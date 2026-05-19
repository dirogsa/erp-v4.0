/**
 * Orquestador de Parsers para Catálogos de Filtros
 * Este archivo centraliza la lógica de extracción de datos de diferentes fabricantes.
 */
import { parseWix } from './catalogParsers/wix';
import { parseFiltron } from './catalogParsers/filtron';
import { parseAzumi } from './catalogParsers/azumi';
import { parseAsakashi } from './catalogParsers/asakashi';
import { parseOEM } from './catalogParsers/oem';
import { parseMillard } from './catalogParsers/millard';
import { parseLys } from './catalogParsers/lys';
import { parseFiltrow } from './catalogParsers/filtrow';

/**
 * Orquestador de Parsers para Catálogos de Filtros
 */
export const parseCatalogHtml = (htmlContent, filename = '', dbCategories = []) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');

    // 1. Detección de Metadatos en Nombre de Archivo (Estrategia de Arquitectura Escalable)
    // Patrón: SKU_MARCA.html (ej: LF916_LYS.html)
    let overrideSku = null;
    let overrideBrand = null;
    
    if (filename && filename.includes('_')) {
        const nameWithoutExt = filename.split('.').slice(0, -1).join('.'); // Quitar .html
        const parts = nameWithoutExt.split('_');
        if (parts.length >= 2) {
            // El último fragmento es la marca, el resto es el SKU (soporta SKUs con guiones bajos si hay varios)
            overrideBrand = parts.pop().toUpperCase();
            overrideSku = parts.join('_').toUpperCase();
            console.log(`[Parser] Detectados metadatos en nombre: SKU=${overrideSku}, MARCA=${overrideBrand}`);
        }
    }

    // 2. Selección de Parser por Contenido
    const text = htmlContent.toUpperCase();
    const title = doc.querySelector('title')?.textContent.toUpperCase() || '';
    
    let result = null;

    if (text.includes('FILTRON.EU') || text.includes('FILTRON FILTERS')) {
        result = parseFiltron(doc, 'https://filtron.eu');
    } else if (text.includes('WIXFILTERS.COM') || text.includes('WIX FILTERS')) {
        result = parseWix(doc, 'https://www.wixfilters.com', dbCategories);
    } else if (text.includes('AZFILTER.JP') || text.includes('AZUMI')) {
        result = parseAzumi(doc, 'https://azfilter.jp', dbCategories);
    } else if (overrideBrand === 'FILTROW' || text.includes('FILTROW FILTERS') || title.includes('FILTROW FILTERS')) {
        result = parseFiltrow(doc, 'https://www.jsfilter.jp', dbCategories);
    } else if (text.includes('JSFILTER.JP') || text.includes('JS ASAKASHI') || title.includes('JS ASAKASHI')) {
        result = parseAsakashi(doc, 'https://www.jsfilter.jp', dbCategories);
    } else if (text.includes('MILLARDCATALOG.COM') || text.includes('MILLARD FILTERS') || title.includes('MILLARD FILTERS')) {
        result = parseMillard(doc, 'http://www.millardcatalog.com', dbCategories);
    } else if (overrideBrand === 'LYS' || text.includes('LYS FILTERS') || title.includes('LYS FILTERS')) {
        result = parseLys(doc, 'http://www.millardcatalog.com', dbCategories);
    } else {
        // Fallback genérico OEM
        result = parseOEM(doc, filename, dbCategories);
    }

    // 3. Aplicar Overrides de Metadatos si existen
    if (result && overrideSku && overrideBrand) {
        result.sku = overrideSku;
        result.brand = overrideBrand;
        result.name = `${overrideBrand} ${result.category_name || 'FILTRO'} ${overrideSku}`;
        console.log(`[Parser] Overwriting data with filename metadata: ${overrideSku} (${overrideBrand})`);
    }

    return result;
};
