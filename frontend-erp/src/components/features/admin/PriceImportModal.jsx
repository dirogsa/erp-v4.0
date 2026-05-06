import React, { useState } from 'react';
import Button from '../../common/Button';
import { inventoryService, salesPolicyService } from '../../../services/api';

const PriceImportModal = ({ visible, onClose, onImported }) => {
    const [pastedData, setPastedData] = useState('');
    const [parsedItems, setParsedItems] = useState([]);
    const [validatedItems, setValidatedItems] = useState([]);
    const [mapping, setMapping] = useState({ sku: 0, price: 1 });
    const [step, setStep] = useState(1);
    const [validationStatus, setValidationStatus] = useState({ loading: false, errors: [] });

    React.useEffect(() => {
        if (!visible) {
            setStep(1);
            setPastedData('');
            setParsedItems([]);
            setValidatedItems([]);
        }
    }, [visible]);

    if (!visible) return null;

    const handlePaste = (e) => {
        const text = e.target.value;
        setPastedData(text);
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

        for (let i = 0; i < parsedItems.length; i++) {
            const row = parsedItems[i];
            const sku = row[mapping.sku]?.trim();
            const priceInput = parseFloat(row[mapping.price]) || 0;
            if (!sku) continue;
            try {
                const res = await inventoryService.getProducts(1, 1, sku);
                const product = res.data.items.find(p => p.sku.toLowerCase() === sku.toLowerCase());
                if (product) {
                    const finalPrice = priceInput > 0 ? priceInput : product.price_list;
                    finalItems.push({
                        sku: product.sku,
                        name: product.name,
                        price_list: finalPrice,
                        old_price_list: product.price_list,
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
    };

    const getDiff = (curr, old) => {
        const diff = curr - old;
        const pct = old > 0 ? (diff / old) * 100 : 0;
        const color = diff > 0 ? '#10b981' : diff < 0 ? '#ef4444' : '#64748b';
        const icon = diff > 0 ? 'up' : diff < 0 ? 'dn' : '=';
        return { diff, pct, color, icon };
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, padding: '2rem', backdropFilter: 'blur(4px)' }}>
            <div style={{ backgroundColor: '#0f172a', borderRadius: '0.75rem', width: '100%', maxWidth: '750px', display: 'flex', flexDirection: 'column', maxHeight: '90vh', border: '1px solid #334155', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
                {/* Header */}
                <div style={{ padding: '1.5rem', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ color: 'white', margin: 0 }}>Importar Precios de Lista desde Excel</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer' }}>x</button>
                </div>

                {/* Content */}
                <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
                    {step === 1 && (
                        <div>
                            <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>
                                Copia desde Excel las columnas <strong style={{ color: 'white' }}>SKU</strong> y <strong style={{ color: 'white' }}>Precio de Lista</strong> y pegaias aqui.
                            </p>
                            <textarea value={pastedData} onChange={handlePaste} placeholder="Pega los datos de Excel aqui..." style={{ width: '100%', height: '300px', backgroundColor: '#1e293b', color: 'white', border: '2px dashed #334155', borderRadius: '0.75rem', padding: '1rem', fontFamily: 'monospace', fontSize: '0.9rem', outline: 'none', resize: 'none', boxSizing: 'border-box' }} />
                        </div>
                    )}

                    {step === 2 && (
                        <div>
                            <p style={{ color: '#94a3b8', marginBottom: '1rem' }}>Indica que columna del Excel corresponde a cada campo:</p>
                            <div style={{ border: '1px solid #334155', borderRadius: '0.5rem', overflow: 'hidden' }}>
                                <table style={{ width: '100%', color: 'white', borderCollapse: 'collapse' }}>
                                    <thead style={{ backgroundColor: '#1e293b' }}>
                                        <tr>
                                            {parsedItems[0]?.map((_, i) => (
                                                <th key={i} style={{ padding: '0.75rem' }}>
                                                    <select
                                                        value={mapping.sku === i ? 'sku' : mapping.price === i ? 'price' : 'none'}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            const nm = { ...mapping };
                                                            if (val === 'none') { if (nm.sku === i) nm.sku = -1; if (nm.price === i) nm.price = -1; }
                                                            else nm[val] = i;
                                                            setMapping(nm);
                                                        }}
                                                        style={{ backgroundColor: '#0f172a', color: 'white', border: '1px solid #475569', padding: '0.4rem', borderRadius: '4px', width: '100%' }}
                                                    >
                                                        <option value="none">Ignorar</option>
                                                        <option value="sku">SKU</option>
                                                        <option value="price">Precio de Lista</option>
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
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#1e293b', borderRadius: '0.75rem', border: '1px solid #334155' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ color: '#10b981', fontSize: '1.25rem', fontWeight: 'bold' }}>{validatedItems.filter(i => i.price_list > i.old_price_list).length}</div>
                                    <div style={{ color: '#94a3b8', fontSize: '0.7rem', textTransform: 'uppercase' }}>Incrementos</div>
                                </div>
                                <div style={{ textAlign: 'center', borderLeft: '1px solid #334155', borderRight: '1px solid #334155' }}>
                                    <div style={{ color: '#ef4444', fontSize: '1.25rem', fontWeight: 'bold' }}>{validatedItems.filter(i => i.price_list < i.old_price_list).length}</div>
                                    <div style={{ color: '#94a3b8', fontSize: '0.7rem', textTransform: 'uppercase' }}>Reducciones</div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ color: '#3b82f6', fontSize: '1.25rem', fontWeight: 'bold' }}>{validatedItems.filter(i => i.price_list === i.old_price_list).length}</div>
                                    <div style={{ color: '#94a3b8', fontSize: '0.7rem', textTransform: 'uppercase' }}>Sin Cambios</div>
                                </div>
                            </div>

                            <div style={{ border: '1px solid #334155', borderRadius: '0.5rem', overflow: 'hidden', maxHeight: '350px', overflowY: 'auto' }}>
                                <table style={{ width: '100%', color: 'white', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                    <thead style={{ backgroundColor: '#1e293b', position: 'sticky', top: 0 }}>
                                        <tr>
                                            <th style={{ padding: '0.75rem', textAlign: 'left' }}>Producto</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'right' }}>Precio de Lista Anterior</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'right' }}>Precio de Lista Nuevo</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {validatedItems.map((item, i) => {
                                            const meta = getDiff(item.price_list, item.old_price_list);
                                            return (
                                                <tr key={i} style={{ borderTop: '1px solid #334155' }}>
                                                    <td style={{ padding: '0.75rem' }}>
                                                        <div style={{ fontWeight: 'bold' }}>{item.sku}</div>
                                                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{item.name}</div>
                                                    </td>
                                                    <td style={{ padding: '0.75rem', textAlign: 'right', textDecoration: 'line-through', color: '#475569' }}>{(item.old_price_list || 0).toFixed(3)}</td>
                                                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                                                        <span style={{ color: meta.color, fontWeight: 'bold' }}>{(item.price_list || 0).toFixed(3)}</span>
                                                        {meta.diff !== 0 && <span style={{ fontSize: '0.65rem', marginLeft: '4px', color: meta.color }}>{meta.icon === 'up' ? 'up' : 'dn'} {Math.abs(meta.pct).toFixed(1)}%</span>}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{ padding: '1.5rem', borderTop: '1px solid #334155', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    <Button variant="secondary" onClick={() => step > 1 ? setStep(step - 1) : onClose()}>
                        {step === 1 ? 'Cancelar' : 'Atras'}
                    </Button>
                    {step < 3 ? (
                        <Button onClick={nextStep} disabled={!pastedData.trim() || validationStatus.loading}>Continuar</Button>
                    ) : (
                        <Button onClick={confirmImport} variant="primary">Cargar a la Lista</Button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PriceImportModal;
