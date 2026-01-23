import React, { useState } from 'react';
import Button from '../../common/Button';
import { inventoryService, priceService, salesPolicyService } from '../../../services/api';

const PriceImportModal = ({ visible, onClose, onImported }) => {
    const [pastedData, setPastedData] = useState('');
    const [parsedItems, setParsedItems] = useState([]); // Raw rows from paste
    const [validatedItems, setValidatedItems] = useState([]); // Validated objects for final step
    const [mapping, setMapping] = useState({ sku: 0, retail: 1, wholesale: 2 });
    const [step, setStep] = useState(1); // 1: Paste, 2: Map & Validate, 3: Final Review
    const [validationStatus, setValidationStatus] = useState({ loading: false, errors: [] });

    // Relational Engine States
    const [autoCalcRetail, setAutoCalcRetail] = useState(true);
    const [policies, setPolicies] = useState(null);

    // Load policies on mount
    React.useEffect(() => {
        if (visible) {
            salesPolicyService.getPolicies().then(res => setPolicies(res.data)).catch(console.error);
        }
    }, [visible]);

    if (!visible) return null;

    const handlePaste = (e) => {
        const text = e.target.value;
        setPastedData(text);

        // Basic parsing to show a preview
        const rows = text.trim().split('\n').map(row => row.split('\t'));
        setParsedItems(rows);
    };

    const nextStep = async () => {
        if (step === 1) {
            if (!pastedData.trim()) return;
            setStep(2);
        } else if (step === 2) {
            await validateItems();
        }
    };

    const validateItems = async () => {
        setValidationStatus({ loading: true, errors: [] });
        const finalItems = [];
        const errors = [];
        const markup = policies?.retail_markup_pct || 25; // Default fallback

        for (let i = 0; i < parsedItems.length; i++) {
            const row = parsedItems[i];
            const sku = row[mapping.sku]?.trim();
            const retailInput = parseFloat(row[mapping.retail]) || 0;
            const wholesaleInput = parseFloat(row[mapping.wholesale]) || 0;

            if (!sku) continue;

            try {
                // We check if the product exists
                const res = await inventoryService.getProducts(1, 1, sku);
                const product = res.data.items.find(p => p.sku.toLowerCase() === sku.toLowerCase());

                if (product) {
                    const finalWholesale = wholesaleInput > 0 ? wholesaleInput : product.price_wholesale;

                    // Relational Logic:
                    // If AutoCalc is ON, force calculation based on wholesale.
                    // If AutoCalc is OFF, use input if present, else keep old.
                    let finalRetail;
                    if (autoCalcRetail) {
                        finalRetail = finalWholesale * (1 + markup / 100);
                    } else {
                        finalRetail = retailInput > 0 ? retailInput : product.price_retail;
                    }

                    finalItems.push({
                        sku: product.sku,
                        name: product.name,
                        price_retail: finalRetail,
                        price_wholesale: finalWholesale,
                        old_retail: product.price_retail,
                        old_wholesale: product.price_wholesale,
                        cost: product.cost || 0
                    });
                } else {
                    errors.push(`Fila ${i + 1}: SKU "${sku}" no encontrado.`);
                }
            } catch (err) {
                errors.push(`Fila ${i + 1}: Error validando SKU "${sku}".`);
            }
        }

        setValidationStatus({ loading: false, errors });
        setValidatedItems(finalItems);
        setStep(3);
    };

    const confirmImport = () => {
        onImported(validatedItems);
        onClose();
        // Reset state
        setStep(1);
        setPastedData('');
        setParsedItems([]);
        setValidatedItems([]);
    };

    const Spinner = () => (
        <div style={{
            width: '24px',
            height: '24px',
            border: '3px solid rgba(59, 130, 246, 0.2)',
            borderTop: '3px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
        }} />
    );

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 2000, padding: '2rem',
            backdropFilter: 'blur(4px)'
        }}>
            <style>
                {`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                `}
            </style>
            <div style={{
                backgroundColor: '#0f172a',
                borderRadius: '0.75rem',
                width: '100%', maxWidth: '850px',
                display: 'flex', flexDirection: 'column',
                maxHeight: '90vh',
                border: '1px solid #334155',
                position: 'relative',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}>
                {/* Loading Overlay */}
                {validationStatus.loading && (
                    <div style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(15, 23, 42, 0.7)',
                        backdropFilter: 'blur(4px)',
                        zIndex: 2100,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        borderRadius: '0.75rem',
                        gap: '1rem'
                    }}>
                        <Spinner />
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ color: 'white', fontWeight: 'bold', margin: 0 }}>Validando Productos</p>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div style={{ padding: '1.5rem', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                            width: '32px', height: '32px',
                            backgroundColor: '#1e293b', borderRadius: '8px',
                            display: 'flex', justifyContent: 'center', alignItems: 'center',
                            color: '#3b82f6', fontWeight: 'bold'
                        }}>
                            {step}
                        </div>
                        <h2 style={{ color: 'white', margin: 0, fontSize: '1.25rem' }}>Importar Precios desde Excel</h2>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                </div>

                {/* Status Bar */}
                {pastedData.trim() && (
                    <div style={{
                        padding: '0.5rem 1.5rem',
                        background: '#1e293b',
                        display: 'flex',
                        gap: '1rem',
                        fontSize: '0.75rem',
                        borderBottom: '1px solid #334155'
                    }}>
                        <div style={{ color: '#94a3b8' }}>
                            <strong style={{ color: '#3b82f6' }}>{step === 3 ? validatedItems.length : pastedData.trim().split('\n').length}</strong> {step === 3 ? 'Productos Válidos' : 'Filas Detectadas'}
                        </div>
                        {validationStatus.errors.length > 0 && (
                            <div style={{ color: '#ef4444' }}>
                                <strong>{validationStatus.errors.length}</strong> Errores/SKU no encontrados
                            </div>
                        )}
                    </div>
                )}

                {/* Content */}
                <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
                    {step === 1 && (
                        <div>
                            <p style={{ color: '#94a3b8', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
                                Copia las columnas de tu Excel (ej: <strong style={{ color: 'white' }}>SKU</strong>, <strong style={{ color: 'white' }}>P. Minorista</strong>, <strong style={{ color: 'white' }}>P. Mayorista</strong>) y pégalas aquí.
                            </p>
                            <textarea
                                value={pastedData}
                                onChange={handlePaste}
                                placeholder="Pega aquí los datos de Excel..."
                                style={{
                                    width: '100%', height: '300px',
                                    backgroundColor: '#1e293b', color: 'white',
                                    border: '2px dashed #334155', borderRadius: '0.75rem',
                                    padding: '1rem', fontFamily: 'monospace', fontSize: '0.9rem',
                                    outline: 'none', resize: 'none'
                                }}
                            />
                        </div>
                    )}

                    {step === 2 && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <p style={{ color: '#94a3b8', margin: 0 }}>Mapea las columnas de tu pegado:</p>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', background: autoCalcRetail ? 'rgba(59, 130, 246, 0.1)' : 'transparent', padding: '0.5rem', borderRadius: '0.5rem', border: `1px solid ${autoCalcRetail ? '#3b82f6' : '#334155'}` }}>
                                    <input
                                        type="checkbox"
                                        checked={autoCalcRetail}
                                        onChange={(e) => setAutoCalcRetail(e.target.checked)}
                                    />
                                    <span style={{ color: autoCalcRetail ? '#60a5fa' : '#94a3b8', fontWeight: 'bold', fontSize: '0.9rem' }}>
                                        ⚡ Aplicar Margen Minorista Automático ({policies?.retail_markup_pct || 25}%)
                                    </span>
                                </label>
                            </div>
                            <div style={{ border: '1px solid #334155', borderRadius: '0.5rem', overflow: 'hidden' }}>
                                <table style={{ width: '100%', color: 'white', borderCollapse: 'collapse' }}>
                                    <thead style={{ backgroundColor: '#1e293b' }}>
                                        <tr>
                                            {parsedItems[0]?.map((_, i) => (
                                                <th key={i} style={{ padding: '0.75rem' }}>
                                                    <select
                                                        value={mapping.sku === i ? 'sku' : mapping.retail === i ? 'retail' : mapping.wholesale === i ? 'wholesale' : 'none'}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            const newMapping = { ...mapping };

                                                            // Logic 1: If selecting 'none', remove this column from any mapping
                                                            if (val === 'none') {
                                                                if (newMapping.sku === i) newMapping.sku = -1;
                                                                if (newMapping.retail === i) newMapping.retail = -1;
                                                                if (newMapping.wholesale === i) newMapping.wholesale = -1;
                                                            } else {
                                                                // Logic 2: If selecting a field, assign it to this column
                                                                newMapping[val] = i;
                                                            }
                                                            setMapping(newMapping);
                                                        }}
                                                        style={{ backgroundColor: '#0f172a', color: 'white', border: '1px solid #475569', padding: '0.4rem', borderRadius: '4px', width: '100%' }}
                                                    >
                                                        <option value="none">Ignorar</option>
                                                        <option value="sku">SKU</option>
                                                        <option value="retail">P. Minorista</option>
                                                        <option value="wholesale">P. Mayorista</option>
                                                    </select>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {parsedItems.slice(0, 5).map((row, idx) => (
                                            <tr key={idx} style={{ borderTop: '1px solid #334155' }}>
                                                {row.map((cell, i) => (
                                                    <td key={i} style={{ padding: '0.75rem', color: '#94a3b8', fontSize: '0.8rem' }}>{cell}</td>
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
                            {/* Diagnostic Summary Header */}
                            <div style={{
                                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem',
                                padding: '1rem', backgroundColor: '#1e293b', borderRadius: '0.75rem', border: '1px solid #334155'
                            }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ color: '#10b981', fontSize: '1.25rem', fontWeight: 'bold' }}>
                                        {validatedItems.filter(item => (item.price_retail > item.old_retail) || (item.price_wholesale > item.old_wholesale)).length}
                                    </div>
                                    <div style={{ color: '#94a3b8', fontSize: '0.7rem', textTransform: 'uppercase' }}>Incrementos</div>
                                </div>
                                <div style={{ textAlign: 'center', borderLeft: '1px solid #334155', borderRight: '1px solid #334155' }}>
                                    <div style={{ color: '#ef4444', fontSize: '1.25rem', fontWeight: 'bold' }}>
                                        {validatedItems.filter(item => (item.price_retail < item.old_retail) || (item.price_wholesale < item.old_wholesale)).length}
                                    </div>
                                    <div style={{ color: '#94a3b8', fontSize: '0.7rem', textTransform: 'uppercase' }}>Reducciones</div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ color: '#3b82f6', fontSize: '1.25rem', fontWeight: 'bold' }}>
                                        {validatedItems.filter(item => (item.price_retail === item.old_retail) && (item.price_wholesale === item.old_wholesale)).length}
                                    </div>
                                    <div style={{ color: '#94a3b8', fontSize: '0.7rem', textTransform: 'uppercase' }}>Sin Cambios</div>
                                </div>
                            </div>

                            <h4 style={{ color: 'white', marginBottom: '1rem' }}>Detalle de Comparativa</h4>
                            <div style={{ border: '1px solid #334155', borderRadius: '0.5rem', overflow: 'hidden', maxHeight: '350px', overflowY: 'auto' }}>
                                <table style={{ width: '100%', color: 'white', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                    <thead style={{ backgroundColor: '#1e293b', position: 'sticky', top: 0, zIndex: 10 }}>
                                        <tr style={{ textAlign: 'left' }}>
                                            <th style={{ padding: '0.75rem' }}>Producto</th>
                                            <th style={{ padding: '0.75rem' }}>P. Minorista (Retail)</th>
                                            <th style={{ padding: '0.75rem' }}>P. Mayorista (Wholesale)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {validatedItems.map((item, i) => {
                                            const getDiff = (curr, old) => {
                                                const diff = curr - old;
                                                const pct = old > 0 ? (diff / old) * 100 : 0;
                                                const color = diff > 0 ? '#10b981' : diff < 0 ? '#ef4444' : '#64748b';
                                                const icon = diff > 0 ? '↑' : diff < 0 ? '↓' : '=';
                                                return { diff, pct, color, icon };
                                            };

                                            const retailMeta = getDiff(item.price_retail, item.old_retail);
                                            const wholesaleMeta = getDiff(item.price_wholesale, item.old_wholesale);

                                            return (
                                                <tr key={i} style={{ borderTop: '1px solid #334155', transition: 'background 0.2s' }} className="hover-row">
                                                    <td style={{ padding: '0.75rem' }}>
                                                        <div style={{ fontWeight: 'bold', color: '#f8fafc' }}>{item.sku}</div>
                                                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{item.name}</div>
                                                    </td>
                                                    <td style={{ padding: '0.75rem' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <div style={{ textDecoration: 'line-through', color: '#475569', fontSize: '0.75rem' }}>{item.old_retail.toFixed(3)}</div>
                                                            <div style={{ color: retailMeta.color, fontWeight: 'bold' }}>{item.price_retail.toFixed(3)}</div>
                                                            {retailMeta.diff !== 0 && (
                                                                <div style={{
                                                                    fontSize: '0.65rem', padding: '2px 4px', borderRadius: '4px',
                                                                    backgroundColor: `${retailMeta.color}15`, color: retailMeta.color,
                                                                    border: `1px solid ${retailMeta.color}30`
                                                                }}>
                                                                    {retailMeta.icon} {Math.abs(retailMeta.pct).toFixed(1)}%
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '0.75rem' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <div style={{ textDecoration: 'line-through', color: '#475569', fontSize: '0.75rem' }}>{item.old_wholesale.toFixed(3)}</div>
                                                            <div style={{ color: wholesaleMeta.color, fontWeight: 'bold' }}>{item.price_wholesale.toFixed(3)}</div>
                                                            {wholesaleMeta.diff !== 0 && (
                                                                <div style={{
                                                                    fontSize: '0.65rem', padding: '2px 4px', borderRadius: '4px',
                                                                    backgroundColor: `${wholesaleMeta.color}15`, color: wholesaleMeta.color,
                                                                    border: `1px solid ${wholesaleMeta.color}30`
                                                                }}>
                                                                    {wholesaleMeta.icon} {Math.abs(wholesaleMeta.pct).toFixed(1)}%
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            {validationStatus.errors.length > 0 && (
                                <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: '0.5rem' }}>
                                    <h5 style={{ color: '#ef4444', margin: '0 0 0.5rem 0' }}>⚠️ Algunos productos fueron omitidos:</h5>
                                    <ul style={{ color: '#94a3b8', fontSize: '0.75rem', margin: 0, paddingLeft: '1.2rem', maxHeight: '100px', overflowY: 'auto' }}>
                                        {validationStatus.errors.map((err, i) => <li key={i}>{err}</li>)}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{ padding: '1.5rem', borderTop: '1px solid #334155', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    <Button variant="secondary" onClick={() => step > 1 ? setStep(step - 1) : onClose()}>
                        {step === 1 ? 'Cancelar' : 'Atrás'}
                    </Button>
                    {step < 3 ? (
                        <Button onClick={nextStep} disabled={!pastedData.trim() || validationStatus.loading}>
                            Continuar
                        </Button>
                    ) : (
                        <Button onClick={confirmImport} variant="primary">
                            Cargar a la Lista
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PriceImportModal;
