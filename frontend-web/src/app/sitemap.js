/**
 * Dynamic Sitemap Generator
 * CONSTITUTION §3 — DDD: Logic lives in services/config, not routes.
 * CONSTITUTION §4 — Bootstrap: Fails gracefully; always returns static pages at minimum.
 *
 * Arquitectura de Calidad:
 * - Consume VEHICLE_BRANDS_WHITELIST desde seo.config.js (única fuente de verdad).
 * - Filtra agresivamente vehículos de baja calidad (maquinaria europea, marcas sin
 *   presencia en Perú) para proteger el Crawl Budget de Google.
 * - URLs limpias: normaliza slugs eliminando caracteres especiales y paréntesis.
 *
 * ISR: Revalida cada 24h para reflejar nuevos productos y vehículos.
 */

import { SITE_URL, VEHICLE_BRANDS_WHITELIST, PRODUCT_CATEGORIES } from '@/config/seo.config';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const revalidate = 86400; // 24 horas

/**
 * Normaliza una marca de vehículo a slug URL-safe para comparar contra el whitelist.
 * Ejemplo: "Kia Motors" → "kia motors" | "VW (Volkswagen)" → "vw (volkswagen)"
 */
function normalizeBrand(make) {
  return make?.toLowerCase().trim() || '';
}

/**
 * Convierte un nombre de vehículo a slug URL limpio.
 * Elimina paréntesis, caracteres especiales y normaliza espacios.
 * Ejemplo: "GR 86 (ZN8)" → "gr-86-zn8" | "C-Klasse (W206/S206)" → "c-klasse-w206-s206"
 */
function toCleanSlug(str) {
  return str
    .toLowerCase()
    .replace(/[()[\]{}]/g, '')          // elimina paréntesis y corchetes
    .replace(/[/\\|,;:]/g, '-')         // convierte separadores en guiones
    .replace(/\s+/g, '-')               // espacios → guiones
    .replace(/-{2,}/g, '-')             // colapsa guiones múltiples
    .replace(/^-|-$/g, '')              // elimina guiones al inicio/fin
    .trim();
}

/**
 * Verifica si una marca de vehículo está en el whitelist de marcas relevantes para Perú.
 * Acepta variantes con/sin guiones y tildes.
 */
function isBrandAllowed(make) {
  const normalized = normalizeBrand(make);
  if (VEHICLE_BRANDS_WHITELIST.has(normalized)) return true;
  // Intento secundario: versión con guiones en lugar de espacios
  const withHyphens = normalized.replace(/\s+/g, '-');
  return VEHICLE_BRANDS_WHITELIST.has(withHyphens);
}

export default async function sitemap() {
  // ── Páginas estáticas (siempre presentes) ──
  const staticPages = [
    { url: SITE_URL,                    lastModified: new Date(), changeFrequency: 'daily',   priority: 1.0 },
    { url: `${SITE_URL}/buscar`,        lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/catalogo`,      lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${SITE_URL}/login`,         lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.4 },
    // Páginas de categoría (SEO programático por tipo de filtro)
    ...PRODUCT_CATEGORIES.map(cat => ({
      url: `${SITE_URL}/catalogo?category=${cat.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: cat.priority,
    })),
  ];

  let dynamicPages = [];

  try {
    // Timeout de 15s para evitar que el build de Next.js se cuelgue en Render
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    // ── 1. Productos del catálogo (máxima prioridad SEO) ──
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

    // ── 2. Vehículos (filtrados por whitelist de calidad) ──
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

      // Deduplicar marcas para evitar páginas duplicadas
      const seenBrands = new Set();
      const seenModels = new Set();

      for (const v of vehicles) {
        if (!v.make) continue;

        // ── FILTRO DE CALIDAD: Solo marcas en el whitelist ──
        if (!isBrandAllowed(v.make)) {
          brandPagesSkipped++;
          continue;
        }

        const makeSlug = toCleanSlug(v.make);

        // Página de marca (una por marca, deduplicada)
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

        // Páginas de modelo (deduplicadas)
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
      console.log(`[Sitemap] 🚫 ${brandPagesSkipped} marcas sin relevancia en Perú omitidas (Crawl Budget protegido).`);
    }
  } catch (err) {
    console.error('[Sitemap] ⚠️ Error fetching dynamic data:', err.message);
    // Fallo silencioso — retorna solo páginas estáticas. El sitio no se rompe.
  }

  const total = staticPages.length + dynamicPages.length;
  console.log(`[Sitemap] 📦 Total: ${total} URLs de alta calidad generadas.`);

  return [...staticPages, ...dynamicPages];
}
