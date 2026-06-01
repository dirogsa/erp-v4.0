import { Inter } from 'next/font/google';
import Link from 'next/link';
import './globals.css';
import { HomeIcon, MagnifyingGlassIcon, ShoppingCartIcon, ClipboardDocumentListIcon, UserIcon } from '@heroicons/react/24/outline';
import VersionWatcher from '@/components/VersionWatcher';

const inter = Inter({ subsets: ['latin'], weight: ['400','500','600','700','800','900'] });

// SEO Metadata Perfecta
export const metadata = {
  metadataBase: new URL('https://www.dirogsa.com'),
  title: {
    default: 'DIROGSA | Filtros y Repuestos Automotrices en Perú',
    template: '%s | DIROGSA Filtros',
  },
  description: 'Importador y distribuidor oficial de filtros automotrices en Perú. Catálogo completo de filtros importados WIX, MANN-FILTER, AZUMI y TOTACHI.',
  keywords: ['filtros importados peru', 'filtros wix peru', 'filtros mann peru', 'filtros azumi', 'filtros totachi', 'filtros automotrices', 'repuestos peru', 'dirogsa', 'filtros aceite'],
  openGraph: {
    siteName: 'DIROGSA Filtros',
    locale: 'es_PE',
    type: 'website',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className="scroll-smooth" data-scroll-behavior="smooth">
      {/* 
        El padding inferior (pb-20) evita que el BottomNav tape el contenido.
        Se aplica a todas las pantallas ya que el BottomNav ahora es global.
      */}
      <body className={`${inter.className} bg-[#0D0E12] text-white min-h-screen flex flex-col overflow-x-hidden pb-20`}>
        <VersionWatcher />
        
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
              <Link href="/catalogo" className="text-sm font-bold text-white/70 hover:text-brand-primary transition-colors">Catálogo</Link>
              <Link href="/marca" className="text-sm font-bold text-white/70 hover:text-brand-primary transition-colors">Marcas</Link>
              <div className="h-6 w-px bg-white/10" />
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
          <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
              {/* Branding */}
              <div className="md:col-span-2">
                <span className="text-2xl font-black text-white">DIROGSA</span>
                <p className="text-sm text-brand-text-dim mt-2 max-w-md">Soluciones integrales de filtración para el sector automotriz e industrial en todo el Perú.</p>
              </div>
              {/* Marcas Hub Links */}
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-3">Marcas Importadas</h3>
                <ul className="space-y-2">
                  <li><Link href="/marca/wix" className="text-sm text-brand-text-dim hover:text-white transition-colors">WIX Filters</Link></li>
                  <li><Link href="/marca/mann" className="text-sm text-brand-text-dim hover:text-white transition-colors">MANN-FILTER</Link></li>
                  <li><Link href="/marca/azumi" className="text-sm text-brand-text-dim hover:text-white transition-colors">AZUMI</Link></li>
                  <li><Link href="/marca/totachi" className="text-sm text-brand-text-dim hover:text-white transition-colors">TOTACHI</Link></li>
                </ul>
              </div>
              {/* Category Hub Links */}
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-3">Por Tipo de Filtro</h3>
                <ul className="space-y-2">
                  <li><Link href="/catalogo/aceite" className="text-sm text-brand-text-dim hover:text-white transition-colors">Filtros de Aceite</Link></li>
                  <li><Link href="/catalogo/aire" className="text-sm text-brand-text-dim hover:text-white transition-colors">Filtros de Aire</Link></li>
                  <li><Link href="/catalogo/combustible" className="text-sm text-brand-text-dim hover:text-white transition-colors">Filtros de Combustible</Link></li>
                  <li><Link href="/catalogo/cabina" className="text-sm text-brand-text-dim hover:text-white transition-colors">Filtros de Cabina</Link></li>
                  <li><Link href="/catalogo/hidraulico" className="text-sm text-brand-text-dim hover:text-white transition-colors">Filtros Hidráulicos</Link></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-white/5 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-xs text-white/20">&copy; {new Date().getFullYear()} DIROGSA. Todos los derechos reservados.</p>
              <div className="flex gap-6 text-sm text-brand-text-dim">
                <Link href="/privacidad" prefetch={false} className="hover:text-white text-xs">Políticas de Privacidad</Link>
                <Link href="/terminos" prefetch={false} className="hover:text-white text-xs">Términos y Condiciones</Link>
              </div>
            </div>
          </div>
        </footer>

        {/* ── BOTÓN FLOTANTE DE WHATSAPP PREMIUM CON NÚMERO VISIBLE ── */}
        <a
          href="https://wa.me/51991717240?text=Hola%20DIROGSA,%20deseo%20consultar%20por%20un%20repuesto."
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-24 right-4 md:right-8 z-[60] flex items-center gap-3.5 px-4 py-2.5 rounded-full bg-[#0D0E12]/95 border border-[#25D366]/40 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.5),0_0_20px_rgba(37,211,102,0.15)] hover:border-[#25D366]/80 transition-all duration-300 hover:scale-105 active:scale-95 group"
          aria-label="Contactar por WhatsApp 991717240"
        >
          {/* Onda expansiva de atención */}
          <span className="absolute left-4 inline-flex h-10 w-10 rounded-full bg-[#25D366]/20 animate-ping opacity-75" />
          
          {/* Icono circular de WhatsApp */}
          <div className="relative h-10 w-10 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-[0_3px_12px_rgba(37,211,102,0.4)]">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.73-1.45L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.968C16.528 1.971 14.076 1.97 11.98 1.97c-5.433 0-9.863 4.374-9.867 9.806-.001 1.73.457 3.41 1.32 4.947l-1.047 3.826 3.925-1.029zm13.111-7.234c-.29-.145-1.716-.847-1.978-.942-.262-.096-.453-.145-.642.145-.19.29-.738.942-.905 1.135-.167.19-.335.21-.625.065-2.9-.145-4.814-1.924-5.59-3.267-.168-.29-.018-.447.127-.592.13-.13.29-.339.436-.508.145-.17.193-.29.29-.483.097-.19.048-.363-.024-.508-.073-.145-.642-1.547-.88-2.122-.232-.558-.468-.483-.642-.492-.166-.008-.356-.01-.546-.01-.19 0-.501.07-.763.356-.262.29-1 .977-1 2.382s1.02 2.762 1.164 2.956c.145.195 2.007 3.064 4.862 4.297.68.293 1.21.468 1.623.599.683.217 1.305.186 1.797.112.548-.08 1.716-.702 1.957-1.378.24-.678.24-1.257.17-1.378-.073-.121-.262-.19-.553-.335z"/>
            </svg>
          </div>
          
          {/* Contenedor de Texto / Número */}
          <div className="flex flex-col pr-1.5 select-none">
            <span className="text-[9px] font-black uppercase tracking-widest text-[#25D366] leading-none">WhatsApp</span>
            <span className="text-[13px] md:text-sm font-black text-white tracking-wide leading-none mt-1">991 717 240</span>
          </div>
        </a>

        {/* ── BOTTOM NAV MÓVIL Y DESKTOP ── */}
        <nav className="fixed bottom-0 w-full bg-[#0D0E12]/95 backdrop-blur-xl border-t border-white/10 px-6 py-2 flex items-center justify-between md:justify-center md:gap-32 z-50 pb-safe" aria-label="Navegación principal inferior">
          <Link href="/" className="flex flex-col items-center justify-center gap-1 w-14 h-12 group" aria-label="Inicio">
            <span className="sr-only">Inicio</span>
            <HomeIcon className="h-6 w-6 text-brand-primary transition-transform group-active:scale-90" />
            <div className="h-1 w-1 rounded-full bg-brand-primary shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
          </Link>
          
          <Link href="/buscar" className="flex flex-col items-center justify-center gap-1 w-14 h-12 text-white/40 active:text-white transition-colors group" aria-label="Buscar">
            <span className="sr-only">Buscar productos</span>
            <MagnifyingGlassIcon className="h-6 w-6 transition-transform group-active:scale-90" />
          </Link>
          
          <Link href="/carrito" className="flex flex-col items-center justify-center gap-1 w-14 h-12 text-white/40 active:text-white transition-colors group" aria-label="Carrito">
            <span className="sr-only">Mi carrito de compras</span>
            <ShoppingCartIcon className="h-6 w-6 transition-transform group-active:scale-90" />
          </Link>
          
          <Link href="/pedidos" className="flex flex-col items-center justify-center gap-1 w-14 h-12 text-white/40 active:text-white transition-colors group" aria-label="Pedidos">
            <span className="sr-only">Mis pedidos e historial</span>
            <ClipboardDocumentListIcon className="h-6 w-6 transition-transform group-active:scale-90" />
          </Link>
        </nav>

      </body>
    </html>
  );
}
