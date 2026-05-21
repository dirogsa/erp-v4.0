from pydantic import BaseModel, field_validator
from typing import List, Optional, Any, Union
from app.models.sales import PaymentStatus, SalesInvoice

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
    items: Optional[List[InvoicedItem]] = None 
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
    # Credit terms surcharges
    credit_60_days: float
    credit_90_days: float
    credit_180_days: float
    min_margin_guard_pct: Optional[float] = 12.0
    vol_3_discount_pct: float = 0.0
    vol_6_discount_pct: float = 0.0
    vol_12_discount_pct: float = 0.0

class SalesPolicyResponse(SalesPolicyUpdate):
    last_updated: str
    updated_by: Optional[str] = None

class InvoiceXmlImport(BaseModel):
    xml_data: Any # Puede ser dict (ya parseado) o str (XML crudo)
    auto_guide: bool = True
    exchange_rate: Optional[Union[float, str]] = None

    @field_validator('exchange_rate', mode='before')
    @classmethod
    def empty_string_to_none(cls, v: Any) -> Optional[float]:
        """Robust normalization for currency exchange rates"""
        if v == "" or v is None:
            return None
        try:
            return float(v)
        except (ValueError, TypeError):
            return None
class BulkPaymentRegistration(BaseModel):
    """Confirms payment for multiple invoices in a single treasury event.
    Applies the full pending balance as a payment for each invoice.
    """
    invoice_numbers: List[str]
    payment_date: str                # YYYY-MM-DD — accounting date chosen by user
    payment_method: Optional[str] = None  # Transferencia, Efectivo, etc.
    bank_name: Optional[str] = None
    notes: Optional[str] = None

class FinancialTermsUpdate(BaseModel):
    """
    Allows internal ERP reprogramming of payment condition WITHOUT altering
    the immutable payment_condition_xml (the fiscal record from Sunat).
    Use when customer negotiates credit on a cash invoice, or vice versa.
    """
    payment_condition: str           # CONTADO | CREDITO (new internal condition)
    due_date: Optional[str] = None   # YYYY-MM-DD
    payment_terms: Optional[dict] = None
    notes: Optional[str] = None      # Reason for change (audit trail)

class PaymentRegistrationV2(BaseModel):
    """Extended payment registration with bank verification metadata."""
    amount: float
    payment_date: str                # YYYY-MM-DD
    bank_name: Optional[str] = None  # Banco donde llegó el depósito
    operation_number: Optional[str] = None  # N° operación bancaria
    notes: Optional[str] = None
