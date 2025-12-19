import React, { useState, useEffect } from 'react';

import Input from '../../common/Input';
import Button from '../../common/Button';
// import PaymentSection from './PaymentSection'; // Removed
import PaymentInfoSection from '../OrderForm/PaymentInfoSection'; // Reuse from OrderForm
import { useNotification } from '../../../hooks/useNotification';
import { formatCurrency } from '../../../utils/formatters';
import { useCompany } from '../../../context/CompanyContext';

const InvoiceForm = ({
    order,
    onSubmit,
    onCancel,
    loading = false,
    type = 'sale' // 'sale' or 'purchase'
}) => {
    const { showNotification } = useNotification();
    const { activeCompany } = useCompany();

    const [formData, setFormData] = useState(() => ({
        sunat_number: '',
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: new Date().toISOString().split('T')[0],
        notes: '',
        amount_in_words: '',
        payment_terms: order?.payment_terms || { type: 'CASH', installments: [] }
    }));

    // Initialize from order
    useEffect(() => {
        if (order) {
            setFormData(prev => ({
                ...prev,
                payment_terms: order.payment_terms || { type: 'CASH', installments: [] }
            }));
        }
    }, [order]);

    const isPurchase = type === 'purchase';
    const entityLabel = isPurchase ? 'Proveedor' : 'Cliente';
    const entityName = isPurchase ? order.supplier_name : order.customer_name;
    const entityRuc = isPurchase ? (order.supplier_ruc || 'N/A') : order.customer_ruc;

    const handleSubmit = (e) => {
        e.preventDefault();

        // Derive Payment Status from Terms
        let payment_status = 'PENDING';
        let amount_paid = 0;
        let payment_date = null;

        if (formData.payment_terms.type === 'CASH') {
            // If Cash, we generally assume it might be paid, but to be safe and consistent with previous flow
            // we could ask? Or just default to PENDING (Unpaid) and let them Register Payment later?
            // The user wanted "SIMPLE".
            // If "Contado", usually means Paid.
            // But let's keep it PENDING to allow registering payment separately?
            // User complained "SIGUE SALIENDO METODO DE PAGO... NO QUIERO VER".
            // So I should NOT ask for these.
            // If Credit -> Pending.
            // If Cash -> Pending (Due Now).
            payment_status = 'PENDING';
        } else {
            payment_status = 'PENDING';
        }

        // Build payload matching backend InvoiceCreation schema
        const payload = {
            order_number: order.order_number,
            sunat_number: formData.sunat_number,
            invoice_date: formData.invoice_date,
            due_date: formData.due_date,
            payment_status: payment_status,
            amount_paid: amount_paid,
            payment_date: payment_date,
            amount_in_words: formData.amount_in_words,
            payment_terms: formData.payment_terms,
            issuer_info: activeCompany // Snapshot ID info
        };

        onSubmit(payload);
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
                    Detalles de Facturación
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                    <Input
                        label="Nro SUNAT (Opcional)"
                        value={formData.sunat_number}
                        onChange={(e) => setFormData({ ...formData, sunat_number: e.target.value })}
                        placeholder="F001-000001"
                    />

                    <Input
                        label="Fecha de Emisión"
                        type="date"
                        value={formData.invoice_date}
                        onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value, due_date: e.target.value })}
                        required
                    />


                </div>

                <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#0f172a', borderRadius: '0.375rem' }}>
                    <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>{entityLabel}</p>
                    <p style={{ color: 'white', fontWeight: '500' }}>{entityName} ({entityRuc})</p>

                    <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.5rem' }}>Total a Facturar</p>
                    <p style={{ color: '#10b981', fontWeight: 'bold', fontSize: '1.25rem' }}>
                        {formatCurrency(order.total_amount)}
                    </p>
                </div>

                {/* Monto en letras */}
                <div style={{ marginTop: '1rem' }}>
                    <Input
                        label="Monto en Letras (SON:)"
                        value={formData.amount_in_words}
                        onChange={(e) => setFormData({ ...formData, amount_in_words: e.target.value.toUpperCase() })}
                        placeholder="SETECIENTOS Y 00/100 SOLES"
                    />
                    <small style={{ color: '#64748b', fontSize: '0.75rem' }}>
                        Ejemplo: SETECIENTOS Y 00/100 SOLES
                    </small>
                </div>
            </div>

            {/* Replaced PaymentSection with PaymentInfoSection */}
            <PaymentInfoSection
                value={formData.payment_terms}
                onChange={(newTerms) => setFormData({ ...formData, payment_terms: newTerms })}
                totalAmount={order.total_amount}
            />

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
                    variant="primary"
                    disabled={loading}
                >
                    {loading ? 'Generando...' : 'Generar Factura'}
                </Button>
            </div>
        </form>
    );
};

export default InvoiceForm;
