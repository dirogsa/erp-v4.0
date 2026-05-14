from typing import Optional, Dict, List, Any
from datetime import datetime
from beanie import Document, Indexed
from pydantic import Field

class PendingIngest(Document):
    document_number: Indexed(str)
    document_type: Optional[str] = None # 'SALE', 'PURCHASE'
    issuer_ruc: str
    receiver_ruc: str
    total_amount: float
    currency: str = "PEN"
    invoice_date: datetime
    raw_data: Dict[str, Any] # Store the full analyzed XML JSON
    status: str = "PENDING" # PENDING, PROCESSING, COMPLETED, ERROR
    error_msg: Optional[str] = None
    company_id: Indexed(str)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "pending_ingests"
        indexes = [
            ("company_id", "status"),
            ("document_number", "issuer_ruc")
        ]
