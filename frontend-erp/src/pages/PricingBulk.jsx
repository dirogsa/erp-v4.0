import React, { useState, useEffect } from 'react';
import { pricingService } from '../services/api';
import Button from '../components/common/Button';
import Select from '../components/common/Select';
import { useNotification } from '../hooks/useNotification';

const PricingBulk = () => {
    const [lists, setLists] = useState([]);
    const [selectedList, setSelectedList] = useState('General');
    const [importMode, setImportMode] = useState('text'); // 'csv' or 'text'
    const [pasteText, setPasteText] = useState('');
    const [parsedData, setParsedData] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState(null);
    const { showNotification } = useNotification();

    useEffect(() => {
        const fetchLists = async () => {
            try {
                const res = await pricingService.getLists();
                setLists(res.data);
            } catch (error) {
                console.error("Error loading lists", error);
            }
        };
        fetchLists();
    }, []);

    // Parser inteligente para texto pegado desde Excel/Texto
    const handleParseText = () => {
        if (!pasteText.trim()) return;

        // Regex para capturar SKU (alfanumérico/guiones) y Precio (decimal)
        // Soporta: SKU\tPrecio, SKU Precio, SKU,Precio
        const lines = pasteText.split(/\r?\n/);
        const detected = [];
        
        lines.forEach(line => {
            if (!line.trim()) return;
            // Busca la primera palabra (SKU) y el primer número decimal que encuentre
            const parts = line.trim().split(/[\s\t,]+/);
            if (parts.length >= 2) {
                const sku = parts[0].trim().toUpperCase();
                const price = parseFloat(parts[1].replace(/[^\d.]/g, ''));
                
                if (sku && !isNaN(price)) {
                    detected.push({ sku, price });
                }
            }
        });

        if (detected.length === 0) {
            showNotification('No se detectaron datos válidos. Usa el formato: SKU [Espacio/Tab] PRECIO', 'warning');
        } else {
            setParsedData(detected);
            showNotification(`Se detectaron ${detected.length} productos listos para procesar.`, 'success');
        }
    };

    const handleExecuteUpdate = async () => {
        if (parsedData.length === 0) return;

        setIsProcessing(true);
        try {
            // Enviamos los datos parseados al backend
            // El backend ya tiene un endpoint para esto o usaremos el mismo de importación masiva adaptado
            const res = await pricingService.bulkUpdateFromText({
                items: parsedData,
                list_name: selectedList
            });
            
            setResult(res.data);
            setParsedData([]);
            setPasteText('');
            showNotification('Actualización de precios completada con éxito', 'success');
        } catch (error) {
            showNotification('Error al procesar la actualización masiva', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div style={{ animation: 'slideInRight 0.5s ease-out' }}>
            <style>{`
                @keyframes slideInRight { from { transform: translateX(20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
                .tab-btn { padding: 0.5rem 1.5rem; border: none; cursor: pointer; font-weight: 700; font-size: 0.8rem; transition: all 0.2s; }
                .tab-btn.active { background: #3b82f6; color: white; border-radius: 0.5rem; }
                .tab-btn.inactive { background: transparent; color: #64748b; }
            `}</style>

            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h2 style={{ color: 'white', fontSize: '1.5rem', marginBottom: '0.5rem' }}>Ajustador Inteligente de Precios</h2>
                    <p style={{ color: '#94a3b8' }}>Sincroniza tus precios base de lista pegando directamente desde Excel.</p>
                </div>
                <div style={{ display: 'flex', background: '#0f172a', padding: '0.25rem', borderRadius: '0.75rem', border: '1px solid #334155' }}>
                    <button 
                        className={`tab-btn ${importMode === 'text' ? 'active' : 'inactive'}`}
                        onClick={() => setImportMode('text')}
                    >
                        📋 Pegar Texto (Excel)
                    </button>
                    <button 
                        className={`tab-btn ${importMode === 'csv' ? 'active' : 'inactive'}`}
                        onClick={() => setImportMode('csv')}
                    >
                        📄 Subir CSV
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem', alignItems: 'start' }}>
                
                {/* Zona de Trabajo */}
                <div style={{
                    background: 'rgba(15, 23, 42, 0.5)',
                    border: '1px solid #334155',
                    borderRadius: '1.5rem',
                    padding: '2rem'
                }}>
                    {importMode === 'text' ? (
                        <div>
                            <textarea
                                value={pasteText}
                                onChange={(e) => setPasteText(e.target.value)}
                                placeholder="Pega aquí tus datos de Excel... (Ej: AP026 6.40)"
                                style={{
                                    width: '100%',
                                    height: '250px',
                                    background: '#0f172a',
                                    border: '1px solid #334155',
                                    borderRadius: '1rem',
                                    padding: '1.5rem',
                                    color: 'white',
                                    fontFamily: 'monospace',
                                    fontSize: '0.9rem',
                                    resize: 'none',
                                    outline: 'none'
                                }}
                            />
                            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <p style={{ color: '#64748b', fontSize: '0.8rem' }}>
                                    💡 Se detectarán automáticamente los SKU y precios.
                                </p>
                                <Button onClick={handleParseText} variant="secondary" disabled={!pasteText.trim()}>
                                    🔍 Analizar Contenido
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div style={{ 
                            border: '2px dashed #334155', borderRadius: '1rem', padding: '4rem', 
                            textAlign: 'center', color: '#64748b' 
                        }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📤</div>
                            <p>El importador de CSV tradicional está disponible para archivos grandes.</p>
                        </div>
                    )}

                    {/* Pre-visualización de Datos Detectados */}
                    {parsedData.length > 0 && (
                        <div style={{ marginTop: '2.5rem', borderTop: '1px solid #334155', paddingTop: '2rem', animation: 'fadeIn 0.3s ease-out' }}>
                            <h3 style={{ color: 'white', fontSize: '1rem', marginBottom: '1rem' }}>Confirmar Actualización ({parsedData.length} ítems)</h3>
                            <div style={{ maxHeight: '300px', overflowY: 'auto', borderRadius: '0.75rem', border: '1px solid #334155' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                    <thead style={{ position: 'sticky', top: 0, background: '#1e293b' }}>
                                        <tr>
                                            <th style={{ padding: '0.75rem', textAlign: 'left', color: '#94a3b8' }}>SKU</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'right', color: '#94a3b8' }}>Nuevo Precio (Lista)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {parsedData.map((item, i) => (
                                            <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                <td style={{ padding: '0.75rem', color: 'white', fontWeight: 'bold' }}>{item.sku}</td>
                                                <td style={{ padding: '0.75rem', textAlign: 'right', color: '#10b981' }}>S/ {item.price.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                <Button onClick={() => setParsedData([])} variant="outline">Limpiar</Button>
                                <Button onClick={handleExecuteUpdate} loading={isProcessing} variant="primary">
                                    🚀 Confirmar e Impactar en {selectedList}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar Config */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{
                        background: '#1e293b',
                        padding: '1.5rem',
                        borderRadius: '1rem',
                        border: '1px solid #334155'
                    }}>
                        <h4 style={{ color: 'white', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            🎯 Lista Destino
                        </h4>
                        <Select 
                            options={lists.map(l => ({ value: l.name, label: l.name }))}
                            value={selectedList}
                            onChange={(e) => setSelectedList(e.target.value)}
                        />
                    </div>

                    {result && (
                        <div style={{
                            background: '#0f172a',
                            padding: '1.5rem',
                            borderRadius: '1rem',
                            border: '1px solid #10b981',
                            animation: 'fadeIn 0.5s ease-out'
                        }}>
                            <h4 style={{ color: '#10b981', marginBottom: '1rem' }}>✅ Resultados</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#94a3b8' }}>Actualizados:</span>
                                    <span style={{ color: 'white', fontWeight: 'bold' }}>{result.updated}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#94a3b8' }}>Omitidos/Error:</span>
                                    <span style={{ color: '#ef4444', fontWeight: 'bold' }}>{result.errors?.length || 0}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default PricingBulk;
