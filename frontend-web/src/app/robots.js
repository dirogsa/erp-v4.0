export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/admin/', '/login'],
    },
    sitemap: 'https://dirogsa.com/sitemap.xml',
  }
}
