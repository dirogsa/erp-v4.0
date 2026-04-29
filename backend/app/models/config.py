from typing import Optional
from beanie import Document
from pydantic import Field

class SystemConfig(Document):
    """Configuración Maestra del ERP"""
    company_name: str = "Dirogsa"
    base_currency: str = "PEN" # La moneda que 'reina' en el sistema
    tax_id: str = "RUC"
    tax_percentage: float = 18.0 # IGV
    
    # Configuración de Costos
    cost_method: str = "PEPS" # PEPS, Promedio Ponderado
    
    class Settings:
        name = "system_config"
