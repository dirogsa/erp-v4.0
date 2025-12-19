import React from 'react';
import { formatCurrency, formatDate } from '../../../utils/formatters';

const PaymentInfoModal = ({
    visible,
    onClose,
    invoice,
    onRegisterPayment
}) => {
    if (!visible || !invoice) return null;

    const totalAmount = invoice.total_amount || 0;
    const amountPaid = invoice.amount_paid || 0;
    const pendingAmount = totalAmount - amountPaid;
    const paymentProgress = totalAmount > 0 ? (amountPaid / totalAmount) * 100 : 0;
    const isPaid = pendingAmount <= 0;

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
                overflowY: 'auto',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}>
                {/* Header */}
                <div style={{
                    padding: '1.5rem',
                    borderBottom: '1px solid #334155',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <h2 style={{ color: 'white', margin: 0, fontSize: '1.5rem' }}>
                        💰 Información de Pagos
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#94a3b8',
                            fontSize: '1.5rem',
                            cursor: 'pointer',
                            padding: '0.5rem'
                        }}
                    >
                        ×
                    </button>
                </div>

                <div style={{ padding: '1.5rem' }}>
                    {/* Invoice Summary */}
                    <div style={{
                        backgroundColor: '#1e293b',
                        borderRadius: '0.5rem',
                        padding: '1.5rem',
                        marginBottom: '1.5rem'
                    }}>
                        <h3 style={{ color: '#e2e8f0', marginTop: 0, marginBottom: '1rem', fontSize: '1.1rem' }}>
                            Resumen de Factura
                        </h3>
                        <div style={{ display: 'grid', gap: '0.75rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#94a3b8' }}>Número:</span>
                                <span style={{ color: 'white', fontWeight: 'bold' }}>{invoice.invoice_number}</span>
                            </div>
                            {invoice.sunat_number && (
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#94a3b8' }}>SUNAT:</span>
                                    <span style={{ color: 'white' }}>{invoice.sunat_number}</span>
                                </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#94a3b8' }}>Proveedor:</span>
                                <span style={{ color: 'white' }}>{invoice.supplier_name}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#94a3b8' }}>Fecha:</span>
                                <span style={{ color: 'white' }}>{formatDate(invoice.invoice_date)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Payment Status */}
                    <div style={{
                        backgroundColor: '#1e293b',
                        borderRadius: '0.5rem',
                        padding: '1.5rem',
                        marginBottom: '1.5rem'
                    }}>
                        <h3 style={{ color: '#e2e8f0', marginTop: 0, marginBottom: '1rem', fontSize: '1.1rem' }}>
                            Estado de Pagos
                        </h3>

                        {/* Amounts */}
                        <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem' }}>
                                <span style={{ color: '#94a3b8' }}>Total:</span>
                                <span style={{ color: '#3b82f6', fontWeight: 'bold', fontSize: '1.2rem' }}>
                                    {formatCurrency(totalAmount)}
                                </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#94a3b8' }}>Pagado:</span>
                                <span style={{ color: '#10b981', fontWeight: 'bold' }}>
                                    {formatCurrency(amountPaid)}
                                </span>
                            </div>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                paddingTop: '0.75rem',
                                borderTop: '1px solid #334155'
                            }}>
                                <span style={{ color: '#94a3b8' }}>
                                    {isPaid ? '✓ Cancelado' : 'Pendiente:'}
                                </span>
                                <span style={{
                                    color: isPaid ? '#10b981' : '#ef4444',
                                    fontWeight: 'bold',
                                    fontSize: '1.1rem'
                                }}>
                                    {formatCurrency(Math.abs(pendingAmount))}
                                </span>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div style={{ marginTop: '1rem' }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                marginBottom: '0.5rem',
                                fontSize: '0.875rem'
                            }}>
                                <span style={{ color: '#94a3b8' }}>Progreso de Pago</span>
                                <span style={{ color: '#e2e8f0', fontWeight: 'bold' }}>
                                    {paymentProgress.toFixed(1)}%
                                </span>
                            </div>
                            <div style={{
                                width: '100%',
                                height: '10px',
                                backgroundColor: '#334155',
                                borderRadius: '5px',
                                overflow: 'hidden'
                            }}>
                                <div style={{
                                    width: `${paymentProgress}%`,
                                    height: '100%',
                                    backgroundColor: isPaid ? '#10b981' : '#3b82f6',
                                    transition: 'width 0.3s ease'
                                }} />
                            </div>
                        </div>
                    </div>

                    {/* Payment History */}
                    {invoice.payments && invoice.payments.length > 0 && (
                        <div style={{
                            backgroundColor: '#1e293b',
                            borderRadius: '0.5rem',
                            padding: '1.5rem',
                            marginBottom: '1.5rem'
                        }}>
                            <h3 style={{ color: '#e2e8f0', marginTop: 0, marginBottom: '1rem', fontSize: '1.1rem' }}>
                                📋 Historial de Pagos
                            </h3>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid #334155' }}>
                                            <th style={{ padding: '0.75rem', textAlign: 'left', color: '#94a3b8', fontSize: '0.875rem' }}>
                                                Fecha
                                            </th>
                                            <th style={{ padding: '0.75rem', textAlign: 'left', color: '#94a3b8', fontSize: '0.875rem' }}>
                                                Notas
                                            </th>
                                            <th style={{ padding: '0.75rem', textAlign: 'right', color: '#94a3b8', fontSize: '0.875rem' }}>
                                                Monto
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {invoice.payments.map((payment, index) => (
                                            <tr key={index} style={{ borderBottom: '1px solid #334155' }}>
                                                <td style={{ padding: '0.75rem', color: '#e2e8f0' }}>
                                                    {formatDate(payment.date)}
                                                </td>
                                                <td style={{ padding: '0.75rem', color: '#94a3b8' }}>
                                                    {payment.notes || '-'}
                                                </td>
                                                <td style={{ padding: '0.75rem', textAlign: 'right', color: '#10b981', fontWeight: 'bold' }}>
                                                    {formatCurrency(payment.amount)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: '1rem',
                        paddingTop: '1rem',
                        borderTop: '1px solid #334155'
                    }}>
                        <button
                            onClick={onClose}
                            style={{
                                padding: '0.75rem 1.5rem',
                                backgroundColor: '#334155',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.375rem',
                                cursor: 'pointer',
                                fontSize: '1rem',
                                fontWeight: '500'
                            }}
                        >
                            Cerrar
                        </button>
                        {!isPaid && (
                            <button
                                onClick={() => {
                                    onClose();
                                    onRegisterPayment();
                                }}
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    backgroundColor: '#10b981',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.375rem',
                                    cursor: 'pointer',
                                    fontSize: '1rem',
                                    fontWeight: '500'
                                }}
                            >
                                💳 Registrar Nuevo Pago
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentInfoModal;
