from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field
from beanie import Document
import pymongo

class ProductAlias(Document):
    """
    Supplier Cross-Reference Table (World-Class ERP Pattern).
    
    Maps external codes from supplier invoices/XMLs to internal master SKUs.
    This is the ERP's "learning memory" — every time a human validates
    an unknown code, the system remembers it for future automated ingestion.
    
    Equivalent to SAP's "Purchasing Info Records" or Oracle's "Cross-Reference Tables".
    """
    # --- Identidad del Código Externo ---
    external_code: str = Field(..., description="The code found in the XML/External source (normalized)")
    external_brand: str = Field(default="N/A", description="Brand detected from the XML description")
    external_description: Optional[str] = None  # Original text from XML for audit

    # --- Mapeo al Maestro Interno ---
    internal_sku: str = Field(..., description="The matching SKU in our Master Catalog")
    internal_brand: Optional[str] = None  # Brand of the master product for quick display
    internal_product_name: Optional[str] = None  # Name snapshot for UI display without joins

    # --- Trazabilidad del Proveedor ---
    supplier_ruc: Optional[str] = None  # Which supplier sent this code
    supplier_name: Optional[str] = None  # Snapshot for display

    # --- Gobernanza y Auditoría ---
    created_by: Optional[str] = None  # Username who validated this mapping
    confidence_score: float = 1.0  # 1.0 for manual human validation, < 1.0 for auto-suggested
    auto_mapped: bool = False  # True if system created it, False if human created it
    notes: Optional[str] = None  # Optional justification: "Proveedor omite marca en XML"

    # --- Métricas de Uso ---
    usage_count: int = 0  # How many times this alias was activated during ingestion
    last_used_at: Optional[datetime] = None  # Last time this alias resolved an XML item

    # --- Metadatos ---
    company_id: str = Field(..., description="Mappings can be company-specific")
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "product_aliases"
        indexes = [
            pymongo.IndexModel(
                [("external_code", pymongo.ASCENDING), ("company_id", pymongo.ASCENDING)],
                unique=True
            ),
            pymongo.IndexModel([("internal_sku", pymongo.ASCENDING)]),
            pymongo.IndexModel([("supplier_ruc", pymongo.ASCENDING)]),
        ]
