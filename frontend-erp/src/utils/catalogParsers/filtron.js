/**
 * Parser especializado para el nuevo formato Global de FILTRON (filtron.eu)
 * Basado en la estructura AEM (Adobe Experience Manager) compartida con WIX.
 */
export const parseFiltron = (doc, domain) => {
    const data = {
        brand: 'FILTRON',
        sku: '',
        name: '',
        ean: '',
        type: 'COMMERCIAL',        // <--- Forzamos el tipo solicitado
        is_active_in_shop: false,  // <--- Forzamos el estado inactivo por defecto
        status: '',
        category_name: '',
        description: '',
        image_url: '',
        image_gallery: [], 
        tech_drawing_url: '',
        manual_pdf_url: '',
        weight_g: 0,
        shape: '',
        specs: [],
        applications: [],
        equivalences: [], 
        tech_bulletin: ''
    };

    // 1. Datos Estructurados (JSON-LD)
    const ldJsonScript = doc.querySelector('script[type="application/ld+json"]');
    if (ldJsonScript) {
        try {
            const ldData = JSON.parse(ldJsonScript.innerText);
            if (ldData.name) data.name = ldData.name;
            if (ldData.description) data.description = ldData.description;
            if (ldData.sku) {
                // Limpiamos sufijo de marca
                data.sku = ldData.sku.replace(/_FILTRON$|-FILTRON$| FILTRON$/i, '').trim(); 
            }
            if (ldData.image) data.image_url = ldData.image;
        } catch (e) {
            console.warn("Error parsing JSON-LD in Filtron", e);
        }
    }

    // 2. Títulos y Identificación (Fallback)
    const titleName = doc.querySelector('.cmp-product__title-name');
    if (titleName && !data.sku) {
        data.sku = titleName.innerText.trim();
    }
    
    // Mapeo de categorías para Filtron (muchas ya vienen en español en el HTML proporcionado)
    const categoryMap = {
        'AIR FILTER': 'Filtro de Aire',
        'OIL FILTER': 'Filtro de Aceite',
        'FUEL FILTER': 'Filtro de Combustible',
        'CABIN FILTER': 'Filtro de Cabina',
        'HYDRAULIC FILTER': 'Filtro Hidráulico'
    };

    const categoryEl = doc.querySelector('.cmp-product__title-family');
    if (categoryEl) {
        const rawCat = categoryEl.innerText.trim().toUpperCase();
        data.category_name = categoryMap[rawCat] || categoryEl.innerText.trim();
        
        // Limpiezas específicas de Filtron (de versiones anteriores)
        data.category_name = data.category_name
            .replace(/s$/i, '')
            .replace(/os /i, 'o ')
            .replace(/Asentamiento/i, 'Aire');

        // Construimos el nombre estándar
        data.name = `${data.category_name} ${data.brand} ${data.sku}`.trim();
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
        data.status = rawStatus === 'suministrable' || rawStatus === 'A' ? 'AVAILABLE' : 'DISCONTINUED';
    }

    // 5. Galería de Imágenes (JSON de Adobe)
    const gallerySection = doc.querySelector('.cmp-product__full-detail-image-carousel');
    if (gallerySection) {
        const galleryItems = [];
        const foundUrls = new Set();
        const galleryEl = gallerySection.querySelector('[data-g-binding-gallery-items]');
        
        if (galleryEl) {
            try {
                const galleryData = JSON.parse(galleryEl.getAttribute('data-g-binding-gallery-items') || '[]');
                galleryData.forEach(item => {
                    if (item.path && !foundUrls.has(item.path)) {
                        galleryItems.push({
                            label: item.label || 'Producto',
                            url: item.path,
                            is_dim: item.path.includes('-dim') || /dim|plano/i.test(item.label)
                        });
                        foundUrls.add(item.path);
                    }
                });
            } catch (e) {
                console.warn("Error parsing Filtron Gallery JSON", e);
            }
        }

        if (galleryItems.length > 0) {
            data.image_gallery = galleryItems;
            const mainImg = galleryItems.find(i => !i.url.includes('box') && !i.is_dim) || galleryItems[0];
            if (mainImg) data.image_url = mainImg.url;
            const dimImg = galleryItems.find(i => i.is_dim);
            if (dimImg) data.tech_drawing_url = dimImg.url;
        }
    }

    // 6. Medidas / Dimensiones
    const dimensionsPanel = doc.querySelector('#dimensions .cmp-table table');
    if (dimensionsPanel) {
        dimensionsPanel.querySelectorAll('tr').forEach(row => {
            const tds = row.querySelectorAll('td');
            if (tds.length >= 2) {
                const label = tds[0].innerText.trim();
                const value = tds[1].innerText.trim();
                
                if (/Weight|Peso|Masa/i.test(label)) {
                    const numMatch = value.match(/[\d.]+/);
                    if (numMatch) data.weight_g = parseFloat(numMatch[0]);
                } else if (/Shape|Forma/i.test(label)) {
                    data.shape = value;
                }

                data.specs.push({
                    label,
                    measure_type: value.includes('mm') ? 'mm' : (value.includes('x') ? 'thread' : 'other'),
                    value: value.replace(' mm', '')
                });
            }
        });
    }

    // 7. Aplicaciones Vehiculares
    const appAccordion = doc.querySelector('#applications');
    if (appAccordion) {
        appAccordion.querySelectorAll('.cmp-accordion__header .cmp-accordion__title').forEach(makeEl => {
            const make = makeEl.innerText.trim();
            if (/Dimensiones|Aplicaciones|OE|Descargas/i.test(make)) return;

            const makePanel = makeEl.closest('.cmp-accordion__item').querySelector('.cmp-accordion__panel');
            if (makePanel) {
                makePanel.querySelectorAll('.cmp-accordion__item').forEach(modelItem => {
                    const modelTitle = modelItem.querySelector('.cmp-accordion__title');
                    if (!modelTitle) return;
                    const modelName = modelTitle.innerText.trim();

                    const tableRows = modelItem.querySelectorAll('.cmp-table tbody tr');
                    tableRows.forEach(row => {
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

    // 8. OE-Numbers / Equivalencias
    const sectionSelectors = ['#oeNumbers', '#crossReferences', '[id*="oeNumbers"]', '[id*="cross-references"]'];
    const sections = doc.querySelectorAll(sectionSelectors.join(','));
    const equivalents = [];

    const addEquivalence = (brandRaw, codeRaw) => {
        const brand = (brandRaw || "").trim().toUpperCase();
        let code = (codeRaw || "").trim().toUpperCase();
        if (!brand || !code || brand.length < 2 || code.length < 2) return;
        if (/MARCA|BRAND|PRODUCENT|CODE|NUMER/i.test(brand)) return;

        if (!equivalents.some(e => e.brand === brand && e.code === code)) {
            equivalents.push({
                brand,
                code,
                is_original: /OE|CITROEN|PEUGEOT|FORD|FIAT|VW|BOSCH|MANN/i.test(brand)
            });
        }
    };

    sections.forEach(section => {
        const nestedItems = section.querySelectorAll('.cmp-accordion__item');
        if (nestedItems.length > 0) {
            nestedItems.forEach(item => {
                const brandName = item.querySelector('.cmp-accordion__title')?.textContent?.trim();
                if (!brandName) return;
                const codes = item.querySelectorAll('td, li, p, span');
                codes.forEach(node => {
                    const text = node.textContent.trim();
                    if (text && text !== brandName && text.length > 2 && text.length < 50) {
                        if (node.children.length > 1) return;
                        addEquivalence(brandName, text);
                    }
                });
            });
        }
    });

    data.equivalences = equivalents;

    // 9. Descargas
    const downloadsPanel = doc.querySelector('#downloads');
    if (downloadsPanel) {
        const pdfLink = downloadsPanel.querySelector('a[href*=".pdf"]');
        if (pdfLink) data.manual_pdf_url = pdfLink.getAttribute('href');
    }

    return data;
};
