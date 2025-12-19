from pydantic import BaseModel
from typing import List, Optional
from app.models.purchasing import PaymentStatus

class InvoiceCreation(BaseModel):
    order_number: str
    sunat_number: Optional[str] = None  # Invoice number from supplier
    invoice_date: str  # YYYY-MM-DD
    payment_status: PaymentStatus = PaymentStatus.PENDING
    amount_paid: float = 0.0
    payment_date: Optional[str] = None

class PaymentRegistration(BaseModel):
    amount: float
    payment_date: str  # YYYY-MM-DD
    notes: Optional[str] = None

class ReceptionRequest(BaseModel):
    notes: Optional[str] = None
    created_by: str
