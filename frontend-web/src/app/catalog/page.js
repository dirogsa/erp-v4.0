import Link from 'next/link';
import { ProductService } from '@/services/product.service';
import ImageWithFallback from '@/components/ImageWithFallback';
import LoadMoreProducts from './LoadMoreProducts';
import { toSlug } from '@/lib/slug';

export const metadata = {
  title: 'Catálogo de Repuestos | DIROGSA',
  description: 'Explora nuestro catálogo completo de repuestos y filtros automotrices. Todos los modelos y marcas con calidad certificada.',
  alternates: {
    canonical: 'https://www.dirogsa.com/catalog',
  },
};

export default async function CatalogoPage({ searchParams }) {
  const sp = await searchParams;
  const parentParam = sp.parent || '';


  // ==========================================
  // FASE 1 & 2: EMBUDO DE DESCUBRIMIENTO (DISCOVERY FUNNEL)
  // ==========================================
  const categoriesRaw = await ProductService.getCategories();
  
  let parentCategories = [];
  let childCategories = [];

  const hasParentId = categoriesRaw.some(c => c.parent_id);

  if (hasParentId) {
    parentCategories = categoriesRaw.filter(c => !c.parent_id);
    
    // Por petición del usuario, por defecto mostramos las subcategorías de "Filtros"
    let activeParentName = parentParam;
    if (!activeParentName) {
      // Buscar la categoría padre que sea de Filtros
      const filtrosParent = parentCategories.find(p => p.name.toUpperCase().includes('FILTRO'));
      if (filtrosParent) {
        activeParentName = filtrosParent.name;
      }
    }

    if (activeParentName) {
      const activeParentObj = parentCategories.find(p => p.name === activeParentName);
      const activeParentId = activeParentObj ? activeParentObj._id : null;
      
      childCategories = categoriesRaw.filter(c => 
        c.parent_id === activeParentId || 
        c.parent_id === activeParentName // Por si acado guardaron el string del nombre
      );
    }
  } else {
    // Agrupación por prefijo (Filtros de Aceite -> Filtros)
    const map = new Map();
    categoriesRaw.forEach(c => {
      const name = c.name.toUpperCase();
      const firstWord = name.split(' ')[0]; 
      if (!map.has(firstWord)) map.set(firstWord, []);
      map.get(firstWord).push(c);
    });
    
    parentCategories = Array.from(map.keys()).map(k => ({ name: k, isPrefix: true }));
    
    let activeParentName = parentParam || 'FILTROS'; // Default to Filtros
    childCategories = map.get(activeParentName) || map.get('FILTRO') || [];
  }

  // Fecha actual para la portada
  const currentDate = new Date();
  const currentMonth = currentDate.toLocaleString('es-PE', { month: 'long' });
  const currentYear = currentDate.getFullYear();
  
  // Determinamos el nombre activo para la UI
  const displayParentName = parentParam || (hasParentId ? parentCategories.find(p => p.name.toUpperCase().includes('FILTRO'))?.name : 'FILTROS');

  return (
    <div className="min-h-screen bg-[#0A0A0B] pb-24">
      <section className="relative w-full h-[60vh] flex items-center justify-center overflow-hidden border-b border-white/5">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30"
          style={{ backgroundImage: "url('/api/images/cover.webp')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0B]/40 via-[#0A0A0B]/80 to-[#0A0A0B]" />
        
        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto flex flex-col items-center mt-16">
          <span className="text-brand-primary text-xs md:text-sm font-black tracking-[0.3em] uppercase mb-6 px-4 py-1.5 rounded-full border border-brand-primary/30 bg-brand-primary/10">
            DIROGSA B2B • {currentMonth.toUpperCase()} {currentYear}
          </span>
          <h1 className="text-5xl md:text-8xl font-black text-white uppercase tracking-tighter mb-8 drop-shadow-2xl leading-none">
            Catálogo de {displayParentName || 'Repuestos'}
          </h1>
          <p className="text-base md:text-xl text-brand-text-dim max-w-2xl font-medium leading-relaxed">
            Elige el tipo específico de {displayParentName ? displayParentName.toLowerCase() : 'producto'} que estás buscando para ver el inventario exacto y optimizar tu búsqueda.
          </p>
          {parentParam && (
             <div className="mt-8">
               <Link href="/catalog" className="text-xs text-white/50 hover:text-white uppercase font-bold tracking-widest transition-colors flex items-center gap-2">
                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                 Volver al Inicio
               </Link>
             </div>
          )}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-5 py-24">
          {/* Mostrar Sub-Categorías directamente por solicitud del usuario */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {childCategories.length === 0 ? (
               <div className="col-span-full text-center py-12 text-white/50 font-bold uppercase tracking-widest">
                 No se encontraron subcategorías para {displayParentName}.
               </div>
            ) : (
              childCategories.map((child, idx) => {
                const slug = toSlug(child.name);
                return (
                  <Link 
                    key={idx} 
                    href={`/catalog/${slug}`}
                    className="group bg-[#141518]/80 backdrop-blur-md border border-white/5 rounded-2xl p-8 flex flex-col items-center justify-center hover:bg-brand-primary hover:border-transparent transition-all duration-300 hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:-translate-y-1 text-center"
                  >
                    <h4 className="text-lg font-black text-white uppercase tracking-wider group-hover:text-black transition-colors">
                      {child.name}
                    </h4>
                    <span className="text-[9px] text-brand-text-dim mt-2 tracking-widest uppercase group-hover:text-black/60 transition-colors">
                      Ver Catálogo
                    </span>
                  </Link>
                );
              })
            )}
          </div>
      </section>
    </div>
  );
}
