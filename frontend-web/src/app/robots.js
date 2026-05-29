/**
 * Robots.txt Generator
 * CONSTITUTION §3 — Configuración centralizada en seo.config.js.
 * El dominio canónico oficial es www.dirogsa.com — debe coincidir
 * con metadataBase en layout.js y con SITE_URL en seo.config.js.
 */
import { SITE_URL } from '@/config/seo.config';

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/', '/login', '/_next/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
