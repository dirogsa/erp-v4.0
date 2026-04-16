/**
 * Orquestador de Parsers para Catálogos de Filtros
 * Este archivo centraliza la lógica de extracción de datos de diferentes fabricantes.
 */
import { parseWix } from './catalogParsers/wix';
import { parseFiltron } from './catalogParsers/filtron';
import { parseAzumi } from './catalogParsers/azumi';
import { parseOEM } from './catalogParsers/oem';

export const parseCatalogHtml = (htmlContent, filename = '', dbCategories = []) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');

    // 1. Detección Prioritaria por Nombre de Archivo (OEM)
    // Si el archivo termina en _OEM.html, forzamos el parser OEM
    if (filename && filename.toLowerCase().includes('_oem.html')) {
        return parseOEM(doc, filename);
    }

    // 2. Detección automática de Marca/Plataforma
    const text = htmlContent.toUpperCase();
    const title = doc.querySelector('title')?.innerText.toUpperCase() || '';
    const metaApp = doc.querySelector('meta[name="application-name"]')?.getAttribute('content')?.toUpperCase() || '';
    const metaOgSite = doc.querySelector('meta[property="og:site_name"]')?.getAttribute('content')?.toUpperCase() || '';

    const isWix = text.includes('WIXFILTERS.COM') || 
                  text.includes('WIX FILTERS') || 
                  title.includes('WIX') ||
                  metaApp.includes('WIX') ||
                  metaOgSite.includes('WIX');

    const isFiltron = text.includes('FILTRON.EU') || 
                      text.includes('FILTRON.COM') || 
                      text.includes('FILTRON FILTERS') ||
                      title.includes('FILTRON') ||
                      metaApp.includes('FILTRON') ||
                      metaOgSite.includes('FILTRON');

    // 3. Detección por Contenido (Fallback para OEM/Asakashi)
    const isAsakashi = text.includes('JSFILTER.JP') || text.includes('JS ASAKASHI') || title.includes('JS ASAKASHI');

    if (isFiltron) {
        return parseFiltron(doc, 'https://filtron.eu');
    } else if (isWix) {
        return parseWix(doc, 'https://www.wixfilters.com', dbCategories);
    } else if (isAzumi) {
        return parseAzumi(doc, 'https://azfilter.jp');
    } else if (isAsakashi) {
        return parseOEM(doc, filename);
    }

    // Fallback por estructura AEM (usado por ambos)
    if (doc.querySelector('.cmp-product__title')) {
        // En este punto, si no se detectó marca pero tiene estructura AEM, 
        // revisamos si el SKU huele a Filtron (ej: AP 080) o Wix (ej: WL7443)
        // Por ahora, usamos Filtron si tiene filtron en alguna parte del DOM
        return title.includes('FILTRON') ? parseFiltron(doc, 'https://filtron.eu') : parseWix(doc, 'https://www.wixfilters.com', dbCategories);
    }

    // Por defecto, lo tratamos como OEM si es una fuente desconocida pero el usuario lo subió
    if (filename && (filename.toLowerCase().includes('_oem') || filename.toLowerCase().includes('oem'))) {
        return parseOEM(doc, filename);
    }

    // Por defecto, WIX
    return parseWix(doc, 'https://www.wixfilters.com', dbCategories);
};
