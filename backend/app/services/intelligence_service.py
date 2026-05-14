import asyncio
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from app.models.sales import SalesOrder, OrderStatus, SalesInvoice
from app.models.inventory import Product, ProductType, ProductStatus, DeliveryGuide, GuideItem, GuideType, GuideStatus, MovementType
from app.models.ingestion import PendingIngest
import math
from bson import ObjectId

class IntelligenceService:
    @staticmethod
    async def add_to_ingestion_queue(xml_batch: List[Dict[str, Any]], user: Any) -> Dict[str, Any]:
        """
        Persiste una lista de XMLs analizados en la cola soberana.
        """
        ingests = []
        for doc in xml_batch:
            # Detectar si ya existe para evitar duplicados en la cola
            # El parser puede enviar 'issuer_ruc' o 'supplier.ruc'
            issuer_ruc = doc.get('issuer_ruc') or doc.get('supplier', {}).get('ruc')
            receiver_ruc = doc.get('receiver_ruc') or doc.get('customer', {}).get('ruc')
            
            document_number = doc.get('document_number') or doc.get('id')
            
            if not document_number or not issuer_ruc:
                continue

            existing = await PendingIngest.find_one({
                "document_number": document_number,
                "issuer_ruc": str(issuer_ruc),
                "company_id": user.current_company_id,
                "status": "PENDING"
            })
            if existing: continue

            ingest = PendingIngest(
                document_number=document_number,
                issuer_ruc=str(issuer_ruc),
                receiver_ruc=str(receiver_ruc or ""),
                total_amount=doc.get('total_amount', 0),
                currency=doc.get('currency', 'PEN'),
                invoice_date=doc.get('invoice_date') or doc.get('date'),
                raw_data=doc,
                company_id=user.current_company_id
            )
            
            # Manejo de fecha si es string o si es nula (fallback de seguridad)
            if not ingest.invoice_date:
                ingest.invoice_date = datetime.utcnow()
            elif isinstance(ingest.invoice_date, str):
                try:
                    ingest.invoice_date = datetime.fromisoformat(ingest.invoice_date.replace('Z', '+00:00'))
                except:
                    ingest.invoice_date = datetime.utcnow()

            ingests.append(ingest)
        
        if ingests:
            await PendingIngest.insert_many(ingests)
        
        return {"status": "success", "added": len(ingests)}

    @staticmethod
    async def get_ingestion_queue(company_id: str) -> List[Dict[str, Any]]:
        """
        Retorna los ítems pendientes en la cola de la empresa.
        """
        queue = await PendingIngest.find({
            "company_id": company_id,
            "status": {"$in": ["PENDING", "ERROR"]}
        }).sort("-created_at").to_list()
        
        # Formatear para el frontend (devolver raw_data con el ID de la base de datos y metadata)
        return [{
            **q.raw_data, 
            "ingest_id": str(q.id), 
            "ingest_status": q.status, 
            "error_msg": getattr(q, 'error_msg', None),
            "persistent_created_at": q.created_at
        } for q in queue]

    @staticmethod
    async def clear_ingestion_queue(company_id: str) -> Dict[str, Any]:
        """
        Limpia la cola de ingesta pendiente.
        """
        await PendingIngest.find({
            "company_id": company_id, 
            "status": {"$in": ["PENDING", "ERROR"]}
        }).delete()
        return {"status": "success"}

    @staticmethod
    async def process_ingestion_item(ingest_id: str, user: Any) -> Dict[str, Any]:
        """
        Procesa un ítem de la cola y lo convierte en Factura (Venta o Compra).
        """
        ingest = await PendingIngest.get(ObjectId(ingest_id))
        if not ingest or ingest.company_id != user.current_company_id:
            raise Exception("Ítem de ingesta no encontrado.")

        try:
            # Reutilizar la lógica universal
            result = await IntelligenceService.universal_xml_ingest(ingest.raw_data, user)
            
            # Marcar como completado
            ingest.status = "COMPLETED"
            await ingest.save()
            
            return result
        except Exception as e:
            ingest.status = "ERROR"
            ingest.error_msg = str(e)
            await ingest.save()
            raise e

    @staticmethod
    async def get_import_planning(
        company_id: Optional[str] = None,
        lead_time_days: int = 60,
        supply_days: int = 90,
        service_level: float = 0.95,
        analysis_days: int = 180,
        recent_days: int = 30
    ) -> List[Dict[str, Any]]:
        """
        World-Class Import Planning Algorithm (V5.1).
        - Integrated Supply Window (Review Period).
        - Fully Dynamic Trend Windows (Recent vs Historical).
        - Backorders & Strategic Target Stock.
        """
        z_scores = {0.90: 1.28, 0.95: 1.65, 0.99: 2.33}
        SERVICE_LEVEL_Z = z_scores.get(service_level, 1.65)
        
        now = datetime.utcnow()
        lookback_hist = now - timedelta(days=analysis_days)
        lookback_recent = now - timedelta(days=recent_days)
        
        # --- 1. AGREGACIÓN DE FACTURAS (Ventas Reales) ---
        invoice_pipeline = [
            {"$match": {"invoice_date": {"$gte": lookback_hist}}},
            {"$unwind": "$items"},
            {
                "$group": {
                    "_id": "$items.product_sku",
                    "qty_hist": {"$sum": "$items.quantity"},
                    "qty_recent": {
                        "$sum": {
                            "$cond": [{"$gte": ["$invoice_date", lookback_recent]}, "$items.quantity", 0]
                        }
                    },
                    "series": {
                        "$push": {
                            "qty": "$items.quantity",
                            "month": {"$month": "$invoice_date"}
                        }
                    }
                }
            }
        ]
        
        # --- 2. AGREGACIÓN DE NOTAS DE CRÉDITO (Devoluciones) ---
        notes_pipeline = [
            {"$match": {"date": {"$gte": lookback_hist}, "type": "CREDIT"}},
            {"$unwind": "$items"},
            {
                "$group": {
                    "_id": "$items.product_sku",
                    "qty_hist": {"$sum": "$items.quantity"},
                    "qty_recent": {
                        "$sum": {
                            "$cond": [{"$gte": ["$date", lookback_recent]}, "$items.quantity", 0]
                        }
                    },
                    "series": {
                        "$push": {
                            "qty": "$items.quantity",
                            "month": {"$month": "$date"}
                        }
                    }
                }
            }
        ]

        from app.models.sales import SalesInvoice, SalesNote
        
        invoices_data = await SalesInvoice.get_motor_collection().aggregate(invoice_pipeline).to_list(None)
        notes_data = await SalesNote.get_motor_collection().aggregate(notes_pipeline).to_list(None)
        
        # --- 3. CONSOLIDACIÓN DE DEMANDA NETA ---
        sales_map = {}
        for inv in invoices_data:
            sku = inv["_id"]
            sales_map[sku] = {
                "total_sold_hist": inv["qty_hist"],
                "recent_sold_window": inv["qty_recent"],
                "monthly_series": inv["series"],
                "backorder_qty": 0 # Los backorders los seguiremos sacando de SalesOrders o Products
            }
        
        for note in notes_data:
            sku = note["_id"]
            if sku in sales_map:
                sales_map[sku]["total_sold_hist"] -= note["qty_hist"]
                sales_map[sku]["recent_sold_window"] -= note["qty_recent"]
                # Para la serie mensual, restamos las cantidades por mes
                for n_entry in note["series"]:
                    found = False
                    for s_entry in sales_map[sku]["monthly_series"]:
                        if s_entry["month"] == n_entry["month"]:
                            s_entry["qty"] -= n_entry["qty"]
                            found = True
                            break
                    if not found:
                        sales_map[sku]["monthly_series"].append({"qty": -n_entry["qty"], "month": n_entry["month"]})
        
        # --- 4. BACKORDERS (Aún necesarios de SalesOrder) ---
        bo_pipeline = [
            {"$match": {"status": OrderStatus.BACKORDER.value}},
            {"$unwind": "$items"},
            {"$group": {"_id": "$items.product_sku", "qty": {"$sum": "$items.quantity"}}}
        ]
        bo_data = await SalesOrder.get_motor_collection().aggregate(bo_pipeline).to_list(None)
        for bo in bo_data:
            if bo["_id"] in sales_map:
                sales_map[bo["_id"]]["backorder_qty"] = bo["qty"]
            else:
                sales_map[bo["_id"]] = {"total_sold_hist": 0, "recent_sold_window": 0, "monthly_series": [], "backorder_qty": bo["qty"]}
        
        products = await Product.find(
            Product.type == ProductType.COMMERCIAL,
            Product.status != ProductStatus.DISCONTINUED,
            Product.is_temporary != True
        ).to_list()
        
        results = []
        for p in products:
            sku = p.sku
            s_info = sales_map.get(sku, {"total_sold_hist": 0, "recent_sold_window": 0, "backorder_qty": 0, "monthly_series": []})
            
            # --- ANÁLISIS DE VELOCIDADES ---
            vos_hist = s_info["total_sold_hist"] / analysis_days
            vos_recent = s_info["recent_sold_window"] / recent_days
            
            # --- TENDENCIA ---
            if vos_hist == 0:
                trend_factor = 1.0 if vos_recent == 0 else 1.2
            else:
                trend_factor = vos_recent / vos_hist
            
            trend_adj = max(0.1, min(1.5, trend_factor))
            vos_projected = vos_hist * (0.4 + (0.6 * trend_adj))

            monthly_totals = {}
            for entry in s_info["monthly_series"]:
                m = entry["month"]
                monthly_totals[m] = monthly_totals.get(m, 0) + entry["qty"]
            
            monthly_vals = list(monthly_totals.values())
            if len(monthly_vals) > 1:
                mean = sum(monthly_vals) / len(monthly_vals)
                variance = sum((x - mean) ** 2 for x in monthly_vals) / len(monthly_vals)
                std_dev_monthly = math.sqrt(variance)
            else:
                std_dev_monthly = (vos_projected * 30) * 0.5
            
            # --- CÁLCULO ESTRATÉGICO DE SUMINISTRO ---
            # El stock de seguridad protege contra la variabilidad durante el Lead Time
            safety_stock = SERVICE_LEVEL_Z * std_dev_monthly * math.sqrt(lead_time_days / 30)
            
            # El Stock Objetivo (Target Stock) debe cubrir:
            # 1. La demanda mientras viene el pedido (Lead Time)
            # 2. La demanda que queremos que dure el pedido (Supply Window / Cobertura)
            # 3. El colchón de seguridad (Safety Stock)
            target_horizon = lead_time_days + supply_days
            target_stock = (vos_projected * target_horizon) + safety_stock
            
            current_stock = p.stock_current
            backorder_needed = s_info["backorder_qty"]
            
            # Sugerido = Lo que falta para llegar al Stock Objetivo + Backorders actuales
            suggested_qty = max(0, (target_stock + backorder_needed) - current_stock)
            
            if suggested_qty > 0 or vos_projected > 0:
                cost_unit = p.cost or 0
                monthly_vel = vos_projected * 30
                
                if monthly_vel >= 10: priority = "A"
                elif monthly_vel >= 2: priority = "B"
                else: priority = "C"
                
                if trend_adj > 1.1: trend_label = "GROWING"
                elif trend_adj < 0.8: trend_label = "DECLINING"
                else: trend_label = "STABLE"

                results.append({
                    "sku": sku,
                    "name": p.name,
                    "brand": p.brand,
                    "category_name": p.category_name or "SIN CATEGORIA",
                    "stock_current": current_stock,
                    "backorder_qty": backorder_needed,
                    "vos_projected": round(vos_projected, 3),
                    "vos_hist": round(vos_hist, 3),
                    "vos_recent": round(vos_recent, 3),
                    "trend": trend_label,
                    "trend_factor": round(trend_adj, 2),
                    "target_stock": round(target_stock, 1),
                    "safety_stock": round(safety_stock, 1),
                    "std_dev_monthly": round(std_dev_monthly, 2),
                    "suggested_qty": int(math.ceil(suggested_qty)),
                    "unit_cost": cost_unit,
                    "estimated_investment": round(suggested_qty * cost_unit, 2),
                    "priority": priority,
                    "stockout_risk": "CRITICAL" if current_stock <= backorder_needed and vos_projected > 0 else "HIGH" if current_stock < target_stock else "LOW",
                    "monthly_series": monthly_vals[-6:] # Enviar últimos 6 meses para gráfica
                })
        
        results.sort(key=lambda x: (x["priority"], -x["estimated_investment"]))
        return results

    @staticmethod
    async def get_unmapped_catalog_items(company_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Retorna ítems de facturas que no están mapeados en el catálogo (SKU Incubation).
        Agrupa por código externo para resolución masiva.
        """
        from app.models.sales import SalesInvoice
        
        query = {"is_catalog_confirmed": False}
        if company_id:
            query["company_id"] = company_id
            
        invoices = await SalesInvoice.find(query).to_list()
        
        unmapped_map = {}
        for inv in invoices:
            for item in inv.items:
                if item.is_unmapped:
                    key = (item.product_sku, item.brand)
                    if key not in unmapped_map:
                        unmapped_map[key] = {
                            "external_code": item.product_sku,
                            "external_description": item.product_name,
                            "brand": item.brand,
                            "occurrences": 0,
                            "invoice_refs": [],
                            "suggestions": []
                        }
                    unmapped_map[key]["occurrences"] += 1
                    if inv.sunat_number not in unmapped_map[key]["invoice_refs"]:
                        unmapped_map[key]["invoice_refs"].append(inv.sunat_number)
        
        # Generar sugerencias Fuzzy para cada ítem huérfano
        results = list(unmapped_map.values())
        for res in results:
            res["suggestions"] = await IntelligenceService._get_fuzzy_suggestions(res["external_code"], res["external_description"])
            
        return results

    @staticmethod
    async def _get_fuzzy_suggestions(code: str, description: str) -> List[Dict[str, Any]]:
        """
        Motor de Lógica Difusa para encontrar candidatos en el maestro.
        Busca por cercanía de código y palabras clave en descripción.
        """
        from app.models.inventory import Product
        import re

        # 1. Búsqueda por Código (Primeros caracteres o similares)
        code_clean = re.sub(r'[^a-zA-Z0-0]', '', code).upper()
        # Buscamos productos que contengan parte del código
        candidates = await Product.find({"sku": {"$regex": code_clean[:4], "$options": "i"}}).limit(5).to_list()
        
        suggestions = []
        for p in candidates:
            # Calcular confianza básica
            confidence = 0.5
            if code_clean in p.sku.upper(): confidence += 0.3
            if description and description.upper()[:10] in p.name.upper(): confidence += 0.1
            
            suggestions.append({
                "sku": p.sku,
                "name": p.name,
                "brand": p.brand,
                "confidence": min(confidence, 0.99)
            })
            
        return sorted(suggestions, key=lambda x: x["confidence"], reverse=True)

    @staticmethod
    async def resolve_catalog_mapping(
        external_code: str, 
        brand: str, 
        internal_sku: str, 
        company_id: str,
        create_alias: bool = True
    ) -> Dict[str, Any]:
        """
        Vincula un código externo con un SKU real y actualiza todas las facturas pendientes.
        """
        from app.models.sales import SalesInvoice
        from app.models.inventory import Product
        from app.models.product_alias import ProductAlias
        
        # 1. Validar SKU interno
        product = await Product.find_one({"sku": internal_sku})
        if not product:
            raise Exception(f"El SKU interno {internal_sku} no existe.")

        # 2. Crear Alias si se solicita (Aprendizaje Permanente)
        if create_alias:
            alias = await ProductAlias.find_one({
                "external_code": external_code, 
                "company_id": company_id
            })
            if not alias:
                alias = ProductAlias(
                    external_code=external_code,
                    internal_sku=internal_sku,
                    company_id=company_id,
                    external_description=product.name,
                    confidence_score=1.0,
                    auto_mapped=False
                )
                await alias.insert()

        # 3. Actualizar Facturas Pendientes
        invoices = await SalesInvoice.find({
            "is_catalog_confirmed": False,
            "company_id": company_id,
            "items.product_sku": external_code
        }).to_list()

        count = 0
        for inv in invoices:
            inv_changed = False
            
            for item in inv.items:
                if item.product_sku == external_code:
                    item.product_sku = product.sku
                    item.product_name = product.name
                    item.product_id = str(product.id)
                    item.brand = product.brand
                    item.is_unmapped = False
                    inv_changed = True

            if inv_changed:
                # Verificar si la factura ya no tiene ítems unmapped
                has_unmapped = any(it.is_unmapped for it in inv.items)
                if not has_unmapped:
                    inv.is_catalog_confirmed = True
                    
                    # --- FASE 5: RESERVA DE STOCK POST-MAPEO ---
                    if not inv.is_stock_reserved:
                        p_data = next((d for d in product.company_data if d.company_id == company_id), None)
                        if p_data:
                            # Calculamos total a reservar de esta factura para este producto
                            qty_to_reserve = sum(it.quantity for it in inv.items if it.product_sku == product.sku)
                            p_data.stock_current -= qty_to_reserve
                            p_data.stock_reserved += qty_to_reserve
                            await product.save()
                        inv.is_stock_reserved = True
                
                await inv.save()
                count += 1

        return {
            "status": "success",
            "mapped_to": internal_sku,
            "invoices_updated": count,
            "alias_created": create_alias
        }

    @staticmethod
    async def get_master_data_gaps(company_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Detecta brechas en Clientes y Tipos de Cambio (Triple Escudo).
        """
        from app.models.sales import SalesInvoice
        
        # 1. Clientes Desconocidos (Agrupados por RUC)
        query_cust = {"is_customer_confirmed": False}
        if company_id: query_cust["company_id"] = company_id
        
        unknown_customers = await SalesInvoice.find(query_cust).to_list()
        cust_map = {}
        for inv in unknown_customers:
            if inv.customer_ruc not in cust_map:
                cust_map[inv.customer_ruc] = {
                    "ruc": inv.customer_ruc,
                    "name": inv.customer_name,
                    "occurrences": 0,
                    "invoice_refs": []
                }
            cust_map[inv.customer_ruc]["occurrences"] += 1
            cust_map[inv.customer_ruc]["invoice_refs"].append(inv.sunat_number)

        # 2. Tipos de Cambio Faltantes (Agrupados por Fecha)
        query_rate = {"is_exchange_rate_confirmed": False, "currency": "USD"}
        if company_id: query_rate["company_id"] = company_id
        
        missing_rates = await SalesInvoice.find(query_rate).to_list()
        rate_map = {}
        for inv in missing_rates:
            date_str = inv.invoice_date.strftime('%Y-%m-%d')
            if date_str not in rate_map:
                rate_map[date_str] = {
                    "date": date_str,
                    "current_placeholder": inv.exchange_rate,
                    "occurrences": 0,
                    "invoice_refs": []
                }
            rate_map[date_str]["occurrences"] += 1
            rate_map[date_str]["invoice_refs"].append(inv.sunat_number)

        return {
            "unknown_customers": list(cust_map.values()),
            "missing_exchange_rates": list(rate_map.values())
        }

    @staticmethod
    async def resolve_exchange_rate_sincerity(date_str: str, sale_rate: float, buy_rate: Optional[float] = None) -> Dict[str, Any]:
        """
        Crea el TC oficial y actualiza todas las facturas de ese día.
        """
        from app.models.finance import ExchangeRate
        from app.models.sales import SalesInvoice
        
        date_obj = datetime.strptime(date_str, '%Y-%m-%d').replace(hour=0, minute=0, second=0, microsecond=0)
        
        # 1. Registrar TC oficial
        rate = await ExchangeRate.find_one(ExchangeRate.date == date_obj)
        if not rate:
            rate = ExchangeRate(date=date_obj, sale=sale_rate, purchase=buy_rate or (sale_rate - 0.05))
            await rate.insert()
        else:
            rate.sale = sale_rate
            await rate.save()

        # 2. Actualizar Facturas
        invoices = await SalesInvoice.find({
            "invoice_date": {"$gte": date_obj, "$lt": date_obj + timedelta(days=1)},
            "is_exchange_rate_confirmed": False
        }).to_list()

        for inv in invoices:
            inv.exchange_rate = sale_rate
            inv.is_exchange_rate_confirmed = True
            await inv.save()

        return {"status": "success", "invoices_updated": len(invoices)}

    @staticmethod
    async def resolve_customer_sincerity(ruc: str, customer_id: str) -> Dict[str, Any]:
        """
        Vincula un RUC incubado a un cliente real del maestro.
        """
        from app.models.sales import SalesInvoice, Customer
        
        customer = await Customer.find_one({"_id": customer_id}) # O por ID real
        if not customer:
            # Re-intentar por ID string si Beanie lo requiere
            try:
                customer = await Customer.get(ObjectId(customer_id))
            except: pass
            
        if not customer:
            raise Exception("Cliente no encontrado en el maestro.")

        invoices = await SalesInvoice.find({
            "customer_ruc": ruc,
            "is_customer_confirmed": False
        }).to_list()

        for inv in invoices:
            inv.customer_id = str(customer.id)
            inv.customer_name = customer.name
            inv.is_customer_confirmed = True
            await inv.save()

        return {"status": "success", "invoices_updated": len(invoices)}

    @staticmethod
    async def auto_create_customer_from_gap(ruc: str, name: str, company_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Alta automática de maestro desde un Gap detectado. 
        Crea el cliente y cura todas las facturas incubadas.
        """
        from app.models.sales import SalesInvoice, Customer
        
        # 1. Verificar si ya existe (por si acaso)
        existing = await Customer.find_one(Customer.ruc == ruc)
        if existing:
            return await IntelligenceService.resolve_customer_sincerity(ruc, str(existing.id))

        # 2. Crear Cliente
        new_customer = Customer(
            ruc=ruc,
            name=name,
            company_name=name,
            is_active=True,
            created_at=datetime.utcnow()
        )
        await new_customer.insert()

        # 3. Sincerar Facturas
        return await IntelligenceService.resolve_customer_sincerity(ruc, str(new_customer.id))

    @staticmethod
    async def bulk_auto_create_customers(customers: List[Dict[str, str]], company_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Procesamiento masivo de nuevos maestros.
        """
        results = []
        total_invoices = 0
        for cust in customers:
            try:
                res = await IntelligenceService.auto_create_customer_from_gap(
                    ruc=cust['ruc'],
                    name=cust['name'],
                    company_id=company_id
                )
                total_invoices += res.get('invoices_updated', 0)
                results.append({"ruc": cust['ruc'], "status": "success"})
            except Exception as e:
                results.append({"ruc": cust['ruc'], "status": "error", "message": str(e)})
        
        return {
            "status": "success", 
            "created": len([r for r in results if r['status'] == 'success']),
            "invoices_sincerated": total_invoices,
            "details": results
        }

    @staticmethod
    async def universal_xml_ingest(xml_data: Dict[str, Any], user: Optional[Any] = None) -> Dict[str, Any]:
        """
        Ingesta Inteligente: Detecta automáticamente si el XML es una Venta o una Compra.
        """
        from app.models.company import Company
        from app.services import sales_service, purchasing_service
        
        if not user or not user.current_company_id:
            raise Exception("Usuario no autenticado o sin empresa asignada.")

        # 1. Obtener RUC de la empresa actual
        try:
            comp_oid = ObjectId(user.current_company_id)
        except:
            raise Exception(f"ID de empresa inválido: {user.current_company_id}")

        company = await Company.get(comp_oid)
        if not company:
            raise Exception("Empresa no encontrada en el sistema.")
        
        # 2. Identificar el Emisor y Receptor del XML
        issuer_ruc = str(xml_data.get('issuer_ruc') or (xml_data.get('issuer') or {}).get('ruc') or (xml_data.get('supplier') or {}).get('ruc') or "").strip()
        receiver_ruc = str(xml_data.get('receiver_ruc') or (xml_data.get('receiver') or {}).get('ruc') or (xml_data.get('customer') or {}).get('ruc') or "").strip()
        
        company_ruc = str(company.ruc or "").strip()
        
        # Log para depuración interna (visible en consola del servidor)
        print(f"[INGEST] Identificando Documento: {xml_data.get('document_number')}")
        print(f"         Empresa ERP: {company_ruc} | XML Emisor: {issuer_ruc} | XML Receptor: {receiver_ruc}")

        # 3. Decidir flujo
        if issuer_ruc == company_ruc:
            print("         --> Detectado como VENTA")
            # Es una Venta emitida por nosotros
            result = await sales_service.import_invoice_xml(
                data=xml_data,
                user=user
            )
            return {
                "type": "SALE",
                "message": "Factura de Venta procesada exitosamente.",
                "document_number": result.sunat_number or result.invoice_number,
                "internal_id": result.invoice_number,
                "total": result.total_amount,
                "currency": result.currency,
                "customer": {
                    "name": result.customer_name,
                    "ruc": result.customer_ruc,
                    "is_confirmed": result.is_customer_confirmed
                },
                "catalog": {
                    "is_confirmed": result.is_catalog_confirmed,
                    "unmapped_count": len([i for i in result.items if getattr(i, 'is_unmapped', False)])
                },
                "status": "SUCCESS" if (getattr(result, 'is_customer_confirmed', True) and getattr(result, 'is_catalog_confirmed', True)) else "INCUBATED"
            }
        else:
            # Si soy el receptor, es compra. Si no soy ninguno, lo tratamos como compra por defecto
            is_explicit_purchase = (receiver_ruc == company_ruc)
            print(f"         --> Detectado como COMPRA (Explícita: {is_explicit_purchase})")

            # Es una Compra recibida de un tercero
            result = await purchasing_service.import_invoice_xml(
                data=xml_data,
                company_id=user.current_company_id
            )
            return {
                "type": "PURCHASE",
                "message": "Factura de Compra procesada exitosamente.",
                "document_number": result.sunat_number or result.invoice_number,
                "internal_id": result.invoice_number,
                "total": result.total_amount,
                "currency": result.currency,
                "success": True
            }
    @staticmethod
    async def get_pending_dispatch_invoices(company_id: str) -> List[Dict[str, Any]]:
        """
        Retorna facturas de venta que están pendientes de vinculación logística.
        """
        invoices = await SalesInvoice.find({
            "company_id": company_id,
            "dispatch_status": "PENDING_GUIDE"
        }).sort("-invoice_date").to_list()
        
        return [inv.dict() for inv in invoices]

    @staticmethod
    async def bulk_generate_sales_guides(invoice_ids: List[str], user: Any) -> Dict[str, Any]:
        """
        Genera guías internas automáticas para un lote de facturas.
        """
        from app.services import sales_service
        count = 0
        errors = []
        
        for inv_id in invoice_ids:
            try:
                invoice = await SalesInvoice.get(ObjectId(inv_id))
                if not invoice: continue
                
                # Usar la lógica existente de creación de guía en SalesService
                # Pero ajustada para ser llamada masivamente
                await sales_service.create_dispatch_guide(
                    invoice_number=invoice.invoice_number,
                    notes="Generación automática (Sinceramiento Masivo)",
                    created_by=user.username,
                    user=user
                )
                count += 1
            except Exception as e:
                errors.append({"id": inv_id, "error": str(e)})
        
        return {"status": "success", "processed": count, "errors": errors}

    @staticmethod
    async def match_xml_guides(guide_batch: List[Dict[str, Any]], company_id: str) -> Dict[str, Any]:
        """
        Vincula guías XML externas de SUNAT con facturas existentes.
        """
        count = 0
        errors = []
        
        for g_data in guide_batch:
            try:
                # El parser de Guía debe extraer el invoice_number referenciado
                # Formato esperado g_data: { sunat_number, invoice_ref, items, date, etc }
                invoice_ref = g_data.get('invoice_ref')
                if not invoice_ref:
                    errors.append({"guide": g_data.get('sunat_number'), "error": "No se encontró referencia a factura"})
                    continue
                
                invoice = await SalesInvoice.find_one({
                    "sunat_number": invoice_ref,
                    "company_id": company_id
                })
                
                if not invoice:
                    errors.append({"guide": g_data.get('sunat_number'), "error": f"Factura {invoice_ref} no encontrada"})
                    continue

                # Crear el registro de la guía vinculada
                guide = DeliveryGuide(
                    guide_number=f"EXT-{g_data['sunat_number']}",
                    sunat_number=g_data['sunat_number'],
                    guide_type=GuideType.DISPATCH,
                    status=GuideStatus.COMPLETED,
                    invoice_number=invoice.invoice_number,
                    customer_name=invoice.customer_name,
                    customer_ruc=invoice.customer_ruc,
                    items=[GuideItem(**item) for item in g_data.get('items', [])],
                    issue_date=datetime.fromisoformat(g_data['date']) if g_data.get('date') else datetime.now(),
                    company_id=company_id
                )
                await guide.insert()
                
                # Actualizar factura
                invoice.dispatch_status = "DISPATCHED"
                invoice.guide_id = str(guide.id)
                await invoice.save()
                count += 1
                
            except Exception as e:
                errors.append({"guide": g_data.get('sunat_number', 'N/A'), "error": str(e)})
                
        return {"status": "success", "matched": count, "errors": errors}

    @staticmethod
    async def revert_logistics_status(invoice_id: str, company_id: str) -> Dict[str, Any]:
        """
        Desvincula una guía de una factura y la devuelve a estado PENDING_GUIDE.
        """
        invoice = await SalesInvoice.find_one({"_id": ObjectId(invoice_id), "company_id": company_id})
        if not invoice:
            raise Exception("Factura no encontrada")
            
        guide_id = invoice.guide_id
        if guide_id:
            # Opción: Podemos anular la guía o solo desvincularla. 
            # Por seguridad, la marcamos como CANCELLED si era automática
            guide = await DeliveryGuide.get(ObjectId(guide_id))
            if guide:
                guide.status = GuideStatus.CANCELLED
                await guide.save()
        
        invoice.dispatch_status = "PENDING_GUIDE"
        invoice.guide_id = None
        await invoice.save()
        
        return {"status": "success", "message": "Logística revertida. Factura lista para nueva vinculación."}
