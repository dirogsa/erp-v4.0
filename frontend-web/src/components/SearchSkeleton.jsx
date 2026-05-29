// Skeleton de carga premium para el SearchModule.
// Reemplaza el texto crudo "Cargando buscador..." durante la hidratación de React.
// No usa JS en cliente — solo CSS animations nativas (sin framer-motion overhead).
export default function SearchSkeleton() {
  return (
    <div className="w-full space-y-4 animate-pulse" aria-hidden="true" aria-label="Cargando buscador de productos">
      {/* Barra de búsqueda simulada */}
      <div className="w-full h-14 rounded-2xl bg-white/5 border border-white/5" />

      {/* Botones de tipo de búsqueda simulados */}
      <div className="flex gap-2">
        {[80, 64, 72].map((w, i) => (
          <div
            key={i}
            className="h-8 rounded-xl bg-white/5 border border-white/5"
            style={{ width: `${w}px` }}
          />
        ))}
      </div>

      {/* Resultados de búsqueda simulados (3 filas) */}
      <div className="space-y-2 pt-1">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="w-full h-12 rounded-xl bg-white/5 border border-white/5"
          />
        ))}
      </div>
    </div>
  );
}
