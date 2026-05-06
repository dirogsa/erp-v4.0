from typing import Optional
from beanie import Document
from pydantic import Field

class SystemConfig(Document):
    """Configuración Maestra del Software"""
    instance_name: str = "Dirogsa Cloud ERP"
    reporting_currency: str = "PEN" 
    decimal_precision: int = 2 
    timezone: str = "America/Lima" 
    
    # Industrial Reconciliation Toggles
    allow_negative_stock: bool = False # Master switch for migration/stocktake
    
    class Settings:
        name = "system_config"
