import React, { useState, useEffect } from 'react';
import Button from '../../common/Button';
import Loading from '../../common/Loading';
import { salesService } from '../../../services/api';
import { useNotification } from '../../../hooks/useNotification';

const BackorderConversionPreviewModal = ({ visible, order, onClose, onConfirm }) => {
    const { showNotification } = useNotification();
    const [loading, setLoading] = useState(false);
    const [availability, setAvailability] = useState(null);
    const [converting, setConverting] = useState(false);

    useEffect(() => {
        if (visible && order) {
            fetchAvailability();
        }
    }, [visible, order]);

    const fetchAvailability = async () => {
        setLoading(true);
        try {
            const response = await salesService.checkBackorderAvailability(order.order_number);
            setAvailability(response.data);
        } catch (error) {
            showNotification('Error al verificar disponibilidad', 'error');
            console.error('Error fetching availability:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = async () => {
        setConverting(true);
        try {
            await onConfirm();
        } finally {
            setConverting(false);
        }
    };

    if (!visible || !order) return null;

    const getItemCounts = () => {
        if (!availability?.items) return { fulfilled: 0, partial: 0, pending: 0 };

        let fulfilled = 0;
        let partial = 0;
        let pending = 0;

        availability.items.forEach(item => {
            if (item.available >= item.required) {
                fulfilled++;
            } else if (item.available > 0) {
                partial++;
            } else {
                pending++;
            }
        });

        return { fulfilled, partial, pending };
    };

    const counts = getItemCounts();
    const hasAvailableStock = counts.fulfilled > 0 || counts.partial > 0;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            padding: '2rem'
        }}>
            <div style={{
                backgroundColor: '#0f172a',
                borderRadius: '0.5rem',
                width: '100%',
                maxWidth: '700px',
                maxHeight: '90vh',
                overflow: 'auto',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}>
                <div style={{
                    padding: '1.5rem',
                    borderBottom: '1px solid #334155',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    position: 'sticky',
                    top: 0,
                    backgroundColor: '#0f172a',
                    zIndex: 1
                }}>
                    <div>
                        <h2 style={{ color: 'white', margin: 0, marginBottom: '0.25rem' }}>
                            🔄 Revisar Disponibilidad de Stock
                        </h2>
                        <p style={{ color: '#94a3b8', fontSize: '0.875rem', margin: 0 }}>
                            Backorder: {order.order_number}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#94a3b8',
                            fontSize: '1.5rem',
                            cursor: 'pointer'
                        }}
                    >
                        ×
                    </button>
                </div>

                <div style={{ padding: '1.5rem' }}>
                    {loading ? (
                        <Loading />
                    ) : availability ? (
                        <>
                            {/* Summary Cards */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                gap: '1rem',
                                marginBottom: '1.5rem'
                            }}>
                                {counts.fulfilled > 0 && (
                                    <div style={{
                                        backgroundColor: '#064e3b',
                                        padding: '1rem',
                                        borderRadius: '0.5rem',
                                        border: '1px solid #065f46'
                                    }}>
                                        <div style={{ color: '#6ee7b7', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                                            ✅ Stock Completo
                                        </div>
                                        <div style={{ color: 'white', fontSize: '1.5rem', fontWeight: 'bold' }}>
                                            {counts.fulfilled} items
                                        </div>
                                    </div>
                                )}

                                {counts.partial > 0 && (
                                    <div style={{
                                        backgroundColor: '#78350f',
                                        padding: '1rem',
                                        borderRadius: '0.5rem',
                                        border: '1px solid #92400e'
                                    }}>
                                        <div style={{ color: '#fcd34d', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                                            ⚠️ Stock Parcial
                                        </div>
                                        <div style={{ color: 'white', fontSize: '1.5rem', fontWeight: 'bold' }}>
                                            {counts.partial} items
                                        </div>
                                    </div>
                                )}

                                {counts.pending > 0 && (
                                    <div style={{
                                        backgroundColor: '#7f1d1d',
                                        padding: '1rem',
                                        borderRadius: '0.5rem',
                                        border: '1px solid #991b1b'
                                    }}>
                                        <div style={{ color: '#fca5a5', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                                            ❌ Sin Stock
                                        </div>
                                        <div style={{ color: 'white', fontSize: '1.5rem', fontWeight: 'bold' }}>
                                            {counts.pending} items
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Action Summary */}
                            {hasAvailableStock && (
                                <div style={{
                                    backgroundColor: '#1e293b',
                                    padding: '1rem',
                                    borderRadius: '0.5rem',
                                    marginBottom: '1.5rem',
                                    border: '1px solid #334155'
                                }}>
                                    <h3 style={{ color: '#3b82f6', margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: '600' }}>
                                        📋 RESULTADO DE LA CONVERSIÓN
                                    </h3>
                                    <ul style={{ color: '#94a3b8', margin: 0, paddingLeft: '1.5rem', fontSize: '0.875rem' }}>
                                        <li>Se creará una nueva <strong style={{ color: '#10b981' }}>Orden PENDIENTE</strong> con los items disponibles</li>
                                        {(counts.partial > 0 || counts.pending > 0) && (
                                            <li>Se creará un nuevo <strong style={{ color: '#f59e0b' }}>BACKORDER</strong> con los items pendientes</li>
                                        )}
                                        <li>Esta orden será marcada como <strong style={{ color: '#6b7280' }}>CONVERTIDA</strong> (historial)</li>
                                    </ul>
                                </div>
                            )}

                            {/* Items Details */}
                            <div style={{ marginBottom: '1.5rem' }}>
                                <h3 style={{ color: 'white', margin: '0 0 1rem 0', fontSize: '1rem' }}>
                                    Detalle de Productos
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {availability.items.map((item, index) => {
                                        const isFulfilled = item.available >= item.required;
                                        const isPartial = item.available > 0 && item.available < item.required;
                                        const isPending = item.available === 0;

                                        return (
                                            <div
                                                key={index}
                                                style={{
                                                    backgroundColor: '#1e293b',
                                                    padding: '1rem',
                                                    borderRadius: '0.5rem',
                                                    border: `1px solid ${isFulfilled ? '#065f46' :
                                                            isPartial ? '#92400e' :
                                                                '#991b1b'
                                                        }`
                                                }}
                                            >
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ color: 'white', fontWeight: '500', marginBottom: '0.25rem' }}>
                                                            {item.name}
                                                        </div>
                                                        <div style={{ color: '#64748b', fontSize: '0.875rem' }}>
                                                            SKU: {item.sku}
                                                        </div>
                                                    </div>
                                                    <div style={{ textAlign: 'right' }}>
                                                        <div style={{
                                                            color: isFulfilled ? '#10b981' : isPartial ? '#f59e0b' : '#ef4444',
                                                            fontWeight: 'bold'
                                                        }}>
                                                            {isFulfilled && '✅ Completo'}
                                                            {isPartial && '⚠️ Parcial'}
                                                            {isPending && '❌ Sin stock'}
                                                        </div>
                                                        <div style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                                                            Disponible: <strong>{item.available}</strong> / {item.required}
                                                        </div>
                                                        {isPartial && (
                                                            <div style={{
                                                                color: '#f59e0b',
                                                                fontSize: '0.75rem',
                                                                marginTop: '0.25rem',
                                                                fontStyle: 'italic'
                                                            }}>
                                                                Se dividirá en {item.available} + {item.required - item.available}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Actions */}
                            <div style={{
                                display: 'flex',
                                justifyContent: 'flex-end',
                                gap: '1rem',
                                paddingTop: '1rem',
                                borderTop: '1px solid #334155'
                            }}>
                                <Button
                                    variant="secondary"
                                    onClick={onClose}
                                    disabled={converting}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={handleConfirm}
                                    disabled={!hasAvailableStock || converting}
                                >
                                    {converting ? 'Procesando...' : '✅ Confirmar Conversión'}
                                </Button>
                            </div>

                            {!hasAvailableStock && (
                                <div style={{
                                    marginTop: '1rem',
                                    padding: '1rem',
                                    backgroundColor: '#7f1d1d',
                                    borderRadius: '0.5rem',
                                    border: '1px solid #991b1b',
                                    textAlign: 'center'
                                }}>
                                    <div style={{ color: '#fca5a5', fontWeight: '500' }}>
                                        ⚠️ No hay stock disponible para ningún producto
                                    </div>
                                    <div style={{ color: '#f87171', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                                        La conversión no es posible en este momento
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                            Error al cargar la disponibilidad
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BackorderConversionPreviewModal;
