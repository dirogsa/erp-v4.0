from datetime import date
from typing import Optional
from beanie import Document, Indexed

class ExchangeRate(Document):
    """Registro histórico de tipo de cambio SUNAT/SBS"""
    date: Indexed(date, unique=True)
    purchase: float # Compra
    sale: float     # Venta
    
    class Settings:
        name = "exchange_rates"
