/**
 * Dynamic Sitemap Generator — World-Class Hub & Spoke Architecture
 * CONSTITUTION §3 — DDD: Logic lives in services/config, not routes.
 * CONSTITUTION §4 — Bootstrap: Fails gracefully; always returns static pages at minimum.
 *
 * Arquitectura de Crawl Budget:
 * Tier 1 (priority 1.0): Home
 * Tier 2 (priority 0.95): Category Hubs (/catalogo/[cat]) + Brand Hubs (/marca/[brand])
 * Tier 3 (priority 0.9):  Product pages (/producto/[sku])
 * Tier 4 (priority 0.8):  Vehicle Hubs (/vehiculo/[marca])
 * Tier 5 (priority 0.75): Vehicle Model pages (/vehiculo/[marca]/[modelo])
 *
 * ISR: Revalida cada 24h para reflejar nuevos productos y vehículos.
 */

import { SITE_URL, VEHICLE_BRANDS_WHITELIST, PRODUCT_CATEGORIES } from '@/config/seo.config';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const revalidate = 86400; // 24 horas

// Marcas de filtros con página Hub propia — sincronizado con /marca/[brand]/page.js
const PRODUCT_BRAND_HUBS = ['wix', 'mann', 'azumi', 'totachi'];

function normalizeBrand(make) {
  return make?.toLowerCase().trim() || '';
}

function toCleanSlug(str) {
  return str
    .toLowerCase()
    .replace(/[()[\]{}]/g, '')
    .replace(/[/\\|,;:]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '')
    .trim();
}

function isBrandAllowed(make) {
  const normalized = normalizeBrand(make);
  if (VEHICLE_BRANDS_WHITELIST.has(normalized)) return true;
  const withHyphens = normalized.replace(/\s+/g, '-');
  return VEHICLE_BRANDS_WHITELIST.has(withHyphens);
}

export default async function sitemap() {
  // ── TIER 1 & 2: Páginas estáticas + Hub pages (siempre presentes, máxima prioridad) ──
  const staticPages = [
    // Tier 1
    { url: SITE_URL,               lastModified: new Date(), changeFrequency: 'daily',  priority: 1.0 },
    // Tier 2A: Category Hubs — 6 URLs que agrupan los 5,000 productos en categorías
    ...PRODUCT_CATEGORIES.map(cat => ({
      url: `${SITE_URL}/catalogo/${cat.slug.toLowerCase()}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.95,
    })),
    // Tier 2B: Brand Hubs — URLs dinámicas
    ...PRODUCT_BRAND_HUBS.map(brand => ({
      url: `${SITE_URL}/marca/${brand}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.95,
    })),
    // Páginas de navegación general
    { url: `${SITE_URL}/catalogo`,   lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${SITE_URL}/buscar`,     lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/login`,      lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.4 },

    // Tier 2C: Soluciones Especializadas (Marketing Long-Tail)
    ...['filtros-para-flotas', 'equivalencias-wix', 'premium-alta-gama', 'importados-peru'].map(slug => ({
      url: `${SITE_URL}/soluciones/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.85,
    })),
  ];

  let dynamicPages = [];

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    // ── TIER 3: Productos (ultra-fast endpoint, sin N+1) ──
    const prodRes = await fetch(`${API_BASE}/shop/seo/products`, {
      next: { revalidate: 86400 },
      signal: controller.signal,
    });
    if (prodRes.ok) {
      const items = await prodRes.json();
      const productPages = items.map(p => ({
        url: `${SITE_URL}/producto/${encodeURIComponent(p.sku)}`,
        lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.9,
      }));
      dynamicPages.push(...productPages);
      console.log(`[Sitemap] ✅ ${productPages.length} páginas de productos añadidas.`);
    }

    // ── TIER 2.5: Marcas Dinámicas (Nuevas marcas desde ERP) ──
    const brandsRes = await fetch(`${API_BASE}/shop/seo/brands`, {
      next: { revalidate: 86400 },
      signal: controller.signal,
    });
    if (brandsRes.ok) {
      const brands = await brandsRes.json();
      const newBrands = brands.filter(b => !PRODUCT_BRAND_HUBS.includes(b.slug));
      const newBrandPages = newBrands.map(b => ({
        url: `${SITE_URL}/marca/${b.slug}`,
        lastModified: b.updated_at ? new Date(b.updated_at) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.95,
      }));
      dynamicPages.push(...newBrandPages);
      console.log(`[Sitemap] ✅ ${newBrandPages.length} páginas de marcas dinámicas añadidas.`);
    }

    // ── TIER 4 & 5: Vehículos (filtrados por whitelist de calidad) ──
    const vehRes = await fetch(`${API_BASE}/shop/vehicles`, {
      next: { revalidate: 86400 },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (vehRes.ok) {
      const vehicles = await vehRes.json();
      let brandPagesAdded = 0;
      let modelPagesAdded = 0;
      let brandPagesSkipped = 0;

      const seenBrands = new Set();
      const seenModels = new Set();

      for (const v of vehicles) {
        if (!v.make) continue;

        if (!isBrandAllowed(v.make)) {
          brandPagesSkipped++;
          continue;
        }

        const makeSlug = toCleanSlug(v.make);

        if (!seenBrands.has(makeSlug)) {
          seenBrands.add(makeSlug);
          dynamicPages.push({
            url: `${SITE_URL}/vehiculo/${makeSlug}`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
          });
          brandPagesAdded++;
        }

        if (v.models && Array.isArray(v.models)) {
          for (const model of v.models) {
            if (!model || model.toLowerCase() === 'none') continue;
            const modelSlug = toCleanSlug(model);
            if (!modelSlug) continue;
            const fullSlug = `${makeSlug}/${modelSlug}`;
            if (seenModels.has(fullSlug)) continue;
            seenModels.add(fullSlug);
            dynamicPages.push({
              url: `${SITE_URL}/vehiculo/${fullSlug}`,
              lastModified: new Date(),
              changeFrequency: 'weekly',
              priority: 0.75,
            });
            modelPagesAdded++;
          }
        }
      }

      console.log(`[Sitemap] ✅ Vehículos: ${brandPagesAdded} marcas, ${modelPagesAdded} modelos añadidos.`);
      console.log(`[Sitemap] 🚫 ${brandPagesSkipped} marcas sin relevancia omitidas (Crawl Budget protegido).`);
    }
  } catch (err) {
    console.error('[Sitemap] ⚠️ Error fetching dynamic data:', err.message);
  }

  const total = staticPages.length + dynamicPages.length;
  console.log(`[Sitemap] 📦 Total Hub & Spoke: ${total} URLs de alta calidad. Tier2=${staticPages.length - 3} hubs, Tier3=${dynamicPages.filter(p => p.url.includes('/producto/')).length} productos.`);

  return [...staticPages, ...dynamicPages];
}
