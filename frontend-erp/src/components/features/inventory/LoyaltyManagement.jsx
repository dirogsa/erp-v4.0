import React, { useState } from 'react';
import Table from '../../common/Table';
import Input from '../../common/Input';
import Button from '../../common/Button';
import Pagination from '../../common/Table/Pagination';
import { useProducts } from '../../../hooks/useProducts';

const LoyaltyManagement = () => {
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [search, setSearch] = useState('');

    const [editingProduct, setEditingProduct] = useState(null);
    const [newPoints, setNewPoints] = useState(0);
    const [newPointsCost, setNewPointsCost] = useState(0);

    const { products, pagination, loading, updateProduct } = useProducts({ page, limit, search });

    const handleEditClick = (product) => {
        setEditingProduct(product);
        setNewPoints(product.loyalty_points || 0);
        setNewPointsCost(product.points_cost || 0);
    };

    const handleSavePoints = async () => {
        if (!editingProduct) return;

        try {
            await updateProduct(editingProduct.sku, {
                ...editingProduct,
                loyalty_points: newPoints,
                points_cost: newPointsCost
            });
            setEditingProduct(null);
        } catch (e) {
            console.error("Error updating loyalty points", e);
        }
    };

    const columns = [
        { label: 'SKU', key: 'sku' },
        { label: 'Nombre', key: 'name' },
        {
            label: 'Puntos Ganados',
            key: 'loyalty_points',
            align: 'center',
            render: (val) => (
                <span style={{
                    background: '#1e293b',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '1rem',
                    color: '#fbbf24',
                    fontWeight: 'bold',
                    border: '1px solid #fbbf24'
                }}>
                    ⭐ {val || 0} pts
                </span>
            )
        },
        {
            label: 'Costo Canje',
            key: 'points_cost',
            align: 'center',
            render: (val) => (
                <span style={{
                    background: val > 0 ? '#064e3b' : '#1e293b',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '1rem',
                    color: val > 0 ? '#34d399' : '#64748b',
                    fontWeight: 'bold',
                    border: `1px solid ${val > 0 ? '#34d399' : '#334155'}`
                }}>
                    🎁 {val || 0} pts
                </span>
            )
        },
        {
            label: 'Acciones', key: 'actions', align: 'center',
            render: (_, row) => (
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                    <Button size="small" variant="primary" onClick={() => handleEditClick(row)}>
                        ✏️ Ajustar Puntos
                    </Button>
                </div>
            )
        }
    ];

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ maxWidth: '400px' }}>
                    <Input
                        placeholder="Buscar por nombre o SKU..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    />
                </div>
            </div>

            <Table columns={columns} data={products} loading={loading} />

            <Pagination
                current={pagination.current}
                total={pagination.total}
                onChange={setPage}
                pageSize={limit}
                onPageSizeChange={(n) => { setLimit(n); setPage(1); }}
            />

            {/* Edit Points Modal */}
            {editingProduct && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <div style={{ backgroundColor: '#0f172a', borderRadius: '0.5rem', width: '100%', maxWidth: '400px', padding: '1.5rem' }}>
                        <h2 style={{ color: 'white', marginBottom: '1rem' }}>Ajustar Puntos: {editingProduct.name}</h2>
                        <p style={{ color: '#94a3b8', marginBottom: '1rem' }}>SKU: {editingProduct.sku}</p>

                        <div style={{ display: 'grid', gap: '1rem' }}>
                            <Input
                                label="Puntos Ganados por Compra"
                                type="number"
                                value={newPoints}
                                onChange={(e) => setNewPoints(parseInt(e.target.value) || 0)}
                            />

                            <Input
                                label="Costo en Puntos para Canje"
                                type="number"
                                value={newPointsCost}
                                onChange={(e) => setNewPointsCost(parseInt(e.target.value) || 0)}
                                placeholder="0 para no canjeable"
                            />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                            <Button variant="secondary" onClick={() => setEditingProduct(null)}>Cancelar</Button>
                            <Button variant="primary" onClick={handleSavePoints}>Guardar</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LoyaltyManagement;
