from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, EmailStr
from enum import Enum

import pymongo
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
    """
    World-Class Audit Trail.
    Differentiates between 'Critical Mutations' (Stock, Sales) and 'Ephemeral Logs' (Logins).
    """
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    user_id: str
    username: str
    action: str            # CREATE, UPDATE, DELETE, LOGIN, etc.
    module: str            # SALES, INVENTORY, PURCHASING, FINANCE, AUTH
    entity_id: Optional[str] = None
    entity_name: Optional[str] = None
    description: str
    ip_address: Optional[str] = None
    
    # Intelligence Fields
    is_critical: bool = True # Vital for stock/finance
    expire_at: Optional[datetime] = None # For TTL Index (Automatic Cleanup)
    
    class Settings:
        name = "activity_logs"
        indexes = [
            # Automatic Cleanup: MongoDB will delete the document when 'expire_at' is reached.
            # If 'expire_at' is null, it's kept forever.
            pymongo.IndexModel([("expire_at", pymongo.ASCENDING)], expireAfterSeconds=0)
        ]

class User(Document):
    username: Optional[Indexed(str, unique=True)] = None
    email: Optional[Indexed(EmailStr, unique=True)] = None
    password_hash: Optional[str] = None
    role: UserRole = UserRole.CUSTOMER_B2C
    full_name: str
    ruc_linked: Optional[str] = None
    classification: UserTier = UserTier.STANDARD
    custom_discount_percent: float = 0.0 # Descuento adicional por ser cliente especial
    assigned_price_list: Optional[str] = None # Nombre de la lista asignada (Ej: "Lista Oro")
    is_active: bool = True
    
    # Multi-company Context
    assigned_companies: List[str] = [] # List of Company RUCs or IDs
    current_company_id: Optional[str] = None # Current context for the session
    
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
