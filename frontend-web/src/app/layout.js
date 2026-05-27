import { Inter } from 'next/font/google';
import Link from 'next/link';
import './globals.css';

const inter = Inter({ subsets: ['latin'], weight: ['400','500','600','700','800','900'] });

export const metadata = {
  metadataBase: new URL('https://dirogsa.com'),
  title: {
    default: 'DIROGSA — Filtros y Repuestos Automotrices en Perú',
    template: '%s | DIROGSA Filtros',
  },
  description: 'Importadora y distribuidora oficial de filtros automotrices en Perú. Filtros de aceite, aire, combustible y cabina para toda marca de vehículo. Calidad certificada, envíos a Lima y provincias.',
  keywords: ['filtros automotrices', 'repuestos peru', 'filtros peru', 'dirogsa', 'filtros aceite', 'filtros aire'],
  openGraph: {
    siteName: 'DIROGSA Filtros',
    locale: 'es_PE',
    type: 'website',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-brand-bg text-brand-text min-h-screen overflow-x-hidden`}>

        {/* ── Ambient Background Glows (decorative, pointer-events none) ── */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-[120px]"
               style={{ background: 'rgba(16,185,129,0.04)' }} />
          <div className="absolute top-1/2 -right-20 w-80 h-80 rounded-full blur-[100px]"
               style={{ background: 'rgba(14,165,233,0.04)' }} />
          <div className="absolute bottom-1/4 left-1/3 w-64 h-64 rounded-full blur-[80px]"
               style={{ background: 'rgba(16,185,129,0.03)' }} />
        </div>

        {/* ── HEADER ── */}
        <header className="sticky top-0 z-50 glass-card border-b border-white/5">
          <div className="max-w-7xl mx-auto px-5 py-4 flex justify-between items-center">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative h-9 w-9 flex items-center justify-center flex-shrink-0">
                <div className="absolute inset-0 rounded-xl" style={{ background: 'var(--brand-primary-dim)', border: '1px solid rgba(16,185,129,0.2)' }} />
                <svg className="h-5 w-5 relative z-10" style={{ color: 'var(--brand-primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black tracking-tight text-white leading-none">DIROGSA</span>
                  <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded"
                        style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--brand-primary)', border: '1px solid rgba(16,185,129,0.2)' }}>
                    FILTROS
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                          style={{ background: 'var(--brand-primary)' }} />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5"
                          style={{ background: 'var(--brand-primary)' }} />
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-wider leading-none"
                        style={{ color: 'var(--brand-primary)' }}>
                    Importador y Distribuidor Oficial
                  </span>
                </div>
              </div>
            </Link>

            {/* Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {[
                { href: '/catalogo', label: 'Catálogo' },
                { href: '/buscar', label: 'Buscar Repuesto' },
                { href: '/#nosotros', label: 'Nosotros' },
              ].map(({ href, label }) => (
                <Link key={href} href={href}
                  className="px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:bg-white/5"
                  style={{ color: 'var(--brand-text-muted)' }}>
                  {label}
                </Link>
              ))}
            </nav>

            {/* CTA */}
            <div className="flex items-center gap-2">
              <Link href="/buscar"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black uppercase tracking-wider transition-all hover:brightness-110"
                style={{ background: 'var(--brand-primary)', color: 'var(--brand-bg)' }}>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="hidden sm:inline">Buscar</span>
              </Link>
              <Link href="/login"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
                style={{ border: '1px solid rgba(16,185,129,0.3)', background: 'var(--brand-primary-dim)', color: 'var(--brand-primary)' }}>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="hidden sm:inline">Acceso B2B</span>
              </Link>
            </div>
          </div>
        </header>

        {/* ── MAIN CONTENT ── */}
        <main className="relative z-10 min-h-[calc(100vh-140px)]">
          {children}
        </main>

        {/* ── FOOTER ── */}
        <footer style={{ borderTop: '1px solid var(--brand-border)', background: 'var(--brand-surface)' }}>
          <div className="max-w-7xl mx-auto px-5 py-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              {/* Brand */}
              <div className="space-y-3">
                <h3 className="text-white font-black text-lg">DIROGSA</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--brand-text-muted)' }}>
                  Importadora y distribuidora oficial de filtros automotrices en Perú. 
                  Calidad certificada para toda flota vehicular.
                </p>
              </div>
              {/* Links */}
              <div className="space-y-3">
                <h4 className="text-white font-bold text-sm uppercase tracking-widest">Catálogo</h4>
                <ul className="space-y-2">
                  {['Filtros de Aceite','Filtros de Aire','Filtros de Combustible','Filtros de Cabina'].map(l => (
                    <li key={l}><Link href="/catalogo" className="text-sm transition-colors hover:text-white"
                      style={{ color: 'var(--brand-text-muted)' }}>{l}</Link></li>
                  ))}
                </ul>
              </div>
              {/* Contact */}
              <div className="space-y-3">
                <h4 className="text-white font-bold text-sm uppercase tracking-widest">Contacto</h4>
                <ul className="space-y-2 text-sm" style={{ color: 'var(--brand-text-muted)' }}>
                  <li>Lima, Perú</li>
                  <li>contacto@dirogsa.com</li>
                </ul>
              </div>
            </div>
            <div style={{ borderTop: '1px solid var(--brand-border)' }} className="pt-6 text-center text-sm" style={{ color: 'var(--brand-text-dim)' }}>
              © {new Date().getFullYear()} DIROGSA. Todos los derechos reservados.
            </div>
          </div>
        </footer>

      </body>
    </html>
  );
}
