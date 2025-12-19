import React, { useState } from 'react';
import Button from '../../common/Button';
import PaymentSection from '../InvoiceForm/PaymentSection';
import { useNotification } from '../../../hooks/useNotification';
import { formatCurrency } from '../../../utils/formatters';

const PaymentForm = ({
    invoice,
    onSubmit,
    onCancel,
    loading = false,
    type = 'sale' // 'sale' or 'purchase'
}) => {
    const { showNotification } = useNotification();

    const [formData, setFormData] = useState({
        payment_status: invoice.payment_status || 'PENDING',
        payment_method: invoice.payment_method || '',
        amount_paid: invoice.amount_paid || 0,
        payment_date: invoice.payment_date || new Date().toISOString().split('T')[0],
        notes: ''
    });

    const isPurchase = type === 'purchase';
    const entityLabel = isPurchase ? 'Proveedor' : 'Cliente';
    const entityName = isPurchase ? invoice.supplier_name : invoice.customer_name;

    const handleSubmit = (e) => {
        e.preventDefault();

        if (formData.payment_status === 'PAID' && formData.amount_paid <= 0) {
            showNotification('El monto pagado debe ser mayor a 0', 'error');
            return;
        }

        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit}>
            <div style={{
                padding: '1.5rem',
                backgroundColor: '#1e293b',
                borderRadius: '0.5rem',
                marginBottom: '1.5rem'
            }}>
                <h3 style={{ marginBottom: '1rem', color: '#e2e8f0', fontSize: '1.1rem' }}>
                    Registrar Pago
                </h3>

                <div style={{ padding: '1rem', backgroundColor: '#0f172a', borderRadius: '0.375rem', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ color: '#94a3b8' }}>Factura:</span>
                        <span style={{ color: 'white' }}>{invoice.invoice_number}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ color: '#94a3b8' }}>{entityLabel}:</span>
                        <span style={{ color: 'white' }}>{entityName}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #334155', paddingTop: '0.5rem' }}>
                        <span style={{ color: '#94a3b8' }}>Total:</span>
                        <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>{formatCurrency(invoice.total_amount)}</span>
                    </div>
                </div>

                {/* Payment Status Summary */}
                <div style={{
                    padding: '1rem',
                    backgroundColor: '#1e293b',
                    borderRadius: '0.375rem',
                    marginBottom: '1rem',
                    border: '1px solid #334155'
                }}>
                    <div style={{ marginBottom: '0.75rem', color: '#e2e8f0', fontWeight: '600', fontSize: '0.875rem' }}>
                        Estado Actual de Pagos
                    </div>
                    <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.875rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#94a3b8' }}>Ya Pagado:</span>
                            <span style={{ color: '#10b981', fontWeight: 'bold' }}>
                                {formatCurrency(invoice.amount_paid || 0)}
                            </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#94a3b8' }}>Por Pagar:</span>
                            <span style={{ color: '#ef4444', fontWeight: 'bold' }}>
                                {formatCurrency((invoice.total_amount || 0) - (invoice.amount_paid || 0))}
                            </span>
                        </div>
                    </div>
                    {/* Progress Indicator */}
                    <div style={{ marginTop: '0.75rem' }}>
                        <div style={{
                            width: '100%',
                            height: '6px',
                            backgroundColor: '#334155',
                            borderRadius: '3px',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                width: `${((invoice.amount_paid || 0) / (invoice.total_amount || 1)) * 100}%`,
                                height: '100%',
                                backgroundColor: '#10b981',
                                transition: 'width 0.3s ease'
                            }} />
                        </div>
                    </div>
                </div>

                <PaymentSection
                    value={formData}
                    onChange={setFormData}
                    totalAmount={invoice.total_amount}
                />
            </div>

            <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '1rem',
                marginTop: '2rem',
                paddingTop: '1rem',
                borderTop: '1px solid #334155'
            }}>
                <Button
                    variant="secondary"
                    onClick={onCancel}
                    disabled={loading}
                >
                    Cancelar
                </Button>
                <Button
                    type="submit"
                    variant="success"
                    disabled={loading}
                >
                    {loading ? 'Registrando...' : 'Registrar Pago'}
                </Button>
            </div>
        </form>
    );
};

export default PaymentForm;
