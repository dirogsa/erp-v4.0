import React, { useEffect, useState } from 'react';
import Button from '../../common/Button';

const ConversionConfirmationModal = ({
    quote,
    onClose,
    onConfirm, // Function that takes (quoteNumber, preview)
    visible
}) => {
    const [loading, setLoading] = useState(false);
    const [previewData, setPreviewData] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (visible && quote) {
            loadPreview();
        } else {
            setPreviewData(null);
            setError(null);
        }
    }, [visible, quote]);

    const loadPreview = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await onConfirm(quote.quote_number, true); // PREVIEW = true
            setPreviewData(data);
        } catch (err) {
            console.error(err);
            setError('Error al verificar stock. Asegurese de que la cotización no esté vencida o ya convertida.');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = async () => {
        setLoading(true);
        try {
            await onConfirm(quote.quote_number, false); // PREVIEW = false (Execute)
            onClose();
        } catch (err) {
            // Error handling usually in hook
        } finally {
            setLoading(false);
        }
    };

    if (!visible || !quote) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000,
            padding: '2rem'
        }}>
            <div style={{
                backgroundColor: '#0f172a', borderRadius: '0.5rem', width: '100%', maxWidth: '600px',
                padding: '2rem', color: 'white',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}>
                <h2 style={{ marginTop: 0, marginBottom: '1rem' }}>Confirmar Conversión</h2>
                <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>Cotización: <strong style={{ color: 'white' }}>{quote.quote_number}</strong></p>

                {loading && !previewData && (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                        Verificando stock...
                    </div>
                )}

                {error && (
                    <div style={{ padding: '1rem', backgroundColor: '#450a0a', border: '1px solid #ef4444', borderRadius: '0.5rem', marginBottom: '1rem', color: '#fca5a5' }}>
                        {error}
                    </div>
                )}

                {previewData && (
                    <div style={{ marginBottom: '2rem' }}>
                        {previewData.will_split ? (
                            <div style={{ padding: '1rem', backgroundColor: '#451a03', border: '1px solid #f59e0b', borderRadius: '0.5rem', marginBottom: '1rem' }}>
                                <h3 style={{ color: '#f59e0b', marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span>⚠️</span> Stock Insuficiente (Parcial)
                                </h3>
                                <p style={{ margin: '0.5rem 0', color: '#fbbf24', fontSize: '0.9rem' }}>
                                    Algunos productos no tienen stock suficiente disponible (considerando reservas).
                                    Se generará un <strong>Backorder</strong> por la diferencia.
                                </p>
                            </div>
                        ) : (
                            <div style={{ padding: '1rem', backgroundColor: '#064e3b', border: '1px solid #10b981', borderRadius: '0.5rem', marginBottom: '1rem' }}>
                                <h3 style={{ color: '#10b981', marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span>✅</span> Stock Disponible
                                </h3>
                                <p style={{ margin: '0.5rem 0', color: '#d1fae5' }}>Todos los items están disponibles para despacho inmediato.</p>
                            </div>
                        )}

                        <div style={{ backgroundColor: '#1e293b', borderRadius: '0.5rem', overflow: 'hidden' }}>
                            <h4 style={{ margin: '1rem', color: '#94a3b8' }}>Análisis de Stock</h4>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                    <thead>
                                        <tr style={{ backgroundColor: '#0f172a', textAlign: 'left' }}>
                                            <th style={{ padding: '0.75rem', color: '#94a3b8' }}>Producto</th>
                                            <th style={{ padding: '0.75rem', color: '#94a3b8', textAlign: 'center' }}>Solicitado</th>
                                            <th style={{ padding: '0.75rem', color: '#94a3b8', textAlign: 'center' }}>Físico</th>
                                            <th style={{ padding: '0.75rem', color: '#94a3b8', textAlign: 'center' }}>Reservado</th>
                                            <th style={{ padding: '0.75rem', color: '#94a3b8', textAlign: 'center' }}>Disponible</th>
                                            <th style={{ padding: '0.75rem', color: '#94a3b8', textAlign: 'center' }}>Faltante</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {/* Combine items for display (Available + Missing logic is split, but we want to show original requested rows ideally? 
                                            Actually the backend splits them. Let's iterate over Missing Items primarily as they are the critical ones, 
                                            and Available items that are fully available. 
                                            Since the API returns split structure, let's just list the Missing Items clearly, and maybe summary for others.
                                            Actually, let's assume 'missing_items' contains the problematic ones with detailed info.
                                         */}
                                        {previewData.stock_check?.missing_items?.map((item, idx) => (
                                            <tr key={`miss-${idx}`} style={{ borderBottom: '1px solid #334155' }}>
                                                <td style={{ padding: '0.5rem', color: '#fca5a5' }}>
                                                    <div>{item.product_name}</div>
                                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{item.product_sku}</div>
                                                </td>
                                                <td style={{ padding: '0.5rem', textAlign: 'center' }}>{item.required_quantity}</td>
                                                <td style={{ padding: '0.5rem', textAlign: 'center' }}>{item.stock_physical}</td>
                                                <td style={{ padding: '0.5rem', textAlign: 'center', color: '#fbbf24' }}>{item.stock_committed}</td>
                                                <td style={{ padding: '0.5rem', textAlign: 'center' }}>{Math.max(0, item.stock_physical - item.stock_committed)}</td>
                                                <td style={{ padding: '0.5rem', textAlign: 'center', color: '#ef4444', fontWeight: 'bold' }}>{item.missing_quantity}</td>
                                            </tr>
                                        ))}
                                        {/* Also show fully available items for completeness if user wants to see "what is reserved" for them too */}
                                        {previewData.stock_check?.available_items?.map((item, idx) => (
                                            <tr key={`avail-${idx}`} style={{ borderBottom: '1px solid #334155' }}>
                                                <td style={{ padding: '0.5rem', color: '#d1fae5' }}>
                                                    <div style={{ fontWeight: '500' }}>{item.product_name || 'Producto'}</div>
                                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{item.product_sku}</div>
                                                </td>
                                                <td style={{ padding: '0.5rem', textAlign: 'center' }}>{item.quantity}</td>
                                                <td style={{ padding: '0.5rem', textAlign: 'center', color: '#94a3b8' }}>{item.stock_info?.physical || '-'}</td>
                                                <td style={{ padding: '0.5rem', textAlign: 'center', color: '#fbbf24' }}>{item.stock_info?.committed || 0}</td>
                                                <td style={{ padding: '0.5rem', textAlign: 'center', color: '#10b981' }}>{item.quantity}</td>
                                                <td style={{ padding: '0.5rem', textAlign: 'center' }}>0</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                    <Button variant="secondary" onClick={onClose} disabled={loading}>Cancelar</Button>
                    <Button onClick={handleConfirm} disabled={loading || error || !previewData}>
                        {loading ? 'Procesando...' : (previewData?.will_split ? 'Confirmar y Crear Backorder' : 'Confirmar Conversión')}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ConversionConfirmationModal;
