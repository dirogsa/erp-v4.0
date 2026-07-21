import SearchSkeleton from '@/components/SearchSkeleton';

export default function BuscarLoading() {
  return (
    <div className="w-full mx-auto max-w-7xl px-4 md:px-8 py-8 md:py-12 flex flex-col gap-6 md:gap-8">
      {/* Dynamic server wake-up warning box */}
      <div className="w-full p-4 md:p-6 rounded-[2rem] bg-brand-primary/5 border border-brand-primary/10 text-brand-primary text-xs md:text-sm text-center animate-pulse flex flex-col md:flex-row items-center justify-center gap-3">
        <span className="flex items-center gap-2 font-black uppercase tracking-wider">
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Conectando al servidor oficial
        </span>
        <span className="opacity-80 font-medium">
          Estableciendo conexión segura con el núcleo del ERP. Esta sincronización inicial puede tomar algunos segundos. Agradecemos su paciencia; por favor, no recargue la página.
        </span>
      </div>

      {/* Skeletons representational cards */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="h-6 w-48 bg-white/5 rounded-lg animate-pulse" />
          <div className="h-8 w-24 bg-white/5 rounded-lg animate-pulse" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          {/* Exact codes column skeleton */}
          <div className="space-y-4">
            <div className="h-5 w-32 bg-white/5 rounded-lg animate-pulse" />
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-28 w-full rounded-2xl bg-white/5 border border-white/5 animate-pulse" />
              ))}
            </div>
          </div>

          {/* Equivalents column skeleton */}
          <div className="space-y-4">
            <div className="h-5 w-32 bg-white/5 rounded-lg animate-pulse" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-28 w-full rounded-2xl bg-white/5 border border-white/5 animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
