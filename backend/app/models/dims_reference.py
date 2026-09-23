from typing import List, Optional
from datetime import datetime
from beanie import Document, Indexed
from pydantic import Field

from app.models.inventory import TechnicalSpec, CrossReference, Application

class DimsReferenceProduct(Document):
    """
    MDM (Master Data Management) / PIM para el ecosistema ERP.
    Enciclopedia global de cruces, equivalencias y especificaciones técnicas.
    TOTALMENTE DESACOPLADO DEL INVENTARIO FÍSICO.
    """
    sku: Indexed(str)
    clean_sku: Indexed(str) = ""
    name: str = "Sin Nombre"
    brand: Indexed(str) = "GENERIC"
    category_name: str = "OTROS"
    
    # Datos Técnicos y Relacionales
    specs: List[TechnicalSpec] = []
    equivalences: List[CrossReference] = []
    applications: List[Application] = []
    
    # Metadata
    source: str = "MANUAL" # or WIX, ASAKASHI, etc.
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "dims_reference_products"
        indexes = [
            "sku",
            "clean_sku",
            "brand",
            [("sku", 1), ("brand", 1)],
            "equivalences.code",
            "category_name"
        ]

    def pre_save(self):
        """Hook opcional para normalización de SKUs antes de guardar"""
        from app.utils.normalization import clean_code
        if self.sku:
            self.clean_sku = clean_code(self.sku)
        self.updated_at = datetime.utcnow()
