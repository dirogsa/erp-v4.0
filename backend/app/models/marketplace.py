from typing import Optional, List
from beanie import Document, Indexed
from pydantic import BaseModel
from datetime import datetime

class MarketplaceVendor(Document):
    """
    Terceros que publican productos en la web de DIROGSA.
    100% aislado de los proveedores contables del ERP.
    """
    name: Indexed(str, unique=True)
    contact_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None
    is_active: bool = True
    created_at: datetime = datetime.now()

    class Settings:
        name = "marketplace_vendors"

class MarketplaceCategory(Document):
    """
    Maestro de Categorías aislado para el Marketplace B2B (Estilo Odoo).
    Soporta jerarquías, archivado lógico y codificación.
    """
    code: Indexed(str, unique=True)
    name: Indexed(str)
    description: Optional[str] = None
    
    # Jerarquía
    parent_id: Optional[str] = None
    parent_name: Optional[str] = None
    
    # Soft Delete (Archivado Lógico)
    is_active: bool = True
    created_at: datetime = datetime.now()

    class Settings:
        name = "marketplace_categories"

class MarketplaceProduct(Document):
    """
    Productos de terceros. No afectan stock, no existen en el Kardex.
    Solo de exhibición y generación de leads.
    """
    sku: Indexed(str, unique=True)
    name: str
    brand: str
    description: Optional[str] = None
    price: float = 0.0  # Referencial
    image_url: Optional[str] = None
    
    # Vinculación a la categoría del Marketplace
    category_id: Optional[str] = None
    category_name: Optional[str] = None
    
    # Vinculación al proveedor de Marketplace (vendor)
    vendor_id: Optional[str] = None
    vendor_name: str
    
    is_active: bool = True
    created_at: datetime = datetime.now()

    class Settings:
        name = "marketplace_products"
        indexes = [
            "name",
            "brand",
            "vendor_name"
        ]
