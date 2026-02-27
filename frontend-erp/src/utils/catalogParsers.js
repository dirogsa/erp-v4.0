/**
 * Orquestador de Parsers para Catálogos de Filtros
 * Este archivo centraliza la lógica de extracción de datos de diferentes fabricantes.
 */
import { parseWix } from './catalogParsers/wix';
import { parseFiltron } from './catalogParsers/filtron';
import { parseAzumi } from './catalogParsers/azumi';

export const parseCatalogHtml = (htmlContent) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');

    // Detección automática de Marca/Plataforma
    const text = htmlContent.toUpperCase();
    const isWix = text.includes('WIXFILTERS.COM') || text.includes('WIX FILTERS') || htmlContent.includes('WL7443_WIX');
    const isFiltron = text.includes('FILTRON.EU') || text.includes('FILTRON.COM') || text.includes('FILTRON FILTERS');
    const isAzumi = text.includes('AZFILTER.JP') || text.includes('AZUMI');

    if (isWix) {
        return parseWix(doc, 'https://www.wixfilters.com');
    } else if (isFiltron) {
        return parseFiltron(doc, 'https://filtron.eu');
    } else if (isAzumi) {
        return parseAzumi(doc, 'https://azfilter.jp');
    }

    // Fallback: Intentar detectar por selectores específicos si el texto no es claro
    if (doc.querySelector('a[href*="wixfilters.com"]') || doc.querySelector('.cmp-product__title')) {
        return parseWix(doc, 'https://www.wixfilters.com');
    }

    // Por defecto, si no se detecta, intentamos WIX ya que es nuestra referencia actual
    return parseWix(doc, 'https://www.wixfilters.com');
};
