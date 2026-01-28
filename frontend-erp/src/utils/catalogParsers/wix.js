/**
 * Parser específico para catálogos de WIX Filters
 */
export const parseWix = (doc, domain) => {
    const data = {
        brand: 'WIX',
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
        let text = skuEl.innerText.trim();
        data.sku = text.includes(':') ? text.split(':').pop().trim() : text.trim();
    }

    // Imagen y PDF
    // Intentamos varios selectores ya que el visor 3D puede ocultar el ID principal
    const has3D = doc.getElementById('3dModelContainer') || doc.querySelector('.model-container');
    const img = doc.querySelector('#productImage-large') ||
        doc.querySelector('.product-table-image img') ||
        doc.querySelector('.productImageButton[data-image="large"] img');

    if (img) {
        let src = img.getAttribute('src');
        // Si la imagen es muy pequeña (thumb), intentamos sacar la versión 'large' de la URL
        if (src && src.includes('/small/')) src = src.replace('/small/', '/large/');
        data.image_url = src && src.startsWith('/') ? domain + src : src;
    } else if (data.sku && has3D) {
        // FALLBACK: Si hay 3D pero no hay <img>, construimos la URL estándar de 2D
        data.image_url = `${domain}/website/images/filters/large/${data.sku}.jpg`;
    }

    const techImg = doc.querySelector('#productImage-largeExtra') ||
        doc.querySelector('#productImage-largePlain') ||
        doc.querySelector('.productImageButton[data-image="largeExtra"] img') ||
        doc.querySelector('.productImageButton[data-image="largePlain"] img') ||
        doc.querySelector('.productImageButton[data-image="dimensions"] img');

    if (techImg) {
        let src = techImg.getAttribute('src');
        if (src && src.includes('/small')) src = src.replace('/small', '/large');
        data.tech_drawing_url = src && src.startsWith('/') ? domain + src : src;
    } else if (data.sku) {
        // Fallback predictivo inteligente para WIX/Filtron
        // Intentamos largeExtra (estándar), si no, largePlain (plano sin cotas)
        data.tech_drawing_url = `${domain}/website/images/filters/largeExtra/${data.sku}.jpg`;
        // Nota: En el frontend se podría verificar si esta imagen carga, 
        // y si no, intentar con /largePlain/ o /dimensions/
    }

    const pdfLink = doc.querySelector('a[href*=".pdf"]');
    if (pdfLink) {
        const href = pdfLink.getAttribute('href');
        data.manual_pdf_url = href && href.startsWith('/') ? domain + href : href;
    }

    // Medidas (WIX suele tener etiquetas más largas)
    doc.querySelectorAll('.product-table-sizes > div').forEach(row => {
        const divs = row.querySelectorAll('div');
        if (divs.length >= 2) {
            const label = divs[0].innerText.trim().replace(':', '');
            const value = divs[1].innerText.trim();
            if (label && value && !/APLICACIÓN|ESTADO|PRODUCTO|IMAGEN/i.test(label)) {
                data.specs.push({
                    label,
                    measure_type: /Rosca|Thread|UNF|G\d/i.test(label) ? 'thread' : 'mm',
                    value
                });
            }
        }
    });

    // Equivalencias (Formato Accordion)
    let eqArea = doc.getElementById('tab2') || doc.getElementById('tab_2') || doc.querySelector('.tab-pane[id*="tab2"]');
    if (eqArea) {
        const panels = eqArea.querySelectorAll('.panel-default');
        panels.forEach(panel => {
            const brand = panel.querySelector('a')?.innerText.trim().toUpperCase();
            if (brand && !/REFERENCIA|CROSS|CRUZADA|APLICACIONES/i.test(brand)) {
                const collapseArea = panel.querySelector('.panel-collapse') || panel;
                collapseArea.querySelectorAll('tr, .tr, li').forEach(row => {
                    const code = (row.querySelector('td, .td') ? row.querySelector('td, .td').innerText : row.innerText).trim().toUpperCase();
                    if (code && code.length >= 2 && !/PRODUCENT|MARCA|BRAND|CODE/i.test(code)) {
                        data.equivalences.push({
                            brand,
                            code,
                            is_original: /OE|VAG|VW|VOLKSWAGEN|AUDI|SEAT|SKODA|BMW|MERCEDES|FORD|TOYOTA|HYUNDAI|KIA|PSA|PEUGEOT|CITROEN|RENAULT|NISSAN|HONDA|MAZDA|MITSUBISHI|GM|CHEVROLET|FIAT|CHRYSLER/i.test(brand)
                        });
                    }
                });
            }
        });
    }

    return data;
};
