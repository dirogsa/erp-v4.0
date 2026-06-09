import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCatalogStore } from '../../store/katalogStore';
import { Settings, Printer, BookOpen, ClipboardPaste, X } from 'lucide-react';
import SkuValidatorModal from './SkuValidatorModal';
import './ConfigPanel.css';

const FIELD_LABELS = {
  image: 'Imagen',
  reference: 'Referencia / SKU',
  dimensions: 'Medidas',
  applications: 'Aplicaciones',
  price: 'Precio',
};

export default function ConfigPanel() {
  const { config, setConfig, toggleField, clearSkuMode } = useCatalogStore();
  const navigate = useNavigate();
  const [availableBrands, setAvailableBrands] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSkuModal, setShowSkuModal] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('http://localhost:8000/katalog/brands').then(res => res.json()),
      fetch('http://localhost:8000/katalog/categories').then(res => res.json())
    ]).then(([brandsData, catsData]) => {
      setAvailableBrands(Array.isArray(brandsData) ? brandsData : []);
      setAvailableCategories(Array.isArray(catsData) ? catsData : []);
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

  const handlePrint = () => navigate('/catalog/print');

  // Agrupación de categorías por parent_id
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

  // El botón de generar se habilita si hay marcas seleccionadas O si el modo SKU está activo
  const canGenerate = config.inputMode === 'skus'
    ? config.validatedSkus.length > 0
    : config.selectedBrands.length > 0;

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

        {/* --- Origen de Datos: Modo SKU vs Filtros --- */}
        <section className="config-card config-card-full">
          <h2><ClipboardPaste className="icon" /> Origen de Datos</h2>

          {config.inputMode === 'skus' ? (
            /* Banner activo del Modo SKU */
            <div className="sku-mode-banner">
              <div className="sku-mode-banner-info">
                <span className="sku-mode-badge">MODO SKU ACTIVO</span>
                <span className="sku-mode-count">
                  {config.validatedSkus.length} productos cargados desde Excel
                </span>
              </div>
              <div className="sku-mode-banner-actions">
                <button className="sku-mode-btn-change" onClick={() => setShowSkuModal(true)}>
                  Cambiar SKUs
                </button>
                <button className="sku-mode-btn-clear" onClick={clearSkuMode} title="Volver al modo filtros">
                  <X size={16} />
                </button>
              </div>
            </div>
          ) : (
            /* Modo filtros: muestra el botón para abrir el validador */
            <div className="sku-mode-inactive">
              <p>Usando <strong>filtros por Marca y Categoría</strong> como fuente de datos.</p>
              <button className="sku-mode-btn-activate" onClick={() => setShowSkuModal(true)}>
                <ClipboardPaste size={16} />
                Importar SKUs desde Excel
              </button>
            </div>
          )}
        </section>

        {/* --- Marcas (solo visible en modo filtros) --- */}
        {config.inputMode === 'filters' && (
          <section className="config-card">
            <h2>Marcas a Incluir</h2>
            <div className="brands-grid">
              {loading ? (
                <p>Cargando...</p>
              ) : availableBrands.length === 0 ? (
                <p>No se encontraron marcas.</p>
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
        )}

        {/* --- Categorías (solo visible en modo filtros) --- */}
        {config.inputMode === 'filters' && (
          <section className="config-card">
            <h2>Tipos de Producto</h2>
            <div className="categories-grouped-grid">
              {loading ? (
                <p>Cargando...</p>
              ) : rootCategories.length === 0 ? (
                <p>No se encontraron categorías.</p>
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
