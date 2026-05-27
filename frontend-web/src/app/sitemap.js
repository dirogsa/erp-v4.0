/**
 * Dynamic Sitemap Generator
 * CONSTITUTION §3 — DDD: Logic lives in services, not routes.
 * 
 * ISR: Revalidates every 24h to pick up new products and vehicles.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const SITE_URL = 'https://dirogsa.com';

export const revalidate = 86400; // 24 hours

export default async function sitemap() {
  const staticPages = [
    { url: SITE_URL,           lastModified: new Date(), changeFrequency: 'daily',  priority: 1.0 },
    { url: `${SITE_URL}/buscar`,    lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/catalogo`,  lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${SITE_URL}/login`,     lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.4 },
  ];

  let dynamicPages = [];
  
  try {
    // Timeout de 15s para evitar que el build de Next.js se cuelgue y falle (error 60s timeout en Render)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    // 1. Fetch Products
    const prodRes = await fetch(`${API_BASE}/shop/products?limit=10000`, { 
      next: { revalidate: 86400 },
      signal: controller.signal
    });
    if (prodRes.ok) {
      const data = await prodRes.json();
      const items = Array.isArray(data) ? data : (data.items || []);
      const productPages = items.map(p => ({
        url: `${SITE_URL}/producto/${p.sku}`,
        lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.9,
      }));
      dynamicPages.push(...productPages);
    }

    // 2. Fetch Vehicles (Long-Tail SEO)
    const vehRes = await fetch(`${API_BASE}/shop/vehicles`, { 
      next: { revalidate: 86400 },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId); // Limpiar timeout si ambas peticiones terminan a tiempo

    if (vehRes.ok) {
      const vehicles = await vehRes.json();
      for (const v of vehicles) {
        if (!v.make) continue;
        const makeStr = encodeURIComponent(v.make.toLowerCase().replace(/\s+/g, '-'));
        
        // Brand Page
        dynamicPages.push({
          url: `${SITE_URL}/vehiculo/${makeStr}`,
          lastModified: new Date(),
          changeFrequency: 'weekly',
          priority: 0.8,
        });

        // Model Pages
        if (v.models && Array.isArray(v.models)) {
          for (const model of v.models) {
            if (!model || model.toLowerCase() === 'none') continue;
            const modelStr = encodeURIComponent(model.toLowerCase().replace(/\s+/g, '-'));
            dynamicPages.push({
              url: `${SITE_URL}/vehiculo/${makeStr}/${modelStr}`,
              lastModified: new Date(),
              changeFrequency: 'weekly',
              priority: 0.8,
            });
          }
        }
      }
    }
  } catch (err) {
    console.error('[Sitemap] Failed to fetch dynamic data:', err.message);
  }

  return [...staticPages, ...dynamicPages];
}
