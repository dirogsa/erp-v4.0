/**
 * blog-posts.js — Single Source of Truth para los artículos del blog.
 * CONSTITUTION §3: La lógica/datos viven en lib, las rutas son mensajeros.
 *
 * Usada por:
 *   - app/blog/page.js          (índice)
 *   - app/blog/[slug]/page.js   (artículo individual)
 *   - app/sitemap.js            (URLs para Google)
 *
 * Cuando el blog migre a un CMS (Contentful, Sanity, etc.) o API del backend,
 * solo se cambia este archivo — el resto del sistema se actualiza solo.
 */

export const BLOG_POSTS = [
  {
    slug: 'cuando-cambiar-filtro-aire',
    title: '¿Cómo saber cuándo cambiar el filtro de aire de tu auto?',
    excerpt: 'El filtro de aire es vital para el motor. Descubre los síntomas que indican que es momento de un reemplazo y cómo prolongar la vida útil de tu vehículo.',
    date: '2026-05-28',
    author: 'Equipo Técnico Dirogsa',
    category: 'Mantenimiento',
    content: `
El filtro de aire es como los pulmones de tu vehículo. Un filtro sucio o deteriorado impide que el motor "respire" correctamente, lo que puede causar desde un aumento en el consumo de combustible hasta daños severos en los cilindros por el ingreso de partículas.

### Síntomas de que necesitas cambiar el filtro
1. **Pérdida de potencia:** El motor se siente "asfixiado" al acelerar.
2. **Humo negro en el escape:** Una mezcla rica en combustible por falta de aire.
3. **Luz de Check Engine:** Los sensores de oxígeno detectan anomalías en la mezcla.

Recomendamos revisar el filtro cada 10,000 km, especialmente si conduces en zonas muy polvorientas o en el tráfico pesado de Lima.
    `,
  },
  {
    slug: 'diferencia-filtro-oem-alternativo',
    title: 'Diferencia entre un filtro OEM y uno alternativo: ¿Cuál elegir?',
    excerpt: 'Guía técnica para entender las ventajas de los repuestos originales (OEM) frente a marcas alternativas de alta calidad como WIX, Sakura o Donaldson.',
    date: '2026-05-20',
    author: 'Equipo Técnico Dirogsa',
    category: 'Guías Técnicas',
    content: `
La pregunta que todo mecánico y propietario de vehículo se hace: ¿pago más por el OEM o elijo un alternativo? La respuesta depende del contexto, pero en DIROGSA te damos los datos para decidir con criterio técnico.

### ¿Qué es un filtro OEM?
OEM significa "Original Equipment Manufacturer". Es el mismo filtro que viene instalado de fábrica en tu vehículo, fabricado según las especificaciones exactas del ensamblador.

### ¿Cuándo elegir un alternativo de calidad?
Marcas como WIX, Filtron o Donaldson fabrican filtros bajo estándares ISO que igualan o superan la filtración del OEM, a un precio significativamente menor. Para vehículos fuera de garantía o flotas comerciales, esta es la opción más inteligente financieramente.

### Nuestra recomendación
Para vehículos en garantía: OEM. Para mantenimiento general: WIX o Filtron son equivalentes técnicos probados.
    `,
  },
];

/**
 * Retorna un post por slug. Retorna null si no existe.
 * @param {string} slug
 * @returns {object|null}
 */
export function getPostBySlug(slug) {
  return BLOG_POSTS.find(p => p.slug === slug) || null;
}
