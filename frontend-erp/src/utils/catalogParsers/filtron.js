/**
 * Parser específico para catálogos de Filtron
 */
export const parseFiltron = (doc, domain) => {
    const data = {
        brand: 'FILTRON',
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
        tech_bulletin: ''
    };

    // SKU, Name & Category
    // Filtron suele tener el título en H1 o H2 dentro de .product-table-info
    let skuEl = doc.querySelector('.inside h1') || doc.querySelector('.product-table-info h2');
    if (skuEl) {
        let text = skuEl.innerText.trim();
        // Format: "Filtros de aceite: OP520/1"
        if (text.includes(':')) {
            const parts = text.split(':');
            data.category_name = parts[0].trim();
            // PRIMERO reemplazamos '/' por '-' para sanitizar el SKU antes de usarlo
            data.sku = parts[1].replace('...', '').trim().replace(/\//g, '-');

            // Meaningful Name & Singularization
            let cat = data.category_name;
            if (cat.startsWith('Filtros')) {
                cat = cat.replace('Filtros', 'Filtro');
            } else if (cat.endsWith('s') && !cat.endsWith('ss')) {
                cat = cat.slice(0, -1);
            }
            data.name = `${cat} ${data.sku}`;
        } else {
            data.sku = text.replace('...', '').trim().replace(/\//g, '-');
            data.name = `${data.sku}`; // Fallback simple
        }
    }

    // EAN Extraction
    // Intentamos varios selectores ya que Filtron cambia a veces
    let eanEl = doc.querySelector('.product-table-code span') || doc.querySelector('.product-ean');

    // Si no lo encontramos por clase directa, buscamos por texto
    if (!eanEl) {
        const potentialEanDivs = doc.querySelectorAll('.product-table-description > div, .product-table-column > div');
        for (const div of potentialEanDivs) {
            if (div.innerText.includes('EAN') || div.innerText.includes('Código EAN') || div.innerText.includes('Kod EAN')) {
                const code = div.innerText.replace(/.*EAN.*:/i, '').trim();
                // Validamos que parezca un EAN (solo números)
                if (/^\d+$/.test(code)) {
                    data.ean = code;
                    break;
                }
            }
        }
    } else {
        data.ean = eanEl.innerText.trim();
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

    // Boletín Técnico / Notas Importantes (Igual que WIX)
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

    // Medidas (Filtron usa letras A, B, C, H)
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

    // Aplicaciones (Pestaña 1 - Estructura de Acordeón Anidado como WIX)
    // Filtron usa una estructura muy similar (a veces idéntica) a WIX
    let appArea = doc.getElementById('tab1') || doc.getElementById('tab_1') || doc.querySelector('.tab-pane[id*="tab1"]');
    if (appArea) {
        // Nivel 1: Marcas
        const makePanels = appArea.querySelectorAll('.panel, .accordion-group');
        makePanels.forEach(makePanel => {
            // Buscar el link que abre este panel
            const makeLink = makePanel.querySelector('a[data-toggle="collapse"][data-parent="#accordion"], a.accordion-toggle');

            // Si el panel no tiene link o no parece un acordeón principal, saltamos
            if (!makeLink && !makePanel.parentNode.id.includes('accordion')) return;
            if (!makeLink) return;

            const make = makeLink.innerText.trim();

            // Nivel 2: Modelos (Acordeón anidado o subpaneles)
            const subAccordion = makePanel.querySelector('.panel-group, .accordion-inner');
            if (subAccordion) {
                const modelPanels = subAccordion.querySelectorAll('.panel');
                modelPanels.forEach(modelPanel => {
                    const modelLink = modelPanel.querySelector('a[data-toggle="collapse"]');
                    if (!modelLink) return;
                    const model = modelLink.innerText.trim();

                    // Nivel 3: Motores (Filas de tabla)
                    const tableRows = modelPanel.querySelectorAll('table tr');
                    tableRows.forEach((row, idx) => {
                        // Ignorar cabecera si es el primer elemento y tiene th
                        if (idx === 0 && row.querySelector('th')) return;

                        const tds = row.querySelectorAll('td');

                        // Filtron suele tener la misma tabla: Detalle, Codigo, CC, KW, HP, Año
                        if (tds.length >= 4) {
                            const engineDetail = tds[0].innerText.trim();
                            const engineCode = tds[1].innerText.trim();
                            const hp = tds[4]?.innerText.trim() || '';
                            const year = tds[5]?.innerText.trim() || '';

                            const engine = `${engineDetail} (${engineCode}) ${hp ? hp + 'CV' : ''}`.trim();

                            data.applications.push({
                                make,
                                model,
                                engine,
                                year,
                                notes: engineCode
                            });
                        }
                    });
                });
            }
        });
    }

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
