import { resolveCategoryName, normalizeSku, normalizeSpecs } from './common';

/**
 * Parser para Catálogo JS Asakashi (jsfilter.jp)
 */
export const parseAsakashi = (doc, baseUrl = 'https://www.jsfilter.jp', dbCategories = []) => {
    try {
        const product = {
            sku: '',
            name: '',
            brand: 'JS ASAKASHI',
            description: '',
            image_url: '',
            category_name: 'FILTRO',
            weight_g: 0,
            shape: '',
            specs: [],
            equivalences: [],
            applications: [],
            status: 'AVAILABLE'
        };

        // 1. Extraer SKU y Categoría del título de búsqueda
        const titleElement = doc.querySelector('.search-title');
        if (titleElement) {
            const fullTitle = titleElement.innerText.trim();
            if (fullTitle.includes('»')) {
                const parts = fullTitle.split('»');
                const rawCategory = parts[0].trim();
                product.sku = normalizeSku(parts[1]);
                product.category_name = resolveCategoryName(rawCategory, dbCategories);
            } else {
                product.sku = normalizeSku(fullTitle);
            }
        }

        // 2. Imagen
        const imgElement = doc.querySelector('#achrColorBox img');
        if (imgElement) {
            let src = imgElement.getAttribute('src');
            if (src && !src.startsWith('http')) {
                src = baseUrl + (src.startsWith('/') ? '' : '/') + src;
            }
            product.image_url = src;
        }

        // 3. Especificaciones Técnicas
        const specRows = doc.querySelectorAll('.detail__specification .str');
        specRows.forEach(row => {
            const label = row.querySelector('.param-title')?.innerText.trim();
            const value = row.querySelector('.param-field')?.innerText.trim();
            if (label && value) {
                if (/Weight|Peso|Masa/i.test(label)) {
                    const numMatch = value.match(/[\d.]+/);
                    if (numMatch) product.weight_g = parseFloat(numMatch[0]);
                } else if (/Shape|Forma/i.test(label)) {
                    product.shape = value;
                }

                product.specs.push({
                    label: label,
                    measure_type: (label.toLowerCase().includes('mm') || /height|width|length|diameter/i.test(label)) ? 'mm' : 'other',
                    value: value
                });
            }
        });

        // 4. Referencias Cruzadas (Equivalencias)
        const refRows = doc.querySelectorAll('.detail__plate .detail__body .str');
        refRows.forEach(row => {
            const brand = row.querySelector('.owner')?.innerText.trim();
            const code = row.querySelector('.field')?.innerText.trim();
            if (brand && code) {
                product.equivalences.push({
                    brand: brand,
                    code: code,
                    is_original: ['PORSCHE', 'VAG', 'VOLKSWAGEN', 'TOYOTA', 'NISSAN', 'HONDA'].includes(brand.toUpperCase())
                });
            }
        });

        // 5. Aplicaciones
        const modelTitles = doc.querySelectorAll('.model-title');
        modelTitles.forEach(titleDiv => {
            const titleText = titleDiv.innerText.trim();
            const [make, model] = titleText.split('»').map(s => s.trim());
            
            const tableContainer = titleDiv.nextElementSibling;
            if (tableContainer && tableContainer.classList.contains('model-body')) {
                const rows = tableContainer.querySelectorAll('tr.model-data');
                rows.forEach(row => {
                    const year = row.querySelector('.tdYear')?.innerText.trim();
                    const engine = row.querySelector('.tdEngineVol')?.innerText.trim();
                    const engineCode = row.querySelector('.tdEngineNo')?.innerText.trim();
                    const body = row.querySelector('.tdBody')?.innerText.trim();
                    
                    product.applications.push({
                        make: make || 'DESCONOCIDO',
                        model: model || 'DESCONOCIDO',
                        year: year || '',
                        engine: engine ? `${engine}cc ${engineCode || ''}` : engineCode || '',
                        notes: body || ''
                    });
                });
            }
        });

        // 6. Nombre descriptivo y Normalización
        product.name = `JS ${product.category_name} ${product.sku}`;
        product.specs = normalizeSpecs(product.specs, product.category_name, dbCategories);

        return product;
    } catch (error) {
        console.error('Error parsing Asakashi HTML:', error);
        return null;
    }
};
