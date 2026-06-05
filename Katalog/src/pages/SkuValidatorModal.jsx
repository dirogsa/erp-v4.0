import { useState } from 'react';
import { useCatalogStore } from '../store';
import { X, ClipboardPaste, CheckCircle, XCircle, ArrowRight, RotateCcw } from 'lucide-react';
import './SkuValidatorModal.css';

/**
 * SkuValidatorModal
 *
 * Ciclo de vida del componente:
 *   'input'    → El usuario pega los SKUs desde Excel
 *   'loading'  → Consulta al backend (una sola query $in)
 *   'results'  → Muestra el reporte de encontrados / no encontrados
 */
export default function SkuValidatorModal({ onClose }) {
  const { activateSkuMode } = useCatalogStore();
  const [step, setStep] = useState('input');
  const [rawText, setRawText] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  // Parsea el texto pegado desde Excel: split por saltos de línea o comas, trim, deduplicar
  const parsedSkus = [...new Set(
    rawText.split(/[\n\r,]+/).map(s => s.trim().toUpperCase()).filter(Boolean)
  )];

  const handleValidate = async () => {
    if (parsedSkus.length === 0) return;
    setStep('loading');
    setError(null);
    try {
      const res = await fetch('http://localhost:8000/katalog/validate-skus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skus: parsedSkus }),
      });
      if (!res.ok) throw new Error(`Error del servidor: ${res.status}`);
      const data = await res.json();
      setResults(data);
      setStep('results');
    } catch (err) {
      setError(err.message);
      setStep('input');
    }
  };

  const handleCopyNotFound = () => {
    if (!results?.not_found?.length) return;
    navigator.clipboard.writeText(results.not_found.join('\n'));
  };

  const handleActivate = () => {
    const foundSkus = results.found.map(p => p.sku);
    activateSkuMode(foundSkus);
    onClose();
  };

  const handleReset = () => {
    setStep('input');
    setRawText('');
    setResults(null);
    setError(null);
  };

  return (
    <div className="sku-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sku-modal">
        {/* Header */}
        <div className="sku-modal-header">
          <div className="sku-modal-title">
            <ClipboardPaste size={20} />
            <span>Validador de SKUs desde Excel</span>
          </div>
          <button className="sku-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Paso 1: Input */}
        {(step === 'input' || step === 'loading') && (
          <div className="sku-modal-body">
            <p className="sku-modal-hint">
              Copia una columna de SKUs en Excel y pégala aquí. El sistema acepta
              uno por línea, con comas, o mezclados.
            </p>
            <textarea
              className="sku-textarea"
              placeholder={"WL7464\nWF8428\nWP9378\n..."}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              disabled={step === 'loading'}
              autoFocus
            />
            {parsedSkus.length > 0 && (
              <div className="sku-detected-count">
                {parsedSkus.length} SKU{parsedSkus.length !== 1 ? 's' : ''} detectado{parsedSkus.length !== 1 ? 's' : ''}
              </div>
            )}
            {error && <div className="sku-error">{error}</div>}
            <div className="sku-modal-actions">
              <button className="sku-btn-secondary" onClick={onClose}>
                Cancelar
              </button>
              <button
                className="sku-btn-primary"
                onClick={handleValidate}
                disabled={parsedSkus.length === 0 || step === 'loading'}
              >
                {step === 'loading' ? 'Validando...' : (
                  <><ArrowRight size={16} /> Validar {parsedSkus.length > 0 ? `(${parsedSkus.length})` : ''}</>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Paso 2: Resultados */}
        {step === 'results' && results && (
          <div className="sku-modal-body">
            {/* Resumen */}
            <div className="sku-summary-bar">
              <div className="sku-summary-item sku-found">
                <CheckCircle size={18} />
                <span><strong>{results.found.length}</strong> encontrados</span>
              </div>
              <div className="sku-summary-divider" />
              <div className="sku-summary-item sku-missing">
                <XCircle size={18} />
                <span><strong>{results.not_found.length}</strong> no encontrados</span>
              </div>
              <div className="sku-summary-divider" />
              <div className="sku-summary-item">
                <span>de {results.total_submitted} enviados</span>
              </div>
            </div>

            {/* Paneles lado a lado */}
            <div className="sku-results-grid">
              {/* Columna Encontrados */}
              <div className="sku-results-panel sku-panel-found">
                <h4>✅ Encontrados</h4>
                <div className="sku-results-list">
                  {results.found.map(p => (
                    <div key={p.sku} className="sku-result-row">
                      <span className="sku-result-code">{p.sku}</span>
                      <span className="sku-result-brand">{p.brand}</span>
                    </div>
                  ))}
                  {results.found.length === 0 && (
                    <p className="sku-empty">Ninguno encontrado</p>
                  )}
                </div>
              </div>

              {/* Columna No Encontrados */}
              <div className="sku-results-panel sku-panel-missing">
                <h4>❌ No encontrados</h4>
                <div className="sku-results-list">
                  {results.not_found.map(sku => (
                    <div key={sku} className="sku-result-row">
                      <span className="sku-result-code sku-code-missing">{sku}</span>
                    </div>
                  ))}
                  {results.not_found.length === 0 && (
                    <p className="sku-empty">¡Todos encontrados!</p>
                  )}
                </div>
                {results.not_found.length > 0 && (
                  <button className="sku-btn-copy" onClick={handleCopyNotFound}>
                    Copiar no encontrados
                  </button>
                )}
              </div>
            </div>

            {/* Acciones finales */}
            <div className="sku-modal-actions">
              <button className="sku-btn-secondary" onClick={handleReset}>
                <RotateCcw size={16} /> Nueva validación
              </button>
              <button
                className="sku-btn-primary"
                onClick={handleActivate}
                disabled={results.found.length === 0}
              >
                <CheckCircle size={16} />
                Usar {results.found.length} SKUs en el catálogo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
