import React, { useState, useEffect } from 'react';
import Button from '../../common/Button';
import { inventoryService } from '../../../services/api';
import { formatCurrency } from '../../../utils/formatters';

const StockReconciliationModal = ({ visible, onClose, onRefresh }) => {
    const [pastedData, setPastedData] = useState('');
    const [parsedItems, setParsedItems] = useState([]);
    const [mapping, setMapping] = useState({ sku: 0, physical_stock: 1 });
    const [step, setStep] = useState(1); // 1: Paste, 2: Map, 3: Reconciliation Audit
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState([]);
    const [globalReason, setGlobalReason] = useState('ADJUSTMENT_STOCKTAKE');
    const [responsible, setResponsible] = useState('');

    const reconciliationReasons = [
        { value: 'ADJUSTMENT_STOCKTAKE', label: 'Inventario Físico (Conteo)', color: '#3b82f6' },
        { value: 'ADJUSTMENT_GIFT', label: 'Regalo / Donación Recibida', color: '#10b981' },
        { value: 'ADJUSTMENT_BONUS', label: 'Bonificación de Proveedor', color: '#10b981' },
        { value: 'ADJUSTMENT_CORRECTION', label: 'Corrección de Error', color: '#6366f1' },
        { value: 'LOSS_DAMAGED', label: 'Deteriorado / Roto', color: '#f59e0b' },
        { value: 'LOSS_THEFT', label: 'Robo / Faltante Crítico', color: '#ef4444' },
        { value: 'LOSS_OTHER', label: 'Otras Mermas', color: '#94a3b8' },
    ];

    if (!visible) return null;

    const handlePaste = (e) => {
        const text = e.target.value;
        setPastedData(text);
        const rows = text.trim().split('\n').map(row => row.split('\t'));
        setParsedItems(rows);
    };

    const validateAndCompare = async () => {
        setIsLoading(true);
        const validatedItems = [];
        const validationErrors = [];

        for (let i = 0; i < parsedItems.length; i++) {
            const row = parsedItems[i];
            const sku = row[mapping.sku]?.trim();
            const physical = parseInt(row[mapping.physical_stock]) || 0;

            if (!sku) continue;

            try {
                // Fetch product details for matching
                const res = await inventoryService.getProducts(1, 1, sku);
                const product = res.data.items.find(p => p.sku.toLowerCase() === sku.toLowerCase());

                if (product) {
                    const systemStock = product.stock_current;
                    const delta = physical - systemStock;

                    validatedItems.push({
                        sku: product.sku,
                        name: product.name,
                        system_stock: systemStock,
                        physical_stock: physical,
                        delta: delta,
                        reason: globalReason,
                        cost: product.cost,
                        impact: delta * product.cost
                    });
                } else {
                    validationErrors.push(`Fila ${i + 1}: SKU "${sku}" no existe.`);
                }
            } catch (err) {
                validationErrors.push(`Fila ${i + 1}: Error al validar "${sku}".`);
            }
        }

        setParsedItems(validatedItems);
        setErrors(validationErrors);
        setIsLoading(false);
        setStep(3);
    };

    const processReconciliation = async () => {
        if (!responsible.trim()) {
            alert('Por favor ingrese el nombre del responsable de la auditoría.');
            return;
        }

        setIsLoading(true);
        try {
            const adjustments = parsedItems.map(item => ({
                sku: item.sku,
                physical_stock: item.physical_stock,
                reason: item.reason,
                responsible: responsible,
                notes: `Reconciliación Masiva - Delta: ${item.delta}`
            }));

            await inventoryService.reconcileStock(adjustments);
            alert('Reconciliación completada con éxito. El inventario ha sido actualizado.');
            onRefresh();
            onClose();
        } catch (err) {
            console.error(err);
            alert('Error al procesar la reconciliación. Verifique los datos.');
        } finally {
            setIsLoading(false);
        }
    };

    const updateItemReason = (index, reason) => {
        const newItems = [...parsedItems];
        newItems[index].reason = reason;
        setParsedItems(newItems);
    };

    const applyGlobalReason = (reason) => {
        setGlobalReason(reason);
        const newItems = parsedItems.map(item => ({ ...item, reason }));
        setParsedItems(newItems);
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1100,
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            backdropFilter: 'blur(8px)', padding: '2rem'
        }}>
            <div style={{
                backgroundColor: '#1e293b',
                borderRadius: '1.25rem',
                border: '1px solid #334155',
                width: '100%', maxWidth: '1000px',
                maxHeight: '90vh', display: 'flex', flexDirection: 'column',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                color: '#e2e8f0', overflow: 'hidden'
            }}>
                {/* Header */}
                <div style={{ padding: '1.5rem', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ margin: 0, color: 'white', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span style={{ fontSize: '1.5rem' }}>⚖️</span>
                            Reconciliación Masiva de Inventario (Excel)
                        </h2>
                        <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>Auditoría Multinacional: Validación de stock físico vs sistema</p>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                </div>

                {/* STEPS INDICATOR */}
                <div style={{ display: 'flex', padding: '1rem 2rem', background: '#0f172a', borderBottom: '1px solid #334155', gap: '2rem' }}>
                    {[1, 2, 3].map(s => (
                        <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: step === s ? 1 : 0.4 }}>
                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: step === s ? '#3b82f6' : '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold' }}>{s}</div>
                            <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
                                {s === 1 ? 'Pegar Datos' : s === 2 ? 'Mapear Columnas' : 'Auditoría Final'}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Content */}
                <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
                    {step === 1 && (
                        <div>
                            <div style={{ backgroundColor: '#3b82f61a', border: '1px solid #3b82f633', padding: '1rem', borderRadius: '0.75rem', marginBottom: '1.5rem' }}>
                                <p style={{ margin: 0, fontSize: '0.9rem', color: '#93c5fd', lineHeight: '1.5' }}>
                                    💡 <strong>Instrucciones:</strong> Copia el SKU y el STOCK FÍSICO desde tu Excel y pégalos aquí. El sistema detectará las diferencias automáticamente.
                                </p>
                            </div>
                            <textarea
                                value={pastedData}
                                onChange={handlePaste}
                                placeholder="Pega columnas de Excel aquí (Ej: SKU \t Cantidad)..."
                                style={{
                                    width: '100%', height: '350px',
                                    backgroundColor: '#0f172a', color: 'white',
                                    border: '2px dashed #334155', borderRadius: '0.75rem',
                                    padding: '1.5rem', fontFamily: 'monospace', outline: 'none',
                                    resize: 'none', transition: 'all 0.3s'
                                }}
                                onFocus={e => e.target.style.borderColor = '#3b82f6'}
                            />
                        </div>
                    )}

                    {step === 2 && (
                        <div>
                            <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>Indica al sistema qué columna corresponde a cada dato en tu Excel:</p>
                            <div style={{ border: '1px solid #334155', borderRadius: '0.75rem', overflow: 'hidden' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead style={{ backgroundColor: '#0f172a' }}>
                                        <tr>
                                            {parsedItems[0]?.map((_, i) => (
                                                <th key={i} style={{ padding: '1rem', borderBottom: '1px solid #334155' }}>
                                                    <select
                                                        value={mapping.sku === i ? 'sku' : mapping.physical_stock === i ? 'stock' : 'none'}
                                                        onChange={(e) => {
                                                            const v = e.target.value;
                                                            if (v === 'sku') setMapping({ ...mapping, sku: i });
                                                            if (v === 'stock') setMapping({ ...mapping, physical_stock: i });
                                                        }}
                                                        style={{ background: '#1e293b', color: 'white', border: '1px solid #334155', padding: '0.5rem', borderRadius: '0.5rem', width: '100%' }}
                                                    >
                                                        <option value="none">Omitir</option>
                                                        <option value="sku">📍 SKU / Código</option>
                                                        <option value="stock">🔢 Stock Físico</option>
                                                    </select>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {parsedItems.slice(0, 10).map((row, idx) => (
                                            <tr key={idx} style={{ borderBottom: '1px solid #1e293b' }}>
                                                {row.map((cell, i) => (
                                                    <td key={i} style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', color: '#94a3b8' }}>{cell}</td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div>
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                                <div style={{ background: '#0f172a', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #334155' }}>
                                    <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: '#94a3b8', textTransform: 'uppercase' }}>Configuración Global</h4>
                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem' }}>Motivo Predeterminado</label>
                                            <select
                                                value={globalReason}
                                                onChange={(e) => applyGlobalReason(e.target.value)}
                                                style={{ width: '100%', background: '#1e293b', color: 'white', border: '1px solid #334155', padding: '0.75rem', borderRadius: '0.5rem' }}
                                            >
                                                {reconciliationReasons.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                                            </select>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem' }}>Auditor Responsable</label>
                                            <input
                                                type="text"
                                                value={responsible}
                                                onChange={(e) => setResponsible(e.target.value)}
                                                placeholder="Nombre Completo"
                                                style={{ width: '100%', background: '#1e293b', color: 'white', border: '1px solid #334155', padding: '0.75rem', borderRadius: '0.5rem' }}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #3b82f633', textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: 'bold', marginBottom: '0.5rem' }}>IMPACTO FINANCIERO ESTIMADO</div>
                                    <div style={{ fontSize: '2rem', fontWeight: '900', color: parsedItems.reduce((s, i) => s + i.impact, 0) < 0 ? '#ef4444' : '#10b981' }}>
                                        {formatCurrency(parsedItems.reduce((sum, item) => sum + item.impact, 0))}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.5rem' }}>Basado en el costo promedio de los productos</div>
                                </div>
                            </div>

                            {errors.length > 0 && (
                                <div style={{ backgroundColor: '#ef44441a', border: '1px solid #ef444433', padding: '1rem', borderRadius: '0.75rem', marginBottom: '1.5rem' }}>
                                    <p style={{ margin: '0 0 0.5rem 0', color: '#f87171', fontWeight: 'bold', fontSize: '0.85rem' }}>⚠️ Advertencias de Validación ({errors.length}):</p>
                                    <div style={{ maxHeight: '100px', overflowY: 'auto', fontSize: '0.8rem', color: '#fca5a5' }}>
                                        {errors.map((e, idx) => <div key={idx}>• {e}</div>)}
                                    </div>
                                </div>
                            )}

                            <div style={{ border: '1px solid #334155', borderRadius: '1rem', overflow: 'hidden' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                    <thead style={{ backgroundColor: '#0f172a', color: '#94a3b8' }}>
                                        <tr>
                                            <th style={{ textAlign: 'left', padding: '1rem' }}>Producto</th>
                                            <th style={{ textAlign: 'center', padding: '1rem' }}>Stock Sistema</th>
                                            <th style={{ textAlign: 'center', padding: '1rem' }}>Stock Físico</th>
                                            <th style={{ textAlign: 'center', padding: '1rem' }}>Diferencia</th>
                                            <th style={{ textAlign: 'left', padding: '1rem' }}>Motivo del Ajuste</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {parsedItems.map((item, idx) => (
                                            <tr key={idx} style={{ borderBottom: '1px solid #1e293b' }}>
                                                <td style={{ padding: '1rem' }}>
                                                    <div style={{ fontWeight: 'bold', color: 'white' }}>{item.sku}</div>
                                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{item.name}</div>
                                                </td>
                                                <td style={{ textAlign: 'center', padding: '1rem', color: '#94a3b8' }}>{item.system_stock}</td>
                                                <td style={{ textAlign: 'center', padding: '1rem', color: 'white', fontWeight: 'bold' }}>{item.physical_stock}</td>
                                                <td style={{ textAlign: 'center', padding: '1rem' }}>
                                                    <div style={{
                                                        color: item.delta === 0 ? '#94a3b8' : item.delta > 0 ? '#10b981' : '#ef4444',
                                                        fontWeight: '900',
                                                        fontSize: '1rem'
                                                    }}>
                                                        {item.delta > 0 ? `+${item.delta}` : item.delta}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '1rem' }}>
                                                    <select
                                                        value={item.reason}
                                                        onChange={(e) => updateItemReason(idx, e.target.value)}
                                                        style={{
                                                            background: '#0f172a',
                                                            color: reconciliationReasons.find(r => r.value === item.reason)?.color || 'white',
                                                            border: '1px solid #334155',
                                                            padding: '0.4rem',
                                                            borderRadius: '0.4rem',
                                                            width: '100%',
                                                            fontSize: '0.75rem'
                                                        }}
                                                    >
                                                        {reconciliationReasons.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                                                    </select>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                <div style={{ padding: '1.5rem', borderTop: '1px solid #334155', display: 'flex', justifyContent: 'flex-end', gap: '1rem', backgroundColor: '#0f172a' }}>
                    <Button variant="secondary" onClick={() => step > 1 ? setStep(step - 1) : onClose()} disabled={isLoading}>
                        {step === 1 ? 'Cancelar' : 'Atrás'}
                    </Button>

                    {step === 1 && (
                        <Button variant="primary" onClick={() => { if (pastedData.trim()) setStep(2); }} disabled={!pastedData.trim()}>
                            Continuar al Mapeo
                        </Button>
                    )}

                    {step === 2 && (
                        <Button variant="primary" onClick={validateAndCompare} disabled={isLoading}>
                            {isLoading ? 'Validando...' : 'Analizar Diferencias'}
                        </Button>
                    )}

                    {step === 3 && (
                        <Button
                            variant="primary"
                            onClick={processReconciliation}
                            disabled={isLoading || parsedItems.length === 0}
                            style={{ background: '#10b981', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)' }}
                        >
                            {isLoading ? 'Procesando...' : `Confirmar y Ajustar ${parsedItems.length} Productos`}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StockReconciliationModal;
