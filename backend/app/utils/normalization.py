import re
from typing import Optional, Any


def aesthetic_code(code: str) -> str:
    """
    Standard: Aesthetic / Display formatting.
    Keeps hyphens, slashes, and internal spaces, but trims leading/trailing spaces
    and capitalizes the string. This is what the user sees.
    """
    if not code:
        return ""
    return str(code).strip().upper()

def clean_code(code: str) -> str:
    """
    Algoritmo 4: Motor de Normalización Global
    Limpia un código (SKU, OEM, Equivalencia) para comparaciones exactas.
    Elimina espacios, guiones, barras, puntos y paréntesis, convirtiendo todo a mayúsculas.
    
    Ejemplo: 'VW (VOLKSWAGEN)' -> 'VWVOLKSWAGEN'
    Ejemplo: '17801-21050' -> '1780121050'
    """
    if not code:
        return ""
    
    # 1. Convertir a mayúsculas
    upper_code = code.upper()
    
    # 2. Eliminar cualquier caracter que no sea alfanumérico (letras A-Z y números 0-9)
    # \W+ coincide con cualquier caracter que no sea palabra (ni letra, ni número, ni guion bajo).
    # También eliminamos explícitamente el guion bajo si es necesario, 
    # pero típicamente los SKUs comerciales pueden tener guiones bajos.
    # Mejor: nos quedamos solo con [A-Z0-9]
    cleaned = re.sub(r'[^A-Z0-9]', '', upper_code)
    
    return cleaned

def extract_numeric_value(val: Any) -> Optional[float]:
    """
    Extrae el valor numérico (float) de un valor o string técnico.
    Ejemplos:
      '85 mm' -> 85.0
      '120.5' -> 120.5
      '14.5mm' -> 14.5
      '3/4-16' -> None (rosca no es medida lineal directa)
      85 -> 85.0
    """
    if val is None:
        return None
    if isinstance(val, (int, float)):
        return float(val)
    val_str = str(val).strip().replace(',', '.')
    # Busca un patrón de número flotante o entero al inicio o aislado
    match = re.search(r'^\s*([0-9]+(?:\.[0-9]+)?)\s*(?:mm|inch|"|\'|cm)?\b', val_str, re.IGNORECASE)
    if match:
        try:
            return float(match.group(1))
        except (ValueError, TypeError):
            pass
    # Intento de parseo directo completo
    try:
        return float(val_str)
    except (ValueError, TypeError):
        return None

