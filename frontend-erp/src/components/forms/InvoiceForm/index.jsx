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
        due_date: order?.due_date ? order.due_date.split('T')[0] : '',
        notes: '',
        amount_in_words: '',
        payment_terms: order?.payment_terms || { type: 'CASH', installments: [] }
    }));

    const [selectedItems, setSelectedItems] = useState([]);

    // Initialize from order
    useEffect(() => {
        if (order) {
            setFormData(prev => ({
                ...prev,
                due_date: order.due_date ? order.due_date.split('T')[0] : '',
                payment_terms: order.payment_terms || { type: 'CASH', installments: [] }
            }));

            if (order.items) {
                // Pre-fill with items that have pending quantity
                const initial = order.items
                    .map(item => {
                        const pendingQty = item.quantity - (item.invoiced_quantity || 0);
                        return {
                            ...item,
                            pending_qty: pendingQty,
                            qty_to_invoice: pendingQty > 0 ? pendingQty : 0
                        };
                    })
                    .filter(item => item.pending_qty > 0);
                setSelectedItems(initial);
            }
        }
    }, [order]);

    const totalToInvoice = selectedItems.reduce((sum, item) => sum + (item.qty_to_invoice * item.unit_price), 0);

    const isPurchase = type === 'purchase';
    const entityLabel = isPurchase ? 'Proveedor' : 'Cliente';
    const entityName = isPurchase ? order.supplier_name : order.customer_name;
    const entityRuc = isPurchase ? (order.supplier_ruc || 'N/A') : order.customer_ruc;

    const handleQtyChange = (sku, val) => {
        const numVal = parseInt(val) || 0;
        setSelectedItems(items => items.map(item => {
            if (item.product_sku === sku) {
                // Cap at pending quantity
                const safeVal = Math.min(numVal, item.pending_qty);
                return { ...item, qty_to_invoice: safeVal };
            }
            return item;
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const itemsToInvoice = selectedItems.filter(i => i.qty_to_invoice > 0);

        if (itemsToInvoice.length === 0) {
            showNotification('Debes seleccionar al menos un ítem con cantidad mayor a 0', 'error');
            return;
        }

        if (itemsToInvoice.length > 20) {
            if (!window.confirm(`Has seleccionado ${itemsToInvoice.length} ítems. El formato de impresión suele verse mejor con máximo 20 ítems. ¿Deseas continuar de todos modos?`)) {
                return;
            }
        }

        // Build payload matching backend InvoiceCreation schema
        const payload = {
            order_number: order.order_number,
            sunat_number: formData.sunat_number,
            invoice_date: formData.invoice_date,
            due_date: formData.due_date || null,
            payment_status: 'PENDING',
            amount_paid: 0,
            payment_date: null,
            amount_in_words: formData.amount_in_words,
            payment_terms: formData.payment_terms,
            issuer_info: activeCompany,
            items: itemsToInvoice.map(i => ({
                product_sku: i.product_sku,
                quantity: i.qty_to_invoice
            }))
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
                        onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
                        required
                    />

                    <Input
                        label="Vencimiento (Opcional)"
                        type="date"
                        value={formData.due_date}
                        onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    />
                </div>

                {/* Ítems a Facturar */}
                <div style={{ marginTop: '1.5rem' }}>
                    <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Seleccionar Ítems y Cantidades</p>
                    <div style={{ backgroundColor: '#0f172a', borderRadius: '0.375rem', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white', fontSize: '0.875rem' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#334155' }}>
                                    <th style={{ textAlign: 'left', padding: '0.75rem' }}>Producto</th>
                                    <th style={{ textAlign: 'center', padding: '0.75rem' }}>Pendiente</th>
                                    <th style={{ textAlign: 'center', padding: '0.75rem', width: '100px' }}>A Facturar</th>
                                    <th style={{ textAlign: 'right', padding: '0.75rem' }}>Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedItems.map((item) => (
                                    <tr key={item.product_sku} style={{ borderBottom: '1px solid #1e293b' }}>
                                        <td style={{ padding: '0.75rem' }}>
                                            <div>{item.product_name}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{item.product_sku}</div>
                                        </td>
                                        <td style={{ textAlign: 'center', padding: '0.75rem' }}>
                                            {item.pending_qty}
                                        </td>
                                        <td style={{ padding: '0.75rem' }}>
                                            <input
                                                type="number"
                                                min="0"
                                                max={item.pending_qty}
                                                value={item.qty_to_invoice}
                                                onChange={(e) => handleQtyChange(item.product_sku, e.target.value)}
                                                style={{
                                                    width: '100%',
                                                    backgroundColor: '#1e293b',
                                                    border: '1px solid #334155',
                                                    color: 'white',
                                                    padding: '0.25rem',
                                                    borderRadius: '0.25rem',
                                                    textAlign: 'center'
                                                }}
                                            />
                                        </td>
                                        <td style={{ textAlign: 'right', padding: '0.75rem' }}>
                                            {formatCurrency(item.qty_to_invoice * item.unit_price)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#0f172a', borderRadius: '0.375rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>{entityLabel}</p>
                            <p style={{ color: 'white', fontWeight: '500' }}>{entityName} ({entityRuc})</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Total de esta Factura</p>
                            <p style={{ color: '#10b981', fontWeight: 'bold', fontSize: '1.5rem' }}>
                                {formatCurrency(totalToInvoice)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Monto en letras */}
                <div style={{ marginTop: '1rem' }}>
                    <Input
                        label="Monto en Letras (SON:)"
                        value={formData.amount_in_words}
                        onChange={(e) => setFormData({ ...formData, amount_in_words: e.target.value.toUpperCase() })}
                        placeholder="SETECIENTOS Y 00/100 SOLES"
                    />
                </div>
            </div>

            <PaymentInfoSection
                value={formData.payment_terms}
                onChange={(newTerms) => setFormData({ ...formData, payment_terms: newTerms })}
                totalAmount={totalToInvoice}
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
