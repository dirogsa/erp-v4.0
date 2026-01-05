from typing import Optional
from beanie import Document
from pydantic import BaseModel

class LoyaltyConfig(Document):
    """Configuración global de lealtad"""
    points_per_sole: float = 1.0  # Cuántos puntos ganas por cada Sol gastado
    is_active: bool = True
    
    # Podemos añadir más reglas luego, como multiplicadores por categoría
    
    class Settings:
        name = "loyalty_config"

class LoyaltyConfigUpdate(BaseModel):
    points_per_sole: float
    is_active: bool
