import { parseWix } from './catalogParsers/wix';
import { parseFiltron } from './catalogParsers/filtron';

/**
 * Orquestador de Ingesta de Catálogos
 * Detecta la marca y delega al parser especializado.
 */
export const parseCatalogHtml = (htmlString) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');

    // Identificar Marca
    const title = doc.querySelector('title')?.innerText.toUpperCase() || '';
    const brand = title.includes('WIX') ? 'WIX' : 'FILTRON';
    const domain = brand === 'WIX' ? 'https://wixeurope.com' : 'https://filtron.eu';

    // Ejecutar Parser Especializado
    let data = brand === 'WIX' ? parseWix(doc, domain) : parseFiltron(doc, domain);

    // --- LÓGICA COMPARTIDA (Aplicaciones y Otros) ---

    // 1. Categoría y Nombre
    const cat = doc.querySelector('.product-table-title');
    if (cat) data.category_name = data.name = cat.innerText.trim();

    // 2. EAN
    const ean = doc.querySelector('.product-table-code span');
    if (ean) data.ean = ean.innerText.trim();

    // 3. Aplicaciones (Estructura similar en ambos)
    const appPanels = doc.querySelectorAll('#tab1 .panel-default, #tab_1 .panel-default, #accordion > .panel');
    appPanels.forEach(panel => {
        const make = panel.querySelector('a')?.innerText.trim().toUpperCase();
        if (!make || /APLICACIONES|NOTICIAS|CAMBIOS/i.test(make)) return;

        panel.querySelectorAll('table tr').forEach((row, i) => {
            if (i === 0) return; // Header
            const cells = Array.from(row.querySelectorAll('td')).map(c => c.innerText.trim());
            if (cells.length >= 4) {
                // Capturamos el motor y si hay columnas adicionales las sumamos a las notas
                const engine = `${cells[1]} (${cells[2]}cc)`;
                const year = cells[cells.length - 1];
                let notes = "";

                // Si hay más de 4 columnas, las del medio suelen ser notas técnicas
                if (cells.length > 4) {
                    notes = cells.slice(3, cells.length - 1).join(" | ");
                }

                data.applications.push({
                    make,
                    model: cells[0],
                    engine: engine,
                    year: year,
                    notes: notes // Notas detalladas (Motor, AC, etc)
                });
            }
        });
    });

    // 4. Boletín Técnico / Notas
    const newsSection = doc.querySelector('.changes-in-prod, .news-table, .news-item-td');
    if (newsSection) {
        const date = newsSection.querySelector('small')?.innerText.trim();
        const titleTop = newsSection.querySelector('.title-top')?.innerText.trim();
        const desc = newsSection.querySelector('.news-item-desc')?.innerText.trim();
        let noteParts = [];
        if (date) noteParts.push(`[${date}]`);
        if (titleTop) noteParts.push(titleTop);
        if (desc) noteParts.push(desc);
        data.tech_bulletin = noteParts.join(' - ').replace(/\s+/g, ' ').trim();
    }

    return data;
};
