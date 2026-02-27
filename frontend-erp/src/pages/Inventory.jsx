import React, { useState, useEffect } from 'react';
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
import { categoryService } from '../services/api';
import ProductDetailsView from '../components/features/inventory/ProductDetailsView';
import SmartSearch from '../components/features/inventory/SmartSearch';

const Inventory = ({ forcedType = null }) => {
    const defaultTab = forcedType === 'MARKETING' ? 'marketing' : 'products';
    const [activeTab, setActiveTab] = useState(defaultTab);
    const [showProductModal, setShowProductModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isViewMode, setIsViewMode] = useState(false);
    const [categories, setCategories] = useState([]);

    // Pagination & Search State
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await categoryService.getCategories();
                setCategories(res.data);
            } catch (error) {
                console.error("Error loading categories", error);
            }
        };
        fetchCategories();
    }, []);

    const {
        products,
        pagination,
        loading,
        createProduct,
        updateProduct,
        deleteProduct,
        error
    } = useProducts({
        page,
        limit,
        search,
        type: forcedType || (activeTab === 'products' ? 'COMMERCIAL' : '')
    });

    console.log('[Inventory] Render - Tab:', activeTab, 'Loading:', loading, 'Products count:', products?.length);
    if (error) console.error('[Inventory] Error loading products:', error);

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
                    <h1 style={{ color: 'white', marginBottom: '0.5rem' }}>
                        {forcedType === 'MARKETING' ? 'Gestión de Publicidad' : 'Gestión de Inventario'}
                    </h1>
                    <p style={{ color: '#94a3b8' }}>
                        {forcedType === 'MARKETING' ? 'Control de artículos y premios publicitarios' : 'Control de productos, transferencias y ajustes'}
                    </p>
                </div>
                {(activeTab === 'products' || activeTab === 'marketing') && (
                    <Button onClick={() => {
                        setSelectedProduct(null);
                        setIsViewMode(false);
                        setShowProductModal(true);
                    }}>
                        {forcedType === 'MARKETING' || activeTab === 'marketing' ? '+ Nuevo Artículo Publicitario' : '+ Nuevo Producto'}
                    </Button>
                )}
            </div>

            {!forcedType && (
                <div style={{ marginBottom: '2rem', borderBottom: '1px solid #334155' }}>
                    <button
                        onClick={() => { setActiveTab('products'); setPage(1); }}
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
                        onClick={() => setActiveTab('smart-search')}
                        style={{
                            padding: '1rem 2rem',
                            background: 'none',
                            border: 'none',
                            borderBottom: activeTab === 'smart-search' ? '2px solid #ffc107' : 'none',
                            color: activeTab === 'smart-search' ? '#ffc107' : '#94a3b8',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        🔎 Búsqueda Inteligente
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
            )}

            {(activeTab === 'products' || activeTab === 'marketing') && (
                <>
                    <div style={{ maxWidth: '400px', marginBottom: '1rem' }}>
                        <Input
                            placeholder={forcedType === 'MARKETING' || activeTab === 'marketing' ? "Buscar premios..." : "Buscar por filtros..."}
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
                        isMarketing={forcedType === 'MARKETING' || activeTab === 'marketing'}
                        categories={categories}
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
                            if (window.confirm('¿Está seguro de eliminar este ítem?')) {
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

            {activeTab === 'smart-search' && <SmartSearch />}

            {/* Modal de Producto */}
            {showProductModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1000,
                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                    backdropFilter: 'blur(5px)'
                }}>
                    <div style={{
                        backgroundColor: '#0f172a',
                        borderRadius: '1rem',
                        width: '100%',
                        maxWidth: isViewMode ? '900px' : '800px', // Wider for view mode
                        height: isViewMode ? '85vh' : 'auto',
                        maxHeight: '95vh',
                        overflow: 'hidden', // Let children handle scroll
                        overflowY: isViewMode ? 'hidden' : 'auto',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                        border: '1px solid #334155'
                    }}>
                        {isViewMode && selectedProduct ? (
                            <ProductDetailsView
                                product={selectedProduct}
                                onClose={() => setShowProductModal(false)}
                            />
                        ) : (
                            <>
                                <div style={{ padding: '1.5rem', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h2 style={{ color: 'white', margin: 0 }}>
                                        {selectedProduct ? 'Editar Producto' : 'Nuevo Producto'}
                                    </h2>
                                    <button onClick={() => setShowProductModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                                </div>
                                <div style={{ overflowY: 'auto', maxHeight: 'calc(95vh - 80px)' }}>
                                    <ProductForm
                                        initialData={selectedProduct || { type: forcedType || (activeTab === 'marketing' ? 'MARKETING' : 'COMMERCIAL') }}
                                        onSubmit={selectedProduct ? handleUpdate : handleCreate}
                                        onCancel={() => setShowProductModal(false)}
                                        loading={loading}
                                        isViewMode={isViewMode}
                                        fixedType={forcedType || (activeTab === 'products' ? 'COMMERCIAL' : 'MARKETING')}
                                    />
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Inventory;
