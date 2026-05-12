import asyncio
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from app.models.sales import SalesOrder, OrderStatus
from app.models.inventory import Product, ProductType, ProductStatus
from app.models.pricing import PriceEntry, PriceList
import math

class IntelligenceService:
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
