from typing import Optional, List
from beanie import Document, Indexed
from pydantic import BaseModel
from datetime import datetime

class Department(BaseModel):
    name: str # e.g., "Cobranzas", "Ventas", "Logística"
    staff_id: Optional[str] = None # Link to Staff member

class EnterpriseSettings(BaseModel):
    # ID del Grupo de Almacén: Empresas con el mismo ID comparten inventario físico
    warehouse_group_id: str = "DEFAULT"
    
    # MODOS DE SOBERANÍA: "SHARED" (Compartido) o "SOVEREIGN" (Segregado por RUC)
    inventory_mode: str = "SHARED" 
    customers_mode: str = "SOVEREIGN"
    suppliers_mode: str = "SOVEREIGN"
    users_mode: str = "SOVEREIGN"
    
    # Autocancelación: ¿Se generan deudas automáticas en ventas cruzadas?
    auto_intercompany_settlement: bool = True
    # Margen de Traspaso: % de ganancia que cobra el dueño al ceder stock (0 = al costo)
    transfer_price_margin_pct: float = 0.0
    # ¿Permitir vender stock de otras empresas del mismo grupo?
    allow_cross_company_sales: bool = True

class Company(Document):
    name: str
    ruc: Indexed(str, unique=True)
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    logo_url: Optional[str] = None
    functional_currency: str = "PEN" # La moneda en la que esta empresa factura y rinde cuentas
    tax_percentage: float = 18.0 # Cada empresa tiene su propio régimen tributario
    cost_method: str = "PEPS" # PEPS, Promedio, etc. (Independiente por empresa)
    
    # Configuración de Gobierno Corporativo
    enterprise_settings: EnterpriseSettings = EnterpriseSettings()
    
    # Bank Info
    bank_name: Optional[str] = None
    account_soles: Optional[str] = None
    account_dollars: Optional[str] = None
    
    is_active_local: bool = False
    is_active_web: bool = False
    
    departments: List[Department] = []
    
    created_at: datetime = datetime.now()
    updated_at: datetime = datetime.now()

    class Settings:
        name = "companies"
