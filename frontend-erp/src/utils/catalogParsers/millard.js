import { resolveCategoryName, normalizeSku } from './common';

/**
 * Parser especializado para el formato de Millard Filters (millardcatalog.com)
 */
export const parseMillard = (doc, domain = 'http://www.millardcatalog.com', dbCategories = []) => {
    const data = {
        brand: 'MILLARD',
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

    // 1. Extraer SKU y Nombre
    const titleEl = doc.querySelector('title');
    if (titleEl && titleEl.textContent) {
        const titleMatch = titleEl.textContent.match(/Ficha T[é\e]cnica\s+([A-Z0-9-]+)/i);
        if (titleMatch) {
            data.sku = normalizeSku(titleMatch[1]);
        }
    }
    
    const schemaNameEl = doc.querySelector('span[itemprop="name"]');
    if (!data.sku && schemaNameEl) {
        data.sku = normalizeSku(schemaNameEl.textContent);
    }

    const schemaDescEl = doc.querySelector('span[itemprop="description"]');
    if (schemaDescEl) {
        data.description = schemaDescEl.textContent.trim();
        // Intentar deducir la categoría de la descripción
        if (data.description.toUpperCase().includes('OIL FILTER') || data.description.toUpperCase().includes('FILTRO DE ACEITE')) {
            data.category_name = resolveCategoryName('OIL FILTER', dbCategories);
        } else if (data.description.toUpperCase().includes('AIR FILTER') || data.description.toUpperCase().includes('FILTRO DE AIRE')) {
            data.category_name = resolveCategoryName('AIR FILTER', dbCategories);
        } else if (data.description.toUpperCase().includes('FUEL FILTER') || data.description.toUpperCase().includes('FILTRO DE COMBUSTIBLE')) {
            data.category_name = resolveCategoryName('FUEL FILTER', dbCategories);
        } else if (data.description.toUpperCase().includes('CABIN FILTER') || data.description.toUpperCase().includes('FILTRO DE CABINA')) {
            data.category_name = resolveCategoryName('CABIN FILTER', dbCategories);
        }
    }

    data.name = `${data.category_name || 'FILTRO'} MILLARD ${data.sku}`.trim();

    // 2. Extraer Imágenes
    const mainImgEl = doc.querySelector('span[itemprop="image"]');
    if (mainImgEl) {
        let imgUrl = mainImgEl.textContent.trim();
        if (imgUrl.startsWith('http')) {
            data.image_url = imgUrl;
        } else {
            data.image_url = `${domain}/${imgUrl}`;
        }
    } else {
        const fallbackImg = doc.querySelector('#foto_principal img');
        if (fallbackImg) {
            data.image_url = fallbackImg.getAttribute('src');
            if (data.image_url && !data.image_url.startsWith('http')) {
                data.image_url = `${domain}/${data.image_url}`;
            }
        }
    }

    // Dibujo técnico (Dimensiones)
    const dimImg = doc.querySelector('img[id="Photo_dim"]');
    if (dimImg) {
        const dimSrc = dimImg.getAttribute('src');
        if (dimSrc) {
            data.tech_drawing_url = dimSrc.startsWith('http') ? dimSrc : `${domain}/${dimSrc}`;
        }
    }

    // 3. EAN / Atributos Técnicos
    const propRows = doc.querySelectorAll('#tabla_propiedades .i_element');
    propRows.forEach(row => {
        const titleEl = row.querySelector('.i_elemtitle');
        const valueEl = row.querySelector('.i_elemvalue');
        
        if (titleEl && valueEl) {
            const label = titleEl.textContent.trim().replace(/\n/g, ' ');
            const value = valueEl.textContent.trim();

            if (label.toUpperCase().includes('EAN')) {
                data.ean = value;
            } else if (label && value && !label.includes('DISCLAMER') && !label.includes('Este artículo')) {
                data.specs.push({
                    label: label.replace(/\s+\(.*\)/, ''), // Quitar info extra entre paréntesis para el label principal
                    measure_type: value.includes('mm') ? 'mm' : 'other',
                    value: value.replace(' mm', '').trim()
                });
            }
        }

        // Buscar Juntas en paneles colapsables
        if (row.querySelector('.i_elemtitle_gasket')) {
            const innerRows = row.querySelectorAll('.panel-body .i_element');
            innerRows.forEach(inner => {
                const innerTitle = inner.querySelector('.i_elemtitle')?.textContent.trim() || 'Junta';
                const innerValue = inner.querySelector('.i_elemvalue')?.textContent.trim();
                if (innerValue) {
                    data.specs.push({
                        label: innerTitle.replace(/\s+\(.*\)/, ''),
                        measure_type: 'mm',
                        value: innerValue
                    });
                }
            });
        }
    });

    // Extraer badges de atributos (válvula antiretorno, etc.)
    const badges = doc.querySelectorAll('.badge_atributos');
    badges.forEach(badge => {
        data.specs.push({
            label: 'Atributo',
            measure_type: 'other',
            value: badge.textContent.trim()
        });
    });

    // 4. Equivalencias (Cross References)
    // En el formato proveído, no hay una tabla obvia de equivalencias, 
    // pero si buscaron un código equivalente (ej. lf260), podemos capturarlo.
    const searchAlert = doc.querySelector('.alert-info');
    if (searchAlert && searchAlert.textContent.includes('searching for')) {
        const searchedMatch = searchAlert.textContent.match(/searching for\s+"([^"]+)"/i);
        if (searchedMatch && searchedMatch[1]) {
            const eqCode = normalizeSku(searchedMatch[1]);
            if (eqCode && eqCode !== data.sku) {
                // Inferir marca rudimentariamente, si empieza con LF -> LYS
                let eqBrand = 'UNKNOWN';
                if (eqCode.startsWith('LF') || eqCode.startsWith('LA')) eqBrand = 'LYS';
                else if (eqCode.startsWith('W')) eqBrand = 'WIX';
                else if (eqCode.startsWith('C')) eqBrand = 'FRAM';

                data.equivalences.push({
                    brand: eqBrand,
                    code: eqCode,
                    is_original: false
                });
            }
        }
    }

    // 5. Aplicaciones
    const appRows = doc.querySelectorAll('.results tbody tr');
    appRows.forEach(row => {
        if (row.classList.contains('no-result')) return;
        
        const tds = row.querySelectorAll('td');
        if (tds.length >= 9) {
            // Estructura: 0:Logo, 1:Fabricante, 2:Modelo, 3:Motor, 4:Kw, 5:HP, 6:CV, 7:Desde, 8:Hasta
            const make = tds[1].textContent.trim();
            const model = tds[2].textContent.trim();
            const engine = tds[3].textContent.trim();
            const kw = tds[4].textContent.trim();
            const hp = tds[5].textContent.trim();
            const cv = tds[6].textContent.trim();
            const yearStart = tds[7].textContent.trim();
            const yearEnd = tds[8].textContent.trim();

            let year = '';
            if (yearStart && yearEnd && yearStart !== '-' && yearEnd !== '-') year = `${yearStart}-${yearEnd}`;
            else if (yearStart && yearStart !== '-') year = `${yearStart}-`;
            else if (yearEnd && yearEnd !== '-') year = `-${yearEnd}`;

            let notes = [];
            if (kw) notes.push(`${kw} Kw`);
            if (hp) notes.push(`${hp} HP`);
            if (cv) notes.push(`${cv} CV`);

            data.applications.push({
                make,
                model,
                engine,
                year,
                notes: notes.join(' | ')
            });
        }
    });

    data.specs = normalizeSpecs(data.specs, data.category_name, dbCategories);

    return data;
};
