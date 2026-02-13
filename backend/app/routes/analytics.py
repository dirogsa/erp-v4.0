from fastapi import APIRouter
from typing import Optional
from app.services import analytics_service

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/dashboard")
async def get_dashboard():
    print("Backend: GET /analytics/dashboard received")
    result = await analytics_service.get_dashboard_summary()
    print("Backend: GET /analytics/dashboard completed")
    return result

@router.get("/reports/debtors")
async def get_debtors_report(customer_id: Optional[str] = None, status_filter: str = 'pending'):
    return await analytics_service.get_debtors_report(customer_id, status_filter)

@router.get("/reports/sales")
async def get_sales_report(start_date: str, end_date: str):
    return await analytics_service.get_sales_report(start_date, end_date)

@router.get("/reports/inventory-valuation")
async def get_inventory_valuation():
    return await analytics_service.get_inventory_valuation()

@router.get("/products/{sku}/history")
async def get_product_price_history(sku: str):
    return await analytics_service.get_product_price_history(sku)
