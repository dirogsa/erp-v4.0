from typing import Optional
from beanie import Document
from pydantic import BaseModel

class LoyaltyConfig(Document):
    """Configuración global de lealtad"""
    points_per_sole: float = 1.0  # Cuántos puntos ganas por cada Sol gastado
    local_to_web_rate: float = 1.0 # Equivalencia: 1 punto local = X puntos web
    only_web_accumulation: bool = False # Si True, solo compras web suman puntos públicos
    is_active: bool = True
    
    class Settings:
        name = "loyalty_config"

class LoyaltyConfigUpdate(BaseModel):
    points_per_sole: float
    local_to_web_rate: float
    only_web_accumulation: bool
    is_active: bool
