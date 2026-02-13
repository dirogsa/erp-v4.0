from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, EmailStr
from beanie import Document, Indexed

class Staff(Document):
    full_name: Indexed(str)
    document_id: Optional[str] = Indexed(str, default=None)
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    position: Optional[str] = None  # Cargo: Vendedor, Despachador, Contador, etc.
    department: str # Área: VENTAS, ALMACEN, FINANZAS, CONTABILIDAD, etc.
    
    is_active: bool = True
    commission_pct: float = 0.0 # Porcentaje de comisión si es vendedor
    
    # Vinculación con sistema (opcional)
    user_id: Optional[str] = None 
    
    # Snapshot/Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    notes: Optional[str] = None

    class Settings:
        name = "staff_members"

class StaffCreate(BaseModel):
    full_name: str
    document_id: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    position: Optional[str] = None
    department: str
    is_active: Optional[bool] = True
    commission_pct: Optional[float] = 0.0
    notes: Optional[str] = None

class StaffUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    position: Optional[str] = None
    department: Optional[str] = None
    is_active: Optional[bool] = None
    commission_pct: Optional[float] = None
    notes: Optional[str] = None
