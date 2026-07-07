/**
 * Generates a standardized file name for the printed catalog.
 * Format: Catalogo_DIROGSA_[Mes]_[Año]_[Audience]_[Strategy]
 *
 * @param {Object} config - The catalog configuration state
 * @returns {string} The formatted document title for PDF generation
 */
export function generateCatalogTitle(config) {
  if (!config) return 'Catalogo_DIROGSA';

  const date = new Date();
  const months = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
  ];
  
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  // Audience formatting
  const audienceMap = {
    b2b: 'Mayorista',
    b2c: 'Retail',
    internal: 'Interno'
  };
  const audience = audienceMap[config.audience] || config.audience || 'General';

  // Strategy formatting
  let strategy = 'Personalizado'; // Default for SKU input mode
  if (config.inputMode !== 'skus') {
    if (config.catalogStrategy === 'by_vehicle') {
      strategy = 'Por_Vehiculo';
    } else if (config.catalogStrategy === 'by_category') {
      strategy = 'Por_Categoria';
    }
  }

  // Construct and sanitize title
  const title = `Catalogo_DIROGSA_${month}_${year}_${audience}_${strategy}`;
  
  // Replace any accidental spaces or invalid filename characters
  return title.replace(/[\s/\\?%*:|"<>]/g, '_');
}
