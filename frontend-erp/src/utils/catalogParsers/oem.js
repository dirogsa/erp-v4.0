import { resolveCategoryName, normalizeSku, normalizeSpecs } from './common';

/**
 * Parser especializado para productos OEM (Original Equipment Manufacturer)
 * Detecta información técnica de fuentes de terceros (como Asakashi) 
 * pero fuerza el SKU y la Marca como OEM según el nombre del archivo.
 */
export const parseOEM = (doc, filename, dbCategories = []) => {
    // Extraer SKU del nombre del archivo (preferente)
    // Ej: "151000158AA_OEM.html" -> "151000158AA"
    let skuFromFilename = '';
    if (filename) {
        // Eliminar extensión y luego el sufijo _OEM
        const baseName = filename.replace(/\.(html|htm)$/i, '');
        const rawSku = baseName.replace(/_OEM$/i, '').trim();
        skuFromFilename = normalizeSku(rawSku);
    }

    const data = {
        brand: 'OEM',
        sku: skuFromFilename || '',
        name: '',
        ean: '',
        type: 'COMMERCIAL',
        is_active_in_shop: false,
        status: 'AVAILABLE',
        category_name: 'Filtro (OEM)',
        description: '',
        image_url: '',
        image_gallery: [],
        tech_drawing_url: '',
        weight_g: 0,
        shape: '',
        specs: [],
        applications: [],
        equivalences: [],
        tech_bulletin: ''
    };

    // 1. Identificar si es JS ASAKASHI y extraer nombre base del producto
    const asakashiTitle = doc.querySelector('.search-title')?.innerText.trim();
    if (asakashiTitle) {
        // Normalizar texto por si hay saltos de línea o entidades raras
        const normalizedTitle = asakashiTitle.replace(/\s+/g, ' ');
        // "AIR FILTER » A8016" -> "A8016"
        const parts = normalizedTitle.split(/»|&raquo;/);
        const internalCode = normalizeSku(parts[parts.length - 1]);
        const categoryPart = parts[0].toUpperCase();

        // Si el SKU estaba vacío (ej: auto-lookup sin filename), intentar sacarlo de Asakashi
        if (!data.sku && internalCode) {
            data.sku = internalCode;
        }

        data.name = `FILTRO OEM ${data.sku}`.trim();
        
        // Agregar el código interno de Asakashi como equivalencia si es diferente del SKU
        if (internalCode && internalCode !== data.sku) {
            data.equivalences.push({
                brand: 'JS ASAKASHI',
                code: internalCode,
                is_original: false
            });
        }

        // Sincronizar con categorías de la BD
        data.category_name = resolveCategoryName(categoryPart, dbCategories);
    } else {
        // Si no es Asakashi, el nombre se basa en el SKU del archivo
        data.name = `FILTRO OEM ${data.sku}`;
    }

    // 2. Imágenes (Específico JS Asakashi)
    const galleryLink = doc.querySelector('#achrColorBox');
    const mainImg = doc.querySelector('.detail__gallery img');
    
    if (galleryLink?.href) {
        data.image_url = galleryLink.href;
    } else if (mainImg?.src) {
        data.image_url = mainImg.src;
    }

    // Fallback: capturar todas las imágenes relevantes
    const allImages = Array.from(doc.querySelectorAll('img'))
        .map(img => img.getAttribute('src') || img.getAttribute('data-src'))
        .filter(src => src && src.includes('/images/') && !src.includes('logo'));
    
    data.image_gallery = [...new Set([data.image_url, ...allImages])].filter(Boolean).map(url => ({ label: 'Referencia', url }));

    // 3. Especificaciones (Específico JS Asakashi)
    const specBlocks = doc.querySelectorAll('.detail__specification .str');
    specBlocks.forEach(block => {
        const title = block.querySelector('.param-title')?.innerText.trim();
        const value = block.querySelector('.param-field')?.innerText.trim();
        
        if (title && value) {
            data.specs.push({
                label: title,
                measure_type: title.includes('mm') ? 'mm' : 'other',
                value: value
            });

            if (title.toLowerCase().includes('weight')) {
                const numMatch = value.match(/[\d.]+/);
                if (numMatch) data.weight_g = parseFloat(numMatch[0]);
            }
            if (title.toLowerCase().includes('shape')) data.shape = value;
        }
    });

    // 4. Referencias Cruzadas (Cross References)
    const crossRefs = doc.querySelectorAll('.detail__plate .str');
    crossRefs.forEach(ref => {
        const owner = ref.querySelector('.owner')?.innerText.trim();
        const code = ref.querySelector('.field')?.innerText.trim();
        if (owner && code) {
            data.equivalences.push({
                brand: owner,
                code: code,
                is_original: owner.toUpperCase() === 'CHERY' || owner.toUpperCase() === 'OEM'
            });
        }
    });

    // 5. Aplicaciones de Vehículos
    const models = doc.querySelectorAll('.model-title h3');
    models.forEach(modelEl => {
        const fullModelText = modelEl.innerText.trim(); // Ej: "CHERY » Tiggo 3x"
        const [make, ...modelRest] = fullModelText.split('»').map(s => s.trim());
        const modelName = modelRest.join(' ');

        // Buscar la tabla de datos que sigue a este título
        const table = modelEl.closest('.model-title').nextElementSibling;
        if (table && table.classList.contains('model-body')) {
            const rows = table.querySelectorAll('.model-data');
            rows.forEach(row => {
                data.applications.push({
                    make: make,
                    model: modelName,
                    engine: row.querySelector('.tdEngineNo')?.innerText.trim() || '',
                    year: row.querySelector('.tdYear')?.innerText.trim() || '',
                    engine_vol: row.querySelector('.tdEngineVol')?.innerText.trim() || '',
                    body: row.querySelector('.tdBody')?.innerText.trim() || '',
                    notes: `Fuente: Catálogo JS Asakashi - Referencia OEM`
                });
            });
        }
    });

    // 6. Normalización de Specs (Inteligencia Enterprise)
    data.specs = normalizeSpecs(data.specs, data.category_name, dbCategories);

    return data;
};
