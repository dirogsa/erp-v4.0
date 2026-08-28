import React, { useState } from 'react';
import { dimsService } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';

const EquivalencyLaboratory = () => {
  const { showNotification } = useNotification();
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);

  // Search State
  const [searchSku, setSearchSku] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [equivResults, setEquivResults] = useState(null);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setIsUploading(true);
    setProgress(0);
    setResults(null);

    const parsedData = [];
    let loadedCount = 0;

    for (const file of files) {
      try {
        const text = await file.text();
        const json = JSON.parse(text);
        parsedData.push(json);
      } catch (err) {
        console.error(`Error parsing ${file.name}:`, err);
      }
      loadedCount++;
      setProgress(Math.round((loadedCount / files.length) * 50)); // 50% for local parsing
    }

    try {
      // Send to backend
      const response = await dimsService.importBatch(parsedData);
      setProgress(100);
      setResults(response.data);
      showNotification('Importación masiva procesada exitosamente', 'success');
    } catch (error) {
      console.error('Error uploading batch:', error);
      showNotification(error.message || 'Error en la importación batch', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchSku.trim()) return;
    setIsSearching(true);
    setEquivResults(null);
    try {
      const response = await dimsService.getEquivalencies(searchSku.trim());
      setEquivResults(response.data);
      showNotification('Búsqueda completada', 'success');
    } catch (error) {
      console.error('Error fetching equivalencies:', error);
      showNotification(error.message || 'Error buscando equivalencias. Asegúrate de que el SKU exista.', 'error');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div style={{ padding: '1.5rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '1.5rem', fontSize: '1.8rem', color: 'var(--text-color)' }}>
        Laboratorio de Equivalencias (Motor DIMS)
      </h1>
      
      <div className="card">
        <h2 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: 'var(--text-color)' }}>Importar JSON de Productos</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Selecciona múltiples archivos JSON para extraer y cruzar su información dimensional, aplicaciones y equivalencias directas.
        </p>
        
        <input 
          type="file" 
          multiple 
          accept=".json"
          onChange={handleFileChange}
          style={{ marginBottom: '1rem', width: '100%', padding: '0.5rem', background: 'var(--bg-color)', color: 'var(--text-color)', border: '1px solid var(--border-color)', borderRadius: '0.5rem' }}
        />
        
        <button 
          className="btn"
          onClick={handleUpload} 
          disabled={files.length === 0 || isUploading}
          style={{ width: '100%', padding: '0.75rem', fontSize: '1rem', opacity: (files.length === 0 || isUploading) ? 0.5 : 1, cursor: (files.length === 0 || isUploading) ? 'not-allowed' : 'pointer' }}
        >
          {isUploading ? 'Procesando...' : `Subir e Inyectar ${files.length} Archivos`}
        </button>

        {isUploading && (
          <div style={{ marginTop: '1.5rem' }}>
            <div style={{ width: '100%', backgroundColor: 'var(--bg-color)', borderRadius: '999px', height: '10px', overflow: 'hidden' }}>
              <div style={{ backgroundColor: 'var(--primary-color)', height: '10px', width: `${progress}%`, transition: 'width 0.3s' }}></div>
            </div>
            <p style={{ fontSize: '0.8rem', marginTop: '0.5rem', color: 'var(--text-secondary)' }}>Progreso: {progress}%</p>
          </div>
        )}
      </div>

      {results && (
        <div className="card" style={{ borderLeft: '4px solid #10b981' }}>
          <h3 style={{ fontWeight: 'bold', marginBottom: '1rem', color: '#10b981' }}>Resultados de Importación</h3>
          <p style={{ marginBottom: '0.5rem' }}>✅ Importados Nuevos: {results.imported}</p>
          <p style={{ marginBottom: '1rem' }}>🔄 Actualizados: {results.updated}</p>
          {results.errors && results.errors.length > 0 && (
            <div style={{ marginTop: '1rem', color: '#f43f5e', fontSize: '0.9rem' }}>
              <p style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Errores ({results.errors.length}):</p>
              <ul style={{ paddingLeft: '1.5rem', listStyleType: 'disc' }}>
                {results.errors.map((e, i) => <li key={i} style={{ marginBottom: '0.25rem' }}>{e}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="card" style={{ marginTop: '2rem' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: 'var(--text-color)' }}>Prueba del Algoritmo 3: Equivalencias Directas</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Busca un SKU (ej. SCT_SB2466) para probar el cruce directo de OEMs y Aftermarket, ignorando medidas.
        </p>
        
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <input 
            type="text" 
            placeholder="Ingrese el SKU a probar..."
            value={searchSku}
            onChange={(e) => setSearchSku(e.target.value)}
            style={{ flex: 1, padding: '0.5rem', background: 'var(--bg-color)', color: 'var(--text-color)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', marginBottom: 0 }}
          />
          <button 
            className="btn"
            onClick={handleSearch}
            disabled={!searchSku.trim() || isSearching}
            style={{ padding: '0.75rem 1.5rem', opacity: (!searchSku.trim() || isSearching) ? 0.5 : 1 }}
          >
            {isSearching ? 'Buscando...' : 'Buscar Equivalencias'}
          </button>
        </div>

        {equivResults && (
          <div style={{ marginTop: '1.5rem', background: 'var(--bg-color)', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
            <h3 style={{ color: 'var(--primary-color)', marginBottom: '1rem', fontWeight: 'bold' }}>Resultados para {equivResults.source_sku}</h3>
            <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
              Coincidencias encontradas: {equivResults.total_matches || 0}
            </p>

            {equivResults.equivalencies && equivResults.equivalencies.length > 0 ? (
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '0.75rem 0' }}>SKU</th>
                    <th>Marca</th>
                    <th>Códigos Compartidos (OEM/Ref)</th>
                  </tr>
                </thead>
                <tbody>
                  {equivResults.equivalencies.map(eq => (
                    <tr key={eq.sku} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.75rem 0', fontWeight: 'bold', color: 'var(--text-color)' }}>{eq.sku}</td>
                      <td style={{ color: 'var(--text-color)' }}>{eq.brand}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          {eq.shared_codes.map(c => (
                            <span key={c} style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem' }}>
                              {c}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ color: 'var(--text-secondary)' }}>No se encontraron equivalencias directas para este SKU.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EquivalencyLaboratory;
