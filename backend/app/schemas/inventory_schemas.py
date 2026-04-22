from pydantic import BaseModel
from typing import List, Optional
from app.models.inventory import MovementType

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
    errors: List[str] = []
