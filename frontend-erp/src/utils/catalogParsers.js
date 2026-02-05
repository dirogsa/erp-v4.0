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
    const isWix = text.includes('WIXEUROPE.COM') || text.includes('WIX FILTERS');
    const isFiltron = text.includes('FILTRON.EU') || text.includes('FILTRON.COM') || text.includes('FILTRON FILTERS');
    const isAzumi = text.includes('AZFILTER.JP') || text.includes('AZUMI');

    if (isWix) {
        return parseWix(doc, 'https://wixeurope.com');
    } else if (isFiltron) {
        return parseFiltron(doc, 'https://filtron.eu');
    } else if (isAzumi) {
        return parseAzumi(doc, 'https://azfilter.jp');
    }

    // Fallback: Intentar detectar por selectores específicos si el texto no es claro
    if (doc.querySelector('a[href*="wixeurope.com"]')) {
        return parseWix(doc, 'https://wixeurope.com');
    }

    // Por defecto, si no se detecta, intentamos WIX ya que es nuestra referencia actual
    return parseWix(doc, 'https://wixeurope.com');
};
