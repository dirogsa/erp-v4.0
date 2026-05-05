/**
 * Utilidades comunes para los parsers de catálogos
 */

/**
 * Diccionario maestro de dimensiones técnicas industriales.
 * Mapea etiquetas crudas y códigos a un esquema estandarizado.
 */
export const TECHNICAL_MAP = {
    // Diámetros
    'OUTER DIAMETER': { label: 'Diámetro Exterior', code: 'A', key: 'spec_d' },
    'DIAMETRO EXTERIOR': { label: 'Diámetro Exterior', code: 'A', key: 'spec_d' },
    'INNER DIAMETER 1': { label: 'Diámetro Interior 1', code: 'B', key: 'spec_id1' },
    'INNER DIAMETER 2': { label: 'Diámetro Interior 2', code: 'C', key: 'spec_id2' },
    'DIAMETRO INTERIOR 1': { label: 'Diámetro Interior 1', code: 'B', key: 'spec_id1' },
    'DIAMETRO INTERIOR 2': { label: 'Diámetro Interior 2', code: 'C', key: 'spec_id2' },
    
    // Altura
    'HEIGHT': { label: 'Altura', code: 'H', key: 'spec_h' },
    'ALTURA': { label: 'Altura', code: 'H', key: 'spec_h' },
    
    // Rosca
    'THREAD': { label: 'Rosca', code: 'G', key: 'spec_t' },
    'ROSCA': { label: 'Rosca', code: 'G', key: 'spec_t' },
    
    // Códigos Directos (Wix/Filtron/Mann)
    'A': { label: 'Diámetro Exterior', code: 'A', key: 'spec_d' },
    'B': { label: 'Diámetro Interior 1', code: 'B', key: 'spec_id1' },
    'C': { label: 'Diámetro Interior 2', code: 'C', key: 'spec_id2' },
    'D': { label: 'Diámetro Exterior', code: 'D', key: 'spec_d' }, // A veces D es Diámetro en otras marcas
    'H': { label: 'Altura', code: 'H', key: 'spec_h' },
    'G': { label: 'Rosca', code: 'G', key: 'spec_t' },
    'T': { label: 'Rosca', code: 'T', key: 'spec_t' },
};

/**
 * Intenta extraer el código técnico entre paréntesis ej: "Altura (H)" -> { label: "Altura", code: "H" }
 */
export const extractTechnicalInfo = (rawLabel) => {
    const codeMatch = rawLabel.match(/\((.+?)\)/);
    const code = codeMatch ? codeMatch[1].trim().toUpperCase() : null;
    let cleanLabel = rawLabel.replace(/\(.+?\)/, '').trim().toUpperCase();
    
    // Buscar en el mapa maestro
    const mapEntry = TECHNICAL_MAP[cleanLabel] || (code ? TECHNICAL_MAP[code] : null) || TECHNICAL_MAP[rawLabel.toUpperCase()];
    
    if (mapEntry) {
        return {
            label: mapEntry.label,
            code: mapEntry.code || code,
            key: mapEntry.key
        };
    }
    
    return { label: rawLabel, code: code, key: null };
};

/**
 * Resuelve el nombre de la categoría basándose en la lista de categorías de la base de datos
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
 * Normaliza las especificaciones técnicas crudas al esquema definido
 */
export const normalizeSpecs = (rawSpecs = [], categoryName, dbCategories = []) => {
    const category = dbCategories.find(c => c.name === categoryName);
    
    return rawSpecs.map(spec => {
        const techInfo = extractTechnicalInfo(spec.label);
        const rawLabel = spec.label.trim().toUpperCase();
        
        // Limpiar y convertir a número para búsquedas con tolerancia (Plan Maestro)
        const numericValue = parseFloat(spec.value.toString().replace(/,/g, '.').replace(/[^0-9.]/g, ''));
        
        let normalized = {
            ...spec,
            label: techInfo.label,
            code: techInfo.code,
            key: techInfo.key,
            value_num: isNaN(numericValue) ? null : numericValue
        };

        // 1. Intentar normalizar vía atributos_schema de la DB (Prioridad Máxima)
        if (category && category.attributes_schema) {
            const matchedAttr = category.attributes_schema.find(attr => {
                const mappings = (attr.import_mapping || []).map(m => m.trim().toUpperCase());
                return attr.label.toUpperCase() === rawLabel || 
                       mappings.includes(rawLabel) || 
                       (techInfo.code && mappings.includes(techInfo.code));
            });

            if (matchedAttr) {
                normalized.label = matchedAttr.label;
                normalized.key = matchedAttr.key || techInfo.key;
                normalized.unit = matchedAttr.unit || spec.measure_type;
            }
        }

        return normalized;
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
