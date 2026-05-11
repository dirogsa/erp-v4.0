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
        service_level: float = 0.95,
        analysis_days: int = 180,
        recent_days: int = 30
    ) -> List[Dict[str, Any]]:
        """
        World-Class Import Planning Algorithm (V4.2).
        - Fully Dynamic Trend Windows (Recent vs Historical).
        - Backorders & Dynamic ROP.
        """
        z_scores = {0.90: 1.28, 0.95: 1.65, 0.99: 2.33}
        SERVICE_LEVEL_Z = z_scores.get(service_level, 1.65)
        
        now = datetime.utcnow()
        lookback_hist = now - timedelta(days=analysis_days)
        lookback_recent = now - timedelta(days=recent_days)
        
        pipeline = [
            {
                "$match": {
                    "date": {"$gte": lookback_hist},
                    "status": {"$in": [OrderStatus.INVOICED.value, OrderStatus.PARTIALLY_INVOICED.value, OrderStatus.BACKORDER.value]}
                }
            },
            {"$unwind": "$items"},
            {
                "$group": {
                    "_id": "$items.product_sku",
                    "total_sold_hist": {"$sum": "$items.quantity"},
                    "recent_sold_window": {
                        "$sum": {
                            "$cond": [{"$gte": ["$date", lookback_recent]}, "$items.quantity", 0]
                        }
                    },
                    "backorder_qty": {
                        "$sum": {
                            "$cond": [{"$eq": ["$status", OrderStatus.BACKORDER.value]}, "$items.quantity", 0]
                        }
                    },
                    "monthly_series": {
                        "$push": {
                            "qty": "$items.quantity",
                            "month": {"$month": "$date"}
                        }
                    }
                }
            }
        ]
        
        sales_data = await SalesOrder.get_motor_collection().aggregate(pipeline).to_list(None)
        sales_map = {item["_id"]: item for item in sales_data}
        
        products = await Product.find(
            Product.type == ProductType.COMMERCIAL,
            Product.status != ProductStatus.DISCONTINUED
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
            
            safety_stock = SERVICE_LEVEL_Z * std_dev_monthly * math.sqrt(lead_time_days / 30)
            rop = (vos_projected * lead_time_days) + safety_stock
            
            current_stock = p.stock_current
            backorder_needed = s_info["backorder_qty"]
            suggested_qty = max(0, (rop + backorder_needed) - current_stock)
            
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
                    "stock_current": current_stock,
                    "backorder_qty": backorder_needed,
                    "vos_projected": round(vos_projected, 3),
                    "trend": trend_label,
                    "trend_factor": round(trend_adj, 2),
                    "rop": round(rop, 1),
                    "suggested_qty": int(math.ceil(suggested_qty)),
                    "unit_cost": cost_unit,
                    "estimated_investment": round(suggested_qty * cost_unit, 2),
                    "priority": priority,
                    "stockout_risk": "CRITICAL" if current_stock <= backorder_needed and vos_projected > 0 else "HIGH" if current_stock < rop else "LOW"
                })
        
        results.sort(key=lambda x: (x["priority"], -x["estimated_investment"]))
        return results
