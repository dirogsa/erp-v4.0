from typing import List, Optional
from pydantic import BaseModel
from app.models.inventory import MovementType, Product

class LossRegistration(BaseModel):
    sku: str
    quantity: int
    loss_type: MovementType
    notes: str
    responsible: str

class TransferItem(BaseModel):
    sku: str
    quantity: int

class TransferRequest(BaseModel):
    target_warehouse_id: str
    items: List[TransferItem]
    notes: Optional[str] = None

class BulkImportResponse(BaseModel):
    created: int
    updated: int
    skipped: int = 0
    total: int
    auto_mapped_count: int = 0
    orphans_count: int = 0
    errors: List[str] = []

class ProductWithPrice(Product):
    price_list: float = 0.0 # Field restored at Schema level for UI compatibility
