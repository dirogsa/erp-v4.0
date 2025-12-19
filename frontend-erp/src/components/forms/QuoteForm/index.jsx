import React, { useState, useEffect } from 'react';
import CustomerSelector from './CustomerSelector';
import ProductItemsSection from './ProductItemsSection';
import QuoteSummary from './QuoteSummary';
import Button from '../../common/Button';
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
        ...initialData
    });

    // Actualizar si cambia initialData (ej. modo edición)
    useEffect(() => {
        if (initialData) {
            setFormData(prev => ({
                ...prev,
                ...initialData,
                customer: initialData.customer || {
                    name: initialData.customer_name || '',
                    ruc: initialData.customer_ruc || '',
                    address: initialData.delivery_address || '',
                    branches: []
                },
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
            items: formData.items,
            total_amount: total,
            issuer_info: activeCompany // Snapshot active company info at creation time
        };

        onSubmit(quotePayload);
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

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <QuoteSummary items={formData.items} />
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
                        {loading ? 'Guardando...' : (initialData ? 'Actualizar Cotización' : 'Guardar Cotización')}
                    </Button>
                </div>
            )}
        </form>
    );
};

export default QuoteForm;
