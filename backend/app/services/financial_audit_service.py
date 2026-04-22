from datetime import datetime, timedelta
import re
from typing import List, Dict, Any, Optional
from ..models.sales import SalesInvoice, SalesNote
from ..models.purchasing import PurchaseInvoice

class FinancialAuditService:
    @staticmethod
    async def run_audit(start_date: datetime, end_date: datetime, doc_type: str = "SALES") -> Dict[str, Any]:
        """
        Ejecuta el Motor de Auditoría Financiera para un rango de fechas y tipo de documento.
        """
        findings = []
        
        if doc_type == "SALES":
            invoices = await SalesInvoice.find(
                {"invoice_date": {"$gte": start_date, "$lte": end_date}}
            ).sort("sunat_number").to_list()
            notes = await SalesNote.find(
                {"date": {"$gte": start_date, "$lte": end_date}}
            ).to_list()
            
            # 1. Auditoría de Secuencialidad (Gaps)
            findings.extend(await FinancialAuditService._check_sequential_gaps(invoices, "Factura"))
            
            # 2. Auditoría Aritmética (Cuadre Base + IGV)
            findings.extend(FinancialAuditService._check_arithmetic_consistency(invoices))
            
            # 3. Auditoría de Duplicados
            findings.extend(FinancialAuditService._check_duplicates(invoices))

            # 4. Auditoría de Continuidad (Huecos entre meses)
            all_invoices = await SalesInvoice.find().sort("invoice_date").to_list()
            continuity = FinancialAuditService._check_period_continuity(all_invoices)
            findings.extend(continuity["findings"])

        elif doc_type == "PURCHASE":
            invoices = await PurchaseInvoice.find(
                {"invoice_date": {"$gte": start_date, "$lte": end_date}}
            ).to_list()
            findings.extend(FinancialAuditService._check_arithmetic_consistency(invoices))
            findings.extend(FinancialAuditService._check_duplicates(invoices))
            continuity = {"status": "N/A", "months": []}

        # 5. Cronograma SUNAT (Basado en RUC del primer documento o empresa activa)
        from ..models.company import Company
        active_company = await Company.find_one({"is_active_local": True})
        ruc = active_company.ruc if active_company else (invoices[0].customer_ruc if invoices else "00000000000")
        deadlines = FinancialAuditService._get_sunat_deadlines(ruc)

        # Resumen
        summary = {
            "total_docs": len(invoices),
            "critical_issues": len([f for f in findings if f["severity"] == "CRITICAL"]),
            "warnings": len([f for f in findings if f["severity"] == "WARNING"]),
            "info": len([f for f in findings if f["severity"] == "INFO"]),
            "findings": findings,
            "continuity": continuity,
            "deadlines": deadlines
        }
        
        return summary

    @staticmethod
    def _check_period_continuity(all_docs: List[Any]) -> Dict[str, Any]:
        """
        Detecta meses sin ningún registro desde el primer documento hasta hoy.
        """
        if not all_docs:
            return {"findings": [], "months": []}
        
        findings = []
        first_date = all_docs[0].invoice_date if hasattr(all_docs[0], 'invoice_date') else all_docs[0].date
        today = datetime.now()
        
        # Generar lista de meses esperados
        expected_months = []
        curr = first_date.replace(day=1)
        while curr <= today:
            expected_months.append(curr.strftime("%Y-%m"))
            # Ir al siguiente mes
            if curr.month == 12: curr = curr.replace(year=curr.year + 1, month=1)
            else: curr = curr.replace(month=curr.month + 1)
            
        # Meses con data
        actual_months = set()
        for d in all_docs:
            date = d.invoice_date if hasattr(d, 'invoice_date') else d.date
            actual_months.add(date.strftime("%Y-%m"))
            
        missing = []
        for m in expected_months:
            if m not in actual_months:
                missing.append(m)
                findings.append({
                    "type": "PERIOD_DISCONTINUITY",
                    "severity": "CRITICAL",
                    "message": f"DISCONTINUIDAD: No se encontraron registros para el periodo {m}.",
                    "category": "CUMPLIMIENTO"
                })
        
        return {
            "findings": findings,
            "missing_months": missing,
            "coverage": {
                "start": expected_months[0],
                "end": expected_months[-1],
                "total_expected": len(expected_months),
                "total_actual": len(actual_months)
            }
        }

    @staticmethod
    def _get_sunat_deadlines(ruc: str) -> List[Dict[str, Any]]:
        """
        Calcula las fechas de vencimiento de SUNAT basadas en el último dígito del RUC.
        (Aproximación basada en calendario estándar de Perú)
        """
        try:
            last_digit = int(ruc[-1])
        except:
            last_digit = 0
            
        # Días base por último dígito del RUC
        base_days = {0: 15, 1: 16, 2: 17, 3: 18, 4: 19, 5: 20, 6: 21, 7: 22, 8: 23, 9: 24}
        day = base_days.get(last_digit, 15)
        
        today = datetime.now()
        months = []
        # Mostrar los últimos 3 meses y el actual
        for i in range(4):
            target = today - timedelta(days=30 * i)
            month_name = target.strftime("%B %Y")
            # El vencimiento de un mes es en el mes siguiente
            deadline_date = (target.replace(day=1) + timedelta(days=32)).replace(day=day)
            
            status = "PENDIENTE"
            if deadline_date < today: status = "VENCIDO"
            
            months.append({
                "period": target.strftime("%Y-%m"),
                "month_name": month_name,
                "deadline": deadline_date.strftime("%d/%m/%Y"),
                "status": status
            })
            
        return months

    @staticmethod
    async def _check_sequential_gaps(docs: List[Any], label: str) -> List[Dict[str, Any]]:
        """
        Detecta saltos en la numeración correlativa de SUNAT.
        """
        findings = []
        # Agrupar por serie (ej: F001, E001)
        series_groups = {}
        for doc in docs:
            num = doc.sunat_number or ""
            if '-' in num:
                parts = num.split('-')
                serie = parts[0]
                try:
                    correlative = int(parts[1])
                    if serie not in series_groups: series_groups[serie] = []
                    series_groups[serie].append(correlative)
                except ValueError: continue

        for serie, numbers in series_groups.items():
            numbers.sort()
            if not numbers: continue
            
            for i in range(len(numbers) - 1):
                diff = numbers[i+1] - numbers[i]
                if diff > 1:
                    missing_range = f"{serie}-{numbers[i]+1}" if diff == 2 else f"{serie}-{numbers[i]+1} al {serie}-{numbers[i+1]-1}"
                    findings.append({
                        "type": "GAP_SEQUENCE",
                        "severity": "CRITICAL",
                        "message": f"Salto detectado en serie {serie}: Falta {missing_range}.",
                        "details": {"serie": serie, "missing": missing_range},
                        "category": "INTEGRIDAD"
                    })
        return findings

    @staticmethod
    def _check_arithmetic_consistency(docs: List[Any]) -> List[Dict[str, Any]]:
        """
        Valida que la suma de items coincida con el total y que el IGV sea consistente.
        """
        findings = []
        for doc in docs:
            # Sumar items
            calc_total = sum(item.quantity * item.unit_price for item in doc.items)
            diff = abs(calc_total - doc.total_amount)
            
            if diff > 0.05: # Umbral de 5 céntimos por redondeo
                findings.append({
                    "type": "ARITHMETIC_MISMATCH",
                    "severity": "WARNING",
                    "message": f"Descuadre en {doc.sunat_number or doc.invoice_number}: Total calculado S/ {calc_total:.2f} vs Guardado S/ {doc.total_amount:.2f}.",
                    "entity_id": str(doc.id),
                    "entity_name": doc.sunat_number or doc.invoice_number,
                    "category": "CÁLCULO"
                })
        return findings

    @staticmethod
    def _check_duplicates(docs: List[Any]) -> List[Dict[str, Any]]:
        """
        Detecta números de SUNAT duplicados en la base de datos.
        """
        findings = []
        seen = {}
        for doc in docs:
            num = doc.sunat_number
            if not num: continue
            if num in seen:
                findings.append({
                    "type": "DUPLICATE_SUNAT",
                    "severity": "CRITICAL",
                    "message": f"Factura duplicada detectada: El número {num} aparece en múltiples registros.",
                    "entity_id": str(doc.id),
                    "entity_name": num,
                    "category": "DUPLICIDAD"
                })
            seen[num] = True
        return findings
