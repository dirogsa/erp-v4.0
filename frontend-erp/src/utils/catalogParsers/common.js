/**
 * Utilidades comunes para los parsers de catálogos
 */

/**
 * Resuelve el nombre de la categoría basándose en la lista de categorías de la base de datos
 * y sus alias de importación.
 */
export const resolveCategoryName = (rawCategoryName, dbCategories = []) => {
    if (!rawCategoryName) return 'FILTRO';
    
    const rawNormalized = rawCategoryName.trim().toUpperCase();

    if (dbCategories && dbCategories.length > 0) {
        for (const cat of dbCategories) {
            // 1. Comparación directa por nombre
            if (cat.name.toUpperCase() === rawNormalized) {
                return cat.name;
            }
            
            // 2. Comparación por alias de importación
            if (cat.import_aliases) {
                const aliases = cat.import_aliases.map(a => a.trim().toUpperCase());
                if (aliases.includes(rawNormalized)) {
                    return cat.name;
                }
            }
            
            // 3. Comparación por palabras clave comunes (Heurística)
            const catNameUpper = cat.name.toUpperCase();
            if (rawNormalized.includes('OIL') && (catNameUpper.includes('ACEITE') || catNameUpper.includes('LUBE'))) return cat.name;
            if (rawNormalized.includes('AIR') && catNameUpper.includes('AIRE') && !rawNormalized.includes('CABIN')) return cat.name;
            if (rawNormalized.includes('FUEL') && catNameUpper.includes('COMBUSTIBLE')) return cat.name;
            if (rawNormalized.includes('CABIN') && (catNameUpper.includes('CABINA') || catNameUpper.includes('HABITÁCULO'))) return cat.name;
            if (rawNormalized.includes('TRANS') && catNameUpper.includes('TRANSMISIÓN')) return cat.name;
        }
    }

    // Fallback: Si no hay match en BD, intentamos una traducción simple para que no quede en inglés puro
    if (rawNormalized.includes('OIL')) return 'FILTRO DE ACEITE';
    if (rawNormalized.includes('AIR') && !rawNormalized.includes('CABIN')) return 'FILTRO DE AIRE';
    if (rawNormalized.includes('FUEL')) return 'FILTRO DE COMBUSTIBLE';
    if (rawNormalized.includes('CABIN')) return 'FILTRO DE CABINA';
    if (rawNormalized.includes('TRANS')) return 'FILTRO DE TRANSMISIÓN';

    return rawCategoryName; // Si no hay más remedio, devolver el original
};

/**
 * Normaliza un SKU para comparaciones y almacenamiento estándar.
 * - Elimina espacios en blanco.
 * - Mantiene caracteres alfanuméricos, guiones (-) y barras (/).
 * - Convierte a Mayúsculas.
 */
export const normalizeSku = (sku) => {
    if (!sku) return '';
    // Mantenemos letras, números, guiones y barras. Eliminamos espacios y otros símbolos.
    return sku.toString()
        .replace(/\s+/g, '') // Eliminar espacios
        .replace(/[^a-zA-Z0-9\-\/]/g, '') // Eliminar todo lo que no sea alfanumérico, '-' o '/'
        .toUpperCase();
};
