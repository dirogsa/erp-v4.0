/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // Allow any hostname for now (or specify your image domains)
      },
    ],
  },
  poweredByHeader: false,
  async redirects() {
    return [
      {
        source: '/product/:slug*',
        destination: '/producto/:slug*',
        permanent: true, // 301 Redirect for SEO
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
