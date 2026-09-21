from fastapi import APIRouter, HTTPException, Query, Depends
from typing import Optional
from app.models.sales import SalesQuote
from app.services import sales_quotes_service
from app.schemas.common import PaginatedResponse
from app.exceptions.business_exceptions import BusinessException
from app.models.auth import User
from .auth import get_current_user

router = APIRouter(prefix="/sales/quotes", tags=["Sales Quotes"])

@router.get("", response_model=PaginatedResponse[SalesQuote])
async def get_quotes(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    search: Optional[str] = None,
    status: Optional[str] = None,
    source: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    return await sales_quotes_service.get_quotes(skip, limit, search, status, source, date_from, date_to, current_user.current_company_id)


@router.post("", response_model=SalesQuote)
async def create_quote(quote: SalesQuote, current_user: User = Depends(get_current_user)):
    try:
        quote.company_id = current_user.current_company_id
        return await sales_quotes_service.create_quote(quote)
    except BusinessException as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{quote_number}", response_model=SalesQuote)
async def get_quote(quote_number: str, current_user: User = Depends(get_current_user)):
    try:
        return await sales_quotes_service.get_quote(quote_number, current_user.current_company_id)
    except BusinessException as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.put("/{quote_number}", response_model=SalesQuote)
async def update_quote(quote_number: str, quote: SalesQuote, current_user: User = Depends(get_current_user)):
    try:
        quote.company_id = current_user.current_company_id
        return await sales_quotes_service.update_quote(quote_number, quote, current_user.current_company_id)
    except BusinessException as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{quote_number}")
async def delete_quote(quote_number: str, current_user: User = Depends(get_current_user)):
    try:
        await sales_quotes_service.delete_quote(quote_number, current_user.current_company_id)
        return {"message": "Quote deleted successfully"}
    except BusinessException as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{quote_number}/convert")
async def convert_quote(quote_number: str, preview: bool = False, current_user: User = Depends(get_current_user)):
    try:
        return await sales_quotes_service.convert_quote_to_order(quote_number, preview, current_user.current_company_id)
    except BusinessException as e:
        raise HTTPException(status_code=400, detail=str(e))
