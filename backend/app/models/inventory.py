from typing import Optional, Dict, List, Any
from datetime import datetime
from enum import Enum
from beanie import Document, Indexed
from pydantic import BaseModel, field_validator, Field

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


class Warehouse(Document):
    name: str
    code: Indexed(str, unique=True)
    address: str
    is_main: bool = False
    is_active: bool = True
    
    class Settings:
        name = "warehouses"

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

class VehicleBrand(Document):
    name: Indexed(str, unique=True)
    origin: BrandOrigin = BrandOrigin.OTHER
    logo_url: Optional[str] = None
    is_popular: bool = False
    
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
    options: List[str] = [] # For SELECT type
    required: bool = False

class ProductCategory(Document):
    name: str
    description: Optional[str] = None
    features_schema: List[str] = [] # List of labels for checkboxes (e.g. ["Cuerpo Metálico", "Tiene Prefiltro"])
    attributes_schema: List[AttributeDefinition] = [] # Typed KV attributes
    
    class Settings:
        name = "product_categories"

class Product(Document):
    sku: Indexed(str, unique=True)
    name: str 
    brand: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    weight_g: float = 0.0
    type: ProductType = ProductType.COMMERCIAL
    
    # Category & Attributes
    category_id: Optional[str] = None
    custom_attributes: Dict[str, Any] = {} # flat dict: {"thread": "3/4", "material": "Metal"}
    features: List[str] = [] # list of active feature labels: ["Cuerpo Metálico"]
    # Precios y Stock
    price_retail: float = 0.0
    price_wholesale: float = 0.0
    
    # Descuentos por volumen (Porcentaje)
    discount_6_pct: float = 0.0
    discount_12_pct: float = 0.0
    discount_24_pct: float = 0.0

    cost: float = 0.0
    stock_current: int = 0
    loyalty_points: int = 0 # Puntos que otorga al comprar
    points_cost: int = 0    # Puntos necesarios para canje (0 = no canjeable)

    
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
    
    created_at: datetime = datetime.now()

    @field_validator('price_retail', 'cost', 'price_wholesale', 'discount_6_pct', 'discount_12_pct', 'discount_24_pct')
    @classmethod
    def round_amounts(cls, v):
        """Redondear a 3 decimales"""
        return round(v, 3) if v is not None else v

    class Settings:
        name = "products"
        indexes = [
            # Texto completo para búsqueda potente
            [
                ("name", "text"),
                ("description", "text"),
                ("brand", "text"),
                ("sku", "text"),
                ("ean", "text"),
                ("equivalences.code", "text"),
                ("applications.model", "text")
            ]
        ]

class PriceListType(str, Enum):
    RETAIL = "RETAIL"       # Minorista
    WHOLESALE = "WHOLESALE" # Mayorista

class PriceHistory(Document):
    product_sku: str
    price_type: PriceListType
    old_price: float
    new_price: float
    changed_at: datetime = datetime.now()
    changed_by: Optional[str] = None
    reason: Optional[str] = None  # "Actualización mensual", etc.

    class Settings:
        name = "price_history"


class StockMovement(Document):
    product_sku: str
    quantity: int
    movement_type: MovementType
    
    warehouse_id: Optional[str] = None          # Origen / Ubicación del movimiento
    target_warehouse_id: Optional[str] = None   # Solo para TRANSFER
    
    unit_cost: Optional[float] = None  # Costo unitario de este lote específico
    reference_document: str # ID de Factura o Orden
    date: datetime = datetime.now()
    notes: Optional[str] = None          # Notas detalladas
    responsible: Optional[str] = None    # Quién registró

    @field_validator('unit_cost')
    @classmethod
    def round_cost(cls, v):
        """Redondear a 3 decimales"""
        return round(v, 3) if v is not None else v

    class Settings:
        name = "stock_movements"

class GuideType(str, Enum):
    RECEPTION = "RECEPTION"         # Recepción de compra
    DISPATCH = "DISPATCH"           # Despacho de venta
    TRANSFER = "TRANSFER"           # Transferencia a sucursal
    RETURN = "RETURN"               # Devolución por Nota de Crédito

class GuideStatus(str, Enum):
    DRAFT = "DRAFT"                 # Creada, pendiente de despacho
    DISPATCHED = "DISPATCHED"       # En camino (stock descontado)
    DELIVERED = "DELIVERED"         # Entregado
    CANCELLED = "CANCELLED"         # Anulada

class GuideItem(BaseModel):
    sku: str
    product_name: str
    quantity: int
    unit_cost: float = 0.0
    weight_g: float = 0.0 # Peso unitario en gramos

class DeliveryGuide(Document):
    # Números
    guide_number: Indexed(str, unique=True)  # Interno: GUIA-0001
    sunat_number: Optional[str] = None       # SUNAT opcional: T001-00000001
    
    guide_type: GuideType = GuideType.DISPATCH
    status: GuideStatus = GuideStatus.DRAFT
    
    # Referencias
    invoice_number: Optional[str] = None     # Factura asociada
    order_number: Optional[str] = None       # Orden original
    
    # Cliente/Destino
    customer_name: Optional[str] = None
    customer_ruc: Optional[str] = None
    delivery_address: Optional[str] = None
    
    # Productos
    items: list[GuideItem] = []
    
    # Transporte
    vehicle_plate: Optional[str] = None      # Placa del vehículo
    driver_name: Optional[str] = None        # Nombre del chofer
    
    # Fechas
    issue_date: datetime = datetime.now()
    dispatch_date: Optional[datetime] = None
    delivery_date: Optional[datetime] = None
    
    # Confirmación
    received_by: Optional[str] = None        # Nombre de quien recibe
    notes: Optional[str] = None
    created_by: Optional[str] = None

    # Datos de la empresa emisora (Snapshot)
    issuer_info: Optional[IssuerInfo] = None
    
    @field_validator('items', mode='before')
    @classmethod
    def validate_items(cls, v):
        """Ensure items is a list"""
        if v is None:
            return []
        return v
    
    class Settings:
        name = "delivery_guides"
