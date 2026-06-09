/**
 * slug.js — Single Source of Truth para generación de slugs URL-safe.
 * CONSTITUTION §3: La lógica vive en servicios/lib, nunca duplicada en rutas.
 *
 * CRÍTICO: Esta función DEBE ser matemáticamente idéntica a `slug_utils.py`
 * del backend. Cualquier cambio aquí DEBE replicarse allá y viceversa.
 * Ambas definen el contrato del sistema de URLs de vehículos.
 *
 * Algoritmo (orden de operaciones):
 *  1. Lowercase
 *  2. Eliminar paréntesis, corchetes, llaves (y su contenido NO, solo el delimitador)
 *  3. Reemplazar / \ | , ; : con guion
 *  4. Reemplazar espacios con guion
 *  5. Colapsar guiones múltiples
 *  6. Trim de guiones extremos
 */

/**
 * Convierte cualquier string de vehículo en un slug URL-safe.
 * @param {string} str - El nombre crudo del vehículo (make o model) tal como viene de la BD.
 * @returns {string} Slug limpio, ej: "KONA II (SX4)" → "kona-ii-sx4"
 */
export function toSlug(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[()[\]{}]/g, '')     // Elimina delimitadores de agrupación
    .replace(/[/\\|,;:]/g, '-')    // Reemplaza separadores con guion
    .replace(/\s+/g, '-')          // Espacios → guion
    .replace(/-{2,}/g, '-')        // Colapsa guiones múltiples
    .replace(/^-|-$/g, '')         // Trim de guiones extremos
    .trim();
}

/**
 * Convierte un slug de vuelta a un patrón de regex para buscar en la BD.
 * Esto permite que /vehiculo/hyundai/kona-ii-sx4 encuentre "KONA II (SX4)" en MongoDB.
 *
 * Estrategia: cada guion en el slug puede representar un espacio, guion, o
 * un caracter eliminado (paréntesis, etc.). El regex hace match flexible.
 *
 * @param {string} slug - El slug limpio de la URL, ej: "kona-ii-sx4"
 * @returns {string} Patrón regex para MongoDB $regex, ej: "kona[\\s\\-\\(\\)]*ii[\\s\\-\\(\\)]*sx4"
 */
export function slugToRegexPattern(slug) {
  if (!slug) return '';
  // Escapamos caracteres especiales del slug, luego el guion se convierte
  // en un separador flexible que permite espacios, guiones y paréntesis.
  const escapedParts = slug
    .split('-')
    .filter(Boolean)
    .map(part => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

  // El separador flexible: entre palabras puede haber espacios, guiones, paréntesis
  return escapedParts.join('[\\s\\-\\(\\)\\.]*');
}

/**
 * Convierte un slug de URL a un display name legible.
 * @param {string} slug - ej: "kona-ii-sx4"
 * @returns {string} ej: "KONA II SX4"
 */
export function slugToDisplay(slug) {
  if (!slug) return '';
  return decodeURIComponent(slug).replace(/-/g, ' ').toUpperCase();
}
