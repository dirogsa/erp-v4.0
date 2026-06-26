import { useEffect, useState } from 'react';
import { useCatalogStore } from '../store';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import './PrintEngine.css';

const FALLBACK_IMAGE = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNTAiIGhlaWdodD0iMTUwIiB2aWV3Qm94PSIwIDAgMTUwIDE1MCI+PHJlY3Qgd2lkdGg9IjE1MCIgaGVpZ2h0PSIxNTAiIGZpbGw9IiNmMWY1ZjkiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzk0YTNiOCIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiPlNpbiBJbWFnZW48L3RleHQ+PC9zdmc+";

export default function PrintEngine() {
  const { config } = useCatalogStore();
  const navigate = useNavigate();
  const [hierarchy, setHierarchy] = useState([]);
  const [loading, setLoading] = useState("Iniciando...");
  const [error, setError] = useState(null);

  // --- Formatters de Libro de Texto para A4 ---
  const formatApplications = (applications) => {
    if (!applications || !Array.isArray(applications) || applications.length === 0) return "No especificado";
    
    // 1. Agrupar modelos únicos por marca (make)
    const grouped = {};
    applications.forEach(app => {
      if (!app) return;
      const make = (app.make || 'Otros').trim();
      if (!grouped[make]) grouped[make] = new Set();
      if (app.model) grouped[make].add(app.model.trim());
    });

    // 2. Construir el texto por marca: "TOYOTA (Yaris, Corolla)"
    const makeStrings = Object.entries(grouped).map(([make, modelsSet]) => {
      const modelsArray = Array.from(modelsSet);
      if (modelsArray.length === 0) return make;
      
      // Limitar a 3 modelos por marca para que sea legible en la tarjeta
      const displayedModels = modelsArray.slice(0, 3);
      let modelsText = displayedModels.join(', ');
      if (modelsArray.length > 3) {
        modelsText += ` +${modelsArray.length - 3}`;
      }
      return `${make} (${modelsText})`;
    });

    // 3. Limitar según si hay espacio (equivalencias activas o no)
    const maxMakes = config.displayFields.reference ? 4 : 8;
    const displayedMakes = makeStrings.slice(0, maxMakes);
    let result = displayedMakes.join(' | ');
    
    if (makeStrings.length > maxMakes) {
      result += ` ... (+${makeStrings.length - maxMakes} marcas)`;
    }
    
    return result;
  };

  const formatSpecs = (specs) => {
    if (!specs || !Array.isArray(specs) || specs.length === 0) return "N/A";
    
    const dimensionMap = {
      "altura": "H",
      "height": "H",
      "diámetro exterior": "OD",
      "diametro exterior": "OD",
      "outer diameter": "OD",
      "diámetro interior 1": "A",
      "diametro interior 1": "A",
      "diámetro interior 2": "B",
      "diametro interior 2": "B",
      "diámetro interior": "A",
      "diametro interior": "A",
      "rosca": "F",
      "largo": "L",
      "ancho": "W"
    };

    return specs.map(s => {
      if (!s || !s.label) return null;
      // Intentar mapear la etiqueta a su equivalente en letra
      const rawLabel = s.label.toLowerCase().trim();
      // Si existe en el mapa, usamos la letra. Si no, usamos la etiqueta original pero asegurando primera en mayúscula.
      const displayLabel = dimensionMap[rawLabel] || s.label;

      const measure = (s.measure_type && s.measure_type !== 'other' && !s.measure_type.includes('OTHER')) 
        ? s.measure_type.replace('MeasureType.', '').toLowerCase() 
        : '';
      return `${displayLabel}: ${s.value || ''}${measure}`;
    }).filter(Boolean).join(' • ');
  };


  // Redirigir si no hay datos seleccionados en ninguno de los dos modos
  useEffect(() => {
    const isSKUMode = config.inputMode === 'skus';
    const hasData = isSKUMode
      ? config.validatedSkus.length > 0
      : true; // En modo filtros, vacío significa traer todo

    if (!hasData) {
      navigate('/');
      return;
    }

    const generateBody = config.inputMode === 'skus'
      ? { skus: config.validatedSkus }
      : { 
          strategy: config.catalogStrategy,
          categories: config.catalogStrategy === 'by_category' ? config.selectedCategories : [],
          vehicle_makes: config.catalogStrategy === 'by_vehicle' ? config.selectedVehicleMakes : []
        };

    Promise.all([
      fetch('http://localhost:8000/katalog/categories').then(r => r.json()),
      fetch('http://localhost:8000/katalog/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(generateBody)
      }).then(r => r.json())
    ])
      .then(([cats, prods]) => {
        setLoading("Procesando datos del servidor...");

        const safeCats = Array.isArray(cats) ? cats : [];
        const safeProds = Array.isArray(prods) ? prods : [];

        // Mapear categorías para acceso rápido
        const cDict = {};
        safeCats.forEach(c => { cDict[c.id] = c; });

        const newHierarchy = [];

        // 0. Portada Maestra DIROGSA — siempre la primera página
        newHierarchy.push({ type: 'master_cover' });
        
        if (config.catalogStrategy === 'by_vehicle') {
          // --- MODO: AGRUPAR POR VEHÍCULO ---
          const byVehicleMake = {};
          
          safeProds.forEach(p => {
             if (!p.applications || p.applications.length === 0) return;
             
             const uniqueMakes = new Set();
             p.applications.forEach(app => {
                 if (app.make) uniqueMakes.add(app.make.trim().toUpperCase());
             });

             uniqueMakes.forEach(make => {
                 if (config.selectedVehicleMakes.length > 0 && 
                     !config.selectedVehicleMakes.map(m=>m.toUpperCase()).includes(make)) {
                    return;
                 }
                 if (!byVehicleMake[make]) byVehicleMake[make] = [];
                 byVehicleMake[make].push({...p, unique_key: `${p._id || p.sku}_${make}`}); 
             });
          });

          const sortedMakes = Object.keys(byVehicleMake).sort();
          sortedMakes.forEach(make => {
             newHierarchy.push({ type: 'brand_cover', brand: make });
             
             const byCategory = {};
             byVehicleMake[make].forEach(p => {
                const catId = p.category_id || 'uncategorized';
                if (!byCategory[catId]) byCategory[catId] = [];
                byCategory[catId].push(p);
             });

             const sortedCatIds = Object.keys(byCategory).sort();
             sortedCatIds.forEach(catId => {
                const catInfo = cDict[catId] || { name: catId === 'uncategorized' ? 'Otros Productos' : catId, description: '' };
                newHierarchy.push({ type: 'category_cover', brand: make, category: catInfo });

                const catProducts = byCategory[catId];
                const productsPerPage = 8;
                for (let i = 0; i < catProducts.length; i += productsPerPage) {
                  newHierarchy.push({ 
                    type: 'product_page', 
                    products: catProducts.slice(i, i + productsPerPage),
                    brand: make,
                    categoryName: catInfo.name,
                    pageIndex: Math.floor(i / productsPerPage) + 1
                  });
                }
             });
          });

        } else {
          // --- MODO ACTUAL: AGRUPAR POR REPUESTO (MARCA DEL PRODUCTO) ---
          const byBrand = {};
          safeProds.forEach(p => {
            const brandName = p.brand || 'Otras Marcas';
            if (!byBrand[brandName]) byBrand[brandName] = [];
            p.unique_key = p._id || p.sku;
            byBrand[brandName].push(p);
          });

          const sortedBrands = Object.keys(byBrand).sort();

          sortedBrands.forEach(brand => {
            newHierarchy.push({ type: 'brand_cover', brand });

            const brandProducts = byBrand[brand];
            
            const byCategory = {};
            brandProducts.forEach(p => {
              const catId = p.category_id || 'uncategorized';
              if (!byCategory[catId]) byCategory[catId] = [];
              byCategory[catId].push(p);
            });

            const sortedCatIds = Object.keys(byCategory).sort();

            sortedCatIds.forEach(catId => {
              const catInfo = cDict[catId] || { 
                name: catId === 'uncategorized' ? 'Otros Productos' : catId, 
                description: '' 
              };
              
              newHierarchy.push({ type: 'category_cover', brand, category: catInfo });

              const catProducts = byCategory[catId];
              const productsPerPage = 8;
              for (let i = 0; i < catProducts.length; i += productsPerPage) {
                newHierarchy.push({ 
                  type: 'product_page', 
                  products: catProducts.slice(i, i + productsPerPage),
                  brand,
                  categoryName: catInfo.name,
                  pageIndex: Math.floor(i / productsPerPage) + 1
                });
              }
            });
          });
        }

        setHierarchy(newHierarchy);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching data:", err);
        setError("Error de conexión con el servidor. Verifica tu terminal.");
        setLoading(false);
      });
  }, [config.selectedBrands, navigate]);

  const handlePrint = () => {
    window.print();
  };

  if (error) {
    return (
      <div style={{ color: 'white', padding: '2rem', textAlign: 'center' }}>
        <h2>Error Crítico</h2>
        <p>{error}</p>
        <button className="btn-back" onClick={() => navigate('/')}>Volver</button>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ color: 'white', padding: '10rem', textAlign: 'center', fontFamily: 'Inter' }}>
        <h2 style={{ fontSize: '24pt', color: '#39ff14', marginBottom: '1rem' }}>Generando Catálogo...</h2>
        <p style={{ fontSize: '12pt', color: '#9ca3af' }}>{loading}</p>
        <div style={{ marginTop: '2rem', width: '200px', height: '4px', background: '#333', margin: '2rem auto', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ width: '50%', height: '100%', background: '#ff5e00', animation: 'pulse 1.5s infinite' }}></div>
        </div>
      </div>
    );
  }

  if (hierarchy.length === 0 && !loading) {
    return <div style={{ color: 'white', padding: '2rem', textAlign: 'center' }}>No se encontraron productos para los filtros seleccionados.</div>;
  }

  return (
    <div className={`print-environment ${config.orientation} theme-${config.audience}`}>
      {/* Controles Flotantes - Ocultos en impresión */}
      <div className="no-print floating-controls">
        <button className="btn-back" onClick={() => navigate('/')}>
          <ArrowLeft size={20} /> Volver
        </button>
        <button className="btn-print" onClick={handlePrint}>
          <Printer size={20} /> Imprimir (Ctrl+P)
        </button>
      </div>

      {/* Páginas Jerárquicas A4 */}
      {hierarchy.map((page, index) => {

        if (page.type === 'master_cover') {
          const now = new Date();
          const monthYear = now.toLocaleDateString('es-PE', { month: 'long', year: 'numeric' }).toUpperCase();
          return (
            <div key="master_cover" className="a4-sheet master-cover">
              <div className="master-cover-inner">
                <div className="master-cover-logo">DIROGSA</div>
                <div className="master-cover-divider"></div>
                <div className="master-cover-subtitle">CATÁLOGO DE PRODUCTOS</div>
                <div className="master-cover-date">{monthYear}</div>
              </div>
              <div className="master-cover-footer">
                Distribuidora Rogsa S.A.C. &mdash; Repuestos Automotrices
              </div>
            </div>
          );
        }

        if (page.type === 'brand_cover') {
          return (
            <div key={index} className="a4-sheet brand-cover">
              <h1>{page.brand}</h1>
            </div>
          );
        }

        if (page.type === 'category_cover') {
          return (
            <div key={index} className="a4-sheet category-cover">
              <span className="cover-brand-tag">{page.brand}</span>
              <h2>{page.category?.name || 'Categoría'}</h2>
              {page.category?.description && <p className="cover-desc">{page.category.description}</p>}
            </div>
          );
        }

        if (page.type === 'product_page') {
          return (
            <div key={index} className="a4-sheet">
              <div className="page-header">
                <h1 className="brand-title">
                  {page.brand} <span style={{fontSize: '12pt', color: '#64748b', fontWeight: 'normal'}}>| {page.categoryName}</span>
                </h1>
                <span className="page-number">Pág {page.pageIndex}</span>
              </div>
              
              <div className="products-grid">
                {page.products.map(product => (
                  <div key={product.unique_key} className="product-card">
                    <div className="product-body">
                      <div className="product-row-1">
                        {config.displayFields.image && (
                          <div className="product-image">
                            <img 
                              src={product.image_url || FALLBACK_IMAGE} 
                              alt={`Filtro ${product.sku}`}
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                e.target.onerror = null; // Previene loops infinitos
                                e.target.src = FALLBACK_IMAGE;
                              }}
                            />
                          </div>
                        )}
                        
                        <div className="product-specs-container">
                          <div className="product-id-block">
                            <span className="product-ref">{product.sku}</span>
                            <span className="product-brand-subtitle">{product.brand}</span>
                          </div>

                          {config.displayFields.dimensions && (
                            <div className="product-info-block">
                              <strong>Medidas</strong>
                              <p>{formatSpecs(product.specs)}</p>
                            </div>
                          )}

                          {config.displayFields.price && (
                            <div className="product-price-badge">
                              {product.cost ? `S/ ${(product.cost * 1.3).toFixed(2)}` : "Consultar"}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Fila 2: Aplicaciones */}
                      {config.displayFields.applications && (
                        <div className="product-row-2">
                          <div className={`product-info-block ${!config.displayFields.reference ? 'clamp-expanded' : ''}`}>
                            <strong>Aplicaciones</strong>
                            <p>{formatApplications(product.applications)}</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Fila 3: Equivalencias */}
                      {config.displayFields.reference && Array.isArray(product.equivalences) && product.equivalences.length > 0 && (
                        <div className="product-row-3">
                          <div className="product-info-block">
                            <strong>Equivalencias</strong>
                            <p>
                              {product.equivalences.slice(0, 5).map(e => `${e?.brand || ''} ${e?.code || ''}`).join(', ')}
                              {product.equivalences.length > 5 ? ' ...' : ''}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}
