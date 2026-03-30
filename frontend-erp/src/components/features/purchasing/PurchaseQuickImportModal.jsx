import React, { useState, useEffect } from 'react';
import Button from '../../common/Button';
import { inventoryService } from '../../../services/api';

const PurchaseQuickImportModal = ({ visible, onClose, onImport }) => {
    const [pastedData, setPastedData] = useState('');
    const [rawRows, setRawRows] = useState([]); // Array of Arrays (from clipboard)
    const [finalItems, setFinalItems] = useState([]); // Array of Objects (validated)
    const [mapping, setMapping] = useState({ sku: 0, name: 1, quantity: 2, cost: 3 });
    const [step, setStep] = useState(1); // 1: Paste, 2: Map & Validate, 3: Final Review
    const [validationStatus, setValidationStatus] = useState({ loading: false, errors: [] });

    if (!visible) return null;

    const handlePaste = (e) => {
        const text = e.target.value;
        setPastedData(text);

        // Basic parsing to show a preview
        const rows = text.trim().split('\n').map(row => row.split('\t'));
        setRawRows(rows);
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
        const processedItems = [];
        const errors = [];

        for (let i = 0; i < rawRows.length; i++) {
            const row = rawRows[i];
            const sku = row[mapping.sku]?.trim();
            const rawName = row[mapping.name]?.trim();
            const qty = parseFloat(row[mapping.quantity]) || 1;
            const cost = parseFloat(row[mapping.cost]) || 0;

            if (!sku) continue;

            try {
                // Try to find in db
                const res = await inventoryService.getProducts(1, 1, sku);
                const product = res.data.items.find(p => p.sku.toLowerCase() === sku.toLowerCase());

                if (product) {
                    processedItems.push({
                        product_sku: product.sku,
                        product_name: product.name,
                        quantity: qty,
                        unit_cost: cost || product.cost || 0,
                        subtotal: qty * (cost || product.cost || 0),
                        is_custom: false
                    });
                } else {
                    // Mark as CUSTOM
                    processedItems.push({
                        product_sku: sku.toUpperCase(),
                        product_name: rawName || sku.toUpperCase(),
                        quantity: qty,
                        unit_cost: cost || 0,
                        subtotal: qty * (cost || 0),
                        is_custom: true
                    });
                }
            } catch (err) {
                errors.push(`Fila ${i + 1}: Error validando SKU "${sku}".`);
            }
        }

        setValidationStatus({ loading: false, errors });
        setFinalItems(processedItems);
        setStep(3);
    };

    const confirmImport = () => {
        onImport(finalItems);
        onClose();
        // Reset state
        setStep(1);
        setPastedData('');
        setRawRows([]);
        setFinalItems([]);
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 2000, padding: '2rem',
            backdropFilter: 'blur(4px)'
        }}>
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
                        <h2 style={{ color: 'white', margin: 0, fontSize: '1.25rem' }}>Importar Cotización (Compras)</h2>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                </div>

                {/* Content */}
                <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
                    {step === 1 && (
                        <div>
                            <p style={{ color: '#94a3b8', marginBottom: '1.5rem', fontSize: '0.95rem', lineHeight: '1.5' }}>
                                Copia el rango de celdas en tu <strong style={{ color: '#10b981' }}>Excel</strong> que contenga el <strong style={{ color: 'white' }}>SKU</strong>, 
                                <strong style={{ color: 'white' }}>Nombre</strong>, <strong style={{ color: 'white' }}>Cantidad</strong> y <strong style={{ color: 'white' }}>Costo</strong>.
                                <br/><span style={{ fontSize: '0.8rem' }}>* Los SKUs no encontrados se marcarán como productos nuevos.</span>
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
                                    resize: 'none'
                                }}
                            />
                        </div>
                    )}

                    {step === 2 && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <p style={{ color: '#94a3b8', margin: 0 }}>Define qué contiene cada columna:</p>
                            </div>
                            <div style={{ border: '1px solid #334155', borderRadius: '0.5rem', overflow: 'hidden' }}>
                                <table style={{ width: '100%', color: 'white', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ textAlign: 'left', backgroundColor: '#1e293b' }}>
                                            {rawRows[0]?.map((_, i) => (
                                                <th key={i} style={{ padding: '0.75rem', fontSize: '0.8rem' }}>
                                                    <select
                                                        value={mapping.sku === i ? 'sku' : mapping.name === i ? 'name' : mapping.quantity === i ? 'qty' : mapping.cost === i ? 'cost' : 'none'}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            if (val === 'sku') setMapping({ ...mapping, sku: i });
                                                            if (val === 'name') setMapping({ ...mapping, name: i });
                                                            if (val === 'qty') setMapping({ ...mapping, quantity: i });
                                                            if (val === 'cost') setMapping({ ...mapping, cost: i });
                                                        }}
                                                        style={{ backgroundColor: '#0f172a', color: 'white', border: '1px solid #475569', padding: '0.4rem', borderRadius: '6px', fontSize: '0.8rem' }}
                                                    >
                                                        <option value="none">Ignorar</option>
                                                        <option value="sku">📍 SKU / Código</option>
                                                        <option value="name">📝 Nombre</option>
                                                        <option value="qty">🔢 Cantidad</option>
                                                        <option value="cost">💰 Costo Unit.</option>
                                                    </select>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rawRows.slice(0, 5).map((row, idx) => (
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
                                <h4 style={{ color: 'white', margin: 0, fontSize: '1.1rem' }}>Resumen de Importación</h4>
                                <div style={{ padding: '0.4rem 0.8rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: '2rem', border: '1px solid #10b981', fontSize: '0.75rem', color: '#34d399' }}>
                                    {finalItems.length} items listos
                                </div>
                            </div>
                            <div style={{ border: '1px solid #334155', borderRadius: '0.5rem', overflow: 'hidden' }}>
                                <table style={{ width: '100%', color: 'white', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                    <thead>
                                        <tr style={{ textAlign: 'left', backgroundColor: '#1e293b', color: '#64748b' }}>
                                            <th style={{ padding: '0.75rem' }}>SKU</th>
                                            <th style={{ padding: '0.75rem' }}>Producto</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'center' }}>Cant.</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'right' }}>Costo</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {finalItems.map((item, i) => (
                                            <tr key={i} style={{ borderTop: '1px solid #334155' }}>
                                                <td style={{ padding: '0.75rem' }}>
                                                    {item.product_sku}
                                                    {item.is_custom && <span style={{ marginLeft: '4px', fontSize: '0.65rem', backgroundColor: '#eab308', color: 'black', padding: '1px 3px', borderRadius: '2px' }}>NUEVO</span>}
                                                </td>
                                                <td style={{ padding: '0.75rem' }}>{item.product_name}</td>
                                                <td style={{ padding: '0.75rem', textAlign: 'center' }}>{item.quantity}</td>
                                                <td style={{ padding: '0.75rem', textAlign: 'right' }}>{item.unit_cost}</td>
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
                    <Button variant="secondary" onClick={() => step > 1 ? setStep(step - 1) : onClose()}>
                        {step === 1 ? 'Cancelar' : 'Atrás'}
                    </Button>
                    <Button onClick={step < 3 ? nextStep : confirmImport}>
                        {step === 3 ? 'Confirmar e Importar' : 'Continuar'}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default PurchaseQuickImportModal;
