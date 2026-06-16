/**
 * DIROGSA Web — Product Service
 * CONSTITUTION §3 — Domain-Driven Design: This is the ONLY file that talks to the backend.
 * CONSTITUTION §5 — Single Source of Truth: No price logic here, only data transport.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Revalidation strategy: 1 hour cache for product data.
// Protects the free-tier DB: 1,000 concurrent users = 1 DB query per hour.
const CACHE_OPTS = { next: { revalidate: 3600 } };
// Short cache for search/catalogue listing (5 min)
const SEARCH_CACHE_OPTS = { next: { revalidate: 300 } };

async function apiFetch(path, opts = {}) {
  try {
    const res = await fetch(`${API_BASE}${path}`, opts);
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`API error ${res.status} on ${path}`);
    }
    return res.json();
  } catch (err) {
    console.error(`[ProductService] ${path}:`, err.message);
    return null;
  }
}

export const ProductService = {
  /**
   * Get a single product by SKU — SSR with 1hr cache (ISR)
   */
  async getProductBySku(sku) {
    const data = await apiFetch(`/shop/products/${encodeURIComponent(sku)}`, CACHE_OPTS);
    if (!data) return null;
    return normalizeProduct(data);
  },

  /**
   * Search products — 5min cache
   */
  async searchProducts(params = {}) {
    const qs = new URLSearchParams();
    if (params.search)         qs.set('search', params.search);
    if (params.vehicle_brand)  qs.set('vehicle_brand', params.vehicle_brand);
    if (params.vehicle_model)  qs.set('vehicle_model', params.vehicle_model);
    if (params.spec_h)         qs.set('spec_h', params.spec_h);
    if (params.spec_d)         qs.set('spec_d', params.spec_d);
    if (params.spec_t)         qs.set('spec_t', params.spec_t);
    if (params.spec_id)        qs.set('spec_id', params.spec_id);
    if (params.category)       qs.set('category', params.category);
    if (params.is_new)         qs.set('is_new', 'true');
    if (params.limit)          qs.set('limit', params.limit);
    if (params.skip !== undefined) qs.set('skip', params.skip);

    const data = await apiFetch(`/shop/products?${qs.toString()}`, SEARCH_CACHE_OPTS);
    if (!data) return { items: [], total: 0 };
    const items = Array.isArray(data) ? data : (data.items || []);
    return { items: items.map(normalizeProduct), total: data.total || items.length };
  },

  /**
   * Get vehicle brands for the search dropdowns
   */
  async getVehicleBrands() {
    const data = await apiFetch('/shop/brands', CACHE_OPTS); // Asumiendo ruta correcta
    return Array.isArray(data) ? data : [];
  },

  /**
   * Get product categories
   */
  async getCategories() {
    const data = await apiFetch('/categories', CACHE_OPTS); // Asumiendo ruta
    return Array.isArray(data) ? data : [];
  },

  /**
   * Get featured products for the home page hero
   */
  async getFeaturedProducts(limit = 6) {
    return ProductService.searchProducts({ limit });
  },

  /**
   * Get related products for SEO Hub & Spoke (Cross-Linking)
   * Highly optimized: performs EXACTLY ONE lightweight indexed query by category and ranks in memory.
   */
  async getRelatedProducts(productOrBrand, categoryOrLimit, limit = 4) {
    let brand = '';
    let category = '';
    let applications = [];
    let queryLimit = limit;
    let currentSku = '';

    if (productOrBrand && typeof productOrBrand === 'object') {
      brand = productOrBrand.brand;
      category = productOrBrand.category;
      applications = productOrBrand.applications || [];
      currentSku = productOrBrand.sku || '';
      queryLimit = typeof categoryOrLimit === 'number' ? categoryOrLimit : limit;
    } else {
      brand = productOrBrand;
      category = categoryOrLimit;
    }

    // Single lightweight query using category index
    const res = await ProductService.searchProducts({ 
      category: category || undefined, 
      limit: 12 
    });

    if (!res || !res.items || res.items.length === 0) {
      // Fallback to brand search if category query returned nothing
      return ProductService.searchProducts({ search: brand, limit: queryLimit });
    }

    // Rank and score candidates in memory to offload CPU-heavy logic from free-tier MongoDB
    const scoredItems = res.items
      .filter(item => item.sku !== currentSku)
      .map(item => {
        let score = 0;
        
        // Coincidencia por vehículo (Marca y Modelo)
        const itemApps = item.applications || [];
        for (const currentApp of applications) {
          const match = itemApps.find(
            app => app.make?.toUpperCase() === currentApp.make?.toUpperCase() &&
                   app.model?.toUpperCase() === currentApp.model?.toUpperCase()
          );
          if (match) {
            score += 10;
            break;
          }
        }

        // Coincidencia por marca de repuesto
        if (item.brand?.toUpperCase() === brand?.toUpperCase()) {
          score += 2;
        }

        return { item, score };
      });

    const sortedItems = scoredItems
      .sort((a, b) => b.score - a.score)
      .map(entry => entry.item)
      .slice(0, queryLimit);

    return { items: sortedItems };
  },
};

/**
 * Normalize raw API product shape to a consistent frontend model.
 * This is the "Anti-Corruption Layer" between API and UI.
 */
function normalizeProduct(p) {
  if (!p) return null;

  let resolvedImageUrl = p.image_url || null;
  if (resolvedImageUrl) {
    resolvedImageUrl = resolvedImageUrl.trim();
    if (
      resolvedImageUrl.startsWith('/adobe/') || 
      resolvedImageUrl.startsWith('/content/') || 
      resolvedImageUrl.startsWith('/en-eu/') || 
      resolvedImageUrl.startsWith('/etc.clientlibs/')
    ) {
      resolvedImageUrl = `https://www.wixfilters.com${resolvedImageUrl}`;
    }
  }

  return {
    id:              p.id,
    sku:             p.sku,
    name:            p.name || `Repuesto ${p.sku}`,
    brand:           p.brand || 'DIROGSA',
    price:           p.price_retail ?? p.price ?? 0,
    currency:        p.currency || 'PEN',
    stock:           p.stock_current ?? p.stock ?? 0,
    category:        p.category || 'Repuestos',
    description:     p.description || `Repuesto automotriz de alta calidad. Código ${p.sku}.`,
    imageUrl:        resolvedImageUrl,
    isNew:           p.is_new || false,
    promoDiscountPct: p.promo_discount_pct || 0,
    discount3Pct:    p.discount_3_pct || 0,
    discount6Pct:    p.discount_6_pct || 0,
    discount12Pct:   p.discount_12_pct || 0,
    specs:           p.specs || [],
    equivalences:    p.equivalences || [],
    applications:    p.applications || [],
    features:        p.features || [],
    weightG:         p.weight_g || 0,
  };
}
