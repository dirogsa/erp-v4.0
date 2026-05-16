from typing import Optional, Dict, List, Any
from datetime import datetime
from enum import Enum
from beanie import Document, Indexed, PydanticObjectId
from pydantic import BaseModel, field_validator, Field
import pymongo

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

class MovementType(str, Enum):
    IN = "IN"   # Entrada (Compras, Devoluciones)
    OUT = "OUT" # Salida (Ventas)
    ADJUSTMENT = "ADJUSTMENT" # Ajuste manual
    TRANSFER_IN = "TRANSFER_IN"   # Entrada por transferencia
    TRANSFER_OUT = "TRANSFER_OUT" # Salida por transferencia
    
    # Enterprise Adjustment Types
    ADJUSTMENT_STOCKTAKE = "ADJUSTMENT_STOCKTAKE"     # Por inventario físico (Conteo)
    ADJUSTMENT_GIFT = "ADJUSTMENT_GIFT"               # Por regalo/donación recibida
    ADJUSTMENT_BONUS = "ADJUSTMENT_BONUS"             # Por bonificación de proveedor
    ADJUSTMENT_CORRECTION = "ADJUSTMENT_CORRECTION"   # Corrección de error de digitación
    
    # Tipos de Merma / Salida
    LOSS_DAMAGED = "LOSS_DAMAGED"        # Deteriorado/Roto
    LOSS_DEFECTIVE = "LOSS_DEFECTIVE"    # Defecto de fábrica
    LOSS_HUMIDITY = "LOSS_HUMIDITY"      # Dañado por humedad
    LOSS_EXPIRED = "LOSS_EXPIRED"        # Vencido/Caducado
    LOSS_THEFT = "LOSS_THEFT"            # Robo
    LOSS_OTHER = "LOSS_OTHER"            # Otra merma

class MeasureType(str, Enum):
    MM = "mm"
    INCH = "inch" # pulgada
    THREAD = "thread" # rosca
    OTHER = "other"

class BrandOrigin(str, Enum):
    EUROPE = "EUROPE"
    ASIA = "ASIA"
    USA = "USA"
    OTHER = "OTHER"

class ProductType(str, Enum):
    COMMERCIAL = "COMMERCIAL" # Productos para venta (ej. Filtros)
    MARKETING = "MARKETING"   # Artículos de publicidad/regalos (ej. Polos, Paneles)
    LUBRICANT = "LUBRICANT"   # Aceites y lubricantes
    SPARK_PLUG = "SPARK_PLUG" # Bujías
    BATTERY = "BATTERY"       # Baterías
    COOLANT = "COOLANT"       # Refrigerantes
    MISC = "MISC"             # Otros productos varios

class ProductStatus(str, Enum):
    AVAILABLE = "AVAILABLE"
    DISCONTINUED = "DISCONTINUED"
    OUT_OF_STOCK = "OUT_OF_STOCK"
    PENDING_REVIEW = "PENDING_REVIEW"

class Warehouse(Document):
    code: Indexed(str, unique=True)
    name: str
    location: Optional[str] = None
    company_id: Optional[str] = None  # Legacy / Default owner
    allowed_companies: List[str] = [] # Companies that can use this warehouse
    is_active: bool = True

    class Settings:
        name = "warehouses"

class VehicleBrand(Document):
    name: Indexed(str, unique=True)
    parent_name: Optional[str] = None # For grouping (e.g., 'TOYOTA INDUSTRIAL' -> 'TOYOTA')
    origin: BrandOrigin = BrandOrigin.OTHER
    logo_url: Optional[str] = None
    is_popular: bool = False
    is_active: bool = True # Control visibility in shop dropdowns
    models: List[str] = [] # Cache of associated models for performance
    
    class Settings:
        name = "vehicle_brands"

class SearchLog(Document):
    query: str
    mode: str
    results_count: int
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    user_id: Optional[str] = None # Si está logueado
    
    class Settings:
        name = "search_logs"

class Notification(Document):
    user_id: str
    title: str
    message: str
    notification_type: str  # "ORDER_UPDATE", "CREDIT_UPDATE", "NEW_PRODUCT", "PROMO"
    is_read: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    link: Optional[str] = None # Para navegar a un pedido o producto específico

    class Settings:
        name = "notifications"

class TechnicalSpec(BaseModel):
    """Especificación técnica unitaria (Ej: A, mm, 120)"""
    label: str  # A, B, C, H, OD, F, G
    measure_type: MeasureType
    value: str  # "120", "3/4-16", "M20x1.5"

class CrossReference(BaseModel):
    """Equivalencia / Cruce con otra marca"""
    brand: str # Mann Filter, Fram, etc.
    code: str  # W 811/80, PH3593A
    is_original: bool = False # Si es código OEM

class Application(BaseModel):
    """Aplicación / Compatibilidad vehicular"""
    make: str   # Toyota
    model: str  # Yaris
    year: str   # 2015-2019
    engine: Optional[str] = None # 1.5L
    notes: Optional[str] = None

class AttributeType(str, Enum):
    TEXT = "text"
    NUMBER = "number"
    SELECT = "select"
    BOOLEAN = "boolean"

class AttributeDefinition(BaseModel):
    key: str # unique key for the attribute (e.g., "material")
    label: str # Display name (e.g., "Material")
    type: AttributeType
    unit: Optional[str] = None # New: Unit of measure (mm, V, Ah)
    options: List[str] = [] # For SELECT type
    import_mapping: List[str] = [] # New: Aliases for parser (e.g., ["OD", "Outer Diameter"])
    required: bool = False

class CompanyProductData(BaseModel):
    company_id: str
    stock_current: float = 0.0
    stock_reserved: float = 0.0  # New: Stock committed by invoices but not yet dispatched
    cost: float = 0.0
    last_purchase_price: float = 0.0
    price_manual: Optional[float] = None
    last_sale_date: Optional[datetime] = None

class ProductCategory(Document):
    name: str
    parent_id: Optional[str] = None # New: Hierarchy support
    description: Optional[str] = None
    icon: str = "Package" # New: Lucide icon name
    color: str = "#6366f1" # New: UI Theme color
    import_aliases: List[str] = []
    features_schema: List[str] = [] # Note: We could upgrade this to objects too
    attributes_schema: List[AttributeDefinition] = []
    
    class Settings:
        name = "product_categories"
        indexes = [
            pymongo.IndexModel([("name", pymongo.ASCENDING)], unique=True)
        ]


class Product(Document):
    sku: Indexed(str)
    name: str 
    brand: str = "N/A"
    description: Optional[str] = None
    image_url: Optional[str] = None
    weight_g: float = 0.0
    shape: Optional[str] = None
    type: ProductType = ProductType.COMMERCIAL
    
    # --- PROPIEDAD Y SEGMENTACIÓN ---
    company_data: Dict[str, CompanyProductData] = {}
    
    # Category & Attributes
    category_id: Optional[str] = None
    custom_attributes: Dict[str, Any] = {} # flat dict: {"thread": "3/4", "material": "Metal"}
    features: List[str] = [] # list of active feature labels: ["Cuerpo Metálico"]
    
    # Inyectados dinámicamente según la empresa que consulte
    stock_current: float = 0.0
    stock_reserved: float = 0.0 # New: Consolidated stock committed by invoices
    cost: float = 0.0 # ¡IMPORTANTE! Costo Unitario de compra siempre CON IGV incluido
    
    loyalty_points: int = 0
    points_cost: int = 0

    # Nuevos campos para Filtros Automotrices (Importación avanzada)
    ean: Optional[Indexed(str)] = None
    tech_bulletin: Optional[str] = None
    manual_pdf_url: Optional[str] = None
    tech_drawing_url: Optional[str] = None
    
    specs: List[TechnicalSpec] = []
    equivalences: List[CrossReference] = []
    applications: List[Application] = []
    
    is_new: bool = False # Manual flag for catalog "Novedades"
    is_active_in_shop: bool = False # Control visibility in frontend-shop
    is_temporary: bool = Field(default=False, description="Flag for reconciliation ghost products")
    
    # Individual Promotion Override (Exceptions)
    promo_discount_pct: float = 0.0
    
    # Adiciones para compatibilidad con scrapers
    category_name: Optional[str] = None
    status: ProductStatus = ProductStatus.AVAILABLE
    image_gallery: List[Dict[str, Any]] = []
    
    created_at: datetime = Field(default_factory=datetime.utcnow)

    @field_validator('cost')
    @classmethod
    def round_amounts(cls, v):
        """Redondear a 3 decimales"""
        return round(v, 3) if v is not None else v

    class Settings:
        name = "products"
        indexes = [
            # Índice Compuesto Único: SKU + Marca (Un solo registro global)
            pymongo.IndexModel(
                [("sku", pymongo.ASCENDING), ("brand", pymongo.ASCENDING)],
                unique=True
            ),
            # Texto completo para búsqueda potente
            pymongo.IndexModel([
                ("name", pymongo.TEXT),
                ("description", pymongo.TEXT),
                ("brand", pymongo.TEXT),
                ("sku", pymongo.TEXT),
                ("ean", pymongo.TEXT),
                ("equivalences.code", pymongo.TEXT),
                ("applications.model", pymongo.TEXT)
            ], weights={"name": 10, "sku": 5, "brand": 3})
        ]

class PriceListType(str, Enum):
    LIST = "LIST"           # Precio de Lista (Único)

class StockMovement(Document):
    product_id: PydanticObjectId
    sku: str
    warehouse_id: str
    quantity: int # Positive for IN, negative for OUT
    movement_type: MovementType
    reference_id: Optional[str] = None # Invoice ID, Order ID, etc.
    reference_type: Optional[str] = None # "SALES_INVOICE", "PURCHASE_INVOICE", etc.
    company_id: Optional[str] = None # The company that performed the movement
    legal_owner_id: Optional[str] = None # The actual legal owner of the stock
    unit_cost: Optional[float] = None
    date: datetime = Field(default_factory=datetime.utcnow)
    notes: Optional[str] = None
    user_id: Optional[str] = None

    @field_validator('unit_cost')
    @classmethod
    def round_cost(cls, v):
        """Redondear a 3 decimales"""
        return round(v, 3) if v is not None else v

    class Settings:
        name = "stock_movements"
        indexes = [
            pymongo.IndexModel([("company_id", pymongo.ASCENDING), ("sku", pymongo.ASCENDING)]),
            pymongo.IndexModel([("legal_owner_id", pymongo.ASCENDING), ("sku", pymongo.ASCENDING)]),
        ]

class PriceHistory(Document):
    product_sku: str
    price_type: str = "LIST"
    old_price: float
    new_price: float
    company_id: str
    reason: Optional[str] = None
    date: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "price_history"
        indexes = [
            pymongo.IndexModel([("product_sku", pymongo.ASCENDING)]),
            pymongo.IndexModel([("date", pymongo.DESCENDING)])
        ]

class IntercompanyStatus(str, Enum):
    PENDING = "PENDING"      # Sale made, needs settlement
    REVIEW = "REVIEW"       # Grouped for billing
    COMPLETED = "COMPLETED" # SUNAT doc registered

class IntercompanyTransaction(Document):
    from_company_id: str
    to_company_id: str
    order_number: Optional[str] = None
    invoice_number: Optional[str] = None
    amount: float = 0.0
    status: IntercompanyStatus = IntercompanyStatus.PENDING
    date: datetime = Field(default_factory=datetime.utcnow)
    settlement_id: Optional[str] = None # Link to SUNAT invoice

    class Settings:
        name = "intercompany_transactions"

# --- LOGÍSTICA Y DESPACHO (Guías de Remisión) ---

class GuideStatus(str, Enum):
    DRAFT = "DRAFT"        # Pendiente de Envío
    READY = "READY"        # Listo (Empaquetado/Muelle)
    DISPATCHED = "DISPATCHED" # Despachado (Salió del Almacén - Stock descontado)
    DELIVERED = "DELIVERED" # Entregado (Confirmación Cliente)
    CANCELLED = "CANCELLED"

class GuideType(str, Enum):
    DISPATCH = "DISPATCH"
    RECEPTION = "RECEPTION"
    RETURN = "RETURN"

class GuideItem(BaseModel):
    sku: str
    product_name: str
    quantity: float
    unit_cost: Optional[float] = None
    weight_g: float = 0.0

class DeliveryGuide(Document):
    guide_number: Indexed(str)
    sunat_number: Optional[str] = None
    guide_type: GuideType = GuideType.DISPATCH
    status: GuideStatus = GuideStatus.DRAFT
    invoice_number: Optional[str] = None
    order_number: Optional[str] = None
    customer_name: str
    customer_ruc: str
    delivery_address: Optional[str] = None
    items: List[GuideItem]
    vehicle_plate: Optional[str] = None
    driver_name: Optional[str] = None
    notes: Optional[str] = None
    created_by: Optional[str] = None
    issue_date: datetime = Field(default_factory=datetime.utcnow)
    dispatch_date: Optional[datetime] = None
    delivery_date: Optional[datetime] = None
    received_by: Optional[str] = None
    
    # Carrier & Shipping Info (World-Class Logistics)
    carrier_name: Optional[str] = None
    carrier_ruc: Optional[str] = None
    carrier_mtc_id: Optional[str] = None
    total_weight: float = 0.0
    
    company_id: Optional[str] = None

    class Settings:
        name = "delivery_guides"
        indexes = [
            pymongo.IndexModel([("company_id", pymongo.ASCENDING), ("guide_number", pymongo.ASCENDING)], unique=True)
        ]
