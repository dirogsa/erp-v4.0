import Link from 'next/link';

export const metadata = {
  title: 'Mis Pedidos | DIROGSA',
  description: 'Historial y estado de tus pedidos B2B.',
  robots: { index: false, follow: false },
};

export default function PedidosPage() {
  return (
    <div className="max-w-4xl mx-auto px-5 py-12 text-center">
      <div className="relative rounded-[2.5rem] p-[2px] overflow-hidden group max-w-lg mx-auto">
        <div className="absolute inset-0 bg-gradient-to-br from-[#F59E0B] via-[#0A0A0B] to-[#38BDF8] opacity-30 group-hover:opacity-50 transition-opacity duration-500" />
        
        <div className="relative h-full w-full rounded-[2.5rem] p-10 flex flex-col items-center justify-center space-y-6 backdrop-blur-xl"
             style={{ background: 'rgba(10,10,11,0.85)' }}>
          
          <div className="h-20 w-20 rounded-full flex items-center justify-center mb-2"
               style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)' }}>
            <svg className="h-10 w-10 text-[#F59E0B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>

          <div>
            <h1 className="text-white font-black text-2xl uppercase tracking-tighter mb-2">Mis Pedidos</h1>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--brand-text-dim)' }}>
              El historial de pedidos e integraciones en tiempo real con el ERP están en desarrollo.
            </p>
          </div>

          <Link href="/"
            className="mt-6 w-full py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all hover:brightness-110 active:scale-95 flex items-center justify-center gap-2"
            style={{ background: 'var(--brand-orange)', color: '#0A0A0B', boxShadow: '0 0 20px rgba(245,158,11,0.2)' }}>
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
