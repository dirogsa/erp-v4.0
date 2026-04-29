from datetime import date, datetime
from typing import Optional
from app.models.finance import ExchangeRate
from app.models.config import SystemConfig
from app.exceptions.business_exceptions import ValidationException

async def get_exchange_rate(date_val: Optional[date] = None) -> ExchangeRate:
    """
    Obtiene el tipo de cambio para una fecha. 
    Si no existe, busca el más reciente anterior.
    """
    target_date = date_val or datetime.utcnow().date()
    
    # 1. Intentar obtener el exacto
    rate = await ExchangeRate.find_one(ExchangeRate.date == target_date)
    
    if not rate:
        # 2. Buscar el más cercano anterior
        rate = await ExchangeRate.find(ExchangeRate.date <= target_date).sort("-date").first_or_none()
        
    if not rate:
        raise ValidationException(f"No se encontró tipo de cambio para la fecha {target_date} ni anteriores. Por favor, ingréselo manualmente en el gestor de finanzas.")
        
    return rate

async def convert_amount(
    amount: float, 
    from_currency: str, 
    to_currency: str, 
    date_val: Optional[date] = None
) -> float:
    """
    Convierte un monto entre monedas usando el tipo de cambio del día.
    """
    if from_currency == to_currency:
        return amount
        
    rate = await get_exchange_rate(date_val)
    
    # Lógica de conversión (Libro de Texto)
    # PEN -> USD: Monto / Tasa Venta
    # USD -> PEN: Monto * Tasa Venta (o Compra según contexto, usamos Venta por defecto para precios)
    
    if from_currency == "PEN" and to_currency == "USD":
        return round(amount / rate.sale, 2)
    elif from_currency == "USD" and to_currency == "PEN":
        return round(amount * rate.sale, 2)
        
    return amount

async def get_base_currency() -> str:
    """Retorna la moneda ancla del sistema"""
    config = await SystemConfig.find_one({})
    if not config:
        return "PEN"
    return config.base_currency
