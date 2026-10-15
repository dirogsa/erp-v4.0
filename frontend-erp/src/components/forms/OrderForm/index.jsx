import React, { useState, useEffect } from 'react';
import CustomerSelector from './CustomerSelector';
import DeliveryMethodSection from '../DeliveryMethodSection';
import ProductItemsSection from './ProductItemsSection';
import OrderSummary from './OrderSummary';
import Button from '../../common/Button';
import { useNotification } from '../../../hooks/useNotification';
import { useCompany } from '../../../context/CompanyContext';
import { numberToWords } from '../../../utils/numberToWords';

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
        delivery_method: 'STORE_PICKUP',
        shipping_cost: 0,
        shipping_agency: '',
        shipping_payment_type: 'PAID',
        shipping_notes: '',
        requested_by: null,
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
                requested_by: initialData.requested_by || null,
                payment_terms: initialData.payment_terms || { type: 'CASH', installments: [] },
                delivery_method: initialData.delivery_method || 'STORE_PICKUP',
                shipping_cost: initialData.shipping_cost !== undefined ? initialData.shipping_cost : 0,
                shipping_agency: initialData.shipping_agency || '',
                shipping_payment_type: initialData.shipping_payment_type || 'PAID',
                shipping_notes: initialData.shipping_notes || '',
                // Asegurar que la dirección de entrega se extraiga si viene anidada en customer
                delivery_address: initialData.delivery_address || initialData.customer?.delivery_address || initialData.customer?.address || '',
                customer: initialData.customer || {
                    name: initialData.customer_name || '',
                    ruc: initialData.customer_ruc || '',
                    address: initialData.delivery_address || '',
                    branches: [],
                    contacts: []
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

    const itemsTotal = formData.items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
    const effectiveShipping = (formData.shipping_payment_type !== 'DESTINATION') ? (parseFloat(formData.shipping_cost) || 0) : 0;
    const total = itemsTotal + effectiveShipping;

    // Auto-update amount in words
    useEffect(() => {
        if (!readOnly) {
            const words = numberToWords(total, formData.currency || 'PEN');
            setFormData(prev => ({ ...prev, amount_in_words: words }));
        }
    }, [total, formData.currency, readOnly]);

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

        if (formData.delivery_method !== 'STORE_PICKUP' && !formData.delivery_address) {
            showNotification('La dirección de entrega es obligatoria para envíos', 'error');
            return;
        }

        const orderPayload = {
            ...formData,
            items: formData.items,
            total_amount: total,
            shipping_cost: effectiveShipping,
            delivery_method: formData.delivery_method,
            shipping_agency: formData.shipping_agency,
            shipping_payment_type: formData.shipping_payment_type,
            shipping_notes: formData.shipping_notes,
            requested_by: formData.requested_by,
            issuer_info: activeCompany // Snapshot active company info at creation time
        };

        onSubmit(orderPayload);
    };

    return (
        <form onSubmit={handleSubmit}>
            <CustomerSelector
                value={formData.customer}
                onChange={handleCustomerChange}
                requestedBy={formData.requested_by}
                onRequestedByChange={(requested_by) => setFormData({ ...formData, requested_by })}
                readOnly={readOnly}
                required
            />

            <DeliveryMethodSection
                deliveryMethod={formData.delivery_method}
                onDeliveryMethodChange={(delivery_method) => setFormData(prev => ({ ...prev, delivery_method }))}
                shippingCost={formData.shipping_cost}
                onShippingCostChange={(shipping_cost) => setFormData(prev => ({ ...prev, shipping_cost }))}
                shippingAgency={formData.shipping_agency}
                onShippingAgencyChange={(shipping_agency) => setFormData(prev => ({ ...prev, shipping_agency }))}
                shippingPaymentType={formData.shipping_payment_type}
                onShippingPaymentTypeChange={(shipping_payment_type) => setFormData(prev => ({ ...prev, shipping_payment_type }))}
                shippingNotes={formData.shipping_notes}
                onShippingNotesChange={(shipping_notes) => setFormData(prev => ({ ...prev, shipping_notes }))}
                deliveryAddress={formData.delivery_address}
                onDeliveryAddressChange={(delivery_address) => setFormData(prev => ({ ...prev, delivery_address }))}
                deliveryBranchName={formData.delivery_branch_name}
                itemsTotal={itemsTotal}
                currency={formData.currency || 'PEN'}
                readOnly={readOnly}
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
                <OrderSummary
                    items={formData.items}
                    shippingCost={effectiveShipping}
                    deliveryMethod={formData.delivery_method}
                    shippingAgency={formData.shipping_agency}
                    shippingPaymentType={formData.shipping_payment_type}
                    currency={formData.currency || 'PEN'}
                />
            </div>

            {!readOnly && (
                <PaymentInfoSection
                    value={formData.payment_terms}
                    onChange={handlePaymentTermsChange}
                    totalAmount={total}
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
