from datetime import datetime, timedelta, time
from typing import Dict, Any, List, Optional
from app.models.sales import SalesOrder, SalesInvoice, PaymentStatus, OrderStatus, OrderItem
from app.models.inventory import Product, StockMovement, MovementType
from app.models.purchasing import PurchaseOrder
from app.models.auth import B2BApplication, B2BStatus
from app.schemas.common import PaginatedResponse

async def get_dashboard_summary() -> Dict[str, Any]:
    now = datetime.now()
    month_start = datetime(now.year, now.month, 1)
    
    # 1. Sales of the Month (Facturas)
    sales_month_invoices = await SalesInvoice.find({
        "invoice_date": {"$gte": month_start}
    }).to_list()
    sales_month_amount = sum(inv.total_amount or 0 for inv in sales_month_invoices)
    
    # 2. Pending Orders
    pending_count = await SalesOrder.find(SalesOrder.status == OrderStatus.PENDING).count()
    
    # 3. Low Stock Items (Threshold < 10)
    low_stock_count = await Product.find(Product.stock_current <= 10).count()
    
    # 4. Recent Activity (Last 5 Sales Orders)
    recent_orders = await SalesOrder.find().sort("-date").limit(5).to_list()

    # 5. Pending B2B Applications
    pending_b2b = await B2BApplication.find(B2BApplication.status == B2BStatus.PENDING).count()

    recent_shop_orders = await SalesOrder.find(
        SalesOrder.source == "SHOP",
        SalesOrder.date >= (now - timedelta(hours=48))
    ).count()

    # 7. Invoiced but not dispatched
    invoiced_not_dispatched = await SalesInvoice.find(
        SalesInvoice.dispatch_status == "NOT_DISPATCHED"
    ).count()

    # 8. Backorders
    backorder_count = await SalesOrder.find(SalesOrder.status == OrderStatus.BACKORDER).count()

    return {
        "sales_month": round(sales_month_amount, 2),
        "pending_orders": pending_count,
        "low_stock_items": low_stock_count,
        "backorder_count": backorder_count,
        "pending_b2b": pending_b2b,
        "recent_shop_orders": recent_shop_orders,
        "invoiced_not_dispatched": invoiced_not_dispatched
    }

async def get_debtors_report(customer_id: Optional[str] = None, status_filter: str = 'pending') -> Dict[str, Any]:
    """
    Reporte de Cuentas por Cobrar (Deudores)
    status_filter: 'pending' (default), 'paid', 'all'
    """
    
    # Base query
    query = {}
    
    # Apply filter
    if status_filter == 'pending':
        query["payment_status"] = {"$in": ["PENDING", "PARTIAL"]}
    elif status_filter == 'paid':
        query["payment_status"] = "PAID"
    # elif status_filter == 'all':
    #     pass # No additional filter needed
    
    invoices = await SalesInvoice.find(query).sort("invoice_date").to_list()
    
    report_items = []
    total_receivable = 0.0
    
    for inv in invoices:
        if customer_id and inv.customer_ruc != customer_id:
            continue

        total = inv.total_amount or 0.0
        paid = inv.amount_paid or 0.0

        balance = round(total - paid, 2)
        if balance <= 0.01: continue 
        
        days_overdue = 0
        if inv.due_date and inv.due_date < datetime.now():
            days_overdue = (datetime.now() - inv.due_date).days
        
        item = {
            "invoice_number": inv.invoice_number,
            "sunat_number": inv.sunat_number,
            "customer_name": inv.customer_name,
            "customer_ruc": inv.customer_ruc,
            "issue_date": inv.invoice_date,
            "due_date": inv.due_date,
            "total_amount": total,
            "amount_paid": paid,
            "balance": balance,
            "days_overdue": days_overdue,
            "payment_terms": inv.payment_terms

        }
        report_items.append(item)
        total_receivable += balance
        
    return {
        "items": report_items,
        "total_receivable": round(total_receivable, 2),
        "generated_at": datetime.now()
    }

async def get_sales_report(start_date: str, end_date: str) -> Dict[str, Any]:
    """
    Reporte de Ventas Detallado
    """
    try:
        start = datetime.strptime(start_date, "%Y-%m-%d")
        end = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1)
    except ValueError:
        return {"items": [], "total_sales": 0}

    invoices = await SalesInvoice.find({
        "invoice_date": {"$gte": start, "$lt": end}
        # "status": {"$ne": "CANCELLED"} # Optional depending on if we want to see cancelled invs
    }).sort("invoice_date").to_list()
    
    items = []
    total_sales = 0.0
    
    for inv in invoices:
        items.append({
            "invoice_number": inv.invoice_number,
            "sunat_number": inv.sunat_number,
            "date": inv.invoice_date,
            "customer": inv.customer_name,
            "details": f"{len(inv.items)} items",
            "total": inv.total_amount or 0.0,
            "status": inv.payment_status
        })
        total_sales += (inv.total_amount or 0.0)
        
    return {
        "items": items,
        "total_sales": round(total_sales, 2),
        "period": f"{start_date} - {end_date}"
    }

async def get_inventory_valuation() -> Dict[str, Any]:
    """
    Reporte de Valorización de Inventario
    """
    products = await Product.find(Product.stock_current > 0).to_list()
    
    items = []
    total_value = 0.0
    total_retail_value = 0.0
    
    for p in products:
        cost = p.cost or 0.0
        retail = p.price_retail or 0.0
        stock = p.stock_current
        
        cost_value = stock * cost
        retail_value = stock * retail
        
        items.append({
            "sku": p.sku,
            "name": p.name,
            "stock": stock,
            "unit_cost": cost,
            "total_cost": round(cost_value, 2),
            "unit_price": retail,
            "total_retail": round(retail_value, 2)
        })
        total_value += cost_value
        total_retail_value += retail_value
        
    return {
        "items": items,
        "total_cost_value": round(total_value, 2),
        "total_retail_value": round(total_retail_value, 2),
        "product_count": len(items)
    }
