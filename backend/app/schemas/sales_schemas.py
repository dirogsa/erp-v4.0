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

class SalesPolicyUpdate(BaseModel):
    cash_discount: float
    credit_30_days: float
    credit_60_days: float
    credit_90_days: float
    credit_180_days: float
    # Relational Engine
    retail_markup_pct: Optional[float] = 20.0
    vol_6_discount_pct: Optional[float] = 3.0
    vol_12_discount_pct: Optional[float] = 7.0
    vol_24_discount_pct: Optional[float] = 12.0
    # Security Guard
    min_margin_guard_pct: Optional[float] = 12.0

class SalesPolicyResponse(SalesPolicyUpdate):
    last_updated: str
    updated_by: Optional[str] = None
