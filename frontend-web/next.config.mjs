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

      // ── LEGACY: Catálogo con query params (?make=, ?model=, ?category=) ──
      // Google indexó URLs como /catalogo?make=KIA&model=CEE'D
      // Redirigir al hub principal del catálogo (canonical limpio)
      {
        source: '/catalogo',
        has: [{ type: 'query', key: 'make' }],
        destination: '/catalogo',
        permanent: true,
      },
      {
        source: '/catalogo',
        has: [{ type: 'query', key: 'model' }],
        destination: '/catalogo',
        permanent: true,
      },
      {
        source: '/catalogo',
        has: [{ type: 'query', key: 'category' }],
        destination: '/catalogo',
        permanent: true,
      },
      {
        source: '/catalogo',
        has: [{ type: 'query', key: 'parent' }],
        destination: '/catalogo',
        permanent: true,
      },
      // ── CONSOLIDACIÓN SEO: Redirigir modelos específicos a su marca padre ──
      // GSC reporta demasiados 404s en modelos detallados. Centramos autoridad en la marca.
      {
        source: '/vehiculo/:marca/:modelo',
        destination: '/vehiculo/:marca',
        permanent: true,
      },
      {
        source: '/vehiculo/aplicaciones/:slug*',
        destination: '/vehiculo',
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
