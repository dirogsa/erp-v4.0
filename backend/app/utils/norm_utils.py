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

# Caché global (Simulado post-aplanamiento)
# En una arquitectura de soberanía, las marcas son strings dinámicos.
_BRANDS_CACHE = {
    'WIX': ['WIX'],
    'FILTRON': ['FILTRON', 'FILTROW'],
    'MANN': ['MANN', 'MANN-FILTER'],
    'FRAM': ['FRAM'],
    'BOSCH': ['BOSCH'],
    'MOBIL': ['MOBIL'],
    'CASTROL': ['CASTROL'],
    'TOYOTA': ['TOYOTA'],
    'HYUNDAI': ['HYUNDAI'],
    'KIA': ['KIA'],
    'NISSAN': ['NISSAN'],
    'MITSUBISHI': ['MITSUBISHI'],
    'SOLITE': ['SOLITE'],
    'VARTA': ['VARTA'],
    'ACDELCO': ['ACDELCO']
}

async def _refresh_brands_cache():
    """No-op: El sistema ahora usa marcas aplanadas (Strings)."""
    return True

async def detect_brand_from_text(description: str, default: str = "N/A") -> str:
    """
    Motor semántico Enterprise para detección de marcas.
    Ahora utiliza un mapa estático de alta frecuencia para evitar latencia de DB.
    """
    if not description: return default
    
    text = description.upper()
    
    # Búsqueda semántica usando el mapa de alta frecuencia
    for brand, aliases in _BRANDS_CACHE.items():
        for alias in aliases:
            pattern = rf'\b{re.escape(alias.upper())}\b'
            if re.search(pattern, text):
                return brand
                
    return default

async def smart_parse_item(sku_raw: str, description_raw: str) -> Tuple[str, str]:
    """
    Procesador unificado de items nivel Enterprise.
    """
    sku = normalize_sku(sku_raw)
    brand = await detect_brand_from_text(description_raw)
    return sku, brand
