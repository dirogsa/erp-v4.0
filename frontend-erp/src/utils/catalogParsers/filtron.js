/**
 * Parser específico para catálogos de Filtron
 */
export const parseFiltron = (doc, domain) => {
    const data = {
        brand: 'FILTRON',
        sku: '',
        category_name: '',
        image_url: '',
        tech_drawing_url: '',
        manual_pdf_url: '',
        specs: [],
        applications: [],
        equivalences: [],
        tech_bulletin: ''
    };

    // SKU
    let skuEl = doc.querySelector('.inside h1') || doc.querySelector('.product-table-info h2');
    if (skuEl) {
        data.sku = skuEl.innerText.replace('...', '').trim();
    }

    // Imagen y PDF
    const has3D = doc.getElementById('3dModelContainer') || doc.querySelector('.model-container');
    const img = doc.querySelector('#productImage-large') ||
        doc.querySelector('.product-table-image img') ||
        doc.querySelector('.productImageButton[data-image="large"] img');

    if (img) {
        let src = img.getAttribute('src');
        if (src && src.includes('/small/')) src = src.replace('/small/', '/large/');
        data.image_url = src && src.startsWith('/') ? domain + src : src;
    } else if (data.sku && has3D) {
        // Fallback predictivo
        data.image_url = `${domain}/website/images/filters/large/${data.sku}.jpg`;
    }

    const techImg = doc.querySelector('#productImage-largeExtra') ||
        doc.querySelector('#productImage-largePlain') ||
        doc.querySelector('.productImageButton[data-image="largeExtra"] img') ||
        doc.querySelector('.productImageButton[data-image="largePlain"] img');
    if (techImg) {
        let src = techImg.getAttribute('src');
        if (src && src.includes('/small/')) src = src.replace('/small/', '/large/');
        data.tech_drawing_url = src && src.startsWith('/') ? domain + src : src;
    } else if (data.sku) {
        // Fallback predictivo para planos
        data.tech_drawing_url = `${domain}/website/images/filters/largeExtra/${data.sku}.jpg`;
    }

    const pdfLink = doc.querySelector('a[href*=".pdf"]');
    if (pdfLink) {
        const href = pdfLink.getAttribute('href');
        data.manual_pdf_url = href && href.startsWith('/') ? domain + href : href;
    }

    // Medidas (Filtron usa letras A, B, C, H)
    doc.querySelectorAll('.product-table-sizes > div').forEach(row => {
        const divs = row.querySelectorAll('div');
        if (divs.length >= 2) {
            const label = divs[0].innerText.trim();
            const value = divs[1].innerText.trim();
            if (label && value && label.length <= 3) {
                data.specs.push({ label, measure_type: 'mm', value });
            }
        }
    });

    // Equivalencias (Sustitutos / Sustitutos / Cross Reference)
    let eqArea = doc.getElementById('tab2') || doc.getElementById('tab_2') || doc.querySelector('[id*="tab2"]');

    // Fallback: Si no hay ID, buscamos el panel por su contenido textual
    if (!eqArea) {
        const allPanes = doc.querySelectorAll('.tab-pane, .panel, .panel-group');
        eqArea = Array.from(allPanes).find(p =>
            p.innerText.toUpperCase().includes('SUSTITUTOS') ||
            p.innerText.toUpperCase().includes('REPLACEMENTS') ||
            p.innerText.toUpperCase().includes('CROSS REFERENCE')
        );
    }

    if (eqArea) {
        // En Filtron/WIX, los sustitutos pueden estar en dos formatos:
        // 1. Formato ACORDEÓN (como WIX): Paneles donde cada marca es un encabezado y los códigos están dentro.
        // 2. Formato TABLA PLANA: Filas con [Marca, Código] o [#, Marca, Código]

        const panels = eqArea.querySelectorAll('.panel-default');

        if (panels.length > 0) {
            // --- CASO 1: FORMATO ACORDEÓN (Igual a WIX) ---
            panels.forEach(panel => {
                let eqBrand = panel.querySelector('a')?.innerText.trim().toUpperCase();
                if (eqBrand && !/REFERENCIA|CROSS|CRUZADA|APLICACIONES/i.test(eqBrand)) {
                    const collapseArea = panel.querySelector('.panel-collapse') || panel;
                    collapseArea.querySelectorAll('tr, .tr, li, .td').forEach(row => {
                        let eqCode = (row.querySelector('td, .td') ? row.querySelector('td, .td').innerText : row.innerText).trim().toUpperCase();
                        if (eqCode && eqCode.length >= 2 && !/PRODUCENT|MARCA|BRAND|CODE|NUMER/i.test(eqCode) && eqCode !== eqBrand) {
                            data.equivalences.push({
                                brand: eqBrand,
                                code: eqCode,
                                is_original: /OE|VAG|VW|VOLKSWAGEN|AUDI|SEAT|SKODA|BMW|MERCEDES|FORD|TOYOTA|HYUNDAI|KIA|PSA|PEUGEOT|CITROEN|RENAULT|NISSAN|HONDA|MAZDA|MITSUBISHI|GM|CHEVROLET|FIAT|CHRYSLER/i.test(eqBrand)
                            });
                        }
                    });
                }
            });
        }

        if (data.equivalences.length === 0) {
            // --- CASO 2: FORMATO TABLA PLANA ---
            const rows = eqArea.querySelectorAll('tr, .tr, .filtersTable .tr');
            rows.forEach(row => {
                const cells = Array.from(row.querySelectorAll('td, .td')).map(c => c.innerText.trim());
                if (cells.length < 2) return;

                // Ignorar encabezados
                if (/MARCA|BRAND|PRODUCENT|MAKER|NUMER|SUSTITUTO/i.test(cells[0]) ||
                    /MARCA|BRAND|PRODUCENT|MAKER/i.test(cells[1])) return;

                let brandStr = "";
                let codeStr = "";

                if (cells.length >= 3 && (cells[0].length <= 3 || !isNaN(cells[0]))) {
                    brandStr = cells[1]; codeStr = cells[2];
                } else {
                    brandStr = cells[0]; codeStr = cells[1];
                }

                if (brandStr && codeStr && brandStr.length >= 2 && codeStr.length >= 2) {
                    const cleanBrand = brandStr.toUpperCase();
                    data.equivalences.push({
                        brand: cleanBrand,
                        code: codeStr.toUpperCase(),
                        is_original: /OE|VAG|VW|VOLKSWAGEN|AUDI|SEAT|SKODA|BMW|MERCEDES|FORD|TOYOTA|HYUNDAI|KIA|PSA|PEUGEOT|CITROEN|RENAULT|NISSAN|HONDA|MAZDA|MITSUBISHI|GM|CHEVROLET|FIAT|CHRYSLER/i.test(cleanBrand)
                    });
                }
            });
        }
    }

    return data;
};
