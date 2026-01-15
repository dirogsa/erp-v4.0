from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, EmailStr
from enum import Enum

from beanie import Document, Indexed

class UserRole(str, Enum):
    SUPERADMIN = "SUPERADMIN"
    ADMIN = "ADMIN"
    SELLER = "SELLER"              # Comercial / Ventas
    STOCK_MANAGER = "STOCK_MANAGER"  # Almacén / Logística
    ACCOUNTANT = "ACCOUNTANT"      # Finanzas / Contabilidad
    STAFF = "STAFF"
    CUSTOMER_B2C = "CUSTOMER_B2C"
    CUSTOMER_B2B = "CUSTOMER_B2B"

class UserTier(str, Enum):
    STANDARD = "STANDARD"
    BRONCE = "BRONCE"
    PLATA = "PLATA"
    ORO = "ORO"
    DIAMANTE = "DIAMANTE"

class ActivityLog(Document):
    """Registro de auditoría para acciones críticas"""
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    user_id: str           # ID del usuario que realizó la acción
    username: str          # Cache del nombre para visualización rápida
    action: str            # CREATE, UPDATE, DELETE, LOGIN, DOWNLOAD, etc.
    module: str            # SALES, INVENTORY, PURCHASING, FINANCE, AUTH
    entity_id: Optional[str] = None # ID del documento afectado (Factura ID, Producto ID)
    entity_name: Optional[str] = None # Número de factura, SKU del producto
    description: str       # Detalle humano: "Modificó precio de S/10 a S/8"
    ip_address: Optional[str] = None
    
    class Settings:
        name = "activity_logs"

class User(Document):
    username: Optional[Indexed(str, unique=True)] = None
    email: Optional[Indexed(EmailStr, unique=True)] = None
    password_hash: Optional[str] = None
    role: UserRole = UserRole.CUSTOMER_B2C
    full_name: str
    ruc_linked: Optional[str] = None
    classification: UserTier = UserTier.STANDARD
    custom_discount_percent: float = 0.0 # Descuento adicional por ser cliente especial
    is_active: bool = True
    
    # Loyalty & Sales Stats
    loyalty_points: int = 0 # Puntos Web (Públicos)
    internal_points_local: int = 0 # Puntos Locales (Internos)
    cumulative_sales: float = 0.0
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None

    class Settings:
        name = "users"

class B2BStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class B2BApplication(Document):
    ruc: Indexed(str)
    company_name: str
    contact_person: str
    email: EmailStr
    phone: str
    address: str
    status: B2BStatus = B2BStatus.PENDING
    submitted_at: datetime = Field(default_factory=datetime.utcnow)
    processed_at: Optional[datetime] = None
    processed_by: Optional[str] = None # Admin email
    admin_notes: Optional[str] = None
    linked_username: Optional[str] = None


    class Settings:
        name = "b2b_applications"
