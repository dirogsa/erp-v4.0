import React, { useState, useEffect } from 'react';
import Button from '../../common/Button';
import { inventoryService } from '../../../services/api';

const QuickImportModal = ({ visible, onClose, onImport }) => {
    const [pastedData, setPastedData] = useState('');
    const [parsedItems, setParsedItems] = useState([]);
    const [mapping, setMapping] = useState({ sku: 0, quantity: 1, price: 2 });
    const [step, setStep] = useState(1); // 1: Paste, 2: Map & Validate, 3: Final Review
    const [validationStatus, setValidationStatus] = useState({ loading: false, errors: [] });

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

        for (let i = 0; i < parsedItems.length; i++) {
            const row = parsedItems[i];
            const sku = row[mapping.sku]?.trim();
            const qty = parseFloat(row[mapping.quantity]) || 1;
            const price = parseFloat(row[mapping.price]) || null;

            if (!sku) continue;

            try {
                const res = await inventoryService.getProducts(1, 1, sku);
                const product = res.data.items.find(p => p.sku.toLowerCase() === sku.toLowerCase());

                if (product) {
                    finalItems.push({
                        product_sku: product.sku,
                        product_name: product.name,
                        quantity: qty,
                        unit_price: price || product.price_retail,
                        stock: product.stock_current,
                        subtotal: qty * (price || product.price_retail)
                    });
                } else {
                    errors.push(`Fila ${i + 1}: SKU "${sku}" no encontrado.`);
                }
            } catch (err) {
                errors.push(`Fila ${i + 1}: Error validando SKU "${sku}".`);
            }
        }

        setValidationStatus({ loading: false, errors });
        setParsedItems(finalItems);
        setStep(3);
    };

    const confirmImport = () => {
        onImport(parsedItems);
        onClose();
        // Reset state
        setStep(1);
        setPastedData('');
        setParsedItems([]);
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
                width: '100%', maxWidth: '800px',
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
                            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '0.25rem' }}>Esto puede demorar unos segundos...</p>
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
                        <h2 style={{ color: 'white', margin: 0, fontSize: '1.25rem' }}>Importar desde Excel</h2>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer', opacity: validationStatus.loading ? 0.5 : 1 }} disabled={validationStatus.loading}>×</button>
                </div>

                {/* Content */}
                <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
                    {step === 1 && (
                        <div>
                            <p style={{ color: '#94a3b8', marginBottom: '1.5rem', fontSize: '0.95rem', lineHeight: '1.5' }}>
                                Copia el rango de celdas en tu <strong style={{ color: '#10b981' }}>Excel</strong> que contenga el <strong style={{ color: 'white' }}>SKU</strong>,
                                la <strong style={{ color: 'white' }}>Cantidad</strong> y opcionalmente el <strong style={{ color: 'white' }}>Precio</strong>.
                            </p>
                            <textarea
                                value={pastedData}
                                onChange={handlePaste}
                                placeholder="Haz clic aquí y presiona Ctrl + V para pegar..."
                                style={{
                                    width: '100%', height: '300px',
                                    backgroundColor: '#1e293b', color: 'white',
                                    border: '2px dashed #334155', borderRadius: '0.75rem',
                                    padding: '1rem', fontFamily: 'monospace', fontSize: '0.9rem',
                                    outline: 'none', transition: 'border-color 0.2s',
                                    resize: 'none'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                onBlur={(e) => e.target.style.borderColor = '#334155'}
                            />
                        </div>
                    )}

                    {step === 2 && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <p style={{ color: '#94a3b8', margin: 0 }}>Define qué contiene cada columna:</p>
                                <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Mostrando previa de las primeras 5 filas</span>
                            </div>
                            <div style={{ border: '1px solid #334155', borderRadius: '0.5rem', overflow: 'hidden' }}>
                                <table style={{ width: '100%', color: 'white', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ textAlign: 'left', backgroundColor: '#1e293b' }}>
                                            {parsedItems[0]?.map((_, i) => (
                                                <th key={i} style={{ padding: '0.75rem', fontSize: '0.8rem' }}>
                                                    <select
                                                        value={mapping.sku === i ? 'sku' : mapping.quantity === i ? 'qty' : mapping.price === i ? 'price' : 'none'}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            if (val === 'sku') setMapping({ ...mapping, sku: i });
                                                            if (val === 'qty') setMapping({ ...mapping, quantity: i });
                                                            if (val === 'price') setMapping({ ...mapping, price: i });
                                                        }}
                                                        style={{
                                                            backgroundColor: '#0f172a',
                                                            color: 'white',
                                                            border: '1px solid #475569',
                                                            padding: '0.4rem',
                                                            borderRadius: '6px',
                                                            width: '100%',
                                                            cursor: 'pointer',
                                                            fontSize: '0.8rem'
                                                        }}
                                                    >
                                                        <option value="none">Ignorar</option>
                                                        <option value="sku">📍 SKU / Código</option>
                                                        <option value="qty">🔢 Cantidad</option>
                                                        <option value="price">💰 Precio Personalizado</option>
                                                    </select>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {parsedItems.slice(0, 5).map((row, idx) => (
                                            <tr key={idx} style={{ borderTop: '1px solid #334155' }}>
                                                {row.map((cell, i) => (
                                                    <td key={i} style={{ padding: '0.75rem', color: '#94a3b8', fontSize: '0.85rem' }}>{cell}</td>
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
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h4 style={{ color: 'white', margin: 0, fontSize: '1.1rem' }}>Resumen Final</h4>
                                <div style={{
                                    padding: '0.4rem 0.8rem',
                                    backgroundColor: validationStatus.errors.length > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                    borderRadius: '2rem',
                                    border: `1px solid ${validationStatus.errors.length > 0 ? '#ef4444' : '#10b981'}`,
                                    fontSize: '0.75rem',
                                    color: validationStatus.errors.length > 0 ? '#f87171' : '#34d399'
                                }}>
                                    {validationStatus.errors.length > 0 ? `${validationStatus.errors.length} errores` : 'Todo válido'}
                                </div>
                            </div>

                            <div style={{ backgroundColor: '#1e293b', padding: '1.25rem', borderRadius: '0.75rem', marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <span style={{ fontSize: '1.5rem' }}>📦</span>
                                    <div>
                                        <p style={{ color: 'white', fontWeight: 'bold', margin: 0 }}>{parsedItems.length} productos procesados</p>
                                        <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>Listos para añadir a la cotización actual.</p>
                                    </div>
                                </div>
                                {validationStatus.errors.length > 0 && (
                                    <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #334155' }}>
                                        <p style={{ color: '#fca5a5', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 'bold' }}>⚠️ Algunos productos fueron omitidos:</p>
                                        <div style={{ maxHeight: '120px', overflowY: 'auto', fontSize: '0.8rem', color: '#fca5a5', paddingRight: '0.5rem' }}>
                                            {validationStatus.errors.map((err, i) => <div key={i} style={{ marginBottom: '0.25rem' }}>• {err}</div>)}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div style={{ border: '1px solid #334155', borderRadius: '0.5rem', overflow: 'hidden' }}>
                                <table style={{ width: '100%', color: 'white', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                    <thead>
                                        <tr style={{ textAlign: 'left', backgroundColor: '#1e293b', color: '#64748b' }}>
                                            <th style={{ padding: '0.75rem' }}>SKU</th>
                                            <th style={{ padding: '0.75rem' }}>Producto</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'center' }}>Cant.</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'right' }}>Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {parsedItems.map((item, i) => (
                                            <tr key={i} style={{ borderTop: '1px solid #334155' }}>
                                                <td style={{ padding: '0.75rem', fontWeight: '500' }}>{item.product_sku}</td>
                                                <td style={{ padding: '0.75rem' }}>{item.product_name}</td>
                                                <td style={{ padding: '0.75rem', textAlign: 'center' }}>{item.quantity}</td>
                                                <td style={{ padding: '0.75rem', textAlign: 'right', color: '#10b981' }}>S/ {item.subtotal.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{ padding: '1.5rem', borderTop: '1px solid #334155', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    <Button
                        variant="secondary"
                        onClick={() => step > 1 ? setStep(step - 1) : onClose()}
                        disabled={validationStatus.loading}
                    >
                        {step === 1 ? 'Cancelar' : 'Atrás'}
                    </Button>
                    {step < 3 ? (
                        <Button
                            onClick={nextStep}
                            disabled={!pastedData || (step === 1 && !pastedData.trim()) || validationStatus.loading}
                        >
                            {validationStatus.loading ? 'Procesando...' : 'Continuar'}
                        </Button>
                    ) : (
                        <Button
                            onClick={confirmImport}
                            variant="primary"
                            disabled={parsedItems.length === 0 || validationStatus.loading}
                        >
                            Confirmar e Importar
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QuickImportModal;
