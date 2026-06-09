/**
 * Robots.txt Generator
 * CONSTITUTION §3 — Configuración centralizada en seo.config.js.
 * El dominio canónico oficial es www.dirogsa.com — debe coincidir
 * con metadataBase en layout.js y con SITE_URL en seo.config.js.
 *
 * Rutas en disallow: privadas, sin valor SEO, o que desperdician Crawl Budget.
 */
import { SITE_URL } from '@/config/seo.config';

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',      // Endpoints de API interna
          '/admin/',    // Panel de administración
          '/login',     // Autenticación — sin valor SEO
          '/carrito',   // Carrito de compra — estado privado del usuario
          '/gracias',   // Página de confirmación temporal
          '/buscar',    // SPA interactiva — no indexable por Google
          '/_next/',    // Assets internos de Next.js
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}

