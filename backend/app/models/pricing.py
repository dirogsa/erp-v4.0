from typing import Optional, List
from datetime import datetime
from beanie import Document, Indexed, PydanticObjectId
from pydantic import BaseModel, Field
from .auth import UserTier

class PriceList(Document):
    """Define una lista de precios (Ej: General, Mayorista, Cyber Wow)"""
    name: Indexed(str, unique=True)
    description: Optional[str] = None
    color: str = "#6366f1" # Para identificar la lista en la UI
    is_active: bool = True
    is_campaign: bool = False # Si es True, requiere fechas
    is_master: bool = False # Solo puede haber una lista maestra (fuente del precio base)
    discount_percentage: float = 0.0 # Porcentaje de descuento sobre el precio base
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    priority: int = 0 # Para saber qué precio mostrar si hay varios activos
    
    class Settings:
        name = "price_lists"

class PriceEntry(Document):
    """El precio específico de un producto en una lista determinada"""
    product_id: Indexed(PydanticObjectId)
    sku: Indexed(str) # Duplicamos para búsquedas rápidas sin joins
    price_list_id: Indexed(PydanticObjectId)
    price: float = 0.0
    currency: str = "PEN" # PEN o USD
    min_quantity: int = 1 # Para precios por volumen (Ej: más de 10 unidades)
    last_updated: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "price_entries"
        indexes = [
            # Un producto solo puede tener un precio por lista y cantidad mínima
            [
                ("product_id", 1),
                ("price_list_id", 1),
                ("min_quantity", 1)
            ]
        ]

class PricingRule(Document):
    """Reglas automatizadas y de Segmentación (Tiers)"""
    name: str
    tier: Optional[UserTier] = UserTier.STANDARD # Si es nulo, aplica a todos
    
    # Filtros de aplicación
    target_category_id: Optional[PydanticObjectId] = None
    target_brand: Optional[str] = None
    
    # Compatibilidad con pricing_service (Legacy/Runtime)
    brand: Optional[str] = None
    category_id: Optional[str] = None
    
    discount_percentage: float = 0.0 # Usado para descuentos por Tier en tiempo real
    percentage_change: float = 0.0 # Usado para actualizaciones masivas (Legacy)
    
    is_active: bool = True
    is_applied: bool = False
    applied_at: Optional[datetime] = None
    
    class Settings:
        name = "pricing_rules"
