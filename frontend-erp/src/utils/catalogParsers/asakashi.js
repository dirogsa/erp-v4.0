import { resolveCategoryName, normalizeSku } from './common';

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
            specs: [],
            equivalences: [],
            applications: [],
            status: 'AVAILABLE'
        };

        // 1. Extraer SKU y Categoría del título de búsqueda
        // Estructura: OIL FILTER (ELEMENT) » OE33001
        const titleElement = doc.querySelector('.search-title');
        if (titleElement) {
            const fullTitle = titleElement.innerText.trim();
            if (fullTitle.includes('»')) {
                const parts = fullTitle.split('»');
                const rawCategory = parts[0].trim();
                product.sku = normalizeSku(parts[1]);
                
                // Sincronizar con categorías de la BD
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
                product.specs.push({
                    label: label,
                    measure_type: 'mm', // JS usa mayormente mm
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
        // Asakashi separa por bloques de marca (model-title) seguidos de una tabla (model-body)
        const modelTitles = doc.querySelectorAll('.model-title');
        modelTitles.forEach(titleDiv => {
            const titleText = titleDiv.innerText.trim(); // Ej: "PORSCHE  »  Cayenne"
            const [make, model] = titleText.split('»').map(s => s.trim());
            
            // La tabla de datos está justo después del título
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

        // Nombre descriptivo
        product.name = `JS ${product.category_name} ${product.sku}`;

        return product;
    } catch (error) {
        console.error('Error parsing Asakashi HTML:', error);
        return null;
    }
};
