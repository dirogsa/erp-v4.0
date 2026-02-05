/**
 * Parser específico para catálogos de AZUMI
 */
export const parseAzumi = (doc, domain = 'https://azfilter.jp') => {
    const data = {
        brand: 'AZUMI',
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

    // 1. SKU & Name & Category
    // Selector: h2.search-res-card__title -> "CABIN FILTER | AZUMI - AC31011C"
    const titleEl = doc.querySelector('.search-res-card__title');
    if (titleEl) {
        let text = titleEl.innerText.trim();
        // Split by '|' then by '-'
        // Part 1: "CABIN FILTER" (Category)
        // Part 2: "AZUMI - AC31011C"
        const parts = text.split('|');
        if (parts.length > 0) {
            data.category_name = parts[0].trim();
        }

        if (parts.length > 1) {
            const brandPart = parts[1].trim();
            // "AZUMI - AC31011C"
            const skuParts = brandPart.split('-');
            if (skuParts.length > 1) {
                data.sku = skuParts[skuParts.length - 1].trim(); // Last part is SKU
            }
        }

        // Name Construction
        // Spanish map for categories if possible, otherwise use English content
        let catName = data.category_name;
        if (catName === 'CABIN FILTER') catName = 'Filtro de Cabina';
        else if (catName === 'OIL FILTER') catName = 'Filtro de Aceite';
        else if (catName === 'AIR FILTER') catName = 'Filtro de Aire';
        else if (catName === 'FUEL FILTER') catName = 'Filtro de Combustible';
        else if (catName === 'TRANSMISSION FILTER') catName = 'Filtro de Transmisión';

        data.name = `${catName} ${data.sku}`;
    }

    // 2. Image
    // Selector: .search-res-card__image img
    const imgEl = doc.querySelector('.search-res-card__image img');
    if (imgEl) {
        const src = imgEl.getAttribute('src');
        if (src) {
            data.image_url = src.startsWith('http') ? src : domain + src;
        }
    }

    // 3. EAN - Not found in HTML sample, but placeholder logic
    // Sometimes EANs are hidden in meta tags or specific data attributes
    // This is a placeholder for future extraction:
    // const eanEl = doc.querySelector('.ean-code-selector');
    // if (eanEl) data.ean = eanEl.innerText.trim();

    // 4. Specs
    // Selector: .search-res-card__specification .search-res-card__line
    const specRows = doc.querySelectorAll('.search-res-card__specification .search-res-card__line');
    specRows.forEach(row => {
        const nameEl = row.querySelector('.search-res-card__name');
        const valEl = row.querySelector('.search-res-card__value');
        if (nameEl && valEl) {
            const label = nameEl.innerText.trim();
            const value = valEl.innerText.trim();
            if (value) {
                data.specs.push({
                    label: label,
                    measure_type: (label === 'Length' || label === 'Width' || label === 'Thickness' || label === 'Height') ? 'mm' : 'other',
                    value: value
                });
            }
        }
    });

    // 5. Equivalences (Crosses)
    // Selector: .search-res-crosses__line
    const crossRows = doc.querySelectorAll('.search-res-crosses__line');
    crossRows.forEach(row => {
        const brandEl = row.querySelector('.search-res-crosses__name');
        const codeEl = row.querySelector('.search-res-crosses__value');
        if (brandEl && codeEl) {
            const brand = brandEl.innerText.trim();
            const code = codeEl.innerText.trim();
            data.equivalences.push({
                brand: brand,
                code: code,
                is_original: /MERCEDES|BMW|TOYOTA|NISSAN|HONDA|MAZDA|HYUNDAI|KIA|VOLKSWAGEN|AUDI|FORD|GM|CHEVROLET|SUBARU|SUZUKI/i.test(brand.toUpperCase())
            });
        }
    });

    // 6. Applications
    // Selector: .spollers__item
    const appItems = doc.querySelectorAll('.spollers__item');
    appItems.forEach(item => {
        // Title: MERCEDES-BENZ » A 180
        const titleBtn = item.querySelector('.spollers__title a');
        if (!titleBtn) return;

        let fullTitle = titleBtn.innerText.trim(); // "MERCEDES-BENZ » A 180"
        let make = '';
        let model = '';

        if (fullTitle.includes('»')) {
            const parts = fullTitle.split('»');
            make = parts[0].trim();
            model = parts[1].trim();
        } else {
            make = fullTitle;
        }

        // Lines inside
        const lines = item.querySelectorAll('.search-res-application__line');
        lines.forEach(line => {
            // Date: .application-date (e.g. "04.18 ~")
            const dateEl = line.querySelector('.application-date');
            const year = dateEl ? dateEl.innerText.replace(/\s+/g, '').trim() : '';

            // Article: W177 , Eng: 1.5L OM 608.915
            const articleEl = line.querySelector('.search-res-application__article');
            // clone to separate text from children (dates)
            let engineText = '';
            if (articleEl) {
                const clone = articleEl.cloneNode(true);
                const dateChild = clone.querySelector('.application-date');
                if (dateChild) dateChild.remove();
                engineText = clone.innerText.trim().replace(/^,/, '').replace(/,$/, '').trim();
            }

            // Extra text (e.g. "(Cabin)")
            const textEl = line.querySelector('.search-res-application__text');
            const note = textEl ? textEl.innerText.trim() : '';

            // Combine engine info for cleaner UI if possible, or keep as is
            const fullEngine = `${engineText} ${note}`.trim();

            data.applications.push({
                make: make,
                model: model,
                engine: fullEngine,
                year: year,
                notes: note
            });
        });
    });

    return data;
};
