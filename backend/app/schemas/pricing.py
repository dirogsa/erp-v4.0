from pydantic import BaseModel
from typing import Optional
from ..models.auth import UserTier

class PricingRuleCreate(BaseModel):
    name: str
    tier: UserTier
    category_id: Optional[str] = None
    brand: Optional[str] = None
    discount_percentage: float = 0.0
    is_active: bool = True

class PricingRuleResponse(PricingRuleCreate):
    id: str

    class Config:
        from_attributes = True
