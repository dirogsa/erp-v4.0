import React, { useState } from 'react';
import Table from '../../common/Table';
import Input from '../../common/Input';
import Button from '../../common/Button';
import Pagination from '../../common/Table/Pagination';
import { usePrices, usePriceHistory } from '../../../hooks/usePrices';
import { formatCurrency } from '../../../utils/formatters';

const PriceManagement = () => {
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [search, setSearch] = useState('');

    const [editingProduct, setEditingProduct] = useState(null);
    const [newRetailPrice, setNewRetailPrice] = useState(0);
    const [newWholesalePrice, setNewWholesalePrice] = useState(0);
    const [priceReason, setPriceReason] = useState('');

    const [showImportModal, setShowImportModal] = useState(false);
    const [importFile, setImportFile] = useState(null);
    const [importReason, setImportReason] = useState('');

    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [historyProduct, setHistoryProduct] = useState(null);

    const { products, pagination, loading, updatePrice, importCsv, isUpdating, isImporting } = usePrices({ page, limit, search });
    const { history, loading: historyLoading } = usePriceHistory(historyProduct?.sku);

    const handleEditClick = (product) => {
        setEditingProduct(product);
        setNewRetailPrice(product.price_retail || 0);
        setNewWholesalePrice(product.price_wholesale || 0);
        setPriceReason('');
    };

    const handleSavePrice = async () => {
        if (!editingProduct) return;

        try {
            // Update retail
            if (newRetailPrice !== editingProduct.price_retail) {
                await updatePrice(editingProduct.sku, {
                    new_price: newRetailPrice,
                    price_type: 'RETAIL',
                    reason: priceReason || 'Actualización manual'
                });
            }
            // Update wholesale
            if (newWholesalePrice !== editingProduct.price_wholesale) {
                await updatePrice(editingProduct.sku, {
                    new_price: newWholesalePrice,
                    price_type: 'WHOLESALE',
                    reason: priceReason || 'Actualización manual'
                });
            }
            setEditingProduct(null);
        } catch (e) { /* handled by hook */ }
    };

    const handleImport = async () => {
        if (!importFile) return;
        try {
            await importCsv(importFile, importReason);
            setShowImportModal(false);
            setImportFile(null);
            setImportReason('');
        } catch (e) { /* handled by hook */ }
    };

    const columns = [
        { label: 'SKU', key: 'sku' },
        { label: 'Nombre', key: 'name' },
        { label: 'P. Minorista', key: 'price_retail', align: 'right', render: (val) => formatCurrency(val) },
        { label: 'P. Mayorista', key: 'price_wholesale', align: 'right', render: (val) => formatCurrency(val || 0) },
        { label: 'Costo Prom.', key: 'cost', align: 'right', render: (val) => formatCurrency(val) },
        {
            label: 'Acciones', key: 'actions', align: 'center',
            render: (_, row) => (
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                    <Button size="small" variant="primary" onClick={() => handleEditClick(row)}>
                        ✏️ Editar
                    </Button>
                    <Button size="small" variant="secondary" onClick={() => { setHistoryProduct(row); setShowHistoryModal(true); }}>
                        📜 Historial
                    </Button>
                </div>
            )
        }
    ];

    const historyColumns = [
        { label: 'Fecha', key: 'changed_at', render: (val) => formatDate(val) },
        { label: 'Tipo', key: 'price_type', render: (val) => val === 'RETAIL' ? 'Minorista' : 'Mayorista' },
        { label: 'Anterior', key: 'old_price', align: 'right', render: (val) => formatCurrency(val) },
        { label: 'Nuevo', key: 'new_price', align: 'right', render: (val) => formatCurrency(val) },
        { label: 'Razón', key: 'reason' }
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
                <Button variant="success" onClick={() => setShowImportModal(true)}>
                    📤 Importar CSV
                </Button>
            </div>

            <Table columns={columns} data={products} loading={loading} />

            <Pagination
                current={pagination.current}
                total={pagination.total}
                onChange={setPage}
                pageSize={limit}
                onPageSizeChange={(n) => { setLimit(n); setPage(1); }}
            />

            {/* Edit Price Modal */}
            {editingProduct && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <div style={{ backgroundColor: '#0f172a', borderRadius: '0.5rem', width: '100%', maxWidth: '500px', padding: '1.5rem' }}>
                        <h2 style={{ color: 'white', marginBottom: '1rem' }}>Editar Precios: {editingProduct.name}</h2>
                        <p style={{ color: '#94a3b8', marginBottom: '1rem' }}>SKU: {editingProduct.sku}</p>

                        <Input label="Precio Minorista (S/)" type="number" value={newRetailPrice} onChange={(e) => setNewRetailPrice(parseFloat(e.target.value))} step="0.01" />
                        <div style={{ marginTop: '1rem' }}>
                            <Input label="Precio Mayorista (S/)" type="number" value={newWholesalePrice} onChange={(e) => setNewWholesalePrice(parseFloat(e.target.value))} step="0.01" />
                        </div>
                        <div style={{ marginTop: '1rem' }}>
                            <Input label="Razón del cambio" value={priceReason} onChange={(e) => setPriceReason(e.target.value)} placeholder="Ej: Actualización mensual" />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                            <Button variant="secondary" onClick={() => setEditingProduct(null)}>Cancelar</Button>
                            <Button variant="primary" onClick={handleSavePrice} disabled={isUpdating}>{isUpdating ? 'Guardando...' : 'Guardar'}</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Import CSV Modal */}
            {showImportModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <div style={{ backgroundColor: '#0f172a', borderRadius: '0.5rem', width: '100%', maxWidth: '500px', padding: '1.5rem' }}>
                        <h2 style={{ color: 'white', marginBottom: '1rem' }}>Importar Precios desde CSV</h2>
                        <p style={{ color: '#94a3b8', marginBottom: '1rem' }}>
                            El CSV debe tener columnas: <code>sku, price, price_wholesale</code>
                        </p>

                        <input type="file" accept=".csv" onChange={(e) => setImportFile(e.target.files[0])} style={{ marginBottom: '1rem', color: 'white' }} />

                        <Input label="Razón (opcional)" value={importReason} onChange={(e) => setImportReason(e.target.value)} placeholder="Ej: Actualización Diciembre 2024" />

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                            <Button variant="secondary" onClick={() => setShowImportModal(false)}>Cancelar</Button>
                            <Button variant="success" onClick={handleImport} disabled={!importFile || isImporting}>{isImporting ? 'Importando...' : 'Importar'}</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* History Modal */}
            {showHistoryModal && historyProduct && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <div style={{ backgroundColor: '#0f172a', borderRadius: '0.5rem', width: '100%', maxWidth: '700px', padding: '1.5rem', maxHeight: '80vh', overflowY: 'auto' }}>
                        <h2 style={{ color: 'white', marginBottom: '1rem' }}>Historial de Precios: {historyProduct.name}</h2>

                        <Table columns={historyColumns} data={history} loading={historyLoading} emptyMessage="Sin historial de cambios" />

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                            <Button variant="secondary" onClick={() => setShowHistoryModal(false)}>Cerrar</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PriceManagement;
