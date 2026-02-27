/**
 * Parser especializado para el nuevo formato Global de WIX Filters (wixfilters.com)
 * Extrae información detallada: SKU, EAN, Medidas, Aplicaciones completas y OE-Numbers.
 */
export const parseWix = (doc, domain) => {
    const data = {
        brand: 'WIX',
        sku: '',
        name: '',
        ean: '',
        status: '',
        category_name: '',
        description: '',
        image_url: '',
        image_gallery: [], // Nueva característica: galería completa
        tech_drawing_url: '',
        manual_pdf_url: '',
        specs: [],
        applications: [],
        equivalences: [], // Aquí mapearemos OE-Numbers y Cross-References
        tech_bulletin: ''
    };

    // 1. Datos Estructurados (JSON-LD) - Fuente de verdad para SKU y EAN
    const ldJsonScript = doc.querySelector('script[type="application/ld+json"]');
    if (ldJsonScript) {
        try {
            const ldData = JSON.parse(ldJsonScript.innerText);
            if (ldData.name) data.name = ldData.name;
            if (ldData.description) data.description = ldData.description;
            if (ldData.sku) data.sku = ldData.sku.replace('_WIX', ''); // Limpiamos el sufijo interno de WIX
            if (ldData.image) data.image_url = ldData.image;
        } catch (e) {
            console.warn("Error parsing JSON-LD", e);
        }
    }

    // 2. Títulos y Identificación (Fallback)
    const titleName = doc.querySelector('.cmp-product__title-name');
    if (titleName && !data.sku) {
        data.sku = titleName.innerText.trim();
    }
    
    const categoryEl = doc.querySelector('.cmp-product__title-family');
    if (categoryEl) {
        data.category_name = categoryEl.innerText.trim();
        if (!data.name) data.name = `${data.category_name} ${data.sku}`;
    }

    // 3. EAN / GTIN
    const skuValueEl = doc.querySelector('.cmp-product__sku-value');
    if (skuValueEl) {
        const eanMatch = skuValueEl.innerText.match(/\d{10,13}/);
        if (eanMatch) data.ean = eanMatch[0];
    }

    // 4. Estado y Disponibilidad
    const statusCircle = doc.querySelector('.cmp-product-status');
    if (statusCircle) {
        const rawStatus = statusCircle.getAttribute('data-g-binding-cmp-product-status-status');
        data.status = rawStatus === 'A' ? 'AVAILABLE' : 'DISCONTINUED';
    }

    // 5. Galería de Imágenes (Extracción del JSON de Adobe)
    const galleryEl = doc.querySelector('.cmp-product__gallery');
    if (galleryEl) {
        try {
            const galleryData = JSON.parse(galleryEl.getAttribute('data-g-binding-gallery-items') || '[]');
            data.image_gallery = galleryData.map(item => ({
                label: item.label,
                url: item.path,
                is_dim: item.path.includes('-dim') || /dim/i.test(item.label)
            }));
            
            // Priorizamos la imagen que no tenga el sufijo de caja si es posible
            const mainImg = galleryData.find(i => !i.path.includes('box')) || galleryData[0];
            if (mainImg) data.image_url = mainImg.path;

            // Extraer plano técnico si existe en la galería
            const dimImg = data.image_gallery.find(i => i.is_dim);
            if (dimImg) data.tech_drawing_url = dimImg.url;
        } catch (e) {
            console.warn("Error parsing Gallery JSON", e);
        }
    }

    // 6. Medidas / Especificaciones (Tabla Dinámica en el acordeón #dimensions)
    const dimensionsPanel = doc.querySelector('#dimensions .cmp-table table');
    if (dimensionsPanel) {
        dimensionsPanel.querySelectorAll('tr').forEach(row => {
            const tds = row.querySelectorAll('td');
            if (tds.length >= 2) {
                const label = tds[0].innerText.trim();
                const value = tds[1].innerText.trim();
                data.specs.push({
                    label,
                    measure_type: value.includes('mm') ? 'mm' : (value.includes('x') ? 'thread' : 'unit'),
                    value: value.replace(' mm', '')
                });
            }
        });
    }

    // 7. Aplicaciones Vehiculares (Estructura de Acordeones Anidados)
    const appAccordion = doc.querySelector('#applications');
    if (appAccordion) {
        // Nivel 1: Marcas (ej: FIAT)
        appAccordion.querySelectorAll('.cmp-accordion__header .cmp-accordion__title').forEach(makeEl => {
            const make = makeEl.innerText.trim();
            if (/Dimensions|Applications|OE-Numbers|Downloads/i.test(make)) return;

            const makePanel = makeEl.closest('.cmp-accordion__item').querySelector('.cmp-accordion__panel');
            if (makePanel) {
                // Nivel 2: Modelos (ej: Ducato 2002)
                makePanel.querySelectorAll('.cmp-accordion__item').forEach(modelItem => {
                    const modelTitle = modelItem.querySelector('.cmp-accordion__title');
                    if (!modelTitle) return;
                    const modelName = modelTitle.innerText.trim();

                    // Nivel 3: Motores (Tabla de aplicaciones)
                    const tableRows = modelItem.querySelectorAll('.cmp-table tbody tr');
                    tableRows.forEach((row, idx) => {
                        // Ignorar cabecera (th)
                        if (row.querySelector('th')) return;

                        const tds = row.querySelectorAll('td');
                        if (tds.length >= 6) {
                            const modelType = tds[0].innerText.trim();
                            const engineCode = tds[2].innerText.trim();
                            const ccm = tds[3].innerText.trim();
                            const kw = tds[4].innerText.trim();
                            const hp = tds[5].innerText.trim();
                            const year = tds[6]?.innerText.trim() || '';

                            data.applications.push({
                                make: make,
                                model: modelName,
                                engine: `${modelType} (${engineCode}) ${ccm}ccm ${hp}HP`,
                                year: year,
                                notes: `KW: ${kw}`
                            });
                        }
                    });
                });
            }
        });
    }

    // 8. OE-Numbers (Equivalencias Originales)
    const oePanel = doc.querySelector('#oeNumbers');
    if (oePanel) {
        const rows = oePanel.querySelectorAll('.cmp-table table tr');
        rows.forEach(row => {
            const tds = row.querySelectorAll('td');
            if (tds.length >= 2) {
                const brand = tds[0].innerText.trim();
                const code = tds[1].innerText.trim();
                data.equivalences.push({
                    brand,
                    code,
                    is_original: true // Por estar en la sección OE
                });
            }
        });
    }

    // 9. Descargas / Manuales
    const downloadsPanel = doc.querySelector('#downloads');
    if (downloadsPanel) {
        const pdfLink = downloadsPanel.querySelector('a[href*=".pdf"]');
        if (pdfLink) data.manual_pdf_url = pdfLink.getAttribute('href');
    }

    return data;
};
