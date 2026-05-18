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

import os
import json

# Ruta persistente del caché local de marcas
CACHE_FILE_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "cache", "product_brands.json")

# Caché global en memoria de alta velocidad del Master Brand Catalog
_BRANDS_CACHE = {}
_IS_CACHE_LOADED = False

def load_brands_from_local_cache():
    """
    World-Class Persistent Local Cache.
    Loads brands directly from local JSON file to ensure ZERO database calls on boot or ingestion.
    """
    global _BRANDS_CACHE, _IS_CACHE_LOADED
    if _IS_CACHE_LOADED:
        return
        
    try:
        # Asegurar que el directorio de caché exista
        os.makedirs(os.path.dirname(CACHE_FILE_PATH), exist_ok=True)
        
        if os.path.exists(CACHE_FILE_PATH):
            with open(CACHE_FILE_PATH, "r", encoding="utf-8") as f:
                _BRANDS_CACHE = json.load(f)
            _IS_CACHE_LOADED = True
            print(f"MDM: [SUCCESS] Loaded {len(_BRANDS_CACHE)} brands from local JSON cache.")
        else:
            # Semillero inicial local (sin consulta de base de datos para inicio instantáneo)
            default_brands = {
                "WIX": ["WIX", "WIX FILTERS"],
                "FILTRON": ["FILTRON", "FILTROW"],
                "MANN": ["MANN", "MANN-FILTER", "MANN FILTER"],
                "FRAM": ["FRAM"],
                "BOSCH": ["BOSCH"],
                "MOBIL": ["MOBIL"],
                "CASTROL": ["CASTROL"],
                "TOYOTA": ["TOYOTA"],
                "HYUNDAI": ["HYUNDAI"],
                "KIA": ["KIA"],
                "NISSAN": ["NISSAN"],
                "MITSUBISHI": ["MITSUBISHI"],
                "SOLITE": ["SOLITE"],
                "VARTA": ["VARTA"],
                "ACDELCO": ["ACDELCO"],
                "AZUMI": ["AZUMI", "AZUMI FILTERS", "AZUMI JAPAN"],
                "ASAKASHI": ["ASAKASHI", "JS ASAKASHI", "ASAKASHI FILTERS"]
            }
            _BRANDS_CACHE = default_brands
            # Escribir en disco para futuros inicios
            with open(CACHE_FILE_PATH, "w", encoding="utf-8") as f:
                json.dump(default_brands, f, ensure_ascii=False, indent=4)
            _IS_CACHE_LOADED = True
            print("MDM: [INFO] Initialized local JSON cache with standard brand catalogue.")
    except Exception as e:
        print(f"MDM: [ERROR] Failed to load local JSON cache: {e}")

async def _refresh_brands_cache():
    """Recarga en caliente del caché local."""
    global _IS_CACHE_LOADED
    _IS_CACHE_LOADED = False
    load_brands_from_local_cache()
    return True

async def detect_brand_from_text(description: str, default: str = "N/A") -> str:
    """
    Motor semántico transnacional para detección de marcas de autopartes.
    Compara contra el catálogo maestro de marcas cargado en memoria RAM desde caché local.
    """
    if not description: return default
    
    load_brands_from_local_cache()
    if not _BRANDS_CACHE: return default
    
    text = description.upper()
    
    # Mapeo de candidatos aplanados ordenados de mayor a menor longitud
    # para evitar colisiones léxicas parciales (ej. MANN-FILTER antes que MANN)
    all_candidates = []
    for brand, aliases in _BRANDS_CACHE.items():
        for alias in aliases:
            all_candidates.append((brand, alias))
            
    all_candidates.sort(key=lambda x: len(x[1]), reverse=True)
    
    for brand, alias in all_candidates:
        pattern = rf'\b{re.escape(alias)}\b'
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
