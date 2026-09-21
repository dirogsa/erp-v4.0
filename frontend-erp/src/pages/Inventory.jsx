import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import ProductsTable from '../components/features/inventory/ProductsTable';
import ProductForm from '../components/features/inventory/ProductForm';
import TransfersSection from '../components/features/inventory/TransfersSection';
import LossesSection from '../components/features/inventory/LossesSection';
import BulkProductIngestor from '../components/features/inventory/BulkProductIngestor';

import LoyaltyManagement from '../components/features/inventory/LoyaltyManagement';
import Pagination from '../components/common/Table/Pagination';
import { useProducts } from '../hooks/useProducts';
import { categoryService, inventoryService, companyService } from '../services/api';
import ProductDetailsView from '../components/features/inventory/ProductDetailsView';
import SmartSearch from '../components/features/inventory/SmartSearch';
import CrudPageTemplate from '../components/common/Crud/CrudPageTemplate';
import CrudToolbar from '../components/common/Crud/CrudToolbar';
import { useNotification } from '../hooks/useNotification';
import { useLoading } from '../context/LoadingContext';

const Inventory = ({ forcedType = null }) => {
    const { showLoading, hideLoading } = useLoading();
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
    const location = useLocation();
    const querySearch = new URLSearchParams(location.search).get('search') || location.state?.search || '';
    
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [search, setSearch] = useState(querySearch);
    const [selectedIds, setSelectedIds] = useState([]);
    const [filterUnrecognized, setFilterUnrecognized] = useState(false);
    const [filterOthers, setFilterOthers] = useState(false);
    const [companies, setCompanies] = useState([]);

    useEffect(() => {
        const loadCompanies = async () => {
            try {
                const res = await companyService.getCompanies();
                setCompanies(res.data);
            } catch (err) { }
        };
        loadCompanies();
    }, []);

    const currentCompanyId = localStorage.getItem('erp_company_id');
    const activeCompany = companies.find(c => c._id === currentCompanyId);

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
        bulkDeleteProducts,
        error,
        refetch
    } = useProducts({
        page,
        limit,
        search,
        filterUnrecognized,
        filterOthers,
        type: forcedType || (activeTab === 'products' ? 'COMMERCIAL' : '')
    });

    const isInitialEmptyState = !search && !filterUnrecognized && !filterOthers;

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
        showLoading("Actualizando Lote...", "Sincronizando estados de visibilidad y filtros técnicos en el catálogo maestro.");
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
            hideLoading();
        }
    };

    // ── Seleccionar TODO el universo filtrado ────────────────────────────────
    const handleSelectAllFiltered = async () => {
        setIsBulkLoading(true);
        try {
            const res = await inventoryService.getProducts(1, 10000, search, '', forcedType || (activeTab === 'products' ? 'COMMERCIAL' : ''));
            const allIds = res.data.items.map(p => p.id || p._id || p.sku).filter(Boolean);
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
        showLoading("Creando Producto...", "Generando identificadores únicos y vinculando categorías técnicas.");
        try {
            await createProduct(data, data.initial_stock);
            setShowProductModal(false);
        } catch (error) { 
        } finally {
            setIsSubmitting(false);
            hideLoading();
        }
    };

    const handleUpdate = async (data) => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        showLoading("Guardando Cambios...", "Actualizando especificaciones y relaciones de equivalencia.");
        try {
            await updateProduct(data.sku, data, data.stock_current);
            setShowProductModal(false);
        } catch (error) { 
        } finally {
            setIsSubmitting(false);
            hideLoading();
        }
    };

    const tabs = forcedType ? [] : [
        { key: 'products', label: '📦 Inventario Maestro' },
        { key: 'loyalty', label: '⭐ Fidelización' },
        { key: 'smart-search', label: '🔎 Búsqueda Inteligente', color: '#ffc107' },
        { key: 'bulk-ingest', label: '🚀 Ingesta HTML', color: '#a855f7' },
        { key: 'transfers', label: '🚚 Transferencias' },
        { key: 'losses', label: '⚖️ Ajustes' }
    ];

    const headerActions = (activeTab === 'products' || activeTab === 'marketing') ? (
        <>
            {!forcedType && activeTab === 'products' && (
                <Button
                    variant="success"
                    onClick={() => handleBulkVisibility({ is_active_in_shop: true, only_with_price: true, label: 'Activar en Tienda (Con Precio)' })}
                    disabled={isBulkLoading}
                    style={{
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
                        fontWeight: 'bold',
                    }}
                >
                    🛒 Activar en Tienda (Con Precio)
                </Button>
            )}
            <Button onClick={() => {
                setSelectedProduct(null);
                setIsViewMode(false);
                setShowProductModal(true);
            }}>
                {forcedType === 'MARKETING' || activeTab === 'marketing' ? '+ Nuevo Artículo Publicitario' : '+ Nuevo Producto'}
            </Button>
        </>
    ) : null;

    return (
        <CrudPageTemplate
            title={forcedType === 'MARKETING' ? 'Gestión de Publicidad' : 'Gestión de Inventario'}
            subtitle={forcedType === 'MARKETING' ? 'Control de artículos y premios publicitarios' : 'Consulta proactiva de productos y depuración de catálogo'}
            headerActions={headerActions}
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={(tabKey) => {
                setActiveTab(tabKey);
                if (['products', 'loyalty', 'losses', 'bulk-ingest'].includes(tabKey)) {
                    setSelectedIds([]);
                }
                if (tabKey === 'products') {
                    setPage(1);
                    setFilterUnrecognized(false);
                    setFilterOthers(false);
                }
            }}
        >
            {(activeTab === 'products' || activeTab === 'marketing') && (
                <>
                    <CrudToolbar
                        selectedIds={selectedIds}
                        onClearSelection={() => setSelectedIds([])}
                        onSelectAllFiltered={handleSelectAllFiltered}
                        totalItems={pagination.totalItems}
                        searchValue={search}
                        onSearchChange={(val) => {
                            setSearch(val);
                            setPage(1);
                            if (val) {
                                setFilterUnrecognized(false);
                                setFilterOthers(false);
                            }
                        }}
                        activeFilterLabel={filterUnrecognized ? 'No Reconocidos' : (filterOthers ? 'Otros / Varios' : (search ? search.trim() : ''))}
                        onClearFilters={() => {
                            setSearch('');
                            setFilterUnrecognized(false);
                            setFilterOthers(false);
                            setPage(1);
                        }}
                        bulkActions={[
                            { label: 'Activar', icon: '🛒', variant: 'success', onClick: (ids) => handleBulkVisibility({ is_active_in_shop: true, ids, label: 'Activar en Tienda' }) },
                            { label: 'Ocultar', icon: '🚫', variant: 'default', onClick: (ids) => handleBulkVisibility({ is_active_in_shop: false, ids, label: 'Ocultar de Tienda' }) },
                            { label: 'Novedad', icon: '✨', variant: 'warning', onClick: (ids) => handleBulkVisibility({ is_new: true, ids, label: 'Marcar Novedad' }) },
                            { label: 'Eliminar', icon: '🗑️', variant: 'danger', onClick: async (ids) => {
                                if (window.confirm(`¿Estás seguro de ELIMINAR permanentemente ${ids.length} producto(s) seleccionado(s)?`)) {
                                    try {
                                        await bulkDeleteProducts(ids);
                                        setSelectedIds([]);
                                    } catch(err) {}
                                }
                            }}
                        ]}
                    />

                    {isInitialEmptyState ? (
                        <div style={{ 
                            padding: '4rem 2rem', 
                            textAlign: 'center', 
                            background: 'rgba(30, 41, 59, 0.5)', 
                            borderRadius: '2rem',
                            border: '2px dashed #334155'
                        }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>🎯</div>
                            <h2 style={{ color: 'white', marginBottom: '1rem' }}>Buscador de Inventario de Alta Eficiencia</h2>
                            <p style={{ color: '#94a3b8', maxWidth: '600px', margin: '0 auto 2.5rem' }}>
                                Para proteger el rendimiento de la base de datos, los productos no se cargan automáticamente. 
                                Ingrese un código o utilice uno de los <b>Filtros de Depuración</b> rápidos.
                            </p>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', maxWidth: '900px', margin: '0 auto' }}>
                                <div 
                                    onClick={() => setFilterUnrecognized(true)}
                                    style={{ padding: '2rem', background: '#1e293b', borderRadius: '1.5rem', cursor: 'pointer', border: '1px solid #334155', transition: 'all 0.2s' }}
                                    onMouseEnter={e => e.currentTarget.style.borderColor = '#ef4444'}
                                    onMouseLeave={e => e.currentTarget.style.borderColor = '#334155'}
                                >
                                    <div style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>❓</div>
                                    <h3 style={{ color: 'white', fontSize: '1rem', marginBottom: '0.5rem' }}>No Reconocidos</h3>
                                    <p style={{ color: '#64748b', fontSize: '0.8rem' }}>Marcas N/A o Genéricas sin identificar.</p>
                                </div>
                                <div 
                                    onClick={() => setFilterOthers(true)}
                                    style={{ padding: '2rem', background: '#1e293b', borderRadius: '1.5rem', cursor: 'pointer', border: '1px solid #334155', transition: 'all 0.2s' }}
                                    onMouseEnter={e => e.currentTarget.style.borderColor = '#3b82f6'}
                                    onMouseLeave={e => e.currentTarget.style.borderColor = '#334155'}
                                >
                                    <div style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>📁</div>
                                    <h3 style={{ color: 'white', fontSize: '1rem', marginBottom: '0.5rem' }}>Otros / Varios</h3>
                                    <p style={{ color: '#64748b', fontSize: '0.8rem' }}>Productos en la categoría de misceláneos.</p>
                                </div>
                                <div 
                                    onClick={() => { setSearch(' '); setPage(1); }} // Force a space to trigger isEnabled
                                    style={{ padding: '2rem', background: '#1e293b', borderRadius: '1.5rem', cursor: 'pointer', border: '1px solid #334155', transition: 'all 0.2s' }}
                                    onMouseEnter={e => e.currentTarget.style.borderColor = '#10b981'}
                                    onMouseLeave={e => e.currentTarget.style.borderColor = '#334155'}
                                >
                                    <div style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>📦</div>
                                    <h3 style={{ color: 'white', fontSize: '1rem', marginBottom: '0.5rem' }}>Ver Todo</h3>
                                    <p style={{ color: '#64748b', fontSize: '0.8rem' }}>Cargar el inventario completo (Uso moderado).</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            <ProductsTable
                                products={products}
                                loading={loading}
                                companies={companies}
                                isMarketing={forcedType === 'MARKETING' || activeTab === 'marketing'}
                                categories={categories}
                                onToggleVisibility={handleToggleVisibility}
                                selectedIds={selectedIds}
                                onSelectionChange={setSelectedIds}
                                onView={async (product) => {
                                    showLoading("Cargando Ficha...", "Recuperando especificaciones técnicas e imágenes de alta resolución.");
                                    try {
                                        const res = await inventoryService.getProduct(product.sku);
                                        setSelectedProduct(res.data);
                                        setIsViewMode(true);
                                        setShowProductModal(true);
                                    } catch (err) {
                                        const msg = err.response?.data?.detail || "Error al cargar la ficha técnica del producto";
                                        showNotification(msg, "error");
                                    } finally {
                                        hideLoading();
                                    }
                                }}
                                onEdit={async (product) => {
                                    showLoading("Cargando Editor...", "Cargando metadatos completos y equivalencias maestras.");
                                    try {
                                        const res = await inventoryService.getProduct(product.sku);
                                        setSelectedProduct(res.data);
                                        setIsViewMode(false);
                                        setShowProductModal(true);
                                    } catch (err) {
                                        const msg = err.response?.data?.detail || "Error al cargar el producto para edición";
                                        showNotification(msg, "error");
                                    } finally {
                                        hideLoading();
                                    }
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
                </>
            )}

            {activeTab === 'transfers' && <TransfersSection />}

            {activeTab === 'losses' && <LossesSection />}

            {activeTab === 'bulk-ingest' && <BulkProductIngestor onComplete={() => refetch && refetch()} />}

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
                                        {!selectedProduct && (
                                            <span style={{ fontSize: '0.7rem', color: '#3b82f6', background: 'rgba(59, 130, 246, 0.1)', padding: '2px 10px', borderRadius: '10px', marginLeft: '1rem', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                                                Contexto: {activeCompany ? activeCompany.name : 'GLOBAL / HOLDING'}
                                            </span>
                                        )}
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
                                        onSubmit={selectedProduct && !isViewMode ? handleUpdate : handleCreate}
                                        onCancel={() => {
                                            setShowProductModal(false);
                                            setSelectedProduct(null);
                                            setIsViewMode(false);
                                        }}
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
        </CrudPageTemplate>
    );
};

export default Inventory;
