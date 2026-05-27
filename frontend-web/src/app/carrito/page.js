import Link from 'next/link';

export const metadata = {
  title: 'Mi Carrito | DIROGSA',
  description: 'Revisa y confirma tu pedido de filtros y repuestos.',
  robots: { index: false, follow: false },
};

export default function CarritoPage() {
  return (
    <div className="max-w-4xl mx-auto px-5 py-12 text-center">
      <div className="relative rounded-[2.5rem] p-[2px] overflow-hidden group max-w-lg mx-auto">
        <div className="absolute inset-0 bg-gradient-to-br from-[#10B981] via-[#0A0A0B] to-[#38BDF8] opacity-30 group-hover:opacity-50 transition-opacity duration-500" />
        
        <div className="relative h-full w-full rounded-[2.5rem] p-10 flex flex-col items-center justify-center space-y-6 backdrop-blur-xl"
             style={{ background: 'rgba(10,10,11,0.85)' }}>
          
          <div className="h-20 w-20 rounded-full flex items-center justify-center mb-2"
               style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' }}>
            <svg className="h-10 w-10 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>

          <div>
            <h1 className="text-white font-black text-2xl uppercase tracking-tighter mb-2">Mi Carrito</h1>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--brand-text-dim)' }}>
              El módulo de compras y cotizaciones B2B está actualmente en fase de implementación.
            </p>
          </div>

          <Link href="/"
            className="mt-6 w-full py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all hover:brightness-110 active:scale-95 flex items-center justify-center gap-2"
            style={{ background: 'var(--brand-primary)', color: '#0A0A0B', boxShadow: '0 0 20px rgba(16,185,129,0.2)' }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver al Inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
