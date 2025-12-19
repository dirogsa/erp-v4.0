from fastapi import APIRouter, HTTPException, Query
from app.models.purchasing import PurchaseQuote
from app.services import purchasing_service
from app.schemas.common import PaginatedResponse
from app.exceptions.business_exceptions import BusinessException

router = APIRouter(prefix="/purchasing/quotes", tags=["Purchase Quotes"])

@router.get("", response_model=PaginatedResponse[PurchaseQuote])
async def get_quotes(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    search: str = None,
    status: str = None,
    date_from: str = None,
    date_to: str = None
):
    return await purchasing_service.get_quotes(skip, limit, search, status, date_from, date_to)

@router.post("", response_model=PurchaseQuote)
async def create_quote(quote: PurchaseQuote):
    try:
        return await purchasing_service.create_quote(quote)
    except BusinessException as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{quote_number}", response_model=PurchaseQuote)
async def get_quote(quote_number: str):
    try:
        return await purchasing_service.get_quote(quote_number)
    except BusinessException as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.put("/{quote_number}", response_model=PurchaseQuote)
async def update_quote(quote_number: str, quote: PurchaseQuote):
    try:
        return await purchasing_service.update_quote(quote_number, quote)
    except BusinessException as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{quote_number}")
async def delete_quote(quote_number: str):
    try:
        await purchasing_service.delete_quote(quote_number)
        return {"message": "Quote deleted successfully"}
    except BusinessException as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{quote_number}/convert")
async def convert_quote(quote_number: str):
    try:
        return await purchasing_service.convert_quote_to_order(quote_number)
    except BusinessException as e:
        raise HTTPException(status_code=400, detail=str(e))
