from typing import List, Optional
from datetime import datetime
from enum import Enum
from beanie import Document, Indexed
from pydantic import BaseModel, field_validator
import pymongo

class OrderStatus(str, Enum):
    PENDING = "PENDING"      # Orden creada, sin facturar
    INVOICED = "INVOICED"    # Facturada
    CANCELLED = "CANCELLED"  # Cancelada

class PaymentStatus(str, Enum):
    PENDING = "PENDING"
    PARTIAL = "PARTIAL"  # Pago parcial
    PAID = "PAID"

class OrderItem(BaseModel):
    product_id: Optional[str] = None
    product_sku: str
    product_name: Optional[str] = None
    quantity: int
    unit_value: float = 0.0 # Sin IGV (Costo Base)
    unit_price: float = 0.0 # Con IGV (Costo Final)
    unit_cost: float = 0.0  # Legacy retrocompatibility
    tax_rate: float = 0.18
    is_custom: bool = False

    @field_validator('unit_value', 'unit_price', 'unit_cost')
    @classmethod
    def round_cost(cls, v):
        """Redondear a 4 decimales"""
        return round(v, 4) if v is not None else v

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
    supplier_ruc: Optional[str] = None
    supplier_address: Optional[str] = None
    date: datetime = datetime.now()
    items: List[OrderItem]
    status: OrderStatus = OrderStatus.PENDING
    total_amount: float = 0.0
    amount_in_words: Optional[str] = None
    currency: str = "SOLES"
    exchange_rate: Optional[float] = None
    show_prices: bool = True
    company_id: Optional[str] = None

    @field_validator('total_amount')
    @classmethod
    def round_total(cls, v):
        """Redondear a 3 decimales"""
        return round(v, 3) if v is not None else v

    class Settings:
        name = "purchase_orders"
        indexes = [
            pymongo.IndexModel([("company_id", pymongo.ASCENDING), ("order_number", pymongo.ASCENDING)], unique=True)
        ]

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
    supplier_ruc: Optional[str] = None
    supplier_address: Optional[str] = None
    supplier_email: Optional[str] = None
    date: datetime = datetime.now()
    valid_until: Optional[datetime] = None
    items: List[OrderItem]
    status: QuoteStatus = QuoteStatus.DRAFT
    total_amount: float = 0.0
    notes: Optional[str] = None
    amount_in_words: Optional[str] = None
    
    # UI Metadata
    currency: str = "SOLES"
    show_prices: bool = False
    issuer_info: Optional[dict] = None
    company_id: Optional[str] = None
    
    @field_validator('total_amount')
    @classmethod
    def round_total(cls, v):
        """Redondear a 3 decimales"""
        return round(v, 3) if v is not None else v

    class Settings:
        name = "purchase_quotes"
        indexes = [
            pymongo.IndexModel([("company_id", pymongo.ASCENDING), ("quote_number", pymongo.ASCENDING)], unique=True)
        ]

class PurchaseInvoice(Document):
    """Factura de compra - Documento fiscal independiente"""
    invoice_number: str  # F001-00001
    order_number: str  # Referencia a la orden (ORD-0001)
    supplier_name: str  # Denormalizado para queries rápidas
    supplier_ruc: Optional[str] = None
    supplier_address: Optional[str] = None
    invoice_date: datetime = datetime.now()
    items: List[OrderItem]
    total_amount: float = 0.0
    amount_in_words: Optional[str] = None
    exchange_rate: Optional[float] = None
    
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
    
    company_id: Optional[str] = None

    class Settings:
        name = "purchase_invoices"
        indexes = [
            pymongo.IndexModel([("company_id", pymongo.ASCENDING), ("invoice_number", pymongo.ASCENDING)], unique=True)
        ]

class Supplier(Document):
    name: str
    ruc: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    ubigeo: Optional[str] = None
    created_at: datetime = datetime.now()

    class Settings:
        name = "suppliers"
        indexes = [
            pymongo.IndexModel([("ruc", pymongo.ASCENDING)], unique=True)
        ]

class SupplierProductPrice(Document):
    """Mapeo de Precio por Proveedor (Catálogo Maestro de Compras)"""
    supplier_ruc: Indexed(str)
    product_sku: Indexed(str)
    
    last_purchase_value: float = 0.0 # Valor sin IGV
    last_purchase_price: float = 0.0 # Precio con IGV
    currency: str = "PEN"
    last_purchase_date: datetime = datetime.now()
    
    # Código interno que usa el proveedor (opcional)
    supplier_part_number: Optional[str] = None
    company_id: Optional[str] = None

    class Settings:
        name = "supplier_product_prices"
        indexes = [
            # Índice único: un registro por cada combinación Proveedor + Producto + Empresa
            pymongo.IndexModel(
                [("supplier_ruc", pymongo.ASCENDING), ("product_sku", pymongo.ASCENDING), ("company_id", pymongo.ASCENDING)],
                unique=True
            )
        ]
