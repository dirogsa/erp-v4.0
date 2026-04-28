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

    const [adjustMode, setAdjustMode] = useState('price'); // 'price', 'cost', 'both'
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [unrecognizedItems, setUnrecognizedItems] = useState([]);
    const [formatErrors, setFormatErrors] = useState([]);

    // Parser inteligente para texto pegado desde Excel/Texto
    const handleParseText = async () => {
        if (!pasteText.trim()) return;

        setIsAnalyzing(true);
        setFormatErrors([]);
        setUnrecognizedItems([]);
        setParsedData([]);

        const lines = pasteText.split(/\r?\n/);
        const detected = [];
        const badLines = [];
        
        lines.forEach((line, index) => {
            const rawLine = line.trim();
            if (!rawLine) return;

            // 1. Detección Inteligente de Cabeceras
            const lowerLine = rawLine.toLowerCase();
            if (lowerLine.includes('codigo') || lowerLine.includes('precio') || lowerLine.includes('sku') || lowerLine.includes('costo')) {
                console.log(`[Parser] Cabecera detectada y omitida en L${index + 1}`);
                return;
            }

            // 2. Prioridad de Tabulación (Excel). Si no hay tabs, usamos espacios múltiples.
            let parts = rawLine.split('\t');
            if (parts.length < 2) {
                parts = rawLine.split(/[\s]{2,}/); // Mínimo 2 espacios para no romper SKUs con espacios simples
                if (parts.length < 2) {
                    parts = rawLine.split(' '); // Último recurso: espacio simple
                }
            }
            
            // Limpiar partes
            parts = parts.map(p => p.trim()).filter(p => p !== "");

            if (parts.length < 2) {
                // Ignorar líneas basura (como un '0' huérfano)
                return;
            }

            // 3. Limpieza de SKU (Tomar solo la primera palabra como pidió el usuario)
            const fullSku = parts[0].toUpperCase();
            const sku = fullSku.split(' ')[0]; 
            
            if (adjustMode === 'price') {
                // Formato: SKU [Marca?] PRECIO
                if (parts.length >= 3) {
                    const brand = parts[1].toUpperCase();
                    const price = parseFloat(parts[2].replace(/[^\d.]/g, ''));
                    if (sku && brand && !isNaN(price)) detected.push({ sku, brand, price });
                    else badLines.push({ line, index: index + 1, reason: 'Formato inválido (Esperado: SKU MARCA PRECIO)' });
                } else {
                    const price = parseFloat(parts[parts.length - 1].replace(/[^\d.]/g, ''));
                    if (sku && !isNaN(price)) detected.push({ sku, price });
                    else badLines.push({ line, index: index + 1, reason: 'Formato inválido (Esperado: SKU PRECIO)' });
                }
            } 
            else if (adjustMode === 'cost') {
                // Formato: SKU [Marca?] COSTO
                if (parts.length >= 3) {
                    const brand = parts[1].toUpperCase();
                    const cost = parseFloat(parts[2].replace(/[^\d.]/g, ''));
                    if (sku && brand && !isNaN(cost)) detected.push({ sku, brand, cost });
                    else badLines.push({ line, index: index + 1, reason: 'Formato inválido (Esperado: SKU MARCA COSTO)' });
                } else {
                    const cost = parseFloat(parts[parts.length - 1].replace(/[^\d.]/g, ''));
                    if (sku && !isNaN(cost)) detected.push({ sku, cost });
                    else badLines.push({ line, index: index + 1, reason: 'Formato inválido (Esperado: SKU COSTO)' });
                }
            }
            else if (adjustMode === 'both') {
                // Formato: SKU [Marca?] COSTO PRECIO
                if (parts.length >= 4) {
                    const brand = parts[1].toUpperCase();
                    const cost = parseFloat(parts[2].replace(/[^\d.]/g, ''));
                    const price = parseFloat(parts[3].replace(/[^\d.]/g, ''));
                    if (sku && brand && !isNaN(cost) && !isNaN(price)) detected.push({ sku, brand, cost, price });
                    else badLines.push({ line, index: index + 1, reason: 'Formato inválido (Esperado: SKU MARCA COSTO PRECIO)' });
                } else {
                    const cost = parseFloat(parts[1]?.replace(/[^\d.]/g, ''));
                    const price = parseFloat(parts[2]?.replace(/[^\d.]/g, ''));
                    if (sku && !isNaN(cost) && !isNaN(price)) detected.push({ sku, cost, price });
                    else badLines.push({ line, index: index + 1, reason: 'Formato inválido (Esperado: SKU COSTO PRECIO)' });
                }
            }
        });

        if (detected.length === 0 && badLines.length === 0) {
            showNotification('No se detectaron datos.', 'warning');
            setIsAnalyzing(false);
            return;
        }

        setFormatErrors(badLines);

        if (detected.length > 0) {
            try {
                const res = await pricingService.analyzeBulk({
                    items: detected,
                    list_name: selectedList,
                    mode: adjustMode
                });
                
                setParsedData(res.data.valid);
                setUnrecognizedItems(res.data.unrecognized);

                const summary = `Análisis: ${res.data.valid.length} válidos, ${res.data.unrecognized.length} no encontrados.`;
                showNotification(summary, res.data.unrecognized.length > 0 ? 'warning' : 'success');
            } catch (error) {
                showNotification('Error al validar productos', 'error');
            }
        }
        setIsAnalyzing(false);
    };

    const handleExecuteUpdate = async () => {
        if (parsedData.length === 0) return;

        setIsProcessing(true);
        try {
            const res = await pricingService.bulkUpdateFromText({
                items: parsedData.map(i => ({ 
                    sku: i.sku, 
                    brand: i.brand,
                    price: i.proposed_price,
                    cost: i.proposed_cost 
                })),
                list_name: selectedList,
                mode: adjustMode
            });
            
            setResult(res.data);
            setParsedData([]);
            setUnrecognizedItems([]);
            setFormatErrors([]);
            setPasteText('');
            showNotification('Actualización maestra completada', 'success');
        } catch (error) {
            showNotification('Error en la actualización', 'error');
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
                .mode-btn { padding: 0.4rem 0.8rem; border: 1px solid #334155; cursor: pointer; font-size: 0.75rem; background: #0f172a; color: #94a3b8; transition: all 0.2s; }
                .mode-btn.active { background: #1e293b; color: #3b82f6; border-color: #3b82f6; font-weight: bold; }
                .error-badge { background: #ef4444; color: white; padding: 0.2rem 0.5rem; borderRadius: 0.4rem; fontSize: 0.7rem; fontWeight: bold; }
            `}</style>

            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h2 style={{ color: 'white', fontSize: '1.5rem', marginBottom: '0.5rem' }}>Ajustador Maestro (Excel)</h2>
                    <p style={{ color: '#94a3b8' }}>Sincronización masiva de costos, precios y márgenes proyectados.</p>
                </div>
                <div style={{ display: 'flex', background: '#0f172a', padding: '0.25rem', borderRadius: '0.75rem', border: '1px solid #334155' }}>
                    <button 
                        className={`tab-btn ${importMode === 'text' ? 'active' : 'inactive'}`}
                        onClick={() => setImportMode('text')}
                    >
                        📋 Pegar Texto
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
                            <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <span style={{ color: '#64748b', fontSize: '0.8rem' }}>Modo:</span>
                                <button className={`mode-btn ${adjustMode === 'price' ? 'active' : ''}`} style={{ borderRadius: '0.5rem 0 0 0.5rem' }} onClick={() => setAdjustMode('price')}>Solo Precios</button>
                                <button className={`mode-btn ${adjustMode === 'cost' ? 'active' : ''}`} onClick={() => setAdjustMode('cost')}>Solo Costos</button>
                                <button className={`mode-btn ${adjustMode === 'both' ? 'active' : ''}`} style={{ borderRadius: '0 0.5rem 0.5rem 0' }} onClick={() => setAdjustMode('both')}>Costos + Precios</button>
                            </div>
                            <textarea
                                value={pasteText}
                                onChange={(e) => setPasteText(e.target.value)}
                                placeholder={
                                    adjustMode === 'price' ? "SKU [Tab] MARCA [Tab] PRECIO..." :
                                    adjustMode === 'cost' ? "SKU [Tab] MARCA [Tab] COSTO..." :
                                    "SKU [Tab] MARCA [Tab] COSTO [Tab] PRECIO..."
                                }
                                style={{
                                    width: '100%',
                                    height: '200px',
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
                                    💡 No incluyas cabeceras. El sistema las detecta por posición.
                                </p>
                                <Button onClick={handleParseText} variant="secondary" loading={isAnalyzing} disabled={!pasteText.trim()}>
                                    🔍 Analizar y Calcular Márgenes
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

                    {/* Reporte de Errores */}
                    {(formatErrors.length > 0 || unrecognizedItems.length > 0) && (
                        <div style={{ 
                            marginTop: '2rem', padding: '1.5rem', background: 'rgba(239, 68, 68, 0.05)', 
                            border: '1px solid #ef4444', borderRadius: '1rem' 
                        }}>
                            <h4 style={{ color: '#ef4444', marginBottom: '1rem', fontSize: '0.85rem' }}>⚠️ Problemas detectados</h4>
                            <div style={{ maxHeight: '120px', overflowY: 'auto' }}>
                                {formatErrors.map((err, i) => <div key={i} style={{ fontSize: '0.75rem', color: '#fca5a5', marginBottom: '0.2rem' }}>L{err.index}: {err.reason}</div>)}
                                {unrecognizedItems.map((item, i) => (
                                    <div key={i} style={{ fontSize: '0.75rem', color: '#fca5a5', marginBottom: '0.2rem' }}>
                                        <strong>SKU {item.sku}:</strong> {item.brand === 'AMBIGUO' ? (
                                            <span style={{ color: '#fbbf24' }}>Ambiguo (Existe en varias marcas). Por favor pega la columna MARCA.</span>
                                        ) : (
                                            'No encontrado en el catálogo.'
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Pre-visualización Maestra */}
                    {parsedData.length > 0 && (
                        <div style={{ marginTop: '2.5rem', borderTop: '1px solid #334155', paddingTop: '2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h3 style={{ color: 'white', fontSize: '1rem' }}>Vista Previa de Rentabilidad</h3>
                                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>* Margen = ((Precio - Costo) / Precio) * 100</div>
                            </div>
                            <div style={{ maxHeight: '400px', overflowY: 'auto', borderRadius: '0.75rem', border: '1px solid #334155' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                                    <thead style={{ position: 'sticky', top: 0, background: '#1e293b' }}>
                                        <tr>
                                            <th style={{ padding: '0.75rem', textAlign: 'left', color: '#94a3b8' }}>Producto</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'left', color: '#94a3b8' }}>Marca</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'right', color: '#94a3b8' }}>Costo</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'right', color: '#94a3b8' }}>Precio</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'center', color: '#94a3b8' }}>Margen</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {parsedData.map((item, i) => {
                                            const costChanged = item.proposed_cost !== null;
                                            const priceChanged = item.proposed_price !== null;
                                            
                                            return (
                                                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                    <td style={{ padding: '0.75rem' }}>
                                                        <div style={{ color: 'white', fontWeight: 'bold' }}>{item.sku}</div>
                                                        <div style={{ color: '#64748b', fontSize: '0.7rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                                                    </td>
                                                    <td style={{ padding: '0.75rem' }}>
                                                        <div style={{ 
                                                            fontSize: '0.7rem', padding: '0.2rem 0.4rem', background: '#334155', 
                                                            color: '#e2e8f0', borderRadius: '0.3rem', display: 'inline-block' 
                                                        }}>
                                                            {item.brand}
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                                                        <div style={{ fontSize: '0.7rem', color: '#64748b', textDecoration: costChanged ? 'line-through' : 'none' }}>
                                                            S/ {item.current_cost.toFixed(2)}
                                                        </div>
                                                        {costChanged && <div style={{ color: '#f59e0b', fontWeight: 'bold' }}>S/ {item.proposed_cost.toFixed(2)}</div>}
                                                    </td>
                                                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                                                        <div style={{ fontSize: '0.7rem', color: '#64748b', textDecoration: priceChanged ? 'line-through' : 'none' }}>
                                                            S/ {item.current_price.toFixed(2)}
                                                        </div>
                                                        {priceChanged && <div style={{ color: '#10b981', fontWeight: 'bold' }}>S/ {item.proposed_price.toFixed(2)}</div>}
                                                    </td>
                                                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                                        <div style={{ 
                                                            padding: '0.2rem 0.5rem', borderRadius: '0.5rem', display: 'inline-block',
                                                            background: item.margin > 20 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                                            color: item.margin > 20 ? '#10b981' : '#ef4444',
                                                            fontWeight: 'bold'
                                                        }}>
                                                            {item.margin.toFixed(1)}%
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                <Button onClick={() => { setParsedData([]); setUnrecognizedItems([]); setFormatErrors([]); }} variant="outline">Limpiar</Button>
                                <Button onClick={handleExecuteUpdate} loading={isProcessing} variant="primary">
                                    🚀 Aplicar Cambios Maestros
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
                            🎯 Lista de Precios
                        </h4>
                        <Select 
                            options={lists.map(l => ({ value: l.name, label: l.name }))}
                            value={selectedList}
                            onChange={(e) => setSelectedList(e.target.value)}
                        />
                    </div>
                </div>

            </div>
        </div>
    );
};

export default PricingBulk;
