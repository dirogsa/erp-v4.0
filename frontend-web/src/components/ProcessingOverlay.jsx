export default function ProcessingOverlay({ message = "Procesando..." }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0A0A0B]/80 backdrop-blur-md pointer-events-auto">
      <div className="bg-[#141518] border border-white/10 rounded-3xl p-8 flex flex-col items-center shadow-[0_0_50px_rgba(0,0,0,0.5)] max-w-sm w-full mx-4 transition-all animate-in fade-in zoom-in duration-300">
        <div className="relative w-16 h-16 mb-6">
          <div className="absolute inset-0 rounded-full border-t-2 border-b-2 border-brand-primary animate-spin" style={{ animationDuration: '1.5s' }}></div>
          <div className="absolute inset-2 rounded-full border-l-2 border-r-2 border-white/20 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '2s' }}></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-6 h-6 text-brand-primary animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        </div>
        <h3 className="text-white font-black text-lg text-center uppercase tracking-wider mb-2">
          {message}
        </h3>
        <p className="text-brand-text-dim text-xs text-center font-medium">
          Asegurando el rendimiento de la base de datos...
        </p>
      </div>
    </div>
  );
}
