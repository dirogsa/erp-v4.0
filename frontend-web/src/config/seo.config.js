/**
 * SEO Configuration — Single Source of Truth
 * CONSTITUTION §3 (DDD): La lógica de negocio vive en servicios/config, nunca en las rutas.
 * CONSTITUTION §4 (Bootstrap): Valores base siempre definidos.
 *
 * Para agregar o quitar una marca del sitemap y del SEO Hub del Home:
 * —→ Solo edita VEHICLE_BRANDS_WHITELIST. El resto del sistema se actualiza solo.
 *
 * Criterio de inclusión: Marcas con presencia real en el parque automotor peruano
 * (venta de repuestos activa, búsquedas en Google.pe > 100/mes estimadas).
 */

export const SITE_URL = 'https://www.dirogsa.com';

/**
 * Whitelist de marcas de vehículos relevantes para el mercado peruano.
 * Formato: slug URL-safe (lowercase, sin espacios, con guiones).
 * Este slug debe coincidir exactamente con el valor en la base de datos
 * después de aplicar la transformación: make.toLowerCase().replace(/\s+/g, '-')
 *
 * Para agregar una marca: simplemente añade una entrada al array.
 * Para desactivar una marca temporalmente: comenta la línea.
 */
export const VEHICLE_BRANDS_WHITELIST = new Set([
  // ── AUTOS DE PASAJEROS (Alta demanda Perú) ──
  'toyota',
  'nissan',
  'hyundai',
  'kia',
  'chevrolet',
  'ford',
  'mitsubishi',
  'suzuki',
  'honda',
  'volkswagen',
  'mazda',
  'subaru',
  'renault',
  'peugeot',
  'citroën',
  'citroen',     // normalización sin tilde
  'fiat',
  'jeep',
  'dodge',
  'chrysler',
  'bmw',
  'mercedes-benz',
  'audi',
  'volvo',
  'skoda',
  'seat',
  'alfa-romeo',
  'alfa romeo',  // variante con espacio
  'infiniti',
  'lexus',
  'acura',
  'land-rover',
  'land rover',  // variante con espacio
  'jaguar',
  'mini',
  'porsche',
  'tesla',

  // ── CAMIONETAS Y SUV (Mercado peruano clave) ──
  'isuzu',
  'great-wall',
  'great wall',
  'changan',
  'chery',
  'byd',
  'mg',
  'jac',
  'foton',
  'dfsk',
  'haval',

  // ── VEHÍCULOS COMERCIALES Y TRANSPORTE (Lima y regiones) ──
  'hino',
  'fuso',         // Mitsubishi Fuso
  'internacional',
  'international',
  'kenworth',
  'freightliner',
  'mack',
  'man',
  'scania',
  'volvo-trucks',
  'mercedes-benz-trucks',
  'iveco',
  'daf',

  // ── MAQUINARIA PESADA (Minería y construcción — Perú es país minero) ──
  'caterpillar',
  'komatsu',
  'volvo-construction',
  'john-deere',
  'john deere',
  'kubota',       // Kubota SÍ tiene presencia agrícola en Perú sierra
  'bobcat',
  'case',
  'new-holland',
  'new holland',
  'liebherr',
  'hitachi-construction',
  'hyundai-construction',
]);

/**
 * Categorías de productos incluidas en el sitemap y en el SEO Hub.
 * Fuente de verdad para la navegación programática del Home y el Catálogo.
 */
export const PRODUCT_CATEGORIES = [
  { slug: 'ACEITE',      label: 'Filtros de Aceite',      emoji: '🛢️', priority: 0.9 },
  { slug: 'AIRE',        label: 'Filtros de Aire',         emoji: '💨', priority: 0.9 },
  { slug: 'COMBUSTIBLE', label: 'Filtros de Combustible',  emoji: '⛽', priority: 0.85 },
  { slug: 'CABINA',      label: 'Filtros de Cabina',       emoji: '🌬️', priority: 0.8 },
  { slug: 'HIDRAULICO',  label: 'Filtros Hidráulicos',     emoji: '🔧', priority: 0.75 },
  { slug: 'TRANSMISION', label: 'Filtros de Transmisión',  emoji: '⚙️', priority: 0.75 },
];

/**
 * Marcas de vehículos para el SEO Hub del Home (subconjunto visual del whitelist).
 * Solo las más buscadas en Google.pe para mantener el Home limpio.
 * Referencia automática al whitelist — no duplicar la lógica de URLs.
 */
export const HOME_SEO_HUB_BRANDS = [
  { label: 'Toyota',      slug: 'toyota' },
  { label: 'Nissan',      slug: 'nissan' },
  { label: 'Hyundai',     slug: 'hyundai' },
  { label: 'Kia',         slug: 'kia' },
  { label: 'Chevrolet',   slug: 'chevrolet' },
  { label: 'Ford',        slug: 'ford' },
  { label: 'Mitsubishi',  slug: 'mitsubishi' },
  { label: 'Suzuki',      slug: 'suzuki' },
  { label: 'Honda',       slug: 'honda' },
  { label: 'Volkswagen',  slug: 'volkswagen' },
  { label: 'Mazda',       slug: 'mazda' },
  { label: 'Subaru',      slug: 'subaru' },
  { label: 'Hino',        slug: 'hino' },
  { label: 'Isuzu',       slug: 'isuzu' },
];
