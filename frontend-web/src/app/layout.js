import { Inter } from 'next/font/google';
import Link from 'next/link';
import './globals.css';
import { HomeIcon, MagnifyingGlassIcon, ShoppingCartIcon, ClipboardDocumentListIcon, UserIcon } from '@heroicons/react/24/outline';

const inter = Inter({ subsets: ['latin'], weight: ['400','500','600','700','800','900'] });

// SEO Metadata Perfecta
export const metadata = {
  metadataBase: new URL('https://dirogsa.com'),
  title: {
    default: 'DIROGSA | Filtros y Repuestos Automotrices en Perú',
    template: '%s | DIROGSA Filtros',
  },
  description: 'Importador y distribuidor oficial de filtros automotrices en Perú. Catálogo completo de filtros de aceite, aire, combustible y cabina.',
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
    <html lang="es" className="scroll-smooth">
      {/* 
        El padding inferior (pb-20) evita que el BottomNav tape el contenido.
        Se aplica a todas las pantallas ya que el BottomNav ahora es global.
      */}
      <body className={`${inter.className} bg-[#0D0E12] text-white min-h-screen flex flex-col overflow-x-hidden pb-20`}>
        
        {/* ── HEADER RESPONSIVO ── */}
        <header className="sticky top-0 z-50 bg-[#0D0E12]/90 backdrop-blur-md border-b border-white/5">
          <div className="max-w-7xl mx-auto px-4 py-3 md:py-4 flex items-center justify-between">
            
            {/* Logo y Branding */}
            <Link href="/" className="flex items-center gap-3 group" aria-label="Inicio DIROGSA">
              <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl flex items-center justify-center border border-white/10 transition-colors group-hover:border-brand-primary/50" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <svg className="h-6 w-6 md:h-7 md:w-7 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
              </div>
              
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl md:text-2xl font-black tracking-tighter text-white leading-none">DIROGSA</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/20 bg-white/5 text-white/70 flex items-center gap-1">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    V1.0.0
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-brand-primary animate-pulse hidden md:block" />
                  <span className="text-[8px] md:text-[10px] font-black uppercase tracking-wider text-brand-primary">
                    Importador y Distribuidor Oficial
                  </span>
                </div>
              </div>
            </Link>

            {/* Navegación Desktop (Oculta en móvil) */}
            <nav className="hidden md:flex items-center gap-6 lg:gap-8" aria-label="Navegación principal">
              <Link href="/catalogo" className="text-sm font-bold text-white/70 hover:text-brand-primary transition-colors">Catálogo completo</Link>
              <div className="h-6 w-px bg-white/10" /> {/* Divisor */}
              
              <Link href="/login" className="flex items-center gap-2 px-4 py-2 rounded-xl border border-brand-primary/30 bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20 transition-colors" aria-label="Acceso B2B">
                <UserIcon className="h-5 w-5" />
                <span className="text-sm font-bold">Portal B2B</span>
              </Link>
            </nav>

            {/* Acciones Rápidas Móvil (Visibles solo en móvil) */}
            <div className="flex md:hidden items-center gap-2">
              <Link href="/login" className="h-10 w-10 rounded-full bg-white/5 border border-brand-primary/30 flex items-center justify-center text-brand-primary active:bg-brand-primary/10 transition-colors" aria-label="Portal B2B">
                <UserIcon className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </header>

        {/* ── CONTENIDO PRINCIPAL ── */}
        <main className="flex-1 w-full relative z-10">
          {children}
        </main>

        {/* ── FOOTER DESKTOP ── */}
        <footer className="hidden md:block bg-[#141518] border-t border-white/5 mt-auto">
          <div className="max-w-7xl mx-auto px-4 py-12 flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <span className="text-2xl font-black text-white">DIROGSA</span>
              <p className="text-sm text-brand-text-dim mt-2 max-w-md">Soluciones integrales de filtración para el sector automotriz e industrial en todo el Perú.</p>
            </div>
            <div className="flex gap-6 text-sm text-brand-text-dim">
              <Link href="/privacidad" className="hover:text-white">Políticas de Privacidad</Link>
              <Link href="/terminos" className="hover:text-white">Términos y Condiciones</Link>
            </div>
          </div>
        </footer>

        {/* ── BOTTOM NAV MÓVIL Y DESKTOP ── */}
        <nav className="fixed bottom-0 w-full bg-[#0D0E12]/95 backdrop-blur-xl border-t border-white/10 px-6 py-2 flex items-center justify-between md:justify-center md:gap-32 z-50 pb-safe" aria-label="Navegación principal inferior">
          <Link href="/" className="flex flex-col items-center justify-center gap-1 w-14 h-12 group" aria-label="Inicio">
            <HomeIcon className="h-6 w-6 text-brand-primary transition-transform group-active:scale-90" />
            <div className="h-1 w-1 rounded-full bg-brand-primary shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
          </Link>
          
          <Link href="/buscar" className="flex flex-col items-center justify-center gap-1 w-14 h-12 text-white/40 active:text-white transition-colors group" aria-label="Buscar">
            <MagnifyingGlassIcon className="h-6 w-6 transition-transform group-active:scale-90" />
          </Link>
          
          <Link href="/carrito" className="flex flex-col items-center justify-center gap-1 w-14 h-12 text-white/40 active:text-white transition-colors group" aria-label="Carrito">
            <ShoppingCartIcon className="h-6 w-6 transition-transform group-active:scale-90" />
          </Link>
          
          <Link href="/pedidos" className="flex flex-col items-center justify-center gap-1 w-14 h-12 text-white/40 active:text-white transition-colors group" aria-label="Pedidos">
            <ClipboardDocumentListIcon className="h-6 w-6 transition-transform group-active:scale-90" />
          </Link>
        </nav>

      </body>
    </html>
  );
}
