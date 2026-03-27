import React, { useState, useEffect } from 'react';
import Button from '../../common/Button';
import Input from '../../common/Input';
import { formatCurrency } from '../../../utils/formatters';

const EMITTER_MAP = {
    '20606277432': { name: 'DIROGSA S.R.L.', logo: '🏢', businessName: 'DIROGSA', color: '#10b981' },
    '10434346318': { name: 'JEEF GELDER ROJAS GARCIA', logo: '👤', businessName: 'JEEF ROJAS', color: '#3b82f6' }
};

const XMLReviewModal = ({ visible, doc, onClose, onConfirm }) => {
    const [exchangeRate, setExchangeRate] = useState(1);
    const [localItems, setLocalItems] = useState([]);
    const [emitter, setEmitter] = useState(null);

    useEffect(() => {
        if (doc) {
            // Detetar emisor
            const emitterInfo = EMITTER_MAP[doc.supplier.ruc] || {
                name: doc.supplier.name,
                logo: '❓',
                businessName: 'Desconocido',
                color: '#64748b'
            };
            setEmitter(emitterInfo);

            // Inicializar items
            setLocalItems(doc.items.map(item => ({
                ...item,
                manual_price: item.unit_price // Ya incluye IGV según ublParser
            })));

            // Sugerir tipo de cambio si es USD
            if (doc.currency === 'DOLARES' || doc.currency === 'USD' || doc.currency === 'PEN' === false) {
                setExchangeRate(3.75); // Referencia promedio
            } else {
                setExchangeRate(1);
            }
        }
    }, [doc]);

    if (!visible || !doc) return null;

    const calculateSystemTotal = () => {
        return localItems.reduce((sum, item) => sum + (item.quantity * item.manual_price * exchangeRate), 0);
    };

    const xmlTotalInSoles = doc.total_amount * exchangeRate;
    const systemTotal = calculateSystemTotal();
    const difference = systemTotal - xmlTotalInSoles;
    const isBalanced = Math.abs(difference) < 0.05;

    const handleConfirm = () => {
        const finalData = {
            ...doc,
            currency: 'PEN',
            exchange_rate: exchangeRate,
            items: localItems.map(item => ({
                ...item,
                unit_price: Math.round((item.manual_price * exchangeRate) * 100) / 100,
                subtotal: Math.round((item.quantity * item.manual_price * exchangeRate) * 100) / 100
            })),
            total_amount: Math.round(systemTotal * 100) / 100,
            original_xml_id: doc.document_number,
            emitter_identity: emitter.businessName
        };
        onConfirm(finalData);
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 1200, padding: '1rem'
        }}>
            <div style={{
                backgroundColor: '#0f172a',
                borderRadius: '1.5rem',
                border: '1px solid #334155',
                width: '100%', maxWidth: '900px',
                maxHeight: '90vh', overflowY: 'auto',
                display: 'flex', flexDirection: 'column',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
                color: '#e2e8f0'
            }}>
                {/* Header */}
                <div style={{
                    padding: '1.5rem',
                    backgroundColor: '#1e293b',
                    borderBottom: '1px solid #334155',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderTopLeftRadius: '1.5rem',
                    borderTopRightRadius: '1.5rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{
                            fontSize: '1.25rem', padding: '0.5rem 1rem', borderRadius: '0.75rem',
                            backgroundColor: emitter?.color + '22', border: `1px solid ${emitter?.color}`,
                            color: emitter?.color, fontWeight: '800'
                        }}>
                            {emitter?.logo} {emitter?.businessName}
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <h2 style={{ margin: 0, fontSize: '1.1rem', color: 'white' }}>Revisión de XML: {doc.document_number}</h2>
                                <span style={{ fontSize: '0.7rem', backgroundColor: '#334155', color: '#60a5fa', padding: '0.2rem 0.6rem', borderRadius: '0.5rem', fontWeight: 'bold' }}>📅 FECHA: {doc.date}</span>
                            </div>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>{doc.supplier.name} - RUC: {doc.supplier.ruc}</p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '2rem', cursor: 'pointer', color: '#94a3b8' }}>×</button>
                </div>

                <div style={{ padding: '1.5rem' }}>
                    {/* Currency & T.C. Controls */}
                    <div style={{
                        display: 'flex', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2rem',
                        padding: '1.25rem', backgroundColor: '#1e293b', borderRadius: '1rem', border: '1px solid #334155'
                    }}>
                        <div style={{ flex: 1, minWidth: '120px' }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.5rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Fecha Emisión</label>
                            <div style={{ padding: '0.6rem', backgroundColor: '#0f172a', borderRadius: '0.5rem', border: '1px solid #334155', fontWeight: 'bold', color: '#60a5fa' }}>
                                📅 {doc.date}
                            </div>
                        </div>

                        <div style={{ flex: 1, minWidth: '120px' }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.5rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Moneda Original</label>
                            <div style={{ padding: '0.6rem', backgroundColor: '#0f172a', borderRadius: '0.5rem', border: '1px solid #334155', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontSize: '1.2rem' }}>{doc.currency === 'DOLARES' || doc.currency === 'USD' ? '💵' : '🇵🇪'}</span>
                                <span style={{ fontWeight: 'bold' }}>{doc.currency}</span>
                            </div>
                        </div>

                        {(doc.currency === 'DOLARES' || doc.currency === 'USD') && (
                            <div style={{ flex: 1, minWidth: '150px' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', color: '#60a5fa', marginBottom: '0.5rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Tipo de Cambio (T.C.)</label>
                                <Input
                                    type="number"
                                    step="0.001"
                                    value={exchangeRate}
                                    onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 0)}
                                    placeholder="Ej: 3.75"
                                    style={{ margin: 0, border: '2px solid #2563eb' }}
                                />
                            </div>
                        )}

                        <div style={{ flex: 1, minWidth: '150px' }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.5rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Total Original XML</label>
                            <div style={{ padding: '0.6rem', color: 'white', fontWeight: '800', fontSize: '1.1rem' }}>
                                {doc.currency === 'DOLARES' || doc.currency === 'USD' ? `$ ` : `S/ `} {doc.total_amount.toFixed(2)}
                            </div>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div style={{ border: '1px solid #334155', borderRadius: '0.75rem', overflow: 'hidden', backgroundColor: '#0f172a' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                            <thead style={{ backgroundColor: '#1e293b', color: '#94a3b8', borderBottom: '1px solid #334155' }}>
                                <tr>
                                    <th style={{ textAlign: 'left', padding: '1rem' }}>Producto</th>
                                    <th style={{ textAlign: 'center', padding: '1rem' }}>Cant.</th>
                                    <th style={{ textAlign: 'right', padding: '1rem' }}>Precio (Neto)</th>
                                    <th style={{ textAlign: 'right', padding: '1rem' }}>Precio + IGV</th>
                                    <th style={{ textAlign: 'right', padding: '1rem' }}>Total Soles</th>
                                </tr>
                            </thead>
                            <tbody>
                                {localItems.map((item, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid #1e293b' }}>
                                        <td style={{ padding: '0.8rem 1rem' }}>
                                            <div style={{ fontWeight: 'bold', color: 'white' }}>{item.product_sku}</div>
                                            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{item.product_name}</div>
                                        </td>
                                        <td style={{ textAlign: 'center', padding: '1rem', color: '#cbd5e1' }}>{item.quantity}</td>
                                        <td style={{ textAlign: 'right', padding: '1rem', color: '#94a3b8' }}>
                                            {item.net_unit_price.toFixed(3)}
                                        </td>
                                        <td style={{ textAlign: 'right', padding: '1rem' }}>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={item.manual_price}
                                                onChange={(e) => {
                                                    const val = parseFloat(e.target.value) || 0;
                                                    const newItems = [...localItems];
                                                    newItems[idx].manual_price = val;
                                                    setLocalItems(newItems);
                                                }}
                                                style={{
                                                    width: '80px', background: '#1e293b', border: '1px solid #334155',
                                                    color: '#fbbf24', padding: '0.3rem', borderRadius: '0.4rem', textAlign: 'right', fontWeight: 'bold'
                                                }}
                                            />
                                        </td>
                                        <td style={{ textAlign: 'right', padding: '1rem', color: 'white', fontWeight: 'bold' }}>
                                            {formatCurrency(item.quantity * item.manual_price * exchangeRate)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Reconciliation Footer */}
                    <div style={{
                        marginTop: '2rem', padding: '1.5rem', borderRadius: '1rem',
                        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                        border: `1px solid ${isBalanced ? '#10b98144' : '#ef444444'}`,
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                        <div style={{ display: 'flex', gap: '2rem' }}>
                            <div>
                                <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Total en XML (A Soles)</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'white' }}>{formatCurrency(xmlTotalInSoles)}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Total Calculado Sistema</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: '800', color: isBalanced ? '#10b981' : '#f87171' }}>{formatCurrency(systemTotal)}</div>
                            </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                            <div style={{
                                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                                padding: '0.5rem 1rem', borderRadius: '2rem', fontSize: '0.85rem', fontWeight: 'bold',
                                backgroundColor: isBalanced ? '#064e3b' : '#450a0a',
                                color: isBalanced ? '#34d399' : '#f87171'
                            }}>
                                {isBalanced ? '✅ Cuadre de Totales Correcto' : `⚠️ Diferencia de S/ ${difference.toFixed(2)}`}
                            </div>
                            {!isBalanced && (
                                <p style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.5rem' }}>Ajusta decimales en los precios unitarios para cuadrar.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Confirm Button */}
                <div style={{
                    padding: '1.5rem', borderTop: '1px solid #334155', backgroundColor: '#1e293b',
                    borderBottomLeftRadius: '1.5rem', borderBottomRightRadius: '1.5rem',
                    display: 'flex', justifyContent: 'flex-end', gap: '1rem'
                }}>
                    <Button variant="secondary" onClick={onClose} style={{ border: 'none' }}>Cancelar</Button>
                    <Button
                        variant="primary"
                        onClick={handleConfirm}
                        style={{
                            backgroundColor: isBalanced ? '#2563eb' : '#64748b',
                            boxShadow: isBalanced ? '0 4px 12px rgba(37, 99, 235, 0.4)' : 'none'
                        }}
                    >
                        Generar Cotización en Soles 🚀
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default XMLReviewModal;
