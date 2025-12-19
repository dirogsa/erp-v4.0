from fastapi import APIRouter, HTTPException, Query, UploadFile, File
from typing import Optional, List
from pydantic import BaseModel
from app.services import price_service
from app.models.inventory import PriceListType, PriceHistory
from app.schemas.common import PaginatedResponse
from app.exceptions.business_exceptions import BusinessException

router = APIRouter(prefix="/inventory/prices", tags=["Price Management"])

class PriceUpdateRequest(BaseModel):
    new_price: float
    price_type: PriceListType = PriceListType.RETAIL
    reason: Optional[str] = None
    discount_6_pct: Optional[float] = None
    discount_12_pct: Optional[float] = None
    discount_24_pct: Optional[float] = None

class BulkPriceUpdateRequest(BaseModel):
    updates: List[dict]  # [{sku, price, price_wholesale}, ...]
    reason: Optional[str] = None

@router.get("")
async def get_products_with_prices(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    search: Optional[str] = None
):
    search = search if search else None
    return await price_service.get_products_with_prices(skip, limit, search)

@router.put("/{sku}")
async def update_product_price(
    sku: str,
    request: PriceUpdateRequest
):
    try:
        product = await price_service.update_product_price(
            sku=sku,
            price_type=request.price_type,
            new_price=request.new_price,
            reason=request.reason,
            discount_6_pct=request.discount_6_pct,
            discount_12_pct=request.discount_12_pct,
            discount_24_pct=request.discount_24_pct
        )
        return {"message": "Price updated successfully", "product": product}
    except BusinessException as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{sku}/history")
async def get_price_history(
    sku: str,
    price_type: Optional[str] = None
):
    price_type = price_type if price_type else None
    return await price_service.get_price_history(sku, price_type)

@router.post("/bulk-update")
async def bulk_update_prices(request: BulkPriceUpdateRequest):
    result = await price_service.bulk_update_prices(
        updates=request.updates,
        reason=request.reason
    )
    return result

@router.post("/import-csv")
async def import_prices_from_csv(
    file: UploadFile = File(...),
    reason: Optional[str] = Query(None)
):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV")
    
    content = await file.read()
    csv_content = content.decode('utf-8')
    
    updates = await price_service.parse_csv_prices(csv_content)
    
    if not updates:
        raise HTTPException(status_code=400, detail="No valid price updates found in CSV")
    
    result = await price_service.bulk_update_prices(
        updates=updates,
        reason=reason or f"CSV Import: {file.filename}"
    )
    
    return result
