/**
 * Parser específico para catálogos de WIX Filters
 */
export const parseWix = (doc, domain) => {
    const data = {
        brand: 'WIX',
        sku: '',
        name: '',
        ean: '',
        category_name: '',
        image_url: '',
        tech_drawing_url: '',
        manual_pdf_url: '',
        specs: [],
        applications: [],
        equivalences: [],
        tech_bulletin: '',
        // Manufacturer/Supplier Info (extracted from JSON-LD)
        manufacturer_name: '',
        manufacturer_address: '',
        vat_id: ''
    };

    // Extract Info from JSON-LD (Company info, address)
    const ldJsonScript = doc.querySelector('script[type="application/ld+json"]');
    if (ldJsonScript) {
        try {
            const ldData = JSON.parse(ldJsonScript.innerText);
            if (ldData.address) {
                const addr = ldData.address;
                data.manufacturer_address = [
                    addr.streetAddress,
                    addr.postalCode,
                    addr.addressLocality,
                    addr.addressRegion
                ].filter(Boolean).join(', ');
            }
            if (ldData.name) data.manufacturer_name = ldData.name;
            if (ldData.vatID) data.vat_id = ldData.vatID;
        } catch (e) {
            console.warn("Error parsing JSON-LD for address", e);
        }
    }

    // SKU & Name/Category
    let skuEl = doc.querySelector('.inside h1') || doc.querySelector('.product-table-info h2');
    if (skuEl) {
        let text = skuEl.innerText.trim();
        // Text is often "Filtros de aceite: WL7476" or similar
        if (text.includes(':')) {
            const parts = text.split(':');
            data.category_name = parts[0].trim(); // "Filtros de aceite"
            data.sku = parts[1].trim();           // "WL7476"
            // Set meaningful name, e.g., "Filtro de aceite WL7476"
            // Normalize category name slightly for better product names (singularize if simple)
            let cat = data.category_name;

            // Singularización inteligente para español
            if (cat.startsWith('Filtros')) {
                cat = cat.replace('Filtros', 'Filtro');
            } else if (cat.endsWith('s') && !cat.endsWith('ss')) {
                cat = cat.slice(0, -1);
            }
            data.name = `${cat} ${data.sku}`;
        } else {
            data.sku = text.trim();
            data.name = text.trim();
        }
    }

    // EAN Extraction
    const eanEl = doc.querySelector('.product-table-code span');
    if (eanEl) {
        data.ean = eanEl.innerText.trim();
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

    // Aplicaciones (Pestaña 1 - Estructura de Acordeón Anidado)
    // #tab1 -> #accordion (Marcas) -> #subaccordionX (Modelos) -> Table (Motores)
    let appArea = doc.getElementById('tab1') || doc.getElementById('tab_1') || doc.querySelector('.tab-pane[id*="tab1"]');
    if (appArea) {
        // Nivel 1: Marcas (Paneles dentro del acordeón principal)
        const makePanels = appArea.querySelectorAll('#accordion > .panel');
        makePanels.forEach(makePanel => {
            const makeLink = makePanel.querySelector('a[data-parent="#accordion"]');
            if (!makeLink) return;

            // Limpiar nombre de marca (ej: "AUDI" -> "AUDI")
            const make = makeLink.innerText.trim();

            // Nivel 2: Modelos (Acordeón anidado)
            const subAccordion = makePanel.querySelector('.panel-group[id^="subaccordion"]');
            if (subAccordion) {
                const modelPanels = subAccordion.querySelectorAll('.panel');
                modelPanels.forEach(modelPanel => {
                    const modelLink = modelPanel.querySelector('a[data-toggle="collapse"]');
                    if (!modelLink) return;
                    const model = modelLink.innerText.trim();

                    // Nivel 3: Motores (Filas de tabla)
                    const tableRows = modelPanel.querySelectorAll('table tr');
                    tableRows.forEach((row, idx) => {
                        // Ignorar cabecera (suele ser la primera fila o th)
                        if (idx === 0 && row.querySelector('th')) return;

                        const tds = row.querySelectorAll('td');
                        if (tds.length >= 4) {
                            // Col 0: Motor/Detalle (ej: 1.6 TDI (8X))
                            // Col 1: Código Motor (ej: CAYC)
                            // Col 2: CC
                            // Col 3: kW
                            // Col 4: CV
                            // Col 5: Año (ej: 08/2010 → 04/2015)
                            const engineDetail = tds[0].innerText.trim();
                            const engineCode = tds[1].innerText.trim();
                            const hp = tds[4]?.innerText.trim() || '';
                            const year = tds[5]?.innerText.trim() || '';

                            // Construimos un string de motor descriptivo
                            const engine = `${engineDetail} (${engineCode}) ${hp ? hp + 'CV' : ''}`.trim();

                            data.applications.push({
                                make,
                                model,
                                engine, // Texto combinado para mostrar en UI
                                year,
                                notes: engineCode // Guardamos el código de motor en notas también
                            });
                        }
                    });
                });
            }
        });
    }

    // Equivalencias (Formato Accordion - Pestaña 2)
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

    // Boletín Técnico / Notas Importantes
    // Ejemplo HTML: <div class="filtersTable ..."> ... <span class="title-top">Nota...</span> ... <span class="news-item-desc">Descripcion...</span>
    const newsItems = doc.querySelectorAll('.news-item-td');
    if (newsItems.length > 0) {
        let bulletins = [];
        newsItems.forEach(item => {
            const title = item.querySelector('.title-top')?.innerText.trim() || '';
            const desc = item.querySelector('.news-item-desc')?.innerText.trim() || '';
            if (title || desc) {
                bulletins.push(`[${title}] ${desc}`);
            }
        });
        data.tech_bulletin = bulletins.join('\n\n');
    }

    return data;
};
