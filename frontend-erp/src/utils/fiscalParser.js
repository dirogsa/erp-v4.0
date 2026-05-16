/**
 * Fiscal Parser - Inteligencia de Extracción de Datos Maestros
 * Arquitectura de Clase Mundial para el Holding DIROGSA.
 * 
 * Este motor extrae metadatos profundos de diversas fuentes (SUNAT HTML, Plain Text, etc)
 * y los estandariza para el sistema global.
 * 
 * Versión 2.5: Sovereign Semantic Extraction
 * No depende solo de la estructura HTML, sino de la semántica de los datos.
 */

export const parseSunatHTML = (text) => {
    // 1. Normalización Profunda
    const normalizedText = text
        .replace(/&nbsp;/g, ' ')
        .replace(/[\r\n\t]+/g, ' ') // Convertir todo a un stream de texto lineal
        .replace(/\s+/g, ' ');

    const stripTags = (str) => str ? str.replace(/<\/?[^>]+(>|$)/g, "").trim() : "";
    const cleanValue = (val) => stripTags(val).trim();

    // Diccionarios Semánticos (Fuerza Bruta Industrial)
    const STATES = ['ACTIVO', 'BAJA DE OFICIO', 'BAJA DEFINITIVA', 'SUSPENSION TEMPORAL'];
    const CONDITIONS = ['HABIDO', 'NO HALLADO', 'NO HABIDO', 'PENDIENTE'];

    const data = {
        document_type: 'RUC',
        country: 'PE',
        sunat_metadata: {}
    };

    // 2. Extracción de Identidad (RUC y Nombre)
    // Patrón A: "RUC: 2060... - NOMBRE"
    const rucNameMatch = normalizedText.match(/(\d{11})\s*-\s*([^<]+?)(?=\s{2,}|<|$)/i);
    if (rucNameMatch) {
        data.document_number = rucNameMatch[1];
        data.name = cleanValue(rucNameMatch[2]);
    } else {
        // Patrón B: RUC aislado
        const rucMatch = normalizedText.match(/(?:RUC|Número de RUC)[:\s]+(\d{11})/i);
        if (rucMatch) data.document_number = rucMatch[1];
        
        // Patrón C: Nombre aislado (después de RUC)
        if (data.document_number) {
            const nameMatch = normalizedText.match(new RegExp(`${data.document_number}\\s*-\\s*([^<]+)`, 'i'));
            if (nameMatch) data.name = cleanValue(nameMatch[1]);
        }
    }

    // 3. Extracción Semántica de Estado y Condición (Sovereign Mode)
    // Buscamos las etiquetas y luego los valores conocidos en la vecindad
    const findSemanticValue = (label, values) => {
        const regex = new RegExp(`${label}.{1,100}`, 'i');
        const segment = normalizedText.match(regex);
        if (segment) {
            for (const v of values) {
                if (segment[0].toUpperCase().includes(v)) return v;
            }
        }
        // Fallback: buscar en todo el texto si el label falló
        for (const v of values) {
            if (normalizedText.toUpperCase().includes(v)) return v;
        }
        return "";
    };

    data.sunat_state = findSemanticValue('Estado', STATES);
    data.sunat_condition = findSemanticValue('Condici', CONDITIONS);

    // 4. Domicilio Fiscal
    const addressMatch = normalizedText.match(/Domicilio Fiscal:?\s*([^<]+?)(?=\s{2,}|<|Actividad|$)/i);
    if (addressMatch) {
        data.address = cleanValue(addressMatch[1]).replace(/^-+/, '');
    }

    // 5. Actividad Económica
    const ciiuMatch = normalizedText.match(/Actividad(?:es)? Económica(?:s)?:?\s*([^<]+?)(?=\s{2,}|<|$)/i);
    if (ciiuMatch) {
        data.main_activity = cleanValue(ciiuMatch[1]);
    }

    return data;
};

/**
 * Motor Global de Ingesta Magic Paste
 */
export const magicIngest = (text) => {
    if (!text || text.trim().length < 10) return null;

    // Detectar si es SUNAT (Perú)
    const isSunat = text.includes('SUNAT') || 
                    text.includes('RUC') || 
                    /\d{11}/.test(text);

    if (isSunat) {
        return parseSunatHTML(text);
    }

    return null;
};
