import React, { useState, useEffect } from 'react';
import Button from '../../common/Button';
import { formatCurrency } from '../../../utils/formatters';
import { inventoryService } from '../../../services/api';
import { useNotification } from '../../../hooks/useNotification';

const RFQToOrderConversionModal = ({ visible, quote, onClose, onConfirm, loading }) => {
    const { showNotification } = useNotification();
    const [items, setItems] = useState([]);
    const [registering, setRegistering] = useState(false);

    const [validating, setValidating] = useState(false);

    useEffect(() => {
        if (quote && visible) {
            const initialItems = quote.items.map(item => ({
                ...item,
                unit_cost: item.unit_cost || 0,
                subtotal: (item.quantity || 0) * (item.unit_cost || 0)
            }));
            
            // Set items immediately for quick render
            setItems(initialItems);

            // Background validation for older quotes that might not have the is_custom flag saved correctly
            const verifyInventory = async () => {
                setValidating(true);
                const updatedItems = [...initialItems];
                for (let i = 0; i < updatedItems.length; i++) {
                    try {
                        const res = await inventoryService.getProducts(1, 1, updatedItems[i].product_sku);
                        const match = res.data.items.find(p => p.sku === updatedItems[i].product_sku);
                        if (!match) {
                            updatedItems[i].is_custom = true;
                        } else {
                            updatedItems[i].is_custom = false;
                        }
                    } catch (error) {
                        updatedItems[i].is_custom = true;
                    }
                }
                setItems(updatedItems);
                setValidating(false);
            };

            verifyInventory();
        }
    }, [quote, visible]);

    if (!visible || !quote) return null;

    const handlePriceChange = (index, value) => {
        const newPrice = parseFloat(value) || 0;
        const newItems = [...items];
        newItems[index] = {
            ...newItems[index],
            unit_cost: newPrice,
            subtotal: newItems[index].quantity * newPrice
        };
        setItems(newItems);
    };

    const total = items.reduce((sum, item) => sum + item.subtotal, 0);

    const handleBatchRegister = async () => {
        setRegistering(true);
        let count = 0;
        try {
            for (let i = 0; i < items.length; i++) {
                if (items[i].is_custom) {
                    // Create basic product in inventory
                    await inventoryService.createProduct({
                        sku: items[i].product_sku,
                        name: items[i].product_name,
                        cost: items[i].unit_cost,
                        price: items[i].unit_cost * 1.3, // Default 30% margin
                        stock: 0,
                        category: "GENERAL",
                        description: `Importado desde RFQ ${quote.quote_number}`
                    });
                    
                    // Mark as no longer custom in our local state
                    const updatedItems = [...items];
                    updatedItems[i].is_custom = false;
                    setItems(updatedItems);
                    count++;
                }
            }
            showNotification(`${count} productos registrados exitosamente en el catálogo.`, 'success');
        } catch (error) {
            showNotification('Error al registrar algunos productos. Verifique que el SKU no exista.', 'error');
        } finally {
            setRegistering(false);
        }
    };

    const handleFinalize = () => {
        // 1. Check prices
        if (items.some(item => item.unit_cost <= 0)) {
            showNotification('Todos los productos deben tener un precio mayor a 0.', 'error');
            return;
        }

        // 2. Check registration
        if (items.some(item => item.is_custom)) {
            showNotification('Debe registrar todos los productos en el catálogo antes de generar la Orden de Compra.', 'error');
            return;
        }

        onConfirm({
            ...quote,
            items: items,
            total_amount: total
        });
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 3000,
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            backdropFilter: 'blur(4px)', padding: '2rem'
        }}>
            <div style={{
                backgroundColor: '#0f172a', borderRadius: '1rem',
                width: '100%', maxWidth: '1000px', maxHeight: '90vh',
                display: 'flex', flexDirection: 'column', border: '1px solid #334155',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
            }}>
                {/* Header */}
                <div style={{ padding: '1.5rem', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ color: 'white', margin: 0, fontSize: '1.25rem' }}>Convertir a Orden de Compra</h2>
                        <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>
                            RFQ: <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>{quote.quote_number}</span> | Proveedor: {quote.supplier_name}
                        </p>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                </div>

                {/* Body */}
                <div style={{ padding: '1.5rem', overflowY: 'auto' }}>
                    <div style={{ 
                        backgroundColor: '#1e293b', padding: '1rem', borderRadius: '0.5rem', 
                        marginBottom: '1.5rem', borderLeft: '4px solid #3b82f6', color: '#e2e8f0', fontSize: '0.9rem' 
                    }}>
                        ℹ️ <strong>Instrucciones:</strong> Ingrese los precios finales negociados con el proveedor. Si hay productos marcados como <span style={{ color: '#fbbf24' }}>"NUEVO"</span>, debe registrarlos en su catálogo usando el botón de abajo antes de finalizar.
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '2px solid #334155', color: '#94a3b8', fontSize: '0.85rem' }}>
                                <th style={{ padding: '0.75rem' }}>Estado</th>
                                <th style={{ padding: '0.75rem' }}>Cant.</th>
                                <th style={{ padding: '0.75rem' }}>SKU / Código</th>
                                <th style={{ padding: '0.75rem' }}>Descripción del Producto</th>
                                <th style={{ padding: '0.75rem', width: '120px' }}>Costo Unit.</th>
                                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, index) => (
                                <tr key={index} style={{ borderBottom: '1px solid #1e293b' }}>
                                    <td style={{ padding: '1rem 0.75rem' }}>
                                        {item.is_custom ? (
                                            <span style={{ 
                                                backgroundColor: '#fbbf24', color: 'black', 
                                                fontSize: '0.65rem', padding: '2px 6px', borderRadius: '2px', fontWeight: 'bold' 
                                            }}>NUEVO</span>
                                        ) : (
                                            <span style={{ 
                                                backgroundColor: '#10b981', color: 'white', 
                                                fontSize: '0.65rem', padding: '2px 6px', borderRadius: '2px', fontWeight: 'bold' 
                                            }}>REGISTRADO</span>
                                        )}
                                    </td>
                                    <td style={{ padding: '1rem 0.75rem', fontWeight: 'bold' }}>{item.quantity}</td>
                                    <td style={{ padding: '1rem 0.75rem', fontSize: '0.85rem', color: '#94a3b8' }}>{item.product_sku}</td>
                                    <td style={{ padding: '1rem 0.75rem', fontSize: '0.9rem' }}>{item.product_name}</td>
                                    <td style={{ padding: '1rem 0.75rem' }}>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={item.unit_cost}
                                            onChange={(e) => handlePriceChange(index, e.target.value)}
                                            style={{
                                                width: '100px', padding: '0.4rem', 
                                                backgroundColor: '#0f172a', border: '1px solid #334155',
                                                borderRadius: '0.25rem', color: 'white', textAlign: 'right'
                                            }}
                                        />
                                    </td>
                                    <td style={{ padding: '1rem 0.75rem', textAlign: 'right', fontWeight: 'bold' }}>
                                        {formatCurrency(item.subtotal, quote.currency === 'DOLARES' ? '$' : 'S/')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem' }}>
                        <Button 
                            variant="warning" 
                            onClick={handleBatchRegister}
                            disabled={registering || !items.some(i => i.is_custom)}
                        >
                            {registering ? 'Registrando...' : '🚀 Registrar Productos Nuevos en Inventario'}
                        </Button>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Total Orden de Compra:</div>
                            <div style={{ color: 'white', fontSize: '1.5rem', fontWeight: '900' }}>
                                {formatCurrency(total, quote.currency === 'DOLARES' ? '$' : 'S/')}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div style={{ padding: '1.5rem', borderTop: '1px solid #334155', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                    <Button 
                        variant="primary" 
                        onClick={handleFinalize}
                        disabled={loading || registering}
                    >
                        {loading ? 'Generando OC...' : '✅ Confirmar y Generar Orden de Compra'}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default RFQToOrderConversionModal;
