/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  poweredByHeader: false,
  async redirects() {
    return [
      // ── LEGACY: /producto/ → /product/ (Spanish → English) ──
      {
        source: '/producto/:slug*',
        destination: '/product/:slug*',
        permanent: true,
      },
      {
        source: '/catalogo/:slug*',
        destination: '/catalog/:slug*',
        permanent: true,
      },
      {
        source: '/catalogo',
        destination: '/catalog',
        permanent: true,
      },
      {
        source: '/buscar/:slug*',
        destination: '/search/:slug*',
        permanent: true,
      },
      {
        source: '/carrito/:slug*',
        destination: '/cart/:slug*',
        permanent: true,
      },
      {
        source: '/gracias/:slug*',
        destination: '/thank-you/:slug*',
        permanent: true,
      },
      {
        source: '/marca/:slug*',
        destination: '/brand/:slug*',
        permanent: true,
      },
      {
        source: '/pedidos/:slug*',
        destination: '/orders/:slug*',
        permanent: true,
      },
      {
        source: '/soluciones/:slug*',
        destination: '/solutions/:slug*',
        permanent: true,
      },
      {
        source: '/vehiculo/:slug*',
        destination: '/vehicle/:slug*',
        permanent: true,
      },

      // ── LEGACY: Catálogo con query params (?make=, ?model=, ?category=) ──
      // Google indexó URLs como /catalogo?make=KIA&model=CEE'D
      // Redirigir al hub principal del catálogo (canonical limpio)
      {
        source: '/catalogo',
        has: [{ type: 'query', key: 'make' }],
        destination: '/catalog',
        permanent: true,
      },
      {
        source: '/catalogo',
        has: [{ type: 'query', key: 'model' }],
        destination: '/catalog',
        permanent: true,
      },
      {
        source: '/catalogo',
        has: [{ type: 'query', key: 'category' }],
        destination: '/catalog',
        permanent: true,
      },
      {
        source: '/catalogo',
        has: [{ type: 'query', key: 'parent' }],
        destination: '/catalog',
        permanent: true,
      },
      // ── CONSOLIDACIÓN SEO: Redirigir modelos específicos a su marca padre ──
      // GSC reporta demasiados 404s en modelos detallados. Centramos autoridad en la marca.
      {
        source: '/vehicle/:marca/:modelo',
        destination: '/vehicle/:marca',
        permanent: true,
      },
      {
        source: '/vehicle/aplicaciones/:slug*',
        destination: '/vehicle',
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        // Fuerza al navegador a consultar siempre la versión más reciente del HTML y las rutas
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
        ],
      },
      {
        // Imágenes y fuentes de public/ tienen un día de caché flexible
        source: '/(.*).(png|jpg|jpeg|svg|webp|woff2|woff)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=86400',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
