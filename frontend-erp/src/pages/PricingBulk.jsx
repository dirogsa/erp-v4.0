import React, { useState, useEffect } from 'react';
import { pricingService } from '../services/api';
import Button from '../components/common/Button';
import { useNotification } from '../hooks/useNotification';

const PricingBulk = () => {
    const [importMode, setImportMode] = useState('text'); 
    const [pasteText, setPasteText] = useState('');
    const [parsedData, setParsedData] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const { showNotification } = useNotification();

    const [adjustMode, setAdjustMode] = useState(null); 
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [unrecognizedItems, setUnrecognizedItems] = useState([]);
    const [formatErrors, setFormatErrors] = useState([]);

    // Danger Zone States
    const [dangerArmed, setDangerArmed] = useState(false);
    const [isPurging, setIsPurging] = useState(false);

    const handleParseText = async () => {
        if (!adjustMode) {
            showNotification('Por favor selecciona un modo (Precios, Costos o Ambos) antes de analizar.', 'warning');
            return;
        }
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

            const lowerLine = rawLine.toLowerCase();
            if (lowerLine.includes('codigo') || lowerLine.includes('precio') || lowerLine.includes('sku') || lowerLine.includes('costo')) return;

            let parts = rawLine.split('\t');
            if (parts.length < 2) {
                parts = rawLine.split(/[\s]{2,}/); 
                if (parts.length < 2) parts = rawLine.split(' '); 
            }
            parts = parts.map(p => p.trim()).filter(p => p !== "");
            if (parts.length < 2) return;

            const fullSku = parts[0].toUpperCase();
            const sku = fullSku.split(' ')[0]; 
            
            if (adjustMode === 'price') {
                const price = parseFloat(parts[parts.length - 1].replace(/[^\d.]/g, ''));
                if (sku && !isNaN(price)) detected.push({ sku, price });
                else badLines.push({ line, index: index + 1, reason: 'Formato inválido' });
            } 
            else if (adjustMode === 'cost') {
                const cost = parseFloat(parts[parts.length - 1].replace(/[^\d.]/g, ''));
                if (sku && !isNaN(cost)) detected.push({ sku, cost });
                else badLines.push({ line, index: index + 1, reason: 'Formato inválido' });
            }
            else if (adjustMode === 'both') {
                const cost = parseFloat(parts[parts.length - 2]?.replace(/[^\d.]/g, ''));
                const price = parseFloat(parts[parts.length - 1]?.replace(/[^\d.]/g, ''));
                if (sku && !isNaN(cost) && !isNaN(price)) detected.push({ sku, cost, price });
                else {
                    const lastNum = parseFloat(parts[parts.length - 1]?.replace(/[^\d.]/g, ''));
                    if (sku && !isNaN(lastNum)) detected.push({ sku, price: lastNum });
                    else badLines.push({ line, index: index + 1, reason: 'Formato inválido' });
                }
            }
        });

        if (detected.length > 0) {
            try {
                const res = await pricingService.analyzeBulk({ items: detected, list_name: "General", mode: adjustMode });
                setParsedData(res.data.valid);
                setUnrecognizedItems(res.data.unrecognized);
                showNotification(`Análisis completado: ${res.data.valid.length} válidos.`, 'success');
            } catch (error) {
                showNotification('Error al validar productos', 'error');
            }
        }
        setFormatErrors(badLines);
        setIsAnalyzing(false);
    };

    const handleExecuteUpdate = async () => {
        if (parsedData.length === 0) return;
        setIsProcessing(true);
        try {
            await pricingService.bulkUpdateFromText({
                items: parsedData.map(i => ({ sku: i.sku, brand: i.brand, price: i.proposed_price, cost: i.proposed_cost })),
                list_name: "General",
                mode: adjustMode
            });
            setParsedData([]);
            setPasteText('');
            showNotification('Lista Maestra actualizada correctamente', 'success');
        } catch (error) {
            showNotification('Error en la actualización', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePurgePrices = async () => {
        setIsPurging(true);
        try {
            const res = await pricingService.purgeMasterPrices();
            showNotification(res.data.message, 'success');
            setDangerArmed(false);
        } catch (error) {
            showNotification('Error al purgar precios', 'error');
        } finally {
            setIsPurging(false);
        }
    };

    const handleResetCosts = async () => {
        setIsPurging(true);
        try {
            const res = await pricingService.resetAllCosts();
            showNotification(res.data.message, 'success');
            setDangerArmed(false);
        } catch (error) {
            showNotification('Error al resetear costos', 'error');
        } finally {
            setIsPurging(false);
        }
    };

    return (
        <div style={{ animation: 'slideInRight 0.4s ease-out' }}>
            <style>{`
                .mode-btn { padding: 0.5rem 1rem; border: 1px solid #334155; cursor: pointer; font-size: 0.8rem; background: #0f172a; color: #94a3b8; transition: all 0.2s; }
                .mode-btn.active { background: #3b82f6; color: white; border-color: #3b82f6; font-weight: bold; }
                .master-card { background: rgba(15, 23, 42, 0.6); border: 1px solid #334155; border-radius: 1.5rem; padding: 2rem; margin-bottom: 2rem; }
                .danger-zone { border: 1px solid #ef4444; background: rgba(239, 68, 68, 0.05); padding: 2rem; border-radius: 1.5rem; }
            `}</style>

            <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ color: 'white', fontSize: '1.5rem', marginBottom: '0.4rem' }}>🎮 Consola de Ajuste Maestro</h2>
                <p style={{ color: '#94a3b8' }}>Impacto directo en la <strong>Lista de Precios Maestra</strong> y Costos de Catálogo.</p>
            </div>

            <div className="master-card">
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
                    placeholder={
                        !adjustMode ? "1. Selecciona un modo arriba ↑\n2. Pega aquí tus datos de Excel..." :
                        adjustMode === 'price' ? "Modo Solo Precios: SKU [Tab] PRECIO" :
                        adjustMode === 'cost' ? "Modo Solo Costos: SKU [Tab] COSTO" :
                        "Modo Costos + Precios: SKU [Tab] COSTO [Tab] PRECIO"
                    }
                    style={{
                        width: '100%', height: '220px', background: '#0f172a', border: adjustMode ? '1px solid #334155' : '1px dashed #3b82f6',
                        borderRadius: '1rem', padding: '1.5rem', color: 'white', fontFamily: 'monospace',
                        fontSize: '0.9rem', resize: 'none', outline: 'none'
                    }}
                />
                
                <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ color: '#64748b', fontSize: '0.8rem' }}>💡 Pega SKU, Costo y Precio. El sistema calculará los márgenes.</p>
                    <Button onClick={handleParseText} variant="primary" loading={isAnalyzing} disabled={!pasteText.trim()}>
                        🔍 Analizar Impacto en Márgenes
                    </Button>
                </div>

                {parsedData.length > 0 && (
                    <div style={{ marginTop: '2.5rem', borderTop: '1px solid #334155', paddingTop: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ color: 'white', fontSize: '1rem', fontWeight: '800' }}>Vista Previa (Maestra)</h3>
                            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>* Margen = ((Precio - Costo) / Precio) * 100</div>
                        </div>
                        
                        <div style={{ maxHeight: '450px', overflowY: 'auto', borderRadius: '1rem', border: '1px solid #334155' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                <thead style={{ position: 'sticky', top: 0, background: '#1e293b', zIndex: 10 }}>
                                    <tr>
                                        <th style={{ padding: '1rem', textAlign: 'left', color: '#94a3b8' }}>Producto</th>
                                        <th style={{ padding: '1rem', textAlign: 'right', color: '#94a3b8' }}>Costo Prop</th>
                                        <th style={{ padding: '1rem', textAlign: 'right', color: '#94a3b8' }}>Precio Prop</th>
                                        <th style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8' }}>Margen</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {parsedData.map((item, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ color: 'white', fontWeight: 'bold' }}>{item.sku}</div>
                                                <div style={{ color: '#64748b', fontSize: '0.7rem' }}>{item.brand} | {item.name}</div>
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'right', color: '#f59e0b', fontWeight: 'bold' }}>S/ {item.proposed_cost?.toFixed(2) || '---'}</td>
                                            <td style={{ padding: '1rem', textAlign: 'right', color: '#10b981', fontWeight: 'bold' }}>S/ {item.proposed_price?.toFixed(2) || '---'}</td>
                                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                <div style={{ padding: '0.3rem 0.6rem', borderRadius: '0.5rem', background: item.margin > 25 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: item.margin > 25 ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>{item.margin.toFixed(1)}%</div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                            <Button onClick={() => setParsedData([])} variant="outline">Limpiar</Button>
                            <Button onClick={handleExecuteUpdate} loading={isProcessing} variant="primary">🚀 Aplicar Cambios Maestros</Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Zona de Peligro */}
            <div className="danger-zone">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div>
                        <h3 style={{ color: '#ef4444', fontSize: '1.1rem', fontWeight: '900', marginBottom: '0.25rem' }}>💀 Zona de Peligro: Borrón y Cuenta Nueva</h3>
                        <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Estas acciones son irreversibles. Úsalas solo si cometiste un error masivo.</p>
                    </div>
                    {!dangerArmed ? (
                        <Button onClick={() => setDangerArmed(true)} variant="outline" style={{ borderColor: '#ef4444', color: '#ef4444' }}>🔓 Activar Comandos de Purga</Button>
                    ) : (
                        <Button onClick={() => setDangerArmed(false)} variant="secondary">🔒 Bloquear Acciones</Button>
                    )}
                </div>

                {dangerArmed && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', animation: 'fadeIn 0.3s' }}>
                        <div style={{ padding: '1.5rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '1rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                            <h4 style={{ color: 'white', marginBottom: '0.5rem' }}>Precios Maestros</h4>
                            <p style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: '1.5rem' }}>Borra TODOS los precios de la lista general. Los productos quedarán sin precio.</p>
                            <Button onClick={handlePurgePrices} loading={isPurging} style={{ width: '100%', background: '#ef4444' }}>💥 PURGAR TODOS LOS PRECIOS</Button>
                        </div>
                        <div style={{ padding: '1.5rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '1rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                            <h4 style={{ color: 'white', marginBottom: '0.5rem' }}>Costos del Catálogo</h4>
                            <p style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: '1.5rem' }}>Resetea el costo de TODOS los productos a S/ 0.00. Útil para re-importación limpia.</p>
                            <Button onClick={handleResetCosts} loading={isPurging} style={{ width: '100%', background: '#ef4444' }}>🧹 RESETEAR TODOS LOS COSTOS</Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PricingBulk;
