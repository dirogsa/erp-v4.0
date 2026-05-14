from datetime import date, datetime
from typing import Optional
from app.models.finance import ExchangeRate
from app.models.config import SystemConfig
from app.models.company import Company
from app.exceptions.business_exceptions import ValidationException

async def get_exchange_rate(date_val: Optional[date] = None) -> ExchangeRate:
    """Obtiene el tipo de cambio del día o el último registrado."""
    target_date = date_val or datetime.utcnow().date()
    rate = await ExchangeRate.find_one(ExchangeRate.date == target_date)
    if not rate:
        rate = await ExchangeRate.find(ExchangeRate.date <= target_date).sort("-date").first_or_none()
    if not rate:
        raise ValidationException(f"Tipo de cambio no disponible para {target_date}.")
    return rate

async def convert_amount(
    amount: float, 
    from_currency: str, 
    to_currency: str, 
    date_val: Optional[date] = None
) -> float:
    """Convierte montos entre cualquier par de monedas."""
    if from_currency == to_currency:
        return amount
    rate = await get_exchange_rate(date_val)
    if from_currency == "PEN" and to_currency == "USD":
        return round(amount / rate.sale, 2)
    elif from_currency == "USD" and to_currency == "PEN":
        return round(amount * rate.sale, 2)
    return amount

async def get_reporting_currency() -> str:
    """Retorna la moneda de consolidación del grupo (Global)"""
    config = await SystemConfig.find_one({})
    return config.reporting_currency if config else "PEN"

async def get_functional_currency(company_id: Optional[str] = None) -> str:
    """
    Retorna la moneda operativa de una empresa específica.
    Si no se especifica empresa, intenta usar la global.
    """
    if not company_id:
        return await get_reporting_currency()
        
    from bson import ObjectId
    try:
        company = await Company.get(ObjectId(company_id))
    except:
        company = None

    if not company:
        return await get_reporting_currency()
        
    return company.functional_currency
