from pydantic import BaseModel
from typing import List, Optional
from app.models.sales import PaymentStatus

class InvoicedItem(BaseModel):
    product_sku: str
    quantity: int

class InvoiceCreation(BaseModel):
    order_number: str
    sunat_number: Optional[str] = None
    invoice_date: str  # YYYY-MM-DD
    due_date: Optional[str] = None
    payment_status: PaymentStatus = PaymentStatus.PENDING
    amount_paid: float = 0.0
    payment_date: Optional[str] = None
    amount_in_words: Optional[str] = None  # SON: SETECIENTOS Y 00/100 SOLES
    payment_terms: Optional[dict] = None
    items: Optional[List[InvoicedItem]] = None # Si es None, factura todo lo pendiente
    issuer_info: Optional[dict] = None

class PaymentRegistration(BaseModel):
    amount: float
    payment_date: str  # YYYY-MM-DD
    notes: Optional[str] = None

class DispatchRequest(BaseModel):
    notes: Optional[str] = None
    created_by: str
