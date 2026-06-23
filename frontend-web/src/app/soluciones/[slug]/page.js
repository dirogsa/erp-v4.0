import { notFound } from 'next/navigation';
import Link from 'next/link';
import { SITE_URL } from '@/config/seo.config';
import { ProductService } from '@/services/product.service';

export const revalidate = 86400;

// Diccionario de Soluciones Especializadas (Marketing SEO B2B)
const SOLUCIONES_SEO = {
  'filtros-para-flotas': {
    title: 'Filtros para Flotas y Línea Pesada',
    desc: 'Abastecimiento mayorista de filtros para flotas de transporte, camiones y maquinaria pesada. Alto rendimiento y durabilidad.',
    keywords: ['filtros para flotas', 'filtros linea pesada peru', 'filtros para camiones', 'filtros hino peru', 'abastecimiento flotas'],
    emoji: '🚛',
    searchQuery: 'pesado', // query para sacar algunos productos
  },
  'equivalencias-wix': {
    title: 'Equivalencias de Filtros WIX',
    desc: 'Encuentra el cruce y la equivalencia exacta de cualquier filtro original a WIX Filters. Precisión OEM garantizada.',
    keywords: ['equivalencias wix', 'cruce de filtros wix', 'catalogo wix peru', 'wix filters peru'],
    emoji: '🔄',
    searchQuery: 'wix',
  },
  'premium-alta-gama': {
    title: 'Filtros Premium para Alta Gama',
    desc: 'Filtros de aceite, aire y cabina para vehículos premium y SUVs de alta gama. Máxima protección y calidad certificada.',
    keywords: ['filtros premium alta gama', 'filtros suv premium', 'filtros importados peru', 'filtros alemanes peru'],
    emoji: '✨',
    searchQuery: 'premium',
  },
  'importados-peru': {
    title: 'Importador Directo de Filtros en Perú',
    desc: 'Distribución mayorista de filtros automotrices importados (Wix, Filtron, Hengst). Cobertura nacional directa desde almacén.',
    keywords: ['filtros importados perú', 'importador de filtros automotrices', 'distribuidor filtros peru', 'mayorista de repuestos'],
    emoji: '🚢',
    searchQuery: 'filtron',
  }
};

export async function generateStaticParams() {
  return Object.keys(SOLUCIONES_SEO).map(slug => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const solucion = SOLUCIONES_SEO[slug];
  
  if (!solucion) return { title: 'No encontrado' };

  return {
    title: `${solucion.title} | DIROGSA Perú`,
    description: solucion.desc,
    keywords: solucion.keywords,
    alternates: { canonical: `${SITE_URL}/soluciones/${slug}` },
    openGraph: {
      title: `${solucion.title} | DIROGSA`,
      description: solucion.desc,
      url: `${SITE_URL}/soluciones/${slug}`,
    },
  };
}

export default async function SolucionesSeoPage({ params }) {
  const { slug } = await params;
  const solucion = SOLUCIONES_SEO[slug];

  if (!solucion) notFound();

  // Fetch some products related to the solution to make the page rich
  let products = [];
  try {
    const res = await ProductService.searchProducts({ q: solucion.searchQuery, limit: 12 });
    products = res.items || [];
  } catch (err) {}

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-16">
      <header className="mb-12 text-center">
        <span className="text-4xl md:text-5xl mb-4 block">{solucion.emoji}</span>
        <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter mb-4">
          {solucion.title}
        </h1>
        <p className="text-sm md:text-lg max-w-3xl mx-auto" style={{ color: 'var(--brand-text-dim)' }}>
          {solucion.desc}
        </p>
      </header>

      {/* Cross-linking to categories for maximum SEO juice */}
      <div className="flex flex-wrap justify-center gap-3 mb-16">
        <Link href="/catalogo" className="px-5 py-2 rounded-xl text-xs font-bold bg-brand-primary text-[#0A0A0B] uppercase tracking-widest hover:bg-brand-primary/80 transition-colors">
          Ver Catálogo Completo
        </Link>
        <Link href="/buscar" className="px-5 py-2 rounded-xl text-xs font-bold border border-white/20 text-white hover:bg-white/5 transition-colors uppercase tracking-widest">
          Buscador Avanzado
        </Link>
      </div>

      {products.length > 0 && (
        <section className="mb-16">
          <h2 className="text-xl font-black text-white uppercase tracking-widest mb-6 text-center">
            Productos Destacados
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {products.map(p => (
              <Link key={p.sku} href={`/product/${p.sku}`} className="group p-4 rounded-2xl border border-white/5 bg-[#141518] hover:border-brand-primary/40 transition-all">
                <span className="text-[10px] text-brand-primary font-bold uppercase">{p.brand || 'DIROGSA'}</span>
                <p className="text-xs text-white font-black mt-1 truncate">{p.name}</p>
                <p className="text-[10px] text-white/40 mt-2">SKU: {p.sku}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* SEO Text content to increase word count and relevance */}
      <article className="prose prose-invert max-w-4xl mx-auto border-t border-white/5 pt-10" style={{ color: 'var(--brand-text-muted)' }}>
        <h2 className="text-sm font-black text-white/50 uppercase tracking-widest mb-4">Especialistas en Abastecimiento B2B</h2>
        <p className="text-xs md:text-sm leading-relaxed text-justify mb-4">
          DIROGSA es el socio estratégico ideal para tu negocio automotriz. Nuestro enfoque en <strong>{solucion.title.toLowerCase()}</strong> nos permite ofrecer soluciones a medida para concesionarias, lubricentros, talleres especializados y operadores logísticos en todo el Perú. Sabemos que el tiempo de inactividad de un vehículo cuesta dinero, por eso mantenemos un stock permanente de alta rotación y realizamos envíos diarios a provincias.
        </p>
        <p className="text-xs md:text-sm leading-relaxed text-justify">
          Todos nuestros productos cumplen con estrictos estándares de calidad internacional. Confía en nuestra plataforma B2B para simplificar tus compras, acceder a equivalencias exactas y asegurar la mejor rentabilidad para tu empresa.
        </p>
      </article>
    </div>
  );
}
