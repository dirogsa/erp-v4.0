import React, { useState } from 'react';
import Table from '../../common/Table';
import Button from '../../common/Button';
import Input from '../../common/Input';
import Select from '../../common/Select';

import { useTransfers } from '../../../hooks/useTransfers';
import { useProducts } from '../../../hooks/useProducts';

const TransfersSection = () => {
    const { transfers, warehouses, createTransfer, loading } = useTransfers();
    const { products, refetch: refetchProducts } = useProducts();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [formData, setFormData] = useState({
        target_warehouse_id: '',
        sku: '',
        quantity: 1,
        notes: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.target_warehouse_id || !formData.sku || formData.quantity <= 0) return;

        try {
            await createTransfer({
                target_warehouse_id: formData.target_warehouse_id,
                items: [{ sku: formData.sku, quantity: parseInt(formData.quantity) }],
                notes: formData.notes
            });
            setIsModalOpen(false);
            setFormData({ target_warehouse_id: '', sku: '', quantity: 1, notes: '' });
            refetchProducts(); // Refresh stock
        } catch (error) {
            // Error handled by hook
        }
    };

    const getProductStock = (sku) => {
        const product = products.find(p => p.sku === sku);
        return product ? product.stock_current : 0;
    };

    const columns = [
        { label: 'Fecha', key: 'date' },
        { label: 'N° Guía', key: 'guide', render: (val) => <strong>{val}</strong> },
        {
            label: 'Destino',
            key: 'warehouse',
            render: (val) => {
                const wh = warehouses.find(w => w.code === val);
                return wh ? wh.name : val;
            }
        },
        {
            label: 'Producto',
            key: 'product',
            render: (val) => {
                const p = products.find(prod => prod.sku === val);
                return p ? p.name : val;
            }
        },
        {
            label: 'Cantidad',
            key: 'quantity',
            align: 'center',
            render: (val) => <span style={{ color: '#ef4444', fontWeight: 'bold' }}>-{val}</span>
        },
        { label: 'Notas', key: 'notes' }
    ];

    return (
        <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ textAlign: 'center', padding: '1.5rem', backgroundColor: '#1e293b', borderRadius: '0.5rem' }}>
                    <h3 style={{ fontSize: '2rem', color: '#3b82f6', margin: 0 }}>{transfers.length}</h3>
                    <p style={{ color: '#94a3b8', margin: 0 }}>Envíos (Sesión)</p>
                </div>
                <div style={{ textAlign: 'center', padding: '1.5rem', backgroundColor: '#1e293b', borderRadius: '0.5rem' }}>
                    <h3 style={{ fontSize: '2rem', color: '#94a3b8', margin: 0 }}>{warehouses.filter(w => !w.is_main).length}</h3>
                    <p style={{ color: '#94a3b8', margin: 0 }}>Almacenes Destino</p>
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                <Button onClick={() => setIsModalOpen(true)}>+ Nueva Transferencia</Button>
            </div>

            <Table
                columns={columns}
                data={transfers}
                emptyMessage="No se han registrado transferencias en esta sesión."
            />

            {isModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000,
                    display: 'flex', justifyContent: 'center', alignItems: 'center'
                }}>
                    <div style={{ backgroundColor: '#0f172a', padding: '2rem', borderRadius: '0.5rem', width: '100%', maxWidth: '500px' }}>
                        <h2 style={{ color: 'white', marginBottom: '1.5rem' }}>Emitir Guía de Remisión</h2>
                        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
                            <Select
                                label="Almacén Destino"
                                value={formData.target_warehouse_id}
                                onChange={(e) => setFormData({ ...formData, target_warehouse_id: e.target.value })}
                                options={warehouses.filter(w => !w.is_main).map(w => ({ value: w.code, label: `${w.name} (${w.address})` }))}
                                required
                            />

                            <Select
                                label="Producto"
                                value={formData.sku}
                                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                options={products.map(p => ({ value: p.sku, label: `${p.sku} - ${p.name} (Stock: ${p.stock_current})` }))}
                                required
                            />

                            {formData.sku && (
                                <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
                                    Stock Disponible: <strong>{getProductStock(formData.sku)}</strong>
                                </div>
                            )}

                            <Input
                                label="Cantidad a Transferir"
                                type="number"
                                value={formData.quantity}
                                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                min="1"
                                max={formData.sku ? getProductStock(formData.sku) : 9999}
                                required
                            />

                            <Input
                                label="Notas / Observaciones"
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            />

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                                <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                                <Button type="submit" variant="primary" disabled={loading}>Generar Guía</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TransfersSection;
