/**
 * Utilidad Centralizada de Tracking B2B
 * Arquitectura Clean & Resiliente
 *
 * Mantiene la integridad de los eventos y previene fallos si
 * Google Tag Manager está bloqueado por adblockers.
 */

export const IS_PRODUCTION = process.env.NODE_ENV === 'production';

/**
 * Empuja un evento estándar al DataLayer global.
 * @param {string} eventName - Nombre del evento (ej: 'busqueda_realizada').
 * @param {object} payload - Propiedades adicionales del evento.
 */
export const trackEvent = (eventName, payload = {}) => {
  try {
    if (typeof window !== "undefined" && window.dataLayer) {
      window.dataLayer.push({
        event: eventName,
        ...payload,
      });

      if (!IS_PRODUCTION) {
        console.log(`[Tracking Event] ${eventName}`, payload);
      }
    } else if (!IS_PRODUCTION) {
      console.warn(`[Tracking Event Ignorado] (DataLayer no encontrado): ${eventName}`, payload);
    }
  } catch (error) {
    console.error("[Tracking Error] No se pudo empujar el evento:", error);
  }
};

// ── DEFINICIÓN ESTRICTA DE EVENTOS CLAVE (Para evitar typos) ──

export const trackSearch = (searchTerm) => {
  trackEvent('search', { search_term: searchTerm });
};

export const trackWhatsAppClick = (context = 'floating_button') => {
  trackEvent('click_whatsapp', { button_context: context });
};

export const trackQuoteInitiated = (productCode = 'varios') => {
  trackEvent('begin_checkout', { product_code: productCode });
};

export const trackDiroInteraction = (action) => {
  trackEvent('diro_interaction', { action_type: action });
};
