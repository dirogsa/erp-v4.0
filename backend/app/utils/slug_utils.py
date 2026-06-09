"""
slug_utils.py — Espejo exacto de frontend-web/src/lib/slug.js
CONSTITUTION §3: Lógica de negocio en services/utils, nunca en rutas.

CRÍTICO: Este módulo es el espejo Python de `src/lib/slug.js` del frontend.
Cualquier cambio en el algoritmo DEBE ser replicado en ambos archivos.
Ambos definen el contrato del sistema de URLs de vehículos de dirogsa.com.

Algoritmo (idéntico al JS):
 1. Lowercase
 2. Eliminar paréntesis, corchetes, llaves
 3. Reemplazar / \\ | , ; : con guion
 4. Reemplazar espacios con guion
 5. Colapsar guiones múltiples
 6. Trim de guiones extremos
"""

import re


def to_slug(text: str) -> str:
    """
    Convierte cualquier string de vehículo en un slug URL-safe.
    Idéntico a toSlug() en src/lib/slug.js.

    Ej: "KONA II (SX4)" -> "kona-ii-sx4"
        "90 (81/85, B2)" -> "90-81-85-b2"
        "G-SERIE" -> "g-serie"
    """
    if not text:
        return ""
    result = text.lower()
    result = re.sub(r'[()[\]{}]', '', result)       # Elimina delimitadores
    result = re.sub(r'[/\\|,;:]', '-', result)      # Separadores → guion
    result = re.sub(r'\s+', '-', result)             # Espacios → guion
    result = re.sub(r'-{2,}', '-', result)           # Colapsa guiones múltiples
    result = result.strip('-').strip()               # Trim extremos
    return result


def slug_to_regex_pattern(slug: str) -> str:
    """
    Convierte un slug de URL en un patrón regex flexible para buscar en MongoDB.
    Idéntico a slugToRegexPattern() en src/lib/slug.js.

    Permite que /vehiculo/hyundai/kona-ii-sx4 encuentre "KONA II (SX4)" en la BD.

    Ej: "kona-ii-sx4" -> "kona[\\s\\-\\(\\)\\.]*ii[\\s\\-\\(\\)\\.]*sx4"
    """
    if not slug:
        return ""
    parts = [p for p in slug.split('-') if p]
    escaped_parts = [re.escape(part) for part in parts]
    return r'[\s\-\(\)\.]*'.join(escaped_parts)
