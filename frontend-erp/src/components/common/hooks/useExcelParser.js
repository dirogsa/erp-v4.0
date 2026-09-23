/**
 * useExcelParser
 * 
 * Encapsula el parsing de texto pegado desde Excel en arrays de filas/columnas.
 * Es un hook de utilidad pura: sin efectos secundarios, sin llamadas HTTP.
 * Reutilizable en cualquier módulo que consuma datos de Excel.
 */

/**
 * Parsea texto TSV/CSV pegado desde Excel en un array de arrays (filas × columnas).
 * Filtra líneas vacías y líneas de cabecera comunes.
 * @param {string} text - Texto crudo pegado desde Excel
 * @returns {string[][]} - Array de filas, cada fila es un array de celdas
 */
export function parseExcelText(text) {
    if (!text || !text.trim()) return [];

    const HEADER_KEYWORDS = ['codigo', 'precio', 'sku', 'costo', 'marca', 'descripcion', 'cantidad'];

    return text
        .split(/\r?\n/)
        .map(line => {
            let cells = line.split('\t');
            if (cells.length < 2) {
                cells = line.split(/\s{2,}/);
            }
            return cells.map(c => c.trim()).filter(c => c !== '');
        })
        .filter(row => {
            if (row.length === 0) return false;
            const firstCell = row[0].toLowerCase();
            return !HEADER_KEYWORDS.some(kw => firstCell.includes(kw));
        });
}

/**
 * Intenta detectar automáticamente el mapping de columnas dado el conjunto de columnas configuradas.
 * Heurística: si la segunda celda de la primera fila es texto no numérico → es marca.
 * @param {string[][]} rows 
 * @param {Array<{key: string}>} columns 
 * @returns {Object} mapping inicial { columnKey: columnIndex }
 */
export function autoDetectMapping(rows, columns) {
    const mapping = {};
    if (!rows || rows.length === 0) return mapping;

    const firstRow = rows[0];
    let colIdx = 0;

    for (const col of columns) {
        if (colIdx >= firstRow.length) break;

        if (col.key === 'brand') {
            const cell = firstRow[colIdx];
            const isText = cell && isNaN(parseFloat(cell.replace(/[^\d.-]/g, '')));
            if (isText) {
                mapping[col.key] = colIdx++;
            }
        } else {
            mapping[col.key] = colIdx++;
        }
    }

    return mapping;
}
