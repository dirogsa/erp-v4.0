from typing import List, Optional
from datetime import datetime
from enum import Enum
from beanie import Document
from pydantic import BaseModel, field_validator

class OrderStatus(str, Enum):
    PENDING = "PENDING"      # Orden creada, sin facturar
    INVOICED = "INVOICED"    # Facturada
    CANCELLED = "CANCELLED"  # Cancelada

class PaymentStatus(str, Enum):
    PENDING = "PENDING"
    PARTIAL = "PARTIAL"  # Pago parcial
    PAID = "PAID"

class OrderItem(BaseModel):
    product_sku: str
    quantity: int
    unit_cost: float

    @field_validator('unit_cost')
    @classmethod
    def round_cost(cls, v):
        """Redondear a 3 decimales"""
        return round(v, 3) if v is not None else v

class Payment(BaseModel):
    """Registro individual de un pago"""
    amount: float
    date: datetime
    notes: Optional[str] = None

    @field_validator('amount')
    @classmethod
    def round_amount(cls, v):
        """Redondear a 3 decimales"""
        return round(v, 3) if v is not None else v

class PurchaseOrder(Document):
    """Orden de compra - Inmutable después de facturar"""
    order_number: Optional[str] = None  # ORD-0001, ORD-0002, etc.
    supplier_name: str
    date: datetime = datetime.now()
    items: List[OrderItem]
    status: OrderStatus = OrderStatus.PENDING
    total_amount: float = 0.0

    @field_validator('total_amount')
    @classmethod
    def round_total(cls, v):
        """Redondear a 3 decimales"""
        return round(v, 3) if v is not None else v

    class Settings:
        name = "purchase_orders"

class QuoteStatus(str, Enum):
    DRAFT = "DRAFT"
    SENT = "SENT"
    ACCEPTED = "ACCEPTED"
    CONVERTED = "CONVERTED"
    REJECTED = "REJECTED"

class PurchaseQuote(Document):
    """Solicitud de Cotización (RFQ)"""
    quote_number: Optional[str] = None  # RFQ-0001
    supplier_name: str
    date: datetime = datetime.now()
    valid_until: Optional[datetime] = None
    items: List[OrderItem]
    status: QuoteStatus = QuoteStatus.DRAFT
    total_amount: float = 0.0
    notes: Optional[str] = None
    
    @field_validator('total_amount')
    @classmethod
    def round_total(cls, v):
        """Redondear a 3 decimales"""
        return round(v, 3) if v is not None else v

    class Settings:
        name = "purchase_quotes"

class PurchaseInvoice(Document):
    """Factura de compra - Documento fiscal independiente"""
    invoice_number: str  # F001-00001
    order_number: str  # Referencia a la orden (ORD-0001)
    supplier_name: str  # Denormalizado para queries rápidas
    invoice_date: datetime = datetime.now()
    items: List[OrderItem]
    total_amount: float = 0.0
    
    # Control de pagos
    payment_status: PaymentStatus = PaymentStatus.PENDING
    amount_paid: float = 0.0
    payments: List[Payment] = []  # Historial de pagos
    
    # Control de recepción (NUEVO)
    reception_status: str = "NOT_RECEIVED"   # NOT_RECEIVED | RECEIVED
    guide_id: Optional[str] = None           # Referencia a DeliveryGuide

    # Referencia Legal (SUNAT)
    sunat_number: Optional[str] = None       # F001-00000001 (Proveedor)

    @field_validator('total_amount', 'amount_paid')
    @classmethod
    def round_amounts(cls, v):
        """Redondear a 3 decimales"""
        return round(v, 3) if v is not None else v

    class Settings:
        name = "purchase_invoices"

class Supplier(Document):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    created_at: datetime = datetime.now()

    class Settings:
        name = "suppliers"
