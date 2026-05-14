from typing import Optional
from pydantic import BaseModel

# LoyaltyConfig has been migrated to SystemConfig for better consolidation.
# These models are preserved for backward compatibility in DTOs if needed.

class LoyaltyUpdate(BaseModel):
    points_per_currency_unit: float
    is_active: bool
