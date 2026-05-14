from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field
from beanie import Document
import pymongo

class ProductAlias(Document):
    """
    Stores mappings between external codes (from XML, suppliers, etc.) 
    and the internal Product SKU.
    Part of the 'Learning Center' / 'Sincerity Hub'.
    """
    external_code: str = Field(..., description="The code found in the XML/External source")
    external_description: Optional[str] = None
    internal_sku: str = Field(..., description="The matching SKU in our Master Catalog")
    company_id: str = Field(..., description="Mappings can be company-specific")
    confidence_score: float = 1.0 # 1.0 for manual, < 1.0 for suggested
    auto_mapped: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_used: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "product_aliases"
        indexes = [
            pymongo.IndexModel([("external_code", pymongo.ASCENDING), ("company_id", pymongo.ASCENDING)], unique=True),
            pymongo.IndexModel([("internal_sku", pymongo.ASCENDING)]),
        ]
