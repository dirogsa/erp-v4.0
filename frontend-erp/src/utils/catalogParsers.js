/**
 * Orquestador de Parsers para Catálogos de Filtros
 * Este archivo centraliza la lógica de extracción de datos de fabricantes.
 * NOTA: Solo soporta HTML para WIX y FILTRON. El resto migró a JSON.
 */
import { parseWix } from './catalogParsers/wix';
import { parseFiltron } from './catalogParsers/filtron';
import { parseAsakashi } from './catalogParsers/asakashi';
import { parseAzumi } from './catalogParsers/azumi';

export const parseCatalogHtml = (htmlContent, filename = '', dbCategories = []) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');

    // 1. Detección de Metadatos en Nombre de Archivo (Estrategia de Arquitectura Escalable)
    // Patrón: SKU_MARCA.html (ej: LF916_WIX.html)
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
    
    let result = null;

    if (text.includes('JSFILTER.JP') || text.includes('ASAKASHI')) {
        result = parseAsakashi(doc, 'https://www.jsfilter.jp', dbCategories);
    } else if (text.includes('FILTRON.EU') || text.includes('FILTRON FILTERS') || overrideBrand === 'FILTRON') {
        result = parseFiltron(doc, 'https://filtron.eu');
    } else if (text.includes('WIXFILTERS.COM') || text.includes('WIX FILTERS') || overrideBrand === 'WIX') {
        result = parseWix(doc, 'https://www.wixfilters.com', dbCategories);
    } else if (text.includes('AZFILTER.JP') || text.includes('AZUMI') || overrideBrand === 'AZUMI') {
        result = parseAzumi(doc, 'https://www.azfilter.jp', dbCategories);
    } else {
        console.warn(`[Parser] HTML format no soportado para el contenido o marca (${overrideBrand || 'Desconocido'}). Por favor, utiliza el formato estructurado JSON.`);
        return null; // Rechazar otros HTMLs
    }

    // 3. Aplicar Overrides de Metadatos si existen
    if (result && overrideSku && overrideBrand) {
        result.sku = overrideSku;
        result.brand = overrideBrand;
        result.name = `${result.category_name || 'FILTRO'} ${overrideSku}`;
        console.log(`[Parser] Overwriting data with filename metadata: ${overrideSku} (${overrideBrand})`);
    }

    return result;
};
