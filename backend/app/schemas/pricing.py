from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

# --- PriceList ---
class PriceListCreate(BaseModel):
    name: str
    description: Optional[str] = None
    color: str = "#6366f1"
    is_active: bool = True
    is_campaign: bool = False
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    priority: int = 0

class PriceListResponse(PriceListCreate):
    id: str

    class Config:
        from_attributes = True

# --- PriceEntry ---
class PriceEntryCreate(BaseModel):
    product_id: str
    sku: str
    price_list_id: str
    price: float
    currency: str = "PEN"
    min_quantity: int = 1

class PriceEntryResponse(PriceEntryCreate):
    id: str
    last_updated: datetime

    class Config:
        from_attributes = True

# --- Bulk Update ---
class BulkItem(BaseModel):
    sku: str
    brand: Optional[str] = None
    price: Optional[float] = None
    cost: Optional[float] = None

class BulkTextUpdate(BaseModel):
    items: List[BulkItem]
    list_name: str = "General"
    mode: str = "price" # "price", "cost", or "both"
    currency: str = "PEN"

# --- PricingRule ---
class PricingRuleCreate(BaseModel):
    name: str
    target_category_id: Optional[str] = None
    target_brand: Optional[str] = None
    percentage_change: float = 0.0

class PricingRuleResponse(PricingRuleCreate):
    id: str
    is_applied: bool
    applied_at: Optional[datetime] = None

    class Config:
        from_attributes = True
