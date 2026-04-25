import re
from typing import Optional, Tuple

def normalize_sku(sku: str) -> str:
    """
    Normalización de SKUs Automotrices estándar ERP.
    Elimina caracteres especiales y espacios para búsqueda técnica pura.
    Ej: "97133-F2000" -> "97133F2000"
    """
    if not sku: return ""
    # Mantenemos letras, números, guiones y barras. Eliminamos espacios y otros símbolos.
    # Es vital para la identidad de marcas como FILTRON/WIX (Ej: AP129-3).
    clean_sku = str(sku).replace(' ', '')
    return re.sub(r'[^a-zA-Z0-9\-\/]', '', clean_sku).upper().strip()

# Caché global para evitar hits constantes a DB durante importaciones masivas
_BRANDS_CACHE = {}

async def _refresh_brands_cache():
    """Actualiza la caché de marcas desde la base de datos"""
    global _BRANDS_CACHE
    from app.models.inventory import ProductBrand
    try:
        # Traemos todas las marcas activas
        brands = await ProductBrand.find(ProductBrand.is_active == True).to_list()
        new_cache = {}
        for b in brands:
            new_cache[b.name] = b.aliases
        _BRANDS_CACHE = new_cache
        return True
    except Exception as e:
        print(f"Error actualizando caché de marcas: {e}")
        return False

async def detect_brand_from_text(description: str, default: str = "OEM") -> str:
    """
    Motor semántico Enterprise para detección de marcas.
    Consulta el Catálogo Maestro Dinámico (MDM).
    """
    if not description: return default
    
    # 1. Asegurar que la caché tenga datos
    if not _BRANDS_CACHE:
        await _refresh_brands_cache()
    
    text = description.upper()
    
    # 2. Búsqueda semántica usando la caché
    for brand, aliases in _BRANDS_CACHE.items():
        for alias in aliases:
            pattern = rf'\b{re.escape(alias.upper())}\b'
            if re.search(pattern, text):
                return brand
                
    return default

async def smart_parse_item(sku_raw: str, description_raw: str) -> Tuple[str, str]:
    """
    Procesador unificado de items nivel Enterprise.
    Ahora es asíncrono para permitir consultas dinámicas a DB.
    """
    sku = normalize_sku(sku_raw)
    brand = await detect_brand_from_text(description_raw)
    return sku, brand
