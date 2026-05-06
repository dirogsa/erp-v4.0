import React, { useState, useEffect } from 'react';
import { pricingService } from '../services/api';
import Button from '../components/common/Button';
import { useNotification } from '../hooks/useNotification';

const PricingBulk = () => {
    const [importMode, setImportMode] = useState('text'); // 'csv' or 'text'
    const [pasteText, setPasteText] = useState('');
    const [parsedData, setParsedData] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const { showNotification } = useNotification();

    const [adjustMode, setAdjustMode] = useState('both'); // Default to both for master control
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
                return;
            }

            // 2. Prioridad de Tabulación (Excel). Si no hay tabs, usamos espacios múltiples.
            let parts = rawLine.split('\t');
            if (parts.length < 2) {
                parts = rawLine.split(/[\s]{2,}/); 
                if (parts.length < 2) {
                    parts = rawLine.split(' '); 
                }
            }
            
            parts = parts.map(p => p.trim()).filter(p => p !== "");

            if (parts.length < 2) return;

            // 3. Limpieza de SKU 
            const fullSku = parts[0].toUpperCase();
            const sku = fullSku.split(' ')[0]; 
            
            if (adjustMode === 'price') {
                const price = parseFloat(parts[parts.length - 1].replace(/[^\d.]/g, ''));
                if (sku && !isNaN(price)) detected.push({ sku, price });
                else badLines.push({ line, index: index + 1, reason: 'Formato inválido (Esperado: SKU PRECIO)' });
            } 
            else if (adjustMode === 'cost') {
                const cost = parseFloat(parts[parts.length - 1].replace(/[^\d.]/g, ''));
                if (sku && !isNaN(cost)) detected.push({ sku, cost });
                else badLines.push({ line, index: index + 1, reason: 'Formato inválido (Esperado: SKU COSTO)' });
            }
            else if (adjustMode === 'both') {
                const cost = parseFloat(parts[parts.length - 2]?.replace(/[^\d.]/g, ''));
                const price = parseFloat(parts[parts.length - 1]?.replace(/[^\d.]/g, ''));
                if (sku && !isNaN(cost) && !isNaN(price)) detected.push({ sku, cost, price });
                else {
                    // Intento de fallback si solo hay un número (tratar como precio)
                    const lastNum = parseFloat(parts[parts.length - 1]?.replace(/[^\d.]/g, ''));
                    if (sku && !isNaN(lastNum)) detected.push({ sku, price: lastNum });
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
                // Siempre apuntamos a "General" (Maestra)
                const res = await pricingService.analyzeBulk({
                    items: detected,
                    list_name: "General",
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
            await pricingService.bulkUpdateFromText({
                items: parsedData.map(i => ({ 
                    sku: i.sku, 
                    brand: i.brand,
                    price: i.proposed_price,
                    cost: i.proposed_cost 
                })),
                list_name: "General",
                mode: adjustMode
            });
            
            setParsedData([]);
            setUnrecognizedItems([]);
            setFormatErrors([]);
            setPasteText('');
            showNotification('Lista Maestra actualizada correctamente', 'success');
        } catch (error) {
            showNotification('Error en la actualización', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div style={{ animation: 'slideInRight 0.4s ease-out' }}>
            <style>{`
                .mode-btn { padding: 0.5rem 1rem; border: 1px solid #334155; cursor: pointer; font-size: 0.8rem; background: #0f172a; color: #94a3b8; transition: all 0.2s; }
                .mode-btn.active { background: #3b82f6; color: white; border-color: #3b82f6; font-weight: bold; }
                .master-card { background: rgba(15, 23, 42, 0.6); border: 1px solid #334155; border-radius: 1.5rem; padding: 2rem; }
            `}</style>

            <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ color: 'white', fontSize: '1.5rem', marginBottom: '0.4rem' }}>🎮 Consola de Ajuste Maestro</h2>
                <p style={{ color: '#94a3b8' }}>Impacto directo en la <strong>Lista de Precios Maestra</strong> y Costos de Catálogo.</p>
            </div>

            <div className="master-card">
                <div>
                    <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: '0px', borderRadius: '0.5rem', overflow: 'hidden' }}>
                            <button className={`mode-btn ${adjustMode === 'price' ? 'active' : ''}`} onClick={() => setAdjustMode('price')}>Solo Precios</button>
                            <button className={`mode-btn ${adjustMode === 'cost' ? 'active' : ''}`} onClick={() => setAdjustMode('cost')}>Solo Costos</button>
                            <button className={`mode-btn ${adjustMode === 'both' ? 'active' : ''}`} onClick={() => setAdjustMode('both')}>Costos + Precios</button>
                        </div>
                        <div style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 'bold', background: '#1e293b', padding: '0.4rem 1rem', borderRadius: '99px' }}>
                            🎯 TARGET: LISTA MAESTRA (GENERAL)
                        </div>
                    </div>
                    
                    <textarea
                        value={pasteText}
                        onChange={(e) => setPasteText(e.target.value)}
                        placeholder="Pega aquí desde Excel: SKU [Tab] COSTO [Tab] PRECIO..."
                        style={{
                            width: '100%', height: '220px', background: '#0f172a', border: '1px solid #334155',
                            borderRadius: '1rem', padding: '1.5rem', color: 'white', fontFamily: 'monospace',
                            fontSize: '0.9rem', resize: 'none', outline: 'none'
                        }}
                    />
                    
                    <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <p style={{ color: '#64748b', fontSize: '0.8rem' }}>
                            💡 Pega directamente columnas de SKU, Costo y Precio. El sistema calculará los márgenes.
                        </p>
                        <Button onClick={handleParseText} variant="primary" loading={isAnalyzing} disabled={!pasteText.trim()}>
                            🔍 Analizar Impacto en Márgenes
                        </Button>
                    </div>
                </div>

                {/* Reporte de Errores / No Encontrados */}
                {(formatErrors.length > 0 || unrecognizedItems.length > 0) && (
                    <div style={{ 
                        marginTop: '2rem', padding: '1.25rem', background: 'rgba(239, 68, 68, 0.05)', 
                        border: '1px solid #ef4444', borderRadius: '1rem' 
                    }}>
                        <h4 style={{ color: '#ef4444', marginBottom: '0.8rem', fontSize: '0.8rem' }}>⚠️ Atención: Ítems no procesados</h4>
                        <div style={{ maxHeight: '100px', overflowY: 'auto' }}>
                            {formatErrors.map((err, i) => <div key={i} style={{ fontSize: '0.75rem', color: '#fca5a5' }}>L{err.index}: {err.reason}</div>)}
                            {unrecognizedItems.map((item, i) => (
                                <div key={i} style={{ fontSize: '0.75rem', color: '#fca5a5' }}>
                                    <strong>SKU {item.sku}:</strong> {item.brand === 'AMBIGUO' ? 'Existe en múltiples marcas. Indica la marca.' : 'No encontrado en catálogo.'}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Pre-visualización de Rentabilidad */}
                {parsedData.length > 0 && (
                    <div style={{ marginTop: '2.5rem', borderTop: '1px solid #334155', paddingTop: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ color: 'white', fontSize: '1rem', fontWeight: '800' }}>Vista Previa de Rentabilidad (Maestra)</h3>
                            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>* Margen = ((Precio - Costo) / Precio) * 100</div>
                        </div>
                        
                        <div style={{ maxHeight: '450px', overflowY: 'auto', borderRadius: '1rem', border: '1px solid #334155' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                <thead style={{ position: 'sticky', top: 0, background: '#1e293b', zIndex: 10 }}>
                                    <tr>
                                        <th style={{ padding: '1rem', textAlign: 'left', color: '#94a3b8', borderBottom: '2px solid #334155' }}>Producto</th>
                                        <th style={{ padding: '1rem', textAlign: 'right', color: '#94a3b8', borderBottom: '2px solid #334155' }}>Costo Act/Prop</th>
                                        <th style={{ padding: '1rem', textAlign: 'right', color: '#94a3b8', borderBottom: '2px solid #334155' }}>Precio Act/Prop</th>
                                        <th style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8', borderBottom: '2px solid #334155' }}>Margen</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {parsedData.map((item, i) => {
                                        const costChanged = item.proposed_cost !== null;
                                        const priceChanged = item.proposed_price !== null;
                                        
                                        return (
                                            <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                                                <td style={{ padding: '1rem' }}>
                                                    <div style={{ color: 'white', fontWeight: 'bold' }}>{item.sku}</div>
                                                    <div style={{ color: '#64748b', fontSize: '0.7rem' }}>{item.brand} | {item.name}</div>
                                                </td>
                                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                                    <div style={{ color: '#64748b', fontSize: '0.75rem', textDecoration: costChanged ? 'line-through' : 'none' }}>S/ {item.current_cost.toFixed(2)}</div>
                                                    {costChanged && <div style={{ color: '#f59e0b', fontWeight: 'bold' }}>S/ {item.proposed_cost.toFixed(2)}</div>}
                                                </td>
                                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                                    <div style={{ color: '#64748b', fontSize: '0.75rem', textDecoration: priceChanged ? 'line-through' : 'none' }}>S/ {item.current_price.toFixed(2)}</div>
                                                    {priceChanged && <div style={{ color: '#10b981', fontWeight: 'bold' }}>S/ {item.proposed_price.toFixed(2)}</div>}
                                                </td>
                                                <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                    <div style={{ 
                                                        padding: '0.3rem 0.6rem', borderRadius: '0.5rem', display: 'inline-block',
                                                        background: item.margin > 25 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                                        color: item.margin > 25 ? '#10b981' : '#ef4444', fontWeight: 'bold'
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
                            <Button onClick={() => setParsedData([])} variant="outline">Limpiar</Button>
                            <Button onClick={handleExecuteUpdate} loading={isProcessing} variant="primary">
                                🚀 Aplicar Cambios a Lista Maestra
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PricingBulk;
