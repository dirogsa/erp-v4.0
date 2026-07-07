import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCatalogStore } from '../store';
import { Settings, Printer, BookOpen, ClipboardPaste, X } from 'lucide-react';
import SkuValidatorModal from './SkuValidatorModal';
import './ConfigPanel.css';

const FIELD_LABELS = {
  image: 'Imagen',
  reference: 'Referencia (Equivalencias)',
  dimensions: 'Medidas',
  applications: 'Aplicaciones',
  price: 'Precio',
  packaging: 'Empaque (Uds. x Caja)',
};

export default function ConfigPanel() {
  const { config, setConfig, toggleField, clearSkuMode, toggleBrandFilter, toggleCategoryFilter, setAllBrandsFilter } = useCatalogStore();
  const navigate = useNavigate();
  const [filterTree, setFilterTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSkuModal, setShowSkuModal] = useState(false);

  useEffect(() => {
    fetch('http://localhost:8000/katalog/filter-tree')
      .then(res => res.json())
      .then(data => {
        setFilterTree(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching filter tree:", err);
        setLoading(false);
      });
  }, []);

  const handleBrandToggle = (brand, allCategoryIds) => {
    toggleBrandFilter(brand, allCategoryIds);
  };

  const handleCategoryToggle = (brand, catId) => {
    toggleCategoryFilter(brand, catId);
  };

  const handleSelectAllBrands = () => {
    // Si todas están seleccionadas, deseleccionamos. Si no, seleccionamos todas.
    const allSelected = filterTree.length > 0 && filterTree.every(node => config.brandCategoryFilters && config.brandCategoryFilters[node.brand] !== undefined);
    setAllBrandsFilter(filterTree, !allSelected);
  };



  const handlePrint = () => navigate('/print');



  // El botón de generar se habilita siempre en modo filtros (si está vacío trae todo),
  // y en modo SKU requiere SKUs válidos.
  const canGenerate = config.inputMode === 'skus'
    ? config.validatedSkus.length > 0
    : true;

  return (
    <div className="config-container">
      <header className="config-header">
        <BookOpen className="icon-large" />
        <h1>Generador de Catálogo Premium</h1>
        <p>Configura los parámetros para la impresión en A4</p>
      </header>

      <main className="config-grid">

        {/* --- Tema Visual --- */}
        <section className="config-card">
          <h2><Settings className="icon" /> Público Objetivo</h2>
          <div className="toggle-group">
            <button
              className={config.audience === 'client' ? 'active' : ''}
              onClick={() => setConfig({ audience: 'client' })}
            >
              Cliente (Dark Mode)
            </button>
            <button
              className={config.audience === 'seller' ? 'active' : ''}
              onClick={() => setConfig({ audience: 'seller' })}
            >
              Vendedor (Ahorro de Tinta)
            </button>
          </div>
        </section>

        {/* --- Orientación --- */}
        <section className="config-card">
          <h2>Orientación de Página</h2>
          <div className="toggle-group">
            <button
              className={config.orientation === 'portrait' ? 'active' : ''}
              onClick={() => setConfig({ orientation: 'portrait' })}
            >
              A4 Vertical (Portrait)
            </button>
            <button
              className={config.orientation === 'landscape' ? 'active' : ''}
              onClick={() => setConfig({ orientation: 'landscape' })}
            >
              A4 Horizontal (Landscape)
            </button>
          </div>
        </section>

        {/* --- Filtros de Catálogo Jerárquicos --- */}
        {config.inputMode === 'filters' && (
          <section className="config-card config-card-full">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2><BookOpen className="icon" /> Marcas del Producto</h2>
                <p style={{ color: '#94a3b8', margin: 0 }}>
                  Selecciona la marca y los tipos de producto específicos que deseas incluir en tu catálogo.
                </p>
              </div>
              <button 
                onClick={handleSelectAllBrands}
                style={{
                  background: 'transparent',
                  border: '1px solid #475569',
                  color: '#cbd5e1',
                  padding: '0.6rem 1.2rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.9rem',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = '#334155'; e.currentTarget.style.color = '#fff'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#cbd5e1'; }}
              >
                <ClipboardPaste size={16} />
                {filterTree.length > 0 && filterTree.every(node => config.brandCategoryFilters && config.brandCategoryFilters[node.brand] !== undefined) 
                  ? 'Limpiar Selección' 
                  : 'Seleccionar Todo'}
              </button>
            </div>
            
            <div className="filter-tree-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2rem' }}>
              {loading ? (
                <p>Cargando marcas desde la base de datos...</p>
              ) : filterTree.length === 0 ? (
                <p>No se encontraron marcas con productos.</p>
              ) : (
                filterTree.map(node => {
                  const isBrandSelected = config.brandCategoryFilters && config.brandCategoryFilters[node.brand] !== undefined;
                  const selectedBrandCategories = isBrandSelected ? config.brandCategoryFilters[node.brand] : [];
                  const allCategoryIds = node.categories.map(c => c.id);

                  return (
                  <div key={node.brand} className="brand-group" style={{ 
                    background: isBrandSelected ? 'rgba(99, 102, 241, 0.05)' : '#0f172a', 
                    padding: '1.5rem', 
                    borderRadius: '12px', 
                    border: isBrandSelected ? '1px solid #6366f1' : '1px solid #1e293b',
                    transition: 'all 0.3s'
                  }}>
                    <h3 style={{ 
                      color: isBrandSelected ? '#818cf8' : '#e2e8f0', 
                      marginBottom: '1rem', 
                      borderBottom: '1px solid #334155', 
                      paddingBottom: '0.8rem' 
                    }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={isBrandSelected}
                          onChange={() => handleBrandToggle(node.brand, allCategoryIds)}
                          style={{ transform: 'scale(1.2)' }}
                        />
                        {node.brand}
                      </label>
                    </h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', paddingLeft: '0.5rem' }}>
                      {node.categories.map(cat => (
                        <label key={cat.id} className="brand-label" style={{ 
                          display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer',
                          color: selectedBrandCategories.includes(cat.id) ? '#fff' : '#94a3b8',
                          opacity: isBrandSelected ? 1 : 0.6
                        }}>
                          <input
                            type="checkbox"
                            checked={selectedBrandCategories.includes(cat.id)}
                            onChange={() => handleCategoryToggle(node.brand, cat.id)}
                            disabled={!isBrandSelected}
                          />
                          {cat.name}
                        </label>
                      ))}
                    </div>
                  </div>
                  );
                })
              )}
            </div>
          </section>
        )}

        {/* --- Campos a Mostrar --- */}
        <section className="config-card">
          <h2>Campos a Mostrar</h2>
          <div className="fields-grid">
            {Object.entries(config.displayFields).map(([field, isVisible]) => (
              <label key={field} className="brand-label">
                <input
                  type="checkbox"
                  checked={isVisible}
                  onChange={() => toggleField(field)}
                />
                {FIELD_LABELS[field] || field}
              </label>
            ))}
          </div>
        </section>

      </main>

      <footer className="config-footer">
        <button
          className="btn-primary"
          onClick={handlePrint}
          disabled={!canGenerate}
        >
          <Printer className="icon" /> Generar Catálogo y Previsualizar
        </button>
      </footer>

      {/* Modal de validación de SKUs (montado condicionalmente) */}
      {showSkuModal && (
        <SkuValidatorModal onClose={() => setShowSkuModal(false)} />
      )}
    </div>
  );
}
