import { resolveCategoryName, normalizeSku, normalizeSpecs } from './common';

/**
 * Parser especializado para el nuevo formato Global de WIX Filters (wixfilters.com)
 * Extrae información detallada: SKU, EAN, Medidas, Aplicaciones completas y OE-Numbers.
 */
const parseWixModern = (doc, domain, dbCategories = []) => {
    const data = {
        brand: 'WIX',
        sku: '',
        name: '',
        ean: '',
        type: 'COMMERCIAL',        // <--- Forzamos el tipo solicitado
        is_active_in_shop: false,  // <--- Forzamos el estado inactivo por defecto
        status: '',
        category_name: '',
        description: '',
        image_url: '',
        image_gallery: [], // Nueva característica: galería completa
        tech_drawing_url: '',
        manual_pdf_url: '',
        weight_g: 0,
        shape: '',
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
            if (ldData.sku) {
                // Eliminamos cualquier variante de Wix y normalizamos
                const rawSku = ldData.sku.replace(/_WIX$|-WIX$| WIX$/i, '').trim(); 
                data.sku = normalizeSku(rawSku);
            }
            if (ldData.image) data.image_url = ldData.image;
        } catch (e) {
            console.warn("Error parsing JSON-LD", e);
        }
    }

    // 2. Títulos y Identificación (Fallback)
    const titleName = doc.querySelector('.cmp-product__title-name');
    if (titleName && !data.sku) {
        data.sku = normalizeSku(titleName.innerText);
    }
    
    const categoryEl = doc.querySelector('.cmp-product__title-family');
    if (categoryEl) {
        const rawCat = categoryEl.innerText.trim().toUpperCase();
        
        // Sincronizar con categorías de la BD usando utilidad común
        data.category_name = resolveCategoryName(rawCat, dbCategories);
        // Construimos el nombre estándar: [Categoría] WIX [SKU]
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
        data.status = rawStatus === 'A' ? 'AVAILABLE' : 'DISCONTINUED';
    }

    // 5. Galería de Imágenes (Extracción del JSON de Adobe + Escaneo Manual)
    const gallerySection = doc.querySelector('.cmp-product__full-detail-image-carousel');
    if (gallerySection) {
        const galleryItems = [];
        const foundUrls = new Set();

        // Intento 1: JSON de Adobe (data-g-binding-gallery-items)
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
                console.warn("Error parsing Gallery JSON", e);
            }
        }

        // Intento 2: Escaneo manual de cualquier <img> en el carrusel (Fuga de imágenes)
        gallerySection.querySelectorAll('img.cmp-product__gallery-img').forEach(img => {
            const src = img.getAttribute('src');
            if (src && !foundUrls.has(src)) {
                galleryItems.push({
                    label: img.getAttribute('alt') || 'Vista adicional',
                    url: src,
                    is_dim: src.includes('-dim')
                });
                foundUrls.add(src);
            }
        });

        if (galleryItems.length > 0) {
            data.image_gallery = galleryItems;
            
            // Priorizamos la imagen principal (evitamos caja o plano técnico como main)
            const mainImg = galleryItems.find(i => !i.url.includes('box') && !i.is_dim) || galleryItems[0];
            if (mainImg) data.image_url = mainImg.url;

            // Extraer plano técnico si existe
            const dimImg = galleryItems.find(i => i.is_dim);
            if (dimImg) data.tech_drawing_url = dimImg.url;
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
                
                // Mapeo específico para Peso y Forma en Wix
                if (/Weight|Peso|Mass/i.test(label)) {
                    // Extract number and convert to grams if it's in lb
                    const numMatch = value.match(/[\d.]+/);
                    if (numMatch) {
                        let val = parseFloat(numMatch[0]);
                        if (value.toLowerCase().includes('lb')) val = val * 453.592;
                        data.weight_g = Math.round(val * 10) / 10;
                    }
                } else if (/Shape|Forma|Style/i.test(label)) {
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

    // 8. OE-Numbers y Cross-References (Equivalencias) - REDISEÑO TOTAL PARA WIX GLOBAL/EU
    const equivalents = [];

    // Función auxiliar para limpiar y agregar equivalencia
    const addEquivalence = (brandRaw, codeRaw, sourceLabel = "") => {
        const brand = (brandRaw || "").trim().toUpperCase();
        let code = (codeRaw || "").trim().toUpperCase(); // No quitamos espacios internos para no romper formatos OEM

        if (!brand || !code || brand.length < 2 || code.length < 2) return;
        
        // Evitar capturar encabezados genéricos o ruido
        const isHeader = /MARCA|BRAND|PRODUCENT|MAKER|NUMER|CODE|PART|REFERENCIA|EQUIVALENCIA/i.test(brand) || 
                        /MARCA|BRAND|PRODUCENT|CODE|NUMER|PART|REFERENCIA/i.test(code);
        if (isHeader) return;

        // Evitar duplicados
        if (!equivalents.some(e => e.brand === brand && e.code === code)) {
            equivalents.push({
                brand,
                code,
                is_original: sourceLabel.toUpperCase().includes('OE') || /FORD|VW|BOSCH|MANN/i.test(brand)
            });
        }
    };

    // Estrategia A: Secciones OE/CROSS identificadas por ID o Título de Acordeón
    const sectionSelectors = [
        '#oeNumbers', '#crossReferences', 
        '[id*="oeNumbers"]', '[id*="crossReferences"]',
        '[id*="oe-numbers"]', '[id*="cross-references"]'
    ];
    const sections = doc.querySelectorAll(sectionSelectors.join(','));
    
    sections.forEach(section => {
        const sectionTitle = (section.querySelector('.cmp-accordion__title')?.textContent || section.id || "OE").toUpperCase();
        
        // 1. Caso: Acordeón anidado (Wix Europe/Global)
        // Estructura: #oeNumbers -> .cmp-accordion__item (Brand) -> .cmp-text (Codes list li)
        const nestedItems = section.querySelectorAll('.cmp-accordion__item');
        if (nestedItems.length > 0) {
            nestedItems.forEach(item => {
                const brandName = item.querySelector('.cmp-accordion__title')?.textContent?.trim();
                if (!brandName) return;

                // Buscar celdas en tablas, grid, o listas (MODIFICADO: Agregamos li, p, span)
                const codes = item.querySelectorAll('td, li, p, span, .aem-GridColumn');
                codes.forEach(node => {
                    // Solo tomamos nodos que sean hijos directos del contenido o list-items
                    // Evitamos procesar el título de la marca como código
                    const text = node.textContent.trim();
                    if (text && text !== brandName && text.length > 2 && text.length < 50) {
                        // Si el nodo tiene muchos hijos, probablemente no sea el código directamente
                        if (node.children.length > 1 && !node.classList.contains('aem-GridColumn')) return;
                        
                        addEquivalence(brandName, text, sectionTitle);
                    }
                });
            });
        }

        // 2. Caso: Tabla estándar (2 columnas: Marca | Código)
        if (equivalents.length === 0) {
            section.querySelectorAll('tr').forEach(row => {
                const cells = row.querySelectorAll('td, .aem-GridColumn');
                if (cells.length >= 2) {
                    addEquivalence(cells[0].textContent, cells[1].textContent, sectionTitle);
                } else if (cells.length === 1) {
                    // Marca en fila superior o similar
                    const code = cells[0].textContent.trim();
                    const groupTitle = row.closest('.cmp-accordion__item')?.querySelector('.cmp-accordion__title')?.textContent;
                    if (groupTitle && groupTitle !== sectionTitle) {
                        addEquivalence(groupTitle, code, sectionTitle);
                    }
                }
            });
        }
    });

    // Estrategia B: Escaneo Global (Búsqueda por palabras clave si las secciones fallan o para atrapar fugas)
    doc.querySelectorAll('.cmp-accordion__item').forEach(item => {
        const title = (item.querySelector('.cmp-accordion__title')?.textContent || "").toUpperCase();
        if (/OE-NUMBERS|CROSS REFERENCES|EQUIVALENCIAS|REFERENCIAS|REFERENCIAS CRUZADAS/i.test(title)) {
            
            // Si ya procesamos esto en Estrategia A por ID, saltamos si ya tenemos datos
            // Pero si no, buscamos marcas anidadas
            const brands = item.querySelectorAll('.cmp-accordion__item');
            if (brands.length > 0) {
                brands.forEach(brandBox => {
                    const brand = brandBox.querySelector('.cmp-accordion__title')?.textContent?.trim();
                    if (!brand) return;
                    brandBox.querySelectorAll('li, td, .cmp-text p').forEach(node => {
                        const code = node.textContent.trim();
                        if (code && code !== brand) addEquivalence(brand, code, title);
                    });
                });
            } else {
                // Si no hay sub-acordeones, buscamos tablas o listas directamente
                item.querySelectorAll('tr, li').forEach(node => {
                    if (node.tagName === 'LI') {
                        const brand = item.querySelector('.cmp-accordion__title')?.textContent?.trim();
                        addEquivalence(brand, node.textContent, title);
                    } else {
                        const tds = node.querySelectorAll('td');
                        if (tds.length >= 2) addEquivalence(tds[0].textContent, tds[1].textContent, title);
                    }
                });
            }
        }
    });

    // Estrategia C: Búsqueda agresiva en cualquier tabla que huela a filtros
    if (equivalents.length === 0) {
        doc.querySelectorAll('table').forEach(table => {
            const text = table.textContent.toUpperCase();
            if (/MANN|BOSCH|MAHLE|FORD|VW|TOYOTA|HENGST|FRAM|FIAT|IVECO/i.test(text)) {
                table.querySelectorAll('tr').forEach(row => {
                    const cells = row.querySelectorAll('td');
                    if (cells.length >= 2) {
                        addEquivalence(cells[0].textContent, cells[1].textContent, "Deep Scan");
                    }
                });
            }
        });
    }

    data.equivalences = equivalents;

    // 9. Descargas / Manuales
    const downloadsPanel = doc.querySelector('#downloads');
    if (downloadsPanel) {
        const pdfLink = downloadsPanel.querySelector('a[href*=".pdf"]');
        if (pdfLink) data.manual_pdf_url = pdfLink.getAttribute('href');
    }

    // 10. Normalización Final (Inteligencia Enterprise)
    // Traducimos los labels crudos al estándar definido en la BD
    data.specs = normalizeSpecs(data.specs, data.category_name, dbCategories);

    return data;
};

/**
 * Parser especializado para el formato Legacy/USA de WIX (PartDetails.aspx)
 * Maneja tablas con IDs gvpd, gvPa, etc.
 */
const parseWixUSA = (doc, dbCategories = []) => {
    const data = {
        brand: 'WIX',
        sku: '',
        name: '',
        ean: '',
        type: 'COMMERCIAL',
        is_active_in_shop: false,
        status: 'AVAILABLE',
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

    // 1. Especificaciones Principales (Tabla #gvpd)
    const pdTable = doc.querySelector('#gvpd');
    if (pdTable) {
        pdTable.querySelectorAll('tr').forEach(row => {
            const labelEl = row.querySelector('.partAttribute');
            const tds = row.querySelectorAll('td');
            const valueEl = tds.length >= 2 ? tds[1] : null;
            
            if (!labelEl || !valueEl) return;

            const label = labelEl.innerText.trim().replace(':', '');
            const value = valueEl.innerText.trim();

            if (/Part Number/i.test(label)) {
                data.sku = normalizeSku(value);
            } else if (/UPC Number/i.test(label)) {
                data.ean = value;
            } else if (/Style/i.test(label)) {
                data.shape = value;
            } else if (/Service/i.test(label)) {
                data.category_name = resolveCategoryName(value, dbCategories);
            } else if (value && value !== '\u00A0' && value !== '') {
                // Es una medida técnica (Length, Width, Height, etc.)
                let cleanValue = value;
                
                // Si tiene conversión métrica (ej: 11.26 (286)*), la preferimos
                const metricMatch = value.match(/\(([\d.]+)\)\*/);
                if (metricMatch) {
                    cleanValue = metricMatch[1]; // Tomamos el valor en mm
                }

                data.specs.push({
                    label: label,
                    value: cleanValue,
                    measure_type: 'mm'
                });
            }
        });
    }

    // 2. Aplicación Principal (Tabla #gvPa)
    const paTable = doc.querySelector('#gvPa');
    if (paTable) {
        paTable.querySelectorAll('tr').forEach(row => {
            const tds = row.querySelectorAll('td');
            if (tds.length >= 2) {
                const appText = tds[1].innerText.trim();
                // Formato: "Jeep Grand Cherokee (21-25)"
                const match = appText.match(/(.+?)\s*\((.+?)\)/);
                if (match) {
                    data.applications.push({
                        make: '', 
                        model: match[1].trim(),
                        year: match[2].trim(),
                        engine: 'Principle Application',
                        notes: ''
                    });
                } else {
                    data.applications.push({
                        make: '',
                        model: appText,
                        year: '',
                        engine: 'Principle Application',
                        notes: ''
                    });
                }
            }
        });
    }

    // 3. Imagen (Zoom o Miniatura)
    const mainImg = doc.querySelector('#zoomImage') || doc.querySelector('#image');
    if (mainImg) {
        data.image_url = mainImg.getAttribute('src');
    }

    // 4. Nombre Final Estándar
    if (data.sku) {
        data.name = `${data.category_name || 'FILTRO'} ${data.brand} ${data.sku}`.trim();
    }

    // 5. Normalización de Specs
    data.specs = normalizeSpecs(data.specs, data.category_name, dbCategories);

    return data;
};

/**
 * Orquestador principal para la marca WIX
 * Detecta automáticamente si es el formato Moderno o USA/Legacy
 */
export const parseWix = (doc, domain, dbCategories = []) => {
    // Firma de WIX USA (ASP.NET Legacy)
    if (doc.querySelector('#gvpd') || doc.querySelector('form[action*="PartDetails.aspx"]')) {
        console.log("[Parser] Detectado formato WIX USA (Legacy)");
        return parseWixUSA(doc, dbCategories);
    }

    // Fallback al formato Moderno (Global/Europe)
    console.log("[Parser] Detectado formato WIX Global (Modern)");
    return parseWixModern(doc, domain, dbCategories);
};
