/**
 * Utilidades comunes para los parsers de catálogos
 */

/**
 * Resuelve el nombre de la categoría basándose en la lista de categorías de la base de datos
 * y sus alias de importación.
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
            if (cat.name.toUpperCase() === rawNormalized) return cat.name;
            
            // 2. Comparación por alias de importación
            if (cat.import_aliases) {
                const aliases = cat.import_aliases.map(a => a.trim().toUpperCase());
                if (aliases.includes(rawNormalized)) return cat.name;
            }
        }
    }

    // Fallback heurístico si no hay match exacto ni por alias
    if (rawNormalized.includes('OIL')) return 'FILTRO DE ACEITE';
    if (rawNormalized.includes('AIR') && !rawNormalized.includes('CABIN')) return 'FILTRO DE AIRE';
    if (rawNormalized.includes('FUEL')) return 'FILTRO DE COMBUSTIBLE';
    if (rawNormalized.includes('CABIN')) return 'FILTRO DE CABINA';
    
    return rawCategoryName;
};

/**
 * Normaliza las especificaciones técnicas crudas (ej: "Outer Diameter") 
 * al esquema definido en la categoría (ej: "Diámetro Exterior").
 */
export const normalizeSpecs = (rawSpecs = [], categoryName, dbCategories = []) => {
    const category = dbCategories.find(c => c.name === categoryName);
    if (!category || !category.attributes_schema) return rawSpecs;

    return rawSpecs.map(spec => {
        const rawLabel = spec.label.trim().toUpperCase();
        
        // Buscar si algún atributo tiene este rawLabel en su import_mapping
        const matchedAttr = category.attributes_schema.find(attr => {
            const mappings = (attr.import_mapping || []).map(m => m.trim().toUpperCase());
            return attr.label.toUpperCase() === rawLabel || mappings.includes(rawLabel);
        });

        if (matchedAttr) {
            return {
                ...spec,
                label: matchedAttr.label, // Normalizamos al nombre de nuestra BD
                key: matchedAttr.key,
                unit: matchedAttr.unit
            };
        }

        return spec;
    });
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
