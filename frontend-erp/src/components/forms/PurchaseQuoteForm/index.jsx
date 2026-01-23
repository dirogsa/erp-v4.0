import React, { useState, useEffect } from 'react';
import SupplierSelector from './SupplierSelector';
import QuoteSummary from '../QuoteForm/QuoteSummary'; // Reuse QuoteSummary
import Button from '../../common/Button';
import { useNotification } from '../../../hooks/useNotification';
import ProductItemsSection from './ProductItemsSection'; // Need to check if I can reuse or create new

const PurchaseQuoteForm = ({
    initialData = null,
    onSubmit,
    onCancel,
    loading = false,
    readOnly = false
}) => {
    const { showNotification } = useNotification();

    const [formData, setFormData] = useState({
        supplier: {
            name: '',
            email: '',
            phone: '',
            address: ''
        },
        delivery_date: '',
        currency: 'SOLES',
        items: [],
        notes: '',
        ...initialData
    });

    useEffect(() => {
        if (initialData) {
            setFormData(prev => ({
                ...prev,
                ...initialData,
                currency: initialData.currency || 'SOLES',
                supplier: initialData.supplier || {
                    name: initialData.supplier_name || ''
                },
                items: (initialData.items || []).map(item => ({
                    ...item,
                    subtotal: item.subtotal !== undefined ? item.subtotal : Math.round((item.quantity * item.unit_cost) * 100) / 100
                }))
            }));
        }
    }, [initialData]);

    const handleSupplierChange = (supplierData) => {
        setFormData(prev => ({
            ...prev,
            supplier: supplierData,
            supplier_name: supplierData.name
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

        if (!formData.supplier_name) {
            showNotification('Debe seleccionar un proveedor', 'error');
            return;
        }

        if (formData.items.length === 0) {
            showNotification('Debe agregar al menos un ítem', 'error');
            return;
        }

        const total = formData.items.reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0);

        const quotePayload = {
            ...formData,
            items: formData.items,
            total_amount: total
        };

        onSubmit(quotePayload);
    };

    return (
        <form onSubmit={handleSubmit}>
            <div style={{
                padding: '1rem',
                backgroundColor: '#1e293b',
                borderRadius: '0.5rem',
                marginBottom: '1rem',
                display: 'grid',
                gridTemplateColumns: 'minmax(200px, 1fr) 150px',
                gap: '1rem'
            }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Fecha de Solicitud</label>
                    <input
                        type="date"
                        value={formData.date || new Date().toISOString().split('T')[0]}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        disabled={readOnly}
                        style={{
                            padding: '0.5rem',
                            backgroundColor: '#0f172a',
                            border: '1px solid #334155',
                            borderRadius: '0.25rem',
                            color: 'white'
                        }}
                    />
                </div>
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

            <SupplierSelector
                value={formData.supplier}
                onChange={handleSupplierChange}
                readOnly={readOnly}
                required
            />

            <ProductItemsSection
                items={formData.items}
                onItemsChange={handleItemsChange}
                readOnly={readOnly}
                isPurchase={true} // Specify it's for purchase (uses Cost instead of Price)
            />

            <div style={{ marginTop: '1rem' }}>
                <label style={{ display: 'block', color: '#94a3b8', marginBottom: '0.5rem' }}>Notas</label>
                <textarea
                    style={{
                        width: '100%',
                        padding: '0.5rem',
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '0.25rem',
                        color: 'white',
                        minHeight: '80px'
                    }}
                    value={formData.notes || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    readOnly={readOnly}
                />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <QuoteSummary items={formData.items} isPurchase={true} currency={formData.currency} />
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
                        {loading ? 'Guardando...' : (initialData ? 'Actualizar Solicitud' : 'Crear Solicitud')}
                    </Button>
                </div>
            )}
        </form>
    );
};

export default PurchaseQuoteForm;
