from typing import Optional
from beanie import Document
from pydantic import Field

class SystemConfig(Document):
    """Configuración Maestra del Software"""
    instance_name: str = "Dirogsa Cloud ERP"
    reporting_currency: str = "PEN" # Moneda para balances consolidados del grupo
    decimal_precision: int = 2 # 2, 3 o 4 decimales en precios
    timezone: str = "America/Lima" # Estándar de tiempo para reportes
    
    class Settings:
        name = "system_config"
