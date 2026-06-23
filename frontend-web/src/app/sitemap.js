/**
 * sitemap.js — Dynamic Sitemap Generator (Hub & Spoke Architecture)
 * CONSTITUTION §3: Lógica en servicios/lib, rutas son mensajeros.
 * CONSTITUTION §4: Falla gracefully; siempre retorna páginas estáticas mínimas.
 *
 * Fuente de verdad para slugs: src/lib/slug.js (toSlug)
 * Fuente de verdad para vehículos: /shop/seo/vehicles (pre-slugificado por el backend)
 *
 * Arquitectura de Crawl Budget (Tiers):
 *   Tier 1 (1.0):  Home
 *   Tier 2 (0.95): Category Hubs + Product Brand Hubs + Soluciones
 *   Tier 3 (0.9):  Productos (/product/[sku])
 *   Tier 4 (0.8):  Vehicle Brand Hubs (/vehicle/[marca])
 *   Tier 5 (0.75): Vehicle Model Pages (/vehicle/[marca]/[modelo])
 *
 * ISR: Revalida cada 24h para reflejar nuevos productos y vehículos.
 */

import { SITE_URL, PRODUCT_CATEGORIES } from '@/config/seo.config';
import { BLOG_POSTS } from '@/lib/blog-posts';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const revalidate = 86400; // 24 horas

// Marcas de filtros con página Hub propia — sincronizado con /brand/[brand]/page.js
const PRODUCT_BRAND_HUBS = ['wix', 'mann', 'azumi', 'totachi'];

export default async function sitemap() {
  // ── TIER 1 & 2: Páginas estáticas + Hub pages ──
  const staticPages = [
    // Tier 1 — Home
    { url: SITE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },

    // Tier 2B — Product Brand Hubs (estáticos)
    ...PRODUCT_BRAND_HUBS.map(brand => ({
      url: `${SITE_URL}/brand/${brand}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.95,
    })),

    // Tier 2C — Navegación principal (solo páginas indexables)
    { url: `${SITE_URL}/catalog`,  lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${SITE_URL}/blog`,      lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.85 },

    // Tier 2D — Artículos del Blog (fuente: lib/blog-posts.js)
    ...BLOG_POSTS.map(post => ({
      url: `${SITE_URL}/blog/${post.slug}`,
      lastModified: new Date(post.date),
      changeFrequency: 'monthly',
      priority: 0.8,
    })),

    // Tier 2E — Soluciones Especializadas (Marketing Long-Tail)
    ...['filtros-para-flotas', 'equivalencias-wix', 'premium-alta-gama', 'importados-peru'].map(slug => ({
      url: `${SITE_URL}/solutions/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.85,
    })),

    // EXCLUIDAS INTENCIONALMENTE (noindex):
    // /search   — SPA interactiva, no indexable
    // /login    — Privada, sin valor SEO
    // /cart  — Privada, sin valor SEO
    // /orders  — Privada, sin valor SEO
    // /thank-you  — Página de confirmación temporal
  ];

  let dynamicPages = [];

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    const [prodRes, brandsRes, vehiclesRes, catRes] = await Promise.all([
      // Tier 3: Productos
      fetch(`${API_BASE}/shop/seo/products`, {
        next: { revalidate: 86400 },
        signal: controller.signal,
      }),
      // Tier 2B dinámica: Marcas desde BD
      fetch(`${API_BASE}/shop/seo/brands`, {
        next: { revalidate: 86400 },
        signal: controller.signal,
      }),
      // Tier 4 & 5: Vehículos pre-slugificados por el backend
      fetch(`${API_BASE}/shop/seo/vehicles`, {
        next: { revalidate: 86400 },
        signal: controller.signal,
      }),
      // Tier 2A dinámica: Categorías desde BD
      fetch(`${API_BASE}/categories`, {
        next: { revalidate: 86400 },
        signal: controller.signal,
      }),
    ]);

    clearTimeout(timeoutId);

    // ── Tier 2A dinámica: Categorías ──
    if (catRes.ok) {
      const categories = await catRes.json();
      const { toSlug } = await import('@/lib/slug'); // Import dinámico para evitar error en el scope
      const categoryPages = categories.map(c => ({
        url: `${SITE_URL}/catalog/${toSlug(c.name)}`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.95,
      }));
      dynamicPages.push(...categoryPages);
      console.log(`[Sitemap] ✅ ${categoryPages.length} páginas de categorías añadidas.`);
    }

    // ── Tier 3: Páginas de productos ──
    if (prodRes.ok) {
      const items = await prodRes.json();
      const productPages = items.map(p => ({
        url: `${SITE_URL}/product/${encodeURIComponent(p.sku)}`,
        lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.9,
      }));
      dynamicPages.push(...productPages);
      console.log(`[Sitemap] ✅ ${productPages.length} páginas de productos añadidas.`);
    }

    // ── Tier 2B dinámica: Marcas de producto ──
    if (brandsRes.ok) {
      const brands = await brandsRes.json();
      const newBrands = brands.filter(b => !PRODUCT_BRAND_HUBS.includes(b.slug));
      const newBrandPages = newBrands.map(b => ({
        url: `${SITE_URL}/brand/${b.slug}`,
        lastModified: b.updated_at ? new Date(b.updated_at) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.95,
      }));
      dynamicPages.push(...newBrandPages);
      console.log(`[Sitemap] ✅ ${newBrandPages.length} páginas de marcas de producto añadidas.`);
    }

    // ── Tier 4 & 5: Vehículos (ya filtrados y slugificados por el backend) ──
    if (vehiclesRes.ok) {
      const vehicles = await vehiclesRes.json();
      let brandCount = 0;
      let modelCount = 0;

      for (const v of vehicles) {
        // Tier 4: Hub de marca
        dynamicPages.push({
          url: `${SITE_URL}/vehicle/${v.make_slug}`,
          lastModified: new Date(),
          changeFrequency: 'weekly',
          priority: 0.8,
        });
        brandCount++;
      }

      console.log(`[Sitemap] ✅ Vehículos: ${brandCount} marcas añadidas. (Modelos omitidos por estrategia SEO)`);
    }

  } catch (err) {
    console.error('[Sitemap] ⚠️ Error fetching dynamic data:', err.message);
  }

  const total = staticPages.length + dynamicPages.length;
  console.log(`[Sitemap] 📦 Total: ${total} URLs. Estáticas=${staticPages.length}, Dinámicas=${dynamicPages.length}`);

  return [...staticPages, ...dynamicPages];
}
