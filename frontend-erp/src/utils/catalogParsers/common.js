/**
 * Utilidades comunes para los parsers de catálogos
 */

/**
 * Diccionario maestro de dimensiones técnicas industriales por categoría.
 * Normaliza etiquetas de distintos proveedores hacia claves estándar (A, B, C, H, OD, etc.)
 */
export const SPEC_MAPS = {
    "FILTRO DE AIRE": {
        "A": { labels: ["A", "Longitud", "Largo", "Length", "OD", "Outer Diameter", "Diámetro exterior"], display: "Diámetro exterior / Longitud (A)" },
        "B": { labels: ["B", "Ancho", "Width", "Diámetro interior superior", "Inner Diameter Top"], display: "Diámetro interior superior / Ancho (B)" },
        "C": { labels: ["C", "Diámetro interior inferior", "Inner Diameter Bottom"], display: "Diámetro interior inferior (C)" },
        "D": { labels: ["D", "Diámetro interior", "Inner Diameter", "ID"], display: "Diámetro interior (D)" },
        "H": { labels: ["H", "Altura", "Alto", "Height"], display: "Altura (H)" },
    },
    "FILTRO DE ACEITE": {
        "OD": { labels: ["OD", "Diámetro exterior", "Outer Diameter", "D", "A"], display: "Diámetro exterior (OD)" },
        "ID": { labels: ["ID", "Diámetro interior", "Inner Diameter", "B", "C"], display: "Diámetro interior (ID)" },
        "H":  { labels: ["H", "Altura", "Alto", "Height"], display: "Altura (H)" },
        "G":  { labels: ["G", "Rosca", "Thread", "Rosca interior", "Thread Pitch"], display: "Rosca (G)" },
    },
    "FILTRO DE CABINA": {
        "A": { labels: ["A", "Largo", "Longitud", "Length"], display: "Largo (A)" },
        "B": { labels: ["B", "Ancho", "Width"], display: "Ancho (B)" },
        "H": { labels: ["H", "Espesor", "Grosor", "Thickness", "Alto", "Altura", "Height"], display: "Espesor (H)" },
    },
    "FILTRO DE COMBUSTIBLE": {
        "OD": { labels: ["OD", "Diámetro exterior", "Outer Diameter", "D", "A"], display: "Diámetro exterior (OD)" },
        "IN": { labels: ["IN", "Entrada", "Inlet"], display: "Entrada" },
        "OUT": { labels: ["OUT", "Salida", "Outlet"], display: "Salida" },
        "H":  { labels: ["H", "Altura", "Alto", "Height"], display: "Altura (H)" },
        "G":  { labels: ["G", "Rosca", "Thread", "Rosca interior"], display: "Rosca (G)" },
    }
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
 * Normaliza las especificaciones técnicas crudas al esquema definido (Estandarización Enterprise)
 */
export const normalizeSpecs = (rawSpecs = [], categoryName, dbCategories = []) => {
    const catMap = SPEC_MAPS[categoryName] || {};
    
    let normalizedSpecs = rawSpecs.map(spec => {
        const rawLabelUpper = spec.label.trim().toUpperCase();
        
        let foundKey = spec.label; // Por defecto
        let foundDisplay = spec.label;

        // Buscar en el mapeo de la categoría
        for (const [stdKey, config] of Object.entries(catMap)) {
            const match = config.labels.some(l => {
                const lUp = l.toUpperCase();
                return rawLabelUpper === lUp || rawLabelUpper.includes(`(${lUp})`) || rawLabelUpper.includes(`${lUp} `) || rawLabelUpper === `${lUp}:`;
            });
            if (match) {
                foundKey = stdKey;
                foundDisplay = config.display;
                break;
            }
        }

        return {
            ...spec,
            label: foundKey,             // Clave interna técnica (ej: "A", "H", "OD")
            display_label: foundDisplay, // Clave legible para catálogo (ej: "Diámetro exterior / Longitud (A)")
        };
    });

    // --- SWAP LOGIC: Normalización para filtros Rectangulares/Llanos ---
    // Asegurar que el lado mayor siempre sea A y el menor B
    if (categoryName === "FILTRO DE AIRE" || categoryName === "FILTRO DE CABINA") {
        const specA = normalizedSpecs.find(s => s.label === "A");
        const specB = normalizedSpecs.find(s => s.label === "B");
        
        if (specA && specB) {
            const valA = parseFloat(specA.value.toString().replace(/,/g, '.').replace(/[^0-9.]/g, ''));
            const valB = parseFloat(specB.value.toString().replace(/,/g, '.').replace(/[^0-9.]/g, ''));
            
            if (!isNaN(valA) && !isNaN(valB) && valB > valA) {
                // Intercambiar valores
                const tempVal = specA.value;
                specA.value = specB.value;
                specB.value = tempVal;
            }
        }
    }

    return normalizedSpecs;
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
