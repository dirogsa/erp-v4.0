/**
 * Utilidades comunes para los parsers de catálogos.
 * Los parsers extraen los specs directamente del HTML fuente sin conversión de etiquetas.
 * El motor DIMS 3.0 tiene su propio Adapter de normalización en tiempo de ejecución.
 */

/**
 * Resuelve el nombre de la categoría basándose en la lista de categorías de la base de datos.
 */
export const resolveCategoryName = (rawCategoryName, dbCategories = []) => {
    if (!rawCategoryName) return 'FILTRO';
    
    const rawNormalized = rawCategoryName.trim().toUpperCase();

    if (dbCategories && dbCategories.length > 0) {
        for (const cat of dbCategories) {
            if (cat.name.toUpperCase() === rawNormalized) return cat.name;
            if (cat.import_aliases) {
                const aliases = cat.import_aliases.map(a => a.trim().toUpperCase());
                if (aliases.includes(rawNormalized)) return cat.name;
            }
        }
    }

    if (rawNormalized.includes('OIL')) return 'FILTRO DE ACEITE';
    if (rawNormalized.includes('AIR') && !rawNormalized.includes('CABIN')) return 'FILTRO DE AIRE';
    if (rawNormalized.includes('FUEL')) return 'FILTRO DE COMBUSTIBLE';
    if (rawNormalized.includes('CABIN')) return 'FILTRO DE CABINA';
    
    return rawCategoryName;
};

/**
 * Normaliza un SKU para comparaciones y almacenamiento estándar.
 */
export const normalizeSku = (sku) => {
    if (!sku) return '';
    return sku.toString()
        .replace(/\s+/g, '') 
        .replace(/[^a-zA-Z0-9\-\/]/g, '') 
        .toUpperCase();
};
