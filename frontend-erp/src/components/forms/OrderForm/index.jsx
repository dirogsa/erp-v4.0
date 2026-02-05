import React, { useState, useEffect } from 'react';
import CustomerSelector from './CustomerSelector';
import ProductItemsSection from './ProductItemsSection';
import OrderSummary from './OrderSummary';
import Button from '../../common/Button';
import { useNotification } from '../../../hooks/useNotification';
import { useCompany } from '../../../context/CompanyContext';

import PaymentInfoSection from './PaymentInfoSection';

const OrderForm = ({
    initialData = null,
    onSubmit,
    onCancel,
    loading = false,
    readOnly = false
}) => {
    const { showNotification } = useNotification();
    const { activeCompany } = useCompany();

    const [formData, setFormData] = useState({
        customer: {
            name: '',
            ruc: '',
            address: '',
            branches: []
        },
        items: [],
        delivery_address: '',
        delivery_branch_name: '',
        payment_terms: { type: 'CASH', installments: [] }, // Default
        notes: '',
        amount_in_words: '',
        ...initialData
    });

    // Actualizar si cambia initialData (ej. modo edición)
    useEffect(() => {
        if (initialData) {
            setFormData(prev => ({
                ...prev,
                ...initialData,
                payment_terms: initialData.payment_terms || { type: 'CASH', installments: [] },
                // Asegurar que la dirección de entrega se extraiga si viene anidada en customer
                delivery_address: initialData.delivery_address || initialData.customer?.delivery_address || initialData.customer?.address || '',
                // Reconstruct customer object if it doesn't exist but we have flat fields
                customer: initialData.customer || {
                    name: initialData.customer_name || '',
                    ruc: initialData.customer_ruc || '',
                    address: initialData.delivery_address || '',
                    branches: [] // We might not have branches in order data, that's fine for read-only
                },
                // Calculate subtotal for items if missing (backend doesn't send it)
                items: (initialData.items || []).map(item => ({
                    ...item,
                    subtotal: item.subtotal !== undefined ? item.subtotal : (item.quantity * item.unit_price)
                }))
            }));
        }
    }, [initialData]);

    const handleCustomerChange = (customerData) => {
        setFormData(prev => ({
            ...prev,
            customer: customerData,
            customer_ruc: customerData.ruc,
            customer_name: customerData.name,
            delivery_address: customerData.delivery_address || customerData.address,
            delivery_branch_name: customerData.delivery_branch_name
        }));
    };

    const handleItemsChange = (newItems) => {
        setFormData(prev => ({
            ...prev,
            items: newItems
        }));
    };

    const handlePaymentTermsChange = (newTerms) => {
        setFormData(prev => ({
            ...prev,
            payment_terms: newTerms
        }));
    };

    const calculateTotal = () => {
        return formData.items.reduce((sum, item) => sum + item.subtotal, 0);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validaciones básicas
        if (!formData.customer_ruc) {
            showNotification('Debe seleccionar un cliente', 'error');
            return;
        }

        if (formData.items.length === 0) {
            showNotification('Debe agregar al menos un producto', 'error');
            return;
        }

        if (!formData.delivery_address) {
            showNotification('La dirección de entrega es obligatoria', 'error');
            return;
        }

        // Calcular totales finales
        const total = calculateTotal();
        const subtotal = total / 1.18;
        const tax = total - subtotal;

        const orderPayload = {
            ...formData,
            total_amount: total,
            tax_amount: tax,
            issuer_info: activeCompany // Snapshot
        };

        onSubmit(orderPayload);
    };

    return (
        <form onSubmit={handleSubmit}>
            <CustomerSelector
                value={formData.customer}
                onChange={handleCustomerChange}
                readOnly={readOnly}
                required
            />

            <ProductItemsSection
                items={formData.items}
                onItemsChange={handleItemsChange}
                readOnly={readOnly}
            />

            <div style={{ marginTop: '1rem' }}>
                <label style={{ display: 'block', color: '#10b981', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem' }}>Importe en Letras (Legal)</label>
                <input
                    type="text"
                    value={formData.amount_in_words || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount_in_words: e.target.value.toUpperCase() }))}
                    placeholder="Ej: SON: CIENTO NOVENTA Y OCHO Y 00/100 SOLES"
                    disabled={readOnly}
                    style={{
                        width: '100%',
                        padding: '0.5rem',
                        backgroundColor: '#0f172a',
                        border: '1px solid #10b98144',
                        borderRadius: '0.25rem',
                        color: 'white'
                    }}
                />
            </div>

            <div style={{ marginTop: '1rem' }}>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Notas / Observaciones</label>
                <textarea
                    style={{
                        width: '100%',
                        padding: '0.75rem',
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '0.375rem',
                        color: 'white',
                        minHeight: '100px',
                        outline: 'none',
                        resize: 'vertical'
                    }}
                    value={formData.notes || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Notas adicionales o términos de la orden..."
                    readOnly={readOnly}
                />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <OrderSummary items={formData.items} />
            </div>

            {!readOnly && (
                <PaymentInfoSection
                    value={formData.payment_terms}
                    onChange={handlePaymentTermsChange}
                    totalAmount={calculateTotal()}
                />
            )}

            {!readOnly && (
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
                        {loading ? 'Guardando...' : (initialData ? 'Actualizar Orden' : 'Crear Orden')}
                    </Button>
                </div>
            )}
        </form>
    );
};

export default OrderForm;
