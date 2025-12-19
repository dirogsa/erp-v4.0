import React, { useState } from 'react';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import ProductsTable from '../components/features/inventory/ProductsTable';
import ProductForm from '../components/features/inventory/ProductForm';
import TransfersSection from '../components/features/inventory/TransfersSection';
import LossesSection from '../components/features/inventory/LossesSection';
import PriceManagement from '../components/features/inventory/PriceManagement';
import LoyaltyManagement from '../components/features/inventory/LoyaltyManagement';
import Pagination from '../components/common/Table/Pagination';
import { useProducts } from '../hooks/useProducts';

const Inventory = () => {
    const [activeTab, setActiveTab] = useState('products');
    const [showProductModal, setShowProductModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isViewMode, setIsViewMode] = useState(false);

    // Pagination & Search State
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [search, setSearch] = useState('');

    const {
        products,
        pagination,
        loading,
        createProduct,
        updateProduct,
        deleteProduct
    } = useProducts({ page, limit, search });

    const handleCreate = async (data) => {
        try {
            await createProduct(data, data.initial_stock);
            setShowProductModal(false);
        } catch (error) { }
    };

    const handleUpdate = async (data) => {
        try {
            await updateProduct(data.sku, data, data.stock_current);
            setShowProductModal(false);
        } catch (error) { }
    };

    return (
        <div style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ color: 'white', marginBottom: '0.5rem' }}>Gestión de Inventario</h1>
                    <p style={{ color: '#94a3b8' }}>Control de productos, transferencias y ajustes</p>
                </div>
                {activeTab === 'products' && (
                    <Button onClick={() => {
                        setSelectedProduct(null);
                        setIsViewMode(false);
                        setShowProductModal(true);
                    }}>
                        + Nuevo Producto
                    </Button>
                )}
            </div>

            <div style={{ marginBottom: '2rem', borderBottom: '1px solid #334155' }}>
                <button
                    onClick={() => setActiveTab('products')}
                    style={{
                        padding: '1rem 2rem',
                        background: 'none',
                        border: 'none',
                        borderBottom: activeTab === 'products' ? '2px solid #3b82f6' : 'none',
                        color: activeTab === 'products' ? '#3b82f6' : '#94a3b8',
                        cursor: 'pointer',
                        fontWeight: '500'
                    }}
                >
                    📦 Productos
                </button>
                <button
                    onClick={() => setActiveTab('transfers')}
                    style={{
                        padding: '1rem 2rem',
                        background: 'none',
                        border: 'none',
                        borderBottom: activeTab === 'transfers' ? '2px solid #3b82f6' : 'none',
                        color: activeTab === 'transfers' ? '#3b82f6' : '#94a3b8',
                        cursor: 'pointer',
                        fontWeight: '500'
                    }}
                >
                    🚚 Transferencias
                </button>
                <button
                    onClick={() => setActiveTab('losses')}
                    style={{
                        padding: '1rem 2rem',
                        background: 'none',
                        border: 'none',
                        borderBottom: activeTab === 'losses' ? '2px solid #3b82f6' : 'none',
                        color: activeTab === 'losses' ? '#3b82f6' : '#94a3b8',
                        cursor: 'pointer',
                        fontWeight: '500'
                    }}
                >
                    ⚖️ Ajustes
                </button>
                <button
                    onClick={() => setActiveTab('prices')}
                    style={{
                        padding: '1rem 2rem',
                        background: 'none',
                        border: 'none',
                        borderBottom: activeTab === 'prices' ? '2px solid #3b82f6' : 'none',
                        color: activeTab === 'prices' ? '#3b82f6' : '#94a3b8',
                        cursor: 'pointer',
                        fontWeight: '500'
                    }}
                >
                    💲 Precios
                </button>
                <button
                    onClick={() => setActiveTab('loyalty')}
                    style={{
                        padding: '1rem 2rem',
                        background: 'none',
                        border: 'none',
                        borderBottom: activeTab === 'loyalty' ? '2px solid #3b82f6' : 'none',
                        color: activeTab === 'loyalty' ? '#3b82f6' : '#94a3b8',
                        cursor: 'pointer',
                        fontWeight: '500'
                    }}
                >
                    ⭐ Fidelización
                </button>
            </div>

            {activeTab === 'products' && (
                <>
                    <div style={{ maxWidth: '400px', marginBottom: '1rem' }}>
                        <Input
                            placeholder="Buscar por nombre o SKU..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1); // Reset to first page on search
                            }}
                        />
                    </div>

                    <ProductsTable
                        products={products}
                        loading={loading}
                        onView={(product) => {
                            setSelectedProduct(product);
                            setIsViewMode(true);
                            setShowProductModal(true);
                        }}
                        onEdit={(product) => {
                            setSelectedProduct(product);
                            setIsViewMode(false);
                            setShowProductModal(true);
                        }}
                        onDelete={(product) => {
                            if (window.confirm('¿Está seguro de eliminar este producto?')) {
                                deleteProduct(product.sku);
                            }
                        }}
                    />

                    <Pagination
                        current={pagination.current}
                        total={pagination.total}
                        onChange={setPage}
                        pageSize={limit}
                        onPageSizeChange={(newSize) => {
                            setLimit(newSize);
                            setPage(1);
                        }}
                    />
                </>
            )}

            {activeTab === 'transfers' && <TransfersSection />}

            {activeTab === 'losses' && <LossesSection />}

            {activeTab === 'prices' && <PriceManagement />}

            {activeTab === 'loyalty' && <LoyaltyManagement />}

            {/* Modal de Producto */}
            {showProductModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000,
                    display: 'flex', justifyContent: 'center', alignItems: 'center'
                }}>
                    <div style={{ backgroundColor: '#0f172a', borderRadius: '0.5rem', width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ color: 'white', margin: 0 }}>{selectedProduct ? 'Editar Producto' : 'Nuevo Producto'}</h2>
                            <button onClick={() => setShowProductModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                        </div>
                        <ProductForm
                            initialData={selectedProduct}
                            onSubmit={selectedProduct ? handleUpdate : handleCreate}
                            onCancel={() => setShowProductModal(false)}
                            loading={loading}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default Inventory;
