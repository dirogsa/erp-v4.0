from typing import Optional
from beanie import Document
from .auth import UserTier

class PricingRule(Document):
    name: str  # Description of the rule, e.g., "Oro Wix Discount"
    tier: UserTier
    category_id: Optional[str] = None
    brand: Optional[str] = None
    discount_percentage: float = 0.0
    is_active: bool = True

    class Settings:
        name = "pricing_rules"
