import React from 'react';
import { formatCurrency, formatDate, formatStatus } from '../../../utils/formatters';
import Badge from '../../common/Badge';

const InvoiceDetailModal = ({
    invoice,
    onClose,
    visible
}) => {
    if (!visible || !invoice) return null;

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
                maxWidth: '900px',
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
                    alignItems: 'center',
                    backgroundColor: '#0f172a',
                    position: 'sticky',
                    top: 0
                }}>
                    <div>
                        <h2 style={{ color: 'white', margin: 0, fontSize: '1.5rem' }}>
                            Factura {invoice.invoice_number}
                        </h2>
                        <p style={{ color: '#94a3b8', margin: '0.25rem 0 0 0' }}>
                            Orden: {invoice.order_number}
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

                <div style={{ padding: '2rem' }}>
                    {/* Status & Dates */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '1.5rem',
                        marginBottom: '2rem',
                        padding: '1.5rem',
                        backgroundColor: '#1e293b',
                        borderRadius: '0.5rem'
                    }}>
                        <div>
                            <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Estado de Pago</p>
                            <Badge status={invoice.payment_status}>{formatStatus(invoice.payment_status)}</Badge>
                        </div>
                        <div>
                            <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Estado de Despacho</p>
                            <Badge status={invoice.dispatch_status}>{formatStatus(invoice.dispatch_status)}</Badge>
                        </div>
                        <div>
                            <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Fecha de Emisión</p>
                            <p style={{ color: 'white', fontWeight: '500' }}>{formatDate(invoice.invoice_date)}</p>
                        </div>
                    </div>

                    {/* Customer Info */}
                    <div style={{ marginBottom: '2rem' }}>
                        <h3 style={{ color: '#e2e8f0', marginBottom: '1rem', fontSize: '1.1rem' }}>Cliente</h3>
                        <div style={{
                            backgroundColor: '#1e293b',
                            padding: '1.5rem',
                            borderRadius: '0.5rem',
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: '1rem'
                        }}>
                            <div>
                                <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Razón Social</p>
                                <p style={{ color: 'white' }}>{invoice.customer_name}</p>
                            </div>
                            <div>
                                <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>RUC</p>
                                <p style={{ color: 'white' }}>{invoice.customer_ruc}</p>
                            </div>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Dirección de Entrega</p>
                                <p style={{ color: 'white' }}>{invoice.delivery_address}</p>
                                {invoice.delivery_branch_name && (
                                    <p style={{ color: '#64748b', fontSize: '0.875rem' }}>({invoice.delivery_branch_name})</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Items */}
                    <div style={{ marginBottom: '2rem' }}>
                        <h3 style={{ color: '#e2e8f0', marginBottom: '1rem', fontSize: '1.1rem' }}>Items</h3>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #334155' }}>
                                    <th style={{ textAlign: 'left', padding: '0.75rem', color: '#94a3b8' }}>Producto</th>
                                    <th style={{ textAlign: 'center', padding: '0.75rem', color: '#94a3b8' }}>Cant.</th>
                                    <th style={{ textAlign: 'right', padding: '0.75rem', color: '#94a3b8' }}>Precio Unit.</th>
                                    <th style={{ textAlign: 'right', padding: '0.75rem', color: '#94a3b8' }}>Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoice.items.map((item, index) => (
                                    <tr key={index} style={{ borderBottom: '1px solid #1e293b' }}>
                                        <td style={{ padding: '0.75rem', color: 'white' }}>
                                            <div>{item.product_name}</div>
                                            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>{item.product_sku}</div>
                                        </td>
                                        <td style={{ padding: '0.75rem', textAlign: 'center', color: 'white' }}>{item.quantity}</td>
                                        <td style={{ padding: '0.75rem', textAlign: 'right', color: 'white' }}>{formatCurrency(item.unit_price)}</td>
                                        <td style={{ padding: '0.75rem', textAlign: 'right', color: 'white' }}>{formatCurrency(item.subtotal)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colSpan="3" style={{ padding: '1rem 0.75rem', textAlign: 'right', color: '#94a3b8' }}>Total</td>
                                    <td style={{ padding: '1rem 0.75rem', textAlign: 'right', color: '#10b981', fontSize: '1.25rem', fontWeight: 'bold' }}>
                                        {formatCurrency(invoice.total_amount)}
                                    </td>
                                </tr>
                                <tr>
                                    <td colSpan="3" style={{ padding: '0.5rem 0.75rem', textAlign: 'right', color: '#94a3b8' }}>Pagado</td>
                                    <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', color: 'white' }}>
                                        {formatCurrency(invoice.amount_paid)}
                                    </td>
                                </tr>
                                <tr>
                                    <td colSpan="3" style={{ padding: '0.5rem 0.75rem', textAlign: 'right', color: '#94a3b8' }}>Pendiente</td>
                                    <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', color: '#ef4444' }}>
                                        {formatCurrency(invoice.total_amount - invoice.amount_paid)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* Payments History */}
                    {invoice.payments && invoice.payments.length > 0 && (
                        <div>
                            <h3 style={{ color: '#e2e8f0', marginBottom: '1rem', fontSize: '1.1rem' }}>Historial de Pagos</h3>
                            <div style={{ backgroundColor: '#1e293b', borderRadius: '0.5rem', overflow: 'hidden' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ backgroundColor: '#0f172a' }}>
                                            <th style={{ textAlign: 'left', padding: '0.75rem', color: '#94a3b8' }}>Fecha</th>
                                            <th style={{ textAlign: 'left', padding: '0.75rem', color: '#94a3b8' }}>Notas</th>
                                            <th style={{ textAlign: 'right', padding: '0.75rem', color: '#94a3b8' }}>Monto</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {invoice.payments.map((payment, index) => (
                                            <tr key={index} style={{ borderBottom: '1px solid #334155' }}>
                                                <td style={{ padding: '0.75rem', color: 'white' }}>{formatDate(payment.date)}</td>
                                                <td style={{ padding: '0.75rem', color: '#cbd5e1' }}>{payment.notes || '-'}</td>
                                                <td style={{ padding: '0.75rem', textAlign: 'right', color: 'white' }}>{formatCurrency(payment.amount)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InvoiceDetailModal;
