/**
 * Evalúa la calidad de datos de un producto (Especialmente filtros)
 * Devuelve un score (0-100) y una lista de datos faltantes.
 */

const SPECIFIC_FILTER_CATEGORIES = [
    'FILTRO DE ACEITE',
    'FILTRO DE AIRE',
    'FILTRO DE CABINA',
    'FILTRO DE COMBUSTIBLE',
    'FILTRO HIDRAULICO',
    'FILTRO SEPARADOR'
];

export const calculateDataQuality = (product, categories = []) => {
    let score = 0;
    let missing = [];

    // Resolver el nombre de la categoría actual
    let catName = (product.category_name || '').toUpperCase();
    if (product.category_id && categories.length > 0) {
        const cat = categories.find(c => c._id === product.category_id);
        if (cat) catName = cat.name.toUpperCase();
    }

    // Determinar si es un filtro
    const isFilter = catName.includes('FILTRO');

    if (isFilter) {
        // --- SCORECARD PARA FILTROS (100%) ---

        // 1. Categoría Específica (10%)
        const isSpecific = SPECIFIC_FILTER_CATEGORIES.some(c => catName.includes(c));
        if (isSpecific) {
            score += 10;
        } else {
            missing.push("Categoría específica (No genérica)");
        }

        // 2. Imagen Principal (10%)
        if (product.image_url) {
            score += 10;
        } else {
            missing.push("Imagen principal");
        }

        // 3. Peso (10%)
        if (product.weight_g && product.weight_g > 0) {
            score += 10;
        } else {
            missing.push("Peso en gramos");
        }

        // 4. Medidas Presentes (10%)
        if (product.specs && product.specs.length > 0) {
            score += 10;
            
            // 5. Códigos Universales (10%)
            // Buscamos si algún label es puramente letras (ej: A, B, H, OD)
            const hasLetters = product.specs.some(s => /^[a-zA-Z]{1,3}$/.test(s.label?.trim()));
            if (hasLetters) {
                score += 10;
            } else {
                missing.push("Medidas sin códigos de ingeniería (A, B, H)");
            }
        } else {
            missing.push("Especificaciones (Medidas)");
            missing.push("Códigos de ingeniería");
        }

        // 6. Forma (5%)
        const forma = product.shape || (product.specs?.find(s => s.label?.toUpperCase() === 'FORMA')?.value);
        if (forma) {
            score += 5;
        } else {
            missing.push("Forma geométrica");
        }

        // 7. Códigos Equivalentes / OE (20%)
        if (product.equivalences && product.equivalences.length > 0) {
            score += 20;
        } else {
            missing.push("Códigos Equivalentes (Cruces OE)");
        }

        // 8. Aplicaciones (15%)
        if (product.applications && product.applications.length > 0) {
            score += 15;
        } else {
            missing.push("Aplicaciones vehiculares");
        }

        // 9. Código EAN (10%)
        if (product.ean && product.ean.trim() !== '') {
            score += 10;
        } else {
            missing.push("Código de barras (EAN)");
        }

    } else {
        // --- SCORECARD PARA NO FILTROS (100%) ---
        // Mercancía general (Herramientas, Marketing, Aceites)
        
        // Imagen (40%)
        if (product.image_url) {
            score += 40;
        } else {
            missing.push("Imagen principal");
        }

        // Peso (30%)
        if (product.weight_g && product.weight_g > 0) {
            score += 30;
        } else {
            missing.push("Peso");
        }

        // Código EAN (30%)
        if (product.ean && product.ean.trim() !== '') {
            score += 30;
        } else {
            missing.push("Código de barras (EAN)");
        }
    }

    // Asegurar que no pase de 100
    score = Math.min(100, Math.max(0, score));

    // Determinar el color visual
    let color = '#ef4444'; // Rojo (Crítico < 50%)
    if (score >= 100) color = '#10b981'; // Verde (Perfecto 100%)
    else if (score >= 50) color = '#f59e0b'; // Amarillo (Incompleto)

    return { score, missing, color, isFilter };
};
