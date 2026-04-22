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

def detect_brand_from_text(description: str, default: str = "OEM") -> str:
    """
    Motor semántico para detección de marcas en descripciones de facturas.
    Utiliza un ranking de palabras clave para identificar el fabricante.
    """
    if not description: return default
    
    text = description.upper()
    
    # Catálogo de Marcas del Sector (Extensible)
    brands_catalog = {
        "FILTROW": ["FILTROW", "FILTROW FILTER"],
        "WIX": ["WIX", "WIX FILTERS"],
        "FILTRON": ["FILTRON"],
        "JS": ["JS", "ASAKASHI", "JS ASAKASHI"],
        "MANN": ["MANN", "MANN-FILTER", "MANN FILTER"],
        "MAHLE": ["MAHLE", "KNECHT"],
        "FRAM": ["FRAM"],
        "DONALDSON": ["DONALDSON"],
        "BALDWIN": ["BALDWIN"],
        "BOSCH": ["BOSCH"],
        "DENSO": ["DENSO"],
        "TOYOTA": ["TOYOTA"],
        "NISSAN": ["NISSAN"],
        "HYUNDAI": ["HYUNDAI"],
        "KIA": ["KIA"],
        "HONDA": ["HONDA"],
        "MITSUBISHI": ["MITSUBISHI"],
        "MAZDA": ["MAZDA"],
        "SUZUKI": ["SUZUKI"],
        "VW": ["VW", "VOLKSWAGEN"],
        "CHEVROLET": ["CHEVROLET", "CHEVY", "GM"],
        "FORD": ["FORD", "MOTORCRAFT"],
    }
    
    for brand, aliases in brands_catalog.items():
        for alias in aliases:
            # Buscamos la palabra exacta (word boundaries) para evitar falsos positivos
            # Ej: Que "JS" no se detecte en "INJECTION"
            pattern = rf'\b{re.escape(alias)}\b'
            if re.search(pattern, text):
                return brand
                
    return default

def smart_parse_item(sku_raw: str, description_raw: str) -> Tuple[str, str]:
    """
    Procesador unificado de items de catálogo.
    Devuelve (SKU_NORMALIZADO, MARCA_DETECTADA)
    """
    sku = normalize_sku(sku_raw)
    brand = detect_brand_from_text(description_raw)
    return sku, brand
