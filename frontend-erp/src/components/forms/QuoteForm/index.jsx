import React, { useState, useEffect } from 'react';
import CustomerSelector from './CustomerSelector';
import ProductItemsSection from './ProductItemsSection';
import QuoteSummary from './QuoteSummary';
import PaymentInfoSection from '../OrderForm/PaymentInfoSection';
import Button from '../../common/Button';
import Input from '../../common/Input';
import { useNotification } from '../../../hooks/useNotification';
import { useCompany } from '../../../context/CompanyContext';

const QuoteForm = ({
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
        requested_by: null,
        date: new Date().toISOString().split('T')[0],
        due_date: '',
        currency: 'SOLES',
        payment_terms: { type: 'CASH', installments: [] },
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
                date: initialData.date ? initialData.date.split('T')[0] : new Date().toISOString().split('T')[0],
                due_date: initialData.due_date ? initialData.due_date.split('T')[0] : '',
                currency: initialData.currency || 'SOLES',
                // Asegurar que la dirección de entrega se extraiga si viene anidada en customer
                delivery_address: initialData.delivery_address || initialData.customer?.delivery_address || initialData.customer?.address || '',
                customer: initialData.customer || {
                    name: initialData.customer_name || '',
                    ruc: initialData.customer_ruc || '',
                    address: initialData.delivery_address || '',
                    branches: [],
                    contacts: []
                },
                items: (initialData.items || []).map(item => ({
                    ...item,
                    subtotal: item.subtotal !== undefined ? item.subtotal : Math.round((item.quantity * item.unit_price) * 100) / 100
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
            delivery_branch_name: customerData.delivery_branch_name,
            // Mantener solicitado por si ya estaba (o resetear si cambia de cliente drásticamente)
        }));
    };

    const handleItemsChange = (newItems) => {
        setFormData(prev => ({
            ...prev,
            items: newItems
        }));
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
        const total = formData.items.reduce((sum, item) => sum + item.subtotal, 0);

        const quotePayload = {
            ...formData,
            due_date: formData.due_date || null,
            items: formData.items,
            total_amount: total,
            requested_by: formData.requested_by,
            issuer_info: activeCompany // Snapshot active company info at creation time
        };

        onSubmit(quotePayload);
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
                    Información General
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) minmax(200px, 1fr) 150px', gap: '1rem' }}>
                    <Input
                        label="Fecha de Emisión"
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        disabled={readOnly}
                        required
                    />
                    <Input
                        label="Vencimiento (Ref)"
                        type="date"
                        value={formData.due_date}
                        onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                        disabled={readOnly}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <label style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Moneda</label>
                        <select
                            value={formData.currency}
                            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                            disabled={readOnly}
                            style={{
                                padding: '0.5rem',
                                backgroundColor: '#0f172a',
                                border: '1px solid #334155',
                                borderRadius: '0.25rem',
                                color: 'white',
                                outline: 'none'
                            }}
                        >
                            <option value="SOLES">S/ Soles</option>
                            <option value="DOLARES">$ Dólares</option>
                        </select>
                    </div>
                </div>
            </div>

            <CustomerSelector
                value={formData.customer}
                onChange={handleCustomerChange}
                requestedBy={formData.requested_by}
                onRequestedByChange={(requested_by) => setFormData({ ...formData, requested_by })}
                readOnly={readOnly}
                required
            />

            <ProductItemsSection
                items={formData.items}
                onItemsChange={handleItemsChange}
                readOnly={readOnly}
                customerRuc={formData.customer?.ruc}
            />

            <PaymentInfoSection
                value={formData.payment_terms}
                onChange={(payment_terms) => setFormData({ ...formData, payment_terms })}
                totalAmount={formData.items.reduce((sum, item) => sum + (item.subtotal || 0), 0)}
                readOnly={readOnly}
            />

            <div style={{ marginTop: '1rem' }}>
                <label style={{ display: 'block', color: '#10b981', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem' }}>Importe en Letras (Legal)</label>
                <Input
                    value={formData.amount_in_words || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount_in_words: e.target.value.toUpperCase() }))}
                    placeholder="Ej: SON: CIENTO NOVENTA Y OCHO Y 00/100 SOLES"
                    readOnly={readOnly}
                    style={{ backgroundColor: '#0f172a', border: '1px solid #10b98144' }}
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
                    placeholder="Notas adicionales o términos de la cotización..."
                    readOnly={readOnly}
                />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <QuoteSummary items={formData.items} currency={formData.currency} />
            </div>

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
                        {loading ? 'Guardando...' : (initialData?.quote_number ? 'Actualizar Cotización' : 'Guardar Cotización')}
                    </Button>
                </div>
            )}
        </form>
    );
};

export default QuoteForm;
