from fastapi import APIRouter, HTTPException, Query, Body
from typing import List, Optional
from datetime import date
from app.models.finance import ExchangeRate
from pydantic import BaseModel

router = APIRouter(prefix="/finance", tags=["Finance"])

class ExchangeRateRequest(BaseModel):
    purchase: float
    sale: float

@router.get("/exchange-rate/{date_str}", response_model=Optional[ExchangeRate])
async def get_exchange_rate(date_str: str):
    try:
        d = date.fromisoformat(date_str)
        return await ExchangeRate.find_one(ExchangeRate.date == d)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

@router.post("/exchange-rate/{date_str}", response_model=ExchangeRate)
async def upsert_exchange_rate(date_str: str, request: ExchangeRateRequest):
    try:
        d = date.fromisoformat(date_str)
        existing = await ExchangeRate.find_one(ExchangeRate.date == d)
        if existing:
            existing.purchase = request.purchase
            existing.sale = request.sale
            await existing.save()
            return existing
        else:
            new_rate = ExchangeRate(date=d, purchase=request.purchase, sale=request.sale)
            await new_rate.insert()
            return new_rate
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
