/**
 * Dynamic Sitemap Generator
 * CONSTITUTION §3 — DDD: Logic lives in services, not routes.
 * 
 * This file is automatically called by Next.js at /sitemap.xml
 * It generates a fully dynamic sitemap with ALL product SKUs
 * so Google can index every page in your catalog.
 * 
 * ISR: Revalidates every 24h to pick up new products without a full rebuild.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const SITE_URL = 'https://dirogsa.com';

export const revalidate = 86400; // 24 hours

export default async function sitemap() {
  // Static pages — always indexed with high priority
  const staticPages = [
    { url: SITE_URL,           lastModified: new Date(), changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${SITE_URL}/buscar`,    lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/catalogo`,  lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${SITE_URL}/login`,     lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.4 },
  ];

  // Dynamic product pages — the SEO goldmine
  let productPages = [];
  try {
    // Fetch ALL product SKUs from your backend (without full data to keep it light)
    const res = await fetch(`${API_BASE}/api/products/?limit=10000`, {
      next: { revalidate: 86400 }
    });
    if (res.ok) {
      const data = await res.json();
      const items = Array.isArray(data) ? data : (data.items || []);
      productPages = items.map(p => ({
        url: `${SITE_URL}/producto/${p.sku}`,
        lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.9, // High priority — these are the money pages for SEO
      }));
    }
  } catch (err) {
    console.error('[Sitemap] Failed to fetch products:', err.message);
  }

  return [...staticPages, ...productPages];
}
