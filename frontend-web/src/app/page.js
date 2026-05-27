import { ProductService } from '@/services/product.service';
import Link from 'next/link';

// News for carousel — static (no DB hit needed)
const NEWS = [
  {
    id: 1, title: 'Nueva Línea Industrial Premium 2026', tag: 'LANZAMIENTO',
    sub: 'Filtros certificados ISO para flotas pesadas',
    img: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&q=80&w=800',
    accent: '#6EE7B7'
  },
  {
    id: 2, title: 'Distribución Nacional Expandida', tag: 'LOGÍSTICA',
    sub: 'Cobertura en Lima, Arequipa y Trujillo',
    img: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=800',
    accent: '#38BDF8'
  },
  {
    id: 3, title: 'Tecnología Nanoflow en Filtros', tag: 'TECNOLOGÍA',
    sub: 'Eficiencia de filtrado superior al 99.7%',
    img: 'https://images.unsplash.com/photo-1537462715879-360eeb61a0ad?auto=format&fit=crop&q=80&w=800',
    accent: '#FB923C'
  },
];

const FILTER_CATEGORIES = [
  { name: 'ACEITE',      icon: '🛢️',  color: '#F59E0B' },
  { name: 'AIRE',        icon: '💨',  color: '#38BDF8' },
  { name: 'COMBUSTIBLE', icon: '⛽',  color: '#FB923C' },
  { name: 'CABINA',      icon: '🚗',  color: '#6EE7B7' },
  { name: 'HIDRÁULICO',  icon: '⚙️',  color: '#A855F7' },
];

export default async function HomePage() {
  // Fetch from server — populated on build/revalidation, free for the DB
  const { items: featured } = await ProductService.searchProducts({ limit: 6 });

  return (
    <div className="min-h-screen" style={{ background: 'var(--brand-bg)' }}>

      {/* ─── HERO SECTION ─── */}
      <section className="relative overflow-hidden py-20 px-5">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl">
            {/* SEO-rich H1 — critical for Google */}
            <div className="flex items-center gap-2 mb-6">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] px-3 py-1.5 rounded-full"
                    style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--brand-primary)', border: '1px solid rgba(16,185,129,0.3)' }}>
                ● Importador Oficial · Lima, Perú
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black leading-tight tracking-tighter text-white mb-6">
              Filtros y{' '}
              <span className="gradient-text">Repuestos</span>
              <br />Automotrices
            </h1>
            <p className="text-lg md:text-xl leading-relaxed mb-10 max-w-xl"
               style={{ color: 'var(--brand-text-muted)' }}>
              Importadora y distribuidora oficial en Perú. Encuentra filtros de aceite, aire,
              combustible y cabina para cualquier marca de vehículo.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/buscar"
                className="flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all hover:brightness-110 active:scale-95"
                style={{ background: 'var(--brand-primary)', color: '#0A0A0B' }}>
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Buscar Filtro
              </Link>
              <Link href="/catalogo"
                className="flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all hover:bg-white/10"
                style={{ border: '1px solid var(--brand-border-2)', color: 'var(--brand-text-muted)' }}>
                Ver Catálogo Completo →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── NEWS CARDS (SSR - Static) ─── */}
      <section className="py-12 px-5">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] mb-6"
              style={{ color: 'var(--brand-text-muted)' }}>
            Novedades
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {NEWS.map(item => (
              <article key={item.id}
                className="relative rounded-3xl overflow-hidden h-52 group cursor-pointer"
                style={{ border: `1px solid ${item.accent}22` }}>
                <img src={item.img} alt={item.title}
                     className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-70 transition-opacity duration-500" />
                <div className="absolute inset-0"
                     style={{ background: 'linear-gradient(to top, #0A0A0B 40%, transparent 100%)' }} />
                <div className="absolute top-0 left-6 right-6 h-px"
                     style={{ background: `linear-gradient(90deg, transparent, ${item.accent}60, transparent)` }} />
                <div className="absolute bottom-5 left-5 right-5">
                  <span className="inline-block px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest mb-2"
                        style={{ background: `${item.accent}20`, border: `1px solid ${item.accent}40`, color: item.accent }}>
                    {item.tag}
                  </span>
                  <h3 className="text-lg font-black text-white leading-tight">{item.title}</h3>
                  <p className="text-[11px] mt-1" style={{ color: `${item.accent}bb` }}>{item.sub}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FILTER CATEGORIES ─── */}
      <section className="py-12 px-5">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-xl font-black text-white mb-2">Tipos de Filtro</h2>
          <p className="text-sm mb-8" style={{ color: 'var(--brand-text-muted)' }}>
            Selecciona el tipo de filtro que necesitas para tu vehículo
          </p>
          <div className="flex flex-wrap gap-3">
            {FILTER_CATEGORIES.map(cat => (
              <Link key={cat.name}
                href={`/buscar?categoria=${cat.name.toLowerCase()}`}
                className="flex items-center gap-3 px-5 py-3 rounded-2xl font-black text-sm uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
                style={{
                  background: `${cat.color}10`,
                  border: `1px solid ${cat.color}30`,
                  color: cat.color
                }}>
                <span>{cat.icon}</span>
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURED PRODUCTS (SSR) ─── */}
      {featured.length > 0 && (
        <section className="py-12 px-5">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl font-black text-white">Productos Destacados</h2>
                <p className="text-sm mt-1" style={{ color: 'var(--brand-text-muted)' }}>
                  Los más consultados de nuestro catálogo
                </p>
              </div>
              <Link href="/catalogo"
                className="text-sm font-bold transition-colors hover:text-white"
                style={{ color: 'var(--brand-primary)' }}>
                Ver todos →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {featured.map(product => (
                <Link key={product.sku} href={`/producto/${product.sku}`}
                  className="card-premium group hover:border-brand-primary/30 hover:shadow-[0_0_30px_rgba(16,185,129,0.1)] transition-all duration-300">
                  {/* Image */}
                  <div className="h-40 rounded-2xl overflow-hidden flex items-center justify-center mb-4 relative"
                       style={{ background: 'var(--brand-surface-2)' }}>
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name}
                           className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-700" />
                    ) : (
                      <svg className="h-12 w-12 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    )}
                    {product.isNew && (
                      <span className="absolute top-2 left-2 text-[8px] font-black uppercase px-2 py-1 rounded-lg animate-pulse"
                            style={{ background: 'var(--brand-primary)', color: '#0A0A0B' }}>NEW</span>
                    )}
                  </div>
                  {/* Info */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-widest"
                          style={{ color: 'var(--brand-text-dim)' }}>
                      {product.brand}
                    </span>
                    <h3 className="text-white font-black text-sm uppercase tracking-tight leading-tight line-clamp-2">
                      {product.name}
                    </h3>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] font-black tracking-widest"
                            style={{ color: 'var(--brand-orange)' }}>
                        {product.sku}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-1 rounded-lg"
                            style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--brand-primary)', border: '1px solid rgba(16,185,129,0.2)' }}>
                        Ver detalle →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── VALUE PROPS ─── */}
      <section className="py-16 px-5">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: '🏆', title: 'Calidad Certificada', desc: 'Todos nuestros filtros cumplen estándares internacionales ISO y OEM.' },
              { icon: '🚚', title: 'Distribución Nacional', desc: 'Cobertura en Lima, Arequipa, Trujillo y principales ciudades del Perú.' },
              { icon: '💼', title: 'Acceso B2B', desc: 'Precios especiales para talleres, flotas y distribuidores mayoristas.' },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="card-premium text-center space-y-4 py-8">
                <div className="text-4xl">{icon}</div>
                <h3 className="text-white font-black text-lg">{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--brand-text-muted)' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
