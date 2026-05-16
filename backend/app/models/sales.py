from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum
from beanie import Document, Indexed
from pydantic import BaseModel, field_validator, Field, computed_field
from .auth import UserTier
import pymongo

class OrderStatus(str, Enum):
    PENDING = "PENDING"          # Orden creada, sin facturar
    PARTIALLY_INVOICED = "PARTIALLY_INVOICED" # Facturada parcialmente
    INVOICED = "INVOICED"    # Facturada (completamente)
    CANCELLED = "CANCELLED"  # Cancelada
    BACKORDER = "BACKORDER"  # En espera de stock
    CONVERTED = "CONVERTED"  # Backorder convertido (no mostrar en UI)
    CONVERTED_TO_ORDER = "CONVERTED_TO_ORDER" # For legacy or specific flows

class CustomerContact(BaseModel):
    """Contacto de un cliente (Persona que solicita)"""
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    position: Optional[str] = None
    is_active: bool = True

class Currency(str, Enum):
    PEN = "PEN"
    USD = "USD"

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


class IssuerInfoDepartment(BaseModel):
    """Snapshot del encargado de área al momento de emitir el documento"""
    name: str 
    staff_name: str
    staff_email: Optional[str] = None
    staff_phone: Optional[str] = None

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
    
    # Organizational structure (Snapshot)
    departments: List[IssuerInfoDepartment] = []

class OrderItem(BaseModel):
    product_id: Optional[str] = None
    product_sku: str
    product_name: Optional[str] = None
    brand: Optional[str] = "OEM"
    quantity: float
    unit_value: float = 0.0 # Sin IGV
    unit_price: float = 0.0 # Con IGV
    tax_rate: float = 0.18
    invoiced_quantity: int = 0 # Cantidad ya facturada de este item
    loyalty_points: Optional[int] = None
    is_unmapped: bool = False # New: For SKU Incubation / Mismatch

    @field_validator('unit_price', 'unit_value')
    @classmethod
    def round_price(cls, v):
        """Redondear a 3 decimales"""
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

class SalesOrder(Document):
    """Orden de venta (Proforma) - Inmutable después de facturar"""
    order_number: Optional[str] = None  # SALE-0001, SALE-0002, etc.
    customer_name: str
    customer_email: Optional[str] = None # Contact email (Optional)
    customer_username: Optional[str] = None # Link to User.username (Unique ID)
    customer_ruc: str  # RUC del cliente para referencia
    date: datetime = datetime.now()
    items: List[OrderItem]
    status: OrderStatus = OrderStatus.PENDING
    total_amount: float = 0.0
    loyalty_points_granted: int = 0  # Puntos que se otorgaron al confirmar esta orden
    loyalty_points_spent: int = 0    # Puntos canjeados en esta orden
    due_date: Optional[datetime] = None
    currency: Currency = Currency.PEN
    requested_by: Optional[CustomerContact] = None # Persona que solicitó el pedido
    
    # Términos de pago (Opcional, para créditos)

    payment_terms: Optional[dict] = None
    
    # Referencia a cotización origen
    related_quote_number: Optional[str] = None
    
    # Dirección de entrega
    delivery_branch_name: Optional[str] = None
    delivery_address: Optional[str] = "No especificada"
    buyer_identity: Optional[str] = None
    
    # Datos de la empresa emisora (Snapshot)
    issuer_info: Optional[IssuerInfo] = None
    amount_in_words: Optional[str] = None
    buyer_identity: Optional[str] = None
    exchange_rate: Optional[float] = None # Persistence of TC used at issuance

    # Origen del pedido
    source: str = "ERP"
    
    company_id: Optional[str] = None

    @field_validator('total_amount')
    @classmethod
    def round_total(cls, v):
        """Redondear a 3 decimales"""
        return round(v, 3) if v is not None else v

    class Settings:
        name = "sales_orders"
        indexes = [
            pymongo.IndexModel([("company_id", pymongo.ASCENDING), ("order_number", pymongo.ASCENDING)], unique=True),
            "items.product_id",
            "items.product_sku"
        ]

class SalesQuote(Document):
    """Cotización de venta (Proforma) - No reserva stock"""
    quote_number: Optional[str] = None
    customer_name: str
    customer_ruc: str
    customer_email: Optional[str] = None
    customer_username: Optional[str] = None
    date: datetime = datetime.now()
    valid_until: Optional[datetime] = None
    items: List[OrderItem]
    status: QuoteStatus = QuoteStatus.DRAFT
    total_amount: float = 0.0
    
    delivery_branch_name: Optional[str] = None
    delivery_address: Optional[str] = None
    payment_terms: Optional[dict] = None
    due_date: Optional[datetime] = None
    currency: Currency = Currency.PEN
    requested_by: Optional[CustomerContact] = None # Persona que solicitó la cotización
    notes: Optional[str] = None
    amount_in_words: Optional[str] = None
    
    # Origen del pedido
    source: str = "ERP"
    external_reference: Optional[str] = None # ID de documento externo (ej: Factura XML Proveedor)

    # Datos de la empresa emisora (Snapshot)
    issuer_info: Optional[IssuerInfo] = None
    company_id: Optional[str] = None


    @field_validator('total_amount')
    @classmethod
    def round_total(cls, v):
        """Redondear a 3 decimales"""
        return round(v, 3) if v is not None else v

    class Settings:
        name = "sales_quotes"
        indexes = [
            pymongo.IndexModel([("company_id", pymongo.ASCENDING), ("quote_number", pymongo.ASCENDING)], unique=True)
        ]

class SalesInvoice(Document):
    """Factura de venta - Documento fiscal independiente"""
    invoice_number: str
    order_number: str
    customer_name: str
    customer_ruc: str
    invoice_date: datetime = datetime.now()
    due_date: Optional[datetime] = None
    currency: Currency = Currency.PEN
    requested_by: Optional[CustomerContact] = None # Persona vinculada a la factura
    items: List[OrderItem]
    total_amount: float = 0.0
    
    delivery_branch_name: Optional[str] = None
    delivery_address: Optional[str] = "No especificada"
    buyer_identity: Optional[str] = None
    
    payment_condition: str = "CONTADO"  # CONTADO | CREDITO
    payment_status: PaymentStatus = PaymentStatus.PENDING
    amount_paid: float = 0.0
    payments: List[Payment] = []
    
    dispatch_status: str = "NOT_DISPATCHED"
    guide_id: Optional[str] = None
    
    sunat_number: Optional[str] = None
    
    amount_in_words: Optional[str] = None
    payment_terms: Optional[dict] = None
    linked_notes: List[dict] = [] # [{note_number, type, total_amount}]
    
    # --- Sinceramiento de Datos (Doble Confirmación XML) ---
    is_financial_confirmed: bool = True  # Para montos y pagos
    is_catalog_confirmed: bool = True    # Para SKUs y Mapeos
    is_customer_confirmed: bool = True   # New: Para validación de cliente en maestro
    is_exchange_rate_confirmed: bool = True # New: Para validación de TC
    is_stock_reserved: bool = False      # Indica si los items han pasado a stock_reserved
    
    customer_id: Optional[str] = None    # New: Link al ID del cliente real (si existe)

    # Datos de la empresa emisora (Snapshot)
    issuer_info: Optional[IssuerInfo] = None
    exchange_rate: Optional[float] = None # Persistence of TC used at issuance
    company_id: Optional[str] = None

    @field_validator('total_amount', 'amount_paid')
    @classmethod
    def round_amounts(cls, v):
        """Redondear a 3 decimales"""
        return round(v, 3) if v is not None else v

    class Settings:
        name = "sales_invoices"
        indexes = [
            pymongo.IndexModel([("company_id", pymongo.ASCENDING), ("invoice_number", pymongo.ASCENDING)], unique=True),
            "items.product_id",
            "items.product_sku"
        ]

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

class DocumentType(str, Enum):
    RUC = "RUC"
    DNI = "DNI"
    CE = "CE"
    PASSPORT = "PASSPORT"
    OTHERS = "OTHERS"

class Customer(Document):
    name: str
    document_type: DocumentType = DocumentType.RUC
    document_number: Indexed(str)
    country: str = "PE"  # ISO 3166-1 alpha-2 (PE, US, CO, etc)
    
    @computed_field
    @property
    def ruc(self) -> str:
        return self.document_number
    address: Optional[str] = None
    ubigeo: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    classification: UserTier = UserTier.STANDARD
    custom_discount_percent: float = 0.0 # Descuento adicional (opcional)
    branches: List[CustomerBranch] = []  # Sucursales del cliente
    contacts: List[CustomerContact] = [] # Trabajadores/Contactos del cliente
    
    # --- Gestión de Créditos y Riesgos (Control Interno) ---
    status_credit: bool = False         # Habilitado para pagar a plazos
    credit_manual_block: bool = False   # Bloqueo MANUAL (Hard Stop decidido por Admin)
    credit_limit: float = 0.0           # Línea de crédito máxima
    allowed_terms: List[int] = [0]      # Plazos permitidos (días): [0, 30, 60...]
    risk_score: str = "C"               # A, B, C
    digital_dossier: List[DigitalDocument] = [] # Expediente de riesgo
    internal_notes: Optional[str] = None # Notas solo visibles en ERP
    
    # --- Inteligencia Comercial (Clase Mundial) ---
    price_list_id: Optional[str] = None   # Vínculo a estrategia de precios
    currency_preference: Currency = Currency.PEN
    seller_id: Optional[str] = None       # Vendedor asignado
    payment_method_id: Optional[str] = None # Transferencia, Efectivo, etc.
    company_id: Optional[str] = None      # Multi-company scope
    
    # --- Escudo de Protección Fiscal (SUNAT) ---
    sunat_state: str = "ACTIVO"          # ACTIVO, BAJA DE OFICIO, etc.
    sunat_condition: str = "HABIDO"      # HABIDO, NO HABIDO, no hallado
    is_retention_agent: bool = False     # Agente de Retención
    is_perception_agent: bool = False    # Agente de Percepción
    last_sunat_check: Optional[datetime] = None
    main_activity: Optional[str] = None  # CIIU o Descripción
    sunat_metadata: Dict[str, Any] = {} # Almacén profundo (CIIU, fechas, etc)
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True

    class Settings:
        name = "customers"
        indexes = [
            pymongo.IndexModel([("company_id", pymongo.ASCENDING), ("country", pymongo.ASCENDING), ("document_number", pymongo.ASCENDING)], unique=True),
            "document_number",
            "company_id",
            "country"
        ]

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
    currency: Currency = Currency.PEN
    requested_by: Optional[CustomerContact] = None # Persona vinculada a la nota
    
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

