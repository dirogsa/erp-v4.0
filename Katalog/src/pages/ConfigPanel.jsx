import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCatalogStore } from '../store';
import { Settings, Printer, BookOpen } from 'lucide-react';
import './ConfigPanel.css';

export default function ConfigPanel() {
  const { config, setConfig, toggleField } = useCatalogStore();
  const navigate = useNavigate();
  const [availableBrands, setAvailableBrands] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('http://localhost:8000/katalog/brands').then(res => res.json()),
      fetch('http://localhost:8000/katalog/categories').then(res => res.json())
    ]).then(([brandsData, catsData]) => {
      setAvailableBrands(brandsData);
      setAvailableCategories(catsData);
      setLoading(false);
    }).catch(err => {
      console.error("Error fetching data:", err);
      setLoading(false);
    });
  }, []);

  const handleBrandToggle = (brand) => {
    const brands = config.selectedBrands.includes(brand)
      ? config.selectedBrands.filter(b => b !== brand)
      : [...config.selectedBrands, brand];
    setConfig({ selectedBrands: brands });
  };

  const handleCategoryToggle = (catId) => {
    const cats = config.selectedCategories.includes(catId)
      ? config.selectedCategories.filter(id => id !== catId)
      : [...config.selectedCategories, catId];
    setConfig({ selectedCategories: cats });
  };

  const handlePrint = () => {
    navigate('/print');
  };

  // Agrupación de categorías
  const groupedCategories = {};
  const rootCategories = [];

  availableCategories.forEach(cat => {
    if (cat.parent_id) {
      if (!groupedCategories[cat.parent_id]) groupedCategories[cat.parent_id] = [];
      groupedCategories[cat.parent_id].push(cat);
    } else {
      rootCategories.push(cat);
    }
  });

  return (
    <div className="config-container">
      <header className="config-header">
        <BookOpen className="icon-large" />
        <h1>Generador de Catálogo Premium</h1>
        <p>Configura los parámetros para la impresión en A4</p>
      </header>

      <main className="config-grid">
        <section className="config-card">
          <h2><Settings className="icon" /> Público Objetivo (Tema Visual)</h2>
          <div className="toggle-group">
            <button 
              className={config.audience === 'client' ? 'active' : ''}
              onClick={() => setConfig({ audience: 'client' })}
            >
              Cliente (Premium Dark Mode)
            </button>
            <button 
              className={config.audience === 'seller' ? 'active' : ''}
              onClick={() => setConfig({ audience: 'seller' })}
            >
              Vendedor (Ahorro de Tinta)
            </button>
          </div>
        </section>

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

        <section className="config-card">
          <h2>Marcas a Incluir</h2>
          <div className="brands-grid">
            {loading ? (
              <p>Cargando datos...</p>
            ) : availableBrands.length === 0 ? (
              <p>No se encontraron marcas en la BD.</p>
            ) : (
              availableBrands.map(brand => (
                <label key={brand} className="brand-label">
                  <input 
                    type="checkbox" 
                    checked={config.selectedBrands.includes(brand)}
                    onChange={() => handleBrandToggle(brand)}
                  />
                  {brand}
                </label>
              ))
            )}
          </div>
        </section>

        <section className="config-card">
          <h2>Tipos de Producto (Categorías)</h2>
          <div className="categories-grouped-grid">
            {loading ? (
              <p>Cargando datos...</p>
            ) : rootCategories.length === 0 ? (
              <p>No se encontraron categorías en la BD.</p>
            ) : (
              rootCategories.map(rootCat => {
                const subCats = groupedCategories[rootCat.id] || [];
                const hasSubCats = subCats.length > 0;
                
                return (
                  <div key={rootCat.id} className="category-group">
                    {hasSubCats ? (
                      <>
                        <h3 className="category-section-title">{rootCat.name}</h3>
                        <div className="subcats-grid">
                          {subCats.map(subCat => (
                            <label key={subCat.id} className="brand-label">
                              <input 
                                type="checkbox" 
                                checked={config.selectedCategories.includes(subCat.id)}
                                onChange={() => handleCategoryToggle(subCat.id)}
                              />
                              {subCat.name}
                            </label>
                          ))}
                        </div>
                      </>
                    ) : (
                      <label className="brand-label root-only-label">
                        <input 
                          type="checkbox" 
                          checked={config.selectedCategories.includes(rootCat.id)}
                          onChange={() => handleCategoryToggle(rootCat.id)}
                        />
                        {rootCat.name}
                      </label>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </section>

        <section className="config-card">
          <h2>Campos a Mostrar</h2>
          <div className="fields-grid">
            {Object.entries(config.displayFields).map(([field, isVisible]) => (
              <label key={field} className="switch-label">
                <input 
                  type="checkbox" 
                  checked={isVisible}
                  onChange={() => toggleField(field)}
                />
                <span className="slider"></span>
                {field.charAt(0).toUpperCase() + field.slice(1)}
              </label>
            ))}
          </div>
        </section>
      </main>

      <footer className="config-footer">
        <button 
          className="btn-primary" 
          onClick={handlePrint}
          disabled={config.selectedBrands.length === 0}
        >
          <Printer className="icon" /> Generar Catálogo y Previsualizar
        </button>
      </footer>
    </div>
  );
}
