import pymongo
from typing import Optional, List
from datetime import datetime
from beanie import Document, Indexed, PydanticObjectId
from pydantic import BaseModel, Field
from .auth import UserTier

class PriceList(Document):
    """
    World-Class Price Management.
    Supports Master Pricing, Virtual Lists, and Targeted Campaigns.
    """
    name: Indexed(str, unique=True)
    description: Optional[str] = None
    color: str = "#6366f1"
    is_active: bool = True
    
    # Hierarchy & Type
    is_master: bool = False # Source of Truth (Only one should be True)
    is_campaign: bool = False # If True, requires start/end dates
    
    # Logic: Dynamic Modifiers
    # If set, this list calculates prices as: Master Price * (1 - discount_percentage / 100)
    default_discount_pct: float = 0.0 
    
    # Targeted Items for Campaigns
    # If this list is not empty, the discount ONLY applies to these SKUs.
    # This fulfills the 'Select and Apply' workflow requested.
    targeted_skus: List[str] = []
    
    # Validity
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    priority: int = 0 # Higher number wins if multiple campaigns overlap
    
    class Settings:
        name = "price_lists"

class PriceEntry(Document):
    """
    Fixed price overrides. 
    Only used for Master List or specific exceptions.
    """
    product_id: Indexed(PydanticObjectId)
    sku: Indexed(str)
    brand: Indexed(str) = "N/A" # Denormalización técnica para evitar colisión multimarca (ej. AZUMI vs ASAKASHI)
    price_list_id: Indexed(PydanticObjectId)
    price: float = 0.0
    currency: str = "PEN"
    min_quantity: int = 1
    last_updated: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "price_entries"
        indexes = [
            pymongo.IndexModel(
                [("product_id", 1), ("price_list_id", 1), ("min_quantity", 1)],
                unique=True
            )
        ]

# PricingRule is now DEPRECATED - Concepts merged into PriceList for architectural elegance.
