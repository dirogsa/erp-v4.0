from typing import List, Optional
from datetime import datetime
from enum import Enum
from beanie import Document, Indexed
from pydantic import BaseModel, field_validator
from .auth import UserTier

class OrderStatus(str, Enum):
    PENDING = "PENDING"          # Orden creada, sin facturar
    PARTIALLY_INVOICED = "PARTIALLY_INVOICED" # Facturada parcialmente
    INVOICED = "INVOICED"    # Facturada (completamente)
    CANCELLED = "CANCELLED"  # Cancelada
    BACKORDER = "BACKORDER"  # En espera de stock
    CONVERTED = "CONVERTED"  # Backorder convertido (no mostrar en UI)

class PaymentStatus(str, Enum):
    PENDING = "PENDING"
    PARTIAL = "PARTIAL"  # Pago parcial
    PAID = "PAID"

class QuoteStatus(str, Enum):
    DRAFT = "DRAFT"
    SENT = "SENT"
    ACCEPTED = "ACCEPTED"
    CONVERTED = "CONVERTED"
    REJECTED = "REJECTED"

class SalesPolicy(Document):
    """Configuración maestra de porcentajes de recargo financiero"""
    cash_discount: float = 0.0          # Contado (siempre 0 o descuento si se desea)
    credit_30_days: float = 3.0        # Recargo % para 30 días
    credit_60_days: float = 5.0        # Recargo % para 60 días
    credit_90_days: float = 8.0        # Recargo % para 90 días
    credit_180_days: float = 15.0      # Recargo % para 180 días
    # Relational Engine (Precios Automáticos)
    retail_markup_pct: float = 20.0    # Margen sugerido sobre mayorista
    vol_6_discount_pct: float = 5.0    # Descuento para 6u
    vol_12_discount_pct: float = 8.0   # Descuento para 12u
    vol_24_discount_pct: float = 12.0  # Descuento para 24u
    # Security Guard (Stop Loss)
    min_margin_guard_pct: float = 12.0 # Margen mínimo permitido
    last_updated: datetime = datetime.utcnow()
    updated_by: Optional[str] = None    # Username del SuperAdmin
    
    class Settings:
        name = "sales_policies"

class IssuerInfo(BaseModel):
    """Información de la empresa emisora al momento de la creación"""
    name: str
    ruc: str
    address: str
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    logo_url: Optional[str] = None
    
    # Bank Info
    bank_name: Optional[str] = None
    account_soles: Optional[str] = None
    account_dollars: Optional[str] = None

class OrderItem(BaseModel):
    product_sku: str
    product_name: Optional[str] = None
    quantity: int
    unit_price: float
    invoiced_quantity: int = 0 # Cantidad ya facturada de este item
    loyalty_points: Optional[int] = None # Snapshot of points per unit. None = Legacy/Calc needed.


    @field_validator('unit_price')
    @classmethod
    def round_price(cls, v):
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

class SalesOrder(Document):
    """Orden de venta (Proforma) - Inmutable después de facturar"""
    order_number: Optional[str] = None  # SALE-0001, SALE-0002, etc.
    customer_name: str
    customer_email: Optional[str] = None # Added for shop user linking
    customer_ruc: str  # RUC del cliente para referencia
    date: datetime = datetime.now()
    items: List[OrderItem]
    status: OrderStatus = OrderStatus.PENDING
    total_amount: float = 0.0
    loyalty_points_granted: int = 0  # Puntos que se otorgaron al confirmar esta orden
    loyalty_points_spent: int = 0    # Puntos canjeados en esta orden
    
    # Términos de pago (Opcional, para créditos)

    payment_terms: Optional[dict] = None
    
    # Referencia a cotización origen
    related_quote_number: Optional[str] = None
    
    # Dirección de entrega
    delivery_branch_name: Optional[str] = None
    delivery_address: str
    
    # Datos de la empresa emisora (Snapshot)
    issuer_info: Optional[IssuerInfo] = None

    # Origen del pedido
    source: str = "ERP"

    @field_validator('total_amount')
    @classmethod
    def round_total(cls, v):
        """Redondear a 3 decimales"""
        return round(v, 3) if v is not None else v

    class Settings:
        name = "sales_orders"

class SalesQuote(Document):
    """Cotización de venta (Proforma) - No reserva stock"""
    quote_number: Optional[str] = None
    customer_name: str
    customer_ruc: str
    customer_email: Optional[str] = None
    date: datetime = datetime.now()
    valid_until: Optional[datetime] = None
    items: List[OrderItem]
    status: QuoteStatus = QuoteStatus.DRAFT
    total_amount: float = 0.0
    
    delivery_branch_name: Optional[str] = None
    delivery_address: Optional[str] = None
    notes: Optional[str] = None
    
    # Origen del pedido
    source: str = "ERP"

    # Datos de la empresa emisora (Snapshot)
    issuer_info: Optional[IssuerInfo] = None


    @field_validator('total_amount')
    @classmethod
    def round_total(cls, v):
        """Redondear a 3 decimales"""
        return round(v, 3) if v is not None else v

    class Settings:
        name = "sales_quotes"

class SalesInvoice(Document):
    """Factura de venta - Documento fiscal independiente"""
    invoice_number: str
    order_number: str
    customer_name: str
    customer_ruc: str
    invoice_date: datetime = datetime.now()
    due_date: Optional[datetime] = None
    items: List[OrderItem]
    total_amount: float = 0.0
    
    delivery_branch_name: Optional[str] = None
    delivery_address: str
    
    payment_status: PaymentStatus = PaymentStatus.PENDING
    amount_paid: float = 0.0
    payments: List[Payment] = []
    
    dispatch_status: str = "NOT_DISPATCHED"
    guide_id: Optional[str] = None
    
    sunat_number: Optional[str] = None
    
    amount_in_words: Optional[str] = None
    payment_terms: Optional[dict] = None
    linked_notes: List[dict] = [] # [{note_number, type, total_amount}]

    # Datos de la empresa emisora (Snapshot)
    issuer_info: Optional[IssuerInfo] = None

    @field_validator('total_amount', 'amount_paid')
    @classmethod
    def round_amounts(cls, v):
        """Redondear a 3 decimales"""
        return round(v, 3) if v is not None else v

    class Settings:
        name = "sales_invoices"

# ... CustomerBranch and Customer skipped (no issuer info needed) ...

# Redefine skipped classes to keep file valid if I don't see them
# Actually replace_file_content replaces chunks. I should target specific blocks. 
# But let's try to be precise with target content to avoid replacing the whole file if possible.
# Wait, I cannot use multiple ReplacementChunks with the simple replace_file_content tool.
# I should use multi_replace_file_content or make separate calls.
# I will cancel this big replacement and use multi_replace_file_content.

class CustomerBranch(BaseModel):
    """Sucursal de un cliente"""
    branch_name: str  # "Sede Principal", "Sucursal Ate", etc.
    address: str
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    is_main: bool = False
    is_active: bool = True

class DigitalDocument(BaseModel):
    """Metadatos de documentos adjuntos para evaluación de riesgo"""
    name: str                           # "DNI", "Reporte Infocorp", etc.
    url: str                            # Link al archivo
    uploaded_at: datetime = datetime.utcnow()
    uploaded_by: str

class Customer(Document):
    name: str
    ruc: Indexed(str, unique=True)  # RUC único para búsqueda/autocompletado
    address: Optional[str] = None  # Dirección principal (retrocompatibilidad)
    phone: Optional[str] = None
    email: Optional[str] = None
    classification: UserTier = UserTier.STANDARD
    custom_discount_percent: float = 0.0 # Descuento adicional (opcional)
    branches: List[CustomerBranch] = []  # Sucursales del cliente
    
    # --- Gestión de Créditos y Riesgos (Control Interno) ---
    status_credit: bool = False         # Habilitado para pagar a plazos
    credit_manual_block: bool = False   # Bloqueo MANUAL (Hard Stop decidido por Admin)
    credit_limit: float = 0.0           # Línea de crédito máxima
    allowed_terms: List[int] = [0]      # Plazos permitidos (días): [0, 30, 60...]
    risk_score: str = "C"               # A, B, C
    digital_dossier: List[DigitalDocument] = [] # Expediente de riesgo
    internal_notes: Optional[str] = None # Notas solo visibles en ERP
    
    created_at: datetime = datetime.now()

    class Settings:
        name = "customers"

class NoteType(str, Enum):
    CREDIT = "CREDIT"  # Nota de Crédito
    DEBIT = "DEBIT"    # Nota de Débito

class NoteReason(str, Enum):
    RETURN = "RETURN"        # Devolución
    DISCOUNT = "DISCOUNT"    # Descuento
    ERROR = "ERROR"          # Error en facturación
    ANNULMENT = "ANNULMENT"  # Anulación

class SalesNote(Document):
    """Nota de Crédito/Débito"""
    note_number: Optional[str] = None  # NC-0001, ND-0001
    invoice_number: str  # Referencia a la factura
    customer_name: str
    customer_ruc: str
    date: datetime = datetime.now()
    type: NoteType
    reason: NoteReason
    items: List[OrderItem] = []  # Ítems involucrados (puede ser parcial)
    total_amount: float = 0.0
    notes: Optional[str] = None
    
    # Referencia a guía de retorno si hubo devolución de stock
    return_guide_id: Optional[str] = None

    # Datos de la empresa emisora (Snapshot)
    issuer_info: Optional[IssuerInfo] = None

    @field_validator('total_amount')
    @classmethod
    def round_total(cls, v):
        """Redondear a 3 decimales"""
        return round(v, 3) if v is not None else v

    class Settings:
        name = "sales_notes"

