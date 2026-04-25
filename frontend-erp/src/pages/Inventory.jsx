import React, { useState, useEffect } from 'react';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import ProductsTable from '../components/features/inventory/ProductsTable';
import ProductForm from '../components/features/inventory/ProductForm';
import TransfersSection from '../components/features/inventory/TransfersSection';
import LossesSection from '../components/features/inventory/LossesSection';

import LoyaltyManagement from '../components/features/inventory/LoyaltyManagement';
import Pagination from '../components/common/Table/Pagination';
import { useProducts } from '../hooks/useProducts';
import { categoryService, inventoryService } from '../services/api';
import ProductDetailsView from '../components/features/inventory/ProductDetailsView';
import SmartSearch from '../components/features/inventory/SmartSearch';
import LoadingOverlay from '../components/common/LoadingOverlay';
import { useNotification } from '../hooks/useNotification';

const Inventory = ({ forcedType = null }) => {
    const defaultTab = forcedType === 'MARKETING' ? 'marketing' : 'products';
    const [activeTab, setActiveTab] = useState(defaultTab);
    const [showProductModal, setShowProductModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isViewMode, setIsViewMode] = useState(false);
    const [categories, setCategories] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isBulkLoading, setIsBulkLoading] = useState(false);
    const { showNotification } = useNotification();

    // Pagination & Search State
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [search, setSearch] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);

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
        error,
        refetch
    } = useProducts({
        page,
        limit,
        search,
        type: forcedType || (activeTab === 'products' ? 'COMMERCIAL' : '')
    });

    if (error) console.error('[Inventory] Error loading products:', error);

    // ── Toggle Individual de Visibilidad ────────────────────────────────────
    const handleToggleVisibility = async (product, field, newValue) => {
        const productId = (product.id || product._id)?.toString();
        if (!productId) {
            showNotification('Este producto no tiene ID de MongoDB. Guárdalo primero.', 'error');
            return;
        }
        try {
            await inventoryService.toggleVisibility(productId, { [field]: newValue });
            refetch && refetch();
        } catch (err) {
            const msg = err.response?.data?.detail || 'Error al cambiar visibilidad';
            showNotification(msg, 'error');
        }
    };

    // ── Activación Masiva (Global o por Selección) ──────────────────────────
    const handleBulkVisibility = async ({ is_active_in_shop, is_new, only_with_price = false, label, ids = null }) => {
        const isSelection = ids && ids.length > 0;
        const targetText = isSelection 
            ? `los ${ids.length} productos seleccionados` 
            : `TODOS los productos COMMERCIAL no discontinuados${only_with_price ? ' con precio > 0' : ''}`;

        const confirm = window.confirm(
            `¿Confirmas aplicar esta acción masiva?\n\n"${label}"\n\nAfectará a: ${targetText}.`
        );
        if (!confirm) return;
        
        setIsBulkLoading(true);
        try {
            const payload = { only_with_price };
            if (is_active_in_shop !== undefined) payload.is_active_in_shop = is_active_in_shop;
            if (is_new !== undefined) payload.is_new = is_new;
            if (isSelection) payload.product_ids = ids;

            const res = await inventoryService.bulkSetVisibility(payload);
            const { modified } = res.data;
            showNotification(`✅ ${label}: ${modified} productos actualizados`, 'success');
            
            if (isSelection) setSelectedIds([]);
            refetch && refetch();
        } catch (err) {
            const msg = err.response?.data?.detail || 'Error en activación masiva';
            showNotification(msg, 'error');
        } finally {
            setIsBulkLoading(false);
        }
    };

    // ── Seleccionar TODO el universo filtrado ────────────────────────────────
    const handleSelectAllFiltered = async () => {
        setIsBulkLoading(true);
        try {
            // Obtenemos todos los IDs que coinciden con la búsqueda actual sin paginación
            const res = await inventoryService.getProducts(1, 10000, search, '', forcedType || (activeTab === 'products' ? 'COMMERCIAL' : ''));
            const allIds = res.data.items.map(p => p._id);
            setSelectedIds(allIds);
            showNotification(`Seleccionados ${allIds.length} productos (total de la búsqueda)`, 'info');
        } catch (err) {
            showNotification('Error al seleccionar todo', 'error');
        } finally {
            setIsBulkLoading(false);
        }
    };

    const handleCreate = async (data) => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            await createProduct(data, data.initial_stock);
            setShowProductModal(false);
        } catch (error) { 
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdate = async (data) => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            await updateProduct(data.sku, data, data.stock_current);
            setShowProductModal(false);
        } catch (error) { 
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{ padding: '2rem' }}>
            <LoadingOverlay 
                visible={isSubmitting} 
                message="Actualizando Inventario..." 
                subMessage="Estamos sincronizando los datos y las marcas vehiculares."
            />
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
                        onClick={() => { setActiveTab('losses'); setSelectedIds([]); }}
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
                        onClick={() => { setActiveTab('loyalty'); setSelectedIds([]); }}
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
                    {/* ── Barra de Acciones Masivas para Selección (FLOTANTE) ── */}
                    {selectedIds.length > 0 && (
                        <div style={{
                            position: 'fixed',
                            bottom: '2rem',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            background: '#0f172a',
                            border: '1px solid #3b82f6',
                            borderRadius: '1rem',
                            padding: '1rem 1.5rem',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1.5rem',
                            zIndex: 100,
                            animation: 'slideUp 0.3s ease-out'
                        }}>
                             <style>{`@keyframes slideUp { from { transform: translate(-50%, 20px); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }`}</style>
                             <div style={{ display: 'flex', flexDirection: 'column' }}>
                                 <span style={{ color: 'white', fontWeight: 'bold', fontSize: '0.9rem' }}>{selectedIds.length} ítems seleccionados</span>
                                 <div style={{ display: 'flex', gap: '0.8rem' }}>
                                     <button 
                                        onClick={() => setSelectedIds([])}
                                        style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.75rem', padding: 0, textAlign: 'left', cursor: 'pointer', textDecoration: 'underline' }}
                                     >
                                        Limpiar selección
                                     </button>
                                     {selectedIds.length < (pagination.totalItems || 0) && (
                                         <button 
                                            onClick={handleSelectAllFiltered}
                                            style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: '0.75rem', padding: 0, textAlign: 'left', cursor: 'pointer', fontWeight: '700' }}
                                         >
                                            Seleccionar los {pagination.totalItems} productos
                                         </button>
                                     )}
                                 </div>
                             </div>
                             
                             <div style={{ width: '1px', height: '30px', background: '#334155' }} />

                             <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <button
                                    onClick={() => handleBulkVisibility({ is_active_in_shop: true, ids: selectedIds, label: 'Activar en Tienda' })}
                                    style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', background: '#10b981', color: 'white', border: 'none', fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem' }}
                                >
                                    🛒 Activar en Tienda
                                </button>
                                <button
                                    onClick={() => handleBulkVisibility({ is_active_in_shop: false, ids: selectedIds, label: 'Ocultar de Tienda' })}
                                    style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', background: '#ef4444', color: 'white', border: 'none', fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem' }}
                                >
                                    🚫 Ocultar
                                </button>
                                <button
                                    onClick={() => handleBulkVisibility({ is_new: true, ids: selectedIds, label: 'Marcar Novedad' })}
                                    style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', background: '#f59e0b', color: 'white', border: 'none', fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem' }}
                                >
                                    ✨ Novedad
                                </button>
                             </div>
                        </div>
                    )}

                    {/* ── Opciones de Gestión Global (Ocultables) ── */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
                        <div style={{ maxWidth: '400px', flex: 1 }}>
                            <Input
                                placeholder={forcedType === 'MARKETING' || activeTab === 'marketing' ? "Buscar premios..." : "Buscar por filtros..."}
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setPage(1);
                                    setSelectedIds([]);
                                }}
                            />
                        </div>

                        {activeTab === 'products' && (
                             <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    onClick={() => handleBulkVisibility({ is_active_in_shop: true, only_with_price: true, label: 'Activar Catálogo con Precio' })}
                                    style={{ background: '#1e293b', border: '1px solid #334155', color: '#94a3b8', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.75rem', cursor: 'pointer' }}
                                >
                                    ⚡ Auto-activar (Con Precio)
                                </button>
                                <button
                                    onClick={() => handleBulkVisibility({ is_active_in_shop: false, label: 'Ocultar TODO el Catálogo' })}
                                    style={{ background: '#1e293b', border: '1px solid #334155', color: '#94a3b8', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.75rem', cursor: 'pointer' }}
                                >
                                    🔒 Ocultar Todo
                                </button>
                             </div>
                        )}
                    </div>

                    <ProductsTable
                        products={products}
                        loading={loading}
                        isMarketing={forcedType === 'MARKETING' || activeTab === 'marketing'}
                        categories={categories}
                        onToggleVisibility={handleToggleVisibility}
                        selectedIds={selectedIds}
                        onSelectionChange={setSelectedIds}
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
                                        initialData={selectedProduct ? {
                                            ...selectedProduct,
                                            category_id: selectedProduct.category_id || '',
                                            type: selectedProduct.type || 'COMMERCIAL'
                                        } : { 
                                            type: forcedType || (activeTab === 'marketing' ? 'MARKETING' : 'COMMERCIAL'),
                                            category_id: '',
                                        }}
                                        onSubmit={selectedProduct ? handleUpdate : handleCreate}
                                        onCancel={() => setShowProductModal(false)}
                                        loading={loading || isSubmitting}
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
