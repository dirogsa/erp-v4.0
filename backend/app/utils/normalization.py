import re

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
