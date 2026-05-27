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
};

export default nextConfig;
