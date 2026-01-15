import React, { useState, useEffect, useRef } from 'react';
import { Clock } from 'lucide-react';
import Button from '../../common/Button';
import ProductHistoryModal from '../../features/sales/ProductHistoryModal';
import QuickImportModal from '../../features/sales/QuickImportModal';
import { inventoryService } from '../../../services/api';
import { formatCurrency } from '../../../utils/formatters';
import { useNotification } from '../../../hooks/useNotification';

const ProductItemsSection = ({
    items = [],
    onItemsChange,
    readOnly = false,
    customerRuc = null
}) => {
    const { showNotification } = useNotification();
    // Local state for the grid rows. 
    // We maintain a local state to handle the "draft" row and UX state (loading, errors)
    // Structure: { _id, sku, name, quantity, unit_price, subtotal, stock, ... }
    const [rows, setRows] = useState([]);

    // History Modal State
    const [historyModal, setHistoryModal] = useState({ visible: false, sku: null, name: null });

    // Autocomplete State
    const [searchResults, setSearchResults] = useState([]);
    const [activeSearchRow, setActiveSearchRow] = useState(null); // rowIndex or null
    const [searchLoading, setSearchLoading] = useState(false);

    // Import Modal State
    const [importModalVisible, setImportModalVisible] = useState(false);

    // Focus Management
    const gridRef = useRef([]);
    // gridRef.current[rowIndex] = { sku: ref, quantity: ref, price: ref }

    // Initial load sync
    useEffect(() => {
        if (!items || items.length === 0) {
            setRows([{ _id: Date.now(), product_sku: '', product_name: '', quantity: 1, unit_price: 0, subtotal: 0, stock: 0 }]);
        } else {
            // Merge props with local logic (adding draft row if needed)
            // CRITICAL: Use item._id if present to maintain React Key stability and focus
            setRows(items.map((item, idx) => ({
                ...item,
                _id: item._id || Date.now() + idx,
                stock: item.stock || 0
            })).concat(readOnly ? [] : [{ _id: Date.now() + 9999, product_sku: '', product_name: '', quantity: 1, unit_price: 0, subtotal: 0, stock: 0 }]));
        }
    }, [items.length, readOnly]);

    // Propagate changes to parent
    const updateParent = (currentRows) => {
        // Filter out empty rows (no SKU) to cleanliness but keep IDs for stability
        const validItems = currentRows.filter(r => r.product_sku && r.product_sku.trim() !== '');

        // Pass essential data AND _id to parent so it returns it back to us, preserving keys.
        onItemsChange(validItems);
    };

    const handleRowChange = (index, field, value) => {
        const newRows = [...rows];
        newRows[index] = { ...newRows[index], [field]: value };

        // Recalculate subtotal
        if (field === 'quantity' || field === 'unit_price') {
            const q = parseFloat(newRows[index].quantity) || 0;
            const p = parseFloat(newRows[index].unit_price) || 0;
            newRows[index].subtotal = q * p;
        }

        setRows(newRows);
        updateParent(newRows);
    };

    const handleProductSearch = async (rowIndex, query) => {
        // Perform update in one go to avoid stale state closures from multiple setters
        const newRows = [...rows];
        newRows[rowIndex] = {
            ...newRows[rowIndex],
            product_sku: query,
            product_name: '' // Clear name while searching
        };
        setRows(newRows);
        updateParent(newRows);

        if (query.length >= 3) {
            setActiveSearchRow(rowIndex);
            setSearchLoading(true);
            try {
                const res = await inventoryService.getProducts(1, 10, query);
                setSearchResults(res.data.items);
            } catch (err) {
                console.error(err);
                setSearchResults([]);
            } finally {
                setSearchLoading(false);
            }
        } else {
            setActiveSearchRow(null);
            setSearchResults([]);
        }
    };

    const selectProduct = (rowIndex, product) => {
        const newRows = [...rows];
        const row = newRows[rowIndex];

        row.product_sku = product.sku;
        row.product_name = product.name;
        row.unit_price = product.price_retail || 0;
        // Persistence of list prices for UI suggestions
        row.price_retail = product.price_retail || 0;
        row.price_wholesale = product.price_wholesale || 0;

        row.stock = product.stock_current || 0;
        row.quantity = 1;
        row.subtotal = product.price_retail || 0;

        setRows(newRows);
        setActiveSearchRow(null);

        // If last row, add new
        if (rowIndex === rows.length - 1) {
            addRow();
        }

        updateParent(newRows);

        // Move focus to Quantity
        setTimeout(() => {
            if (gridRef.current[rowIndex]?.quantity) {
                gridRef.current[rowIndex].quantity.focus();
            }
        }, 50);
    };

    const addRow = () => {
        setRows(prev => [...prev, { _id: Date.now(), product_sku: '', product_name: '', quantity: 1, unit_price: 0, subtotal: 0, stock: 0 }]);
    };

    const removeRow = (index) => {
        const newRows = rows.filter((_, i) => i !== index);
        // Ensure at least one row if not readonly
        if (newRows.length === 0 && !readOnly) {
            newRows.push({ _id: Date.now(), product_sku: '', product_name: '', quantity: 1, unit_price: 0, subtotal: 0, stock: 0 });
        }
        setRows(newRows);
        updateParent(newRows);
    };

    const handleImport = (importedItems) => {
        // Filter out existing blank rows
        const currentValidRows = rows.filter(r => r.product_sku);

        // Add current timestamp to imported items to ensure unique IDs
        const itemsWithId = importedItems.map((item, idx) => ({
            ...item,
            _id: Date.now() + idx
        }));

        const newRows = [...currentValidRows, ...itemsWithId];

        // Add a backoff empty row for UX
        if (!readOnly) {
            newRows.push({ _id: Date.now() + 9999, product_sku: '', product_name: '', quantity: 1, unit_price: 0, subtotal: 0, stock: 0 });
        }

        setRows(newRows);
        updateParent(newRows);
    };

    const handleExportCopy = () => {
        const validRows = rows.filter(r => r.product_sku && r.product_sku.trim() !== '');

        if (validRows.length === 0) {
            showNotification('No hay productos para exportar', 'warning');
            return;
        }

        // Header
        const header = ["SKU", "Producto", "Cantidad", "Precio Unit.", "Subtotal"].join('\t');

        // Rows
        const body = validRows.map(r => [
            r.product_sku,
            r.product_name,
            r.quantity,
            r.unit_price,
            r.subtotal
        ].join('\t')).join('\n');

        const tsv = `${header}\n${body}`;

        navigator.clipboard.writeText(tsv).then(() => {
            showNotification('Copiado al portapapeles para Excel', 'success');
        }).catch(err => {
            console.error('Error copying to clipboard:', err);
            showNotification('Error al copiar al portapapeles', 'error');
        });
    };

    const handleKeyDown = (e, rowIndex, field) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (field === 'quantity') {
                // Move to Price
                gridRef.current[rowIndex]?.price?.focus();
            } else if (field === 'unit_price') {
                if (rowIndex === rows.length - 1 && rows[rowIndex].product_sku) {
                    addRow();
                }
            }
        }
        if (e.key === 'Escape') setActiveSearchRow(null);
    };

    // --- RENDER HELPERS ---

    // Check if stock is low
    const getStockStyle = (stock, qty) => {
        if (stock <= 0) return { color: '#ef4444', fontWeight: 'bold' }; // Red
        if (stock < qty) return { color: '#f59e0b', fontWeight: 'bold' }; // Orange
        return { color: '#10b981' }; // Green
    };

    return (
        <div className="product-grid-container" style={{
            backgroundColor: '#1e293b',
            borderRadius: '0.5rem',
            padding: '1rem',
            marginBottom: '1.5rem',
            overflowX: 'auto'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, color: '#e2e8f0', fontSize: '1.1rem' }}>Productos (Modo Rápido)</h3>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {!readOnly && (
                        <Button
                            variant="secondary"
                            size="small"
                            onClick={() => setImportModalVisible(true)}
                            style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                        >
                            🚀 Importar Excel
                        </Button>
                    )}
                    <Button
                        variant="secondary"
                        size="small"
                        onClick={handleExportCopy}
                        style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', backgroundColor: '#334155' }}
                        title="Copiar lista para pegar en su Excel"
                    >
                        📋 Copiar a Excel
                    </Button>
                </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                    <tr style={{ borderBottom: '1px solid #334155', color: '#94a3b8', textAlign: 'left' }}>
                        <th style={{ padding: '0.75rem', width: '40%' }}>Producto / SKU</th>
                        <th style={{ padding: '0.75rem', width: '10%', textAlign: 'center' }}>Stock</th>
                        <th style={{ padding: '0.75rem', width: '10%', textAlign: 'center' }}>Cant.</th>
                        <th style={{ padding: '0.75rem', width: '15%', textAlign: 'right' }}>Precio Unit.</th>
                        <th style={{ padding: '0.75rem', width: '15%', textAlign: 'right' }}>Total</th>
                        {!readOnly && <th style={{ padding: '0.75rem', width: '10%', textAlign: 'center' }}>Acciones</th>}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, index) => (
                        <tr key={row._id} style={{ borderBottom: '1px solid #1e293b' }}>
                            {/* SKU / NAME COLUMN */}
                            <td style={{ padding: '0.5rem', position: 'relative', verticalAlign: 'top' }}>
                                {readOnly ? (
                                    <div style={{ color: 'white' }}>
                                        <div style={{ fontWeight: 500 }}>{row.product_name}</div>
                                        <div style={{ fontSize: '0.75em', color: '#64748b' }}>{row.product_sku}</div>
                                    </div>
                                ) : (
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            ref={el => {
                                                if (!gridRef.current[index]) gridRef.current[index] = {};
                                                gridRef.current[index].sku = el;
                                            }}
                                            type="text"
                                            value={row.product_sku}
                                            onChange={(e) => handleProductSearch(index, e.target.value)}
                                            onFocus={() => row.product_sku.length >= 3 && setActiveSearchRow(index)}
                                            onKeyDown={(e) => handleKeyDown(e, index, 'sku')}
                                            placeholder="Buscar producto..."
                                            style={{
                                                width: '100%',
                                                padding: '0.5rem',
                                                backgroundColor: '#0f172a',
                                                border: '1px solid #334155',
                                                borderRadius: '0.25rem',
                                                color: 'white',
                                                outline: 'none'
                                            }}
                                        />
                                        {row.product_name && (
                                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {row.product_name}
                                            </div>
                                        )}
                                        {/* DROPDOWN - Custom Styled without Tailwind */}
                                        {activeSearchRow === index && (
                                            <div style={{
                                                position: 'absolute',
                                                top: '100%',
                                                left: 0,
                                                width: '150%',
                                                zIndex: 50,
                                                backgroundColor: '#1e293b',
                                                border: '1px solid #475569',
                                                borderRadius: '0.375rem',
                                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)',
                                                maxHeight: '200px',
                                                overflowY: 'auto'
                                            }}>
                                                {searchLoading ? (
                                                    <div style={{ padding: '0.5rem', color: '#94a3b8' }}>Buscando...</div>
                                                ) : searchResults.length > 0 ? (
                                                    searchResults.map(p => (
                                                        <div
                                                            key={p.sku}
                                                            onClick={() => selectProduct(index, p)}
                                                            style={{
                                                                padding: '0.5rem',
                                                                cursor: 'pointer',
                                                                borderBottom: '1px solid #334155',
                                                                color: 'white',
                                                                backgroundColor: 'transparent',
                                                                transition: 'background-color 0.2s'
                                                            }}
                                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#334155'}
                                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                        >
                                                            <div style={{ fontWeight: 'bold' }}>{p.sku}</div>
                                                            <div style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>{p.name}</div>
                                                            <div style={{ fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                                                                <span style={{ color: p.stock_current > 0 ? '#34d399' : '#f87171' }}>Stock: {p.stock_current}</span>
                                                                <span>S/ {p.price_retail}</span>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div style={{ padding: '0.5rem', color: '#94a3b8' }}>Sin resultados</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </td>

                            {/* STOCK */}
                            <td style={{ textAlign: 'center', verticalAlign: 'top', paddingTop: '0.75rem' }}>
                                <span style={getStockStyle(row.stock, row.quantity)}>
                                    {row.stock}
                                </span>
                            </td>

                            {/* QUANTITY */}
                            <td style={{ padding: '0.5rem', verticalAlign: 'top' }}>
                                {readOnly ? (
                                    <div style={{ textAlign: 'center', color: 'white' }}>{row.quantity}</div>
                                ) : (
                                    <input
                                        ref={el => {
                                            if (!gridRef.current[index]) gridRef.current[index] = {};
                                            gridRef.current[index].quantity = el;
                                        }}
                                        type="number"
                                        min="1"
                                        value={row.quantity}
                                        onChange={(e) => handleRowChange(index, 'quantity', e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(e, index, 'quantity')}
                                        style={{
                                            width: '100%',
                                            padding: '0.5rem',
                                            backgroundColor: '#0f172a',
                                            border: '1px solid #334155',
                                            borderRadius: '0.25rem',
                                            color: 'white',
                                            textAlign: 'center'
                                        }}
                                    />
                                )}
                            </td>

                            {/* UNIT PRICE + HISTORY */}
                            <td style={{ padding: '0.5rem', verticalAlign: 'top' }}>
                                {readOnly ? (
                                    <div style={{ textAlign: 'right', color: 'white' }}>{formatCurrency(row.unit_price)}</div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <input
                                            ref={el => {
                                                if (!gridRef.current[index]) gridRef.current[index] = {};
                                                gridRef.current[index].price = el;
                                            }}
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={row.unit_price}
                                            onChange={(e) => handleRowChange(index, 'unit_price', e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(e, index, 'unit_price')}
                                            style={{
                                                width: '100%',
                                                padding: '0.5rem',
                                                backgroundColor: '#0f172a',
                                                border: '1px solid #334155',
                                                borderRadius: '0.25rem',
                                                color: 'white',
                                                textAlign: 'right'
                                            }}
                                        />

                                        {/* UX: PRECIO SUGERIDO (Smart Tags) */}
                                        {row.product_sku && (
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', fontSize: '0.7rem', marginTop: '6px' }}>
                                                {(row.price_retail > 0 || row.price_wholesale > 0) ? (
                                                    <>
                                                        {row.price_retail > 0 && (
                                                            <span
                                                                onClick={() => handleRowChange(index, 'unit_price', row.price_retail)}
                                                                style={{
                                                                    cursor: 'pointer',
                                                                    color: 'white',
                                                                    backgroundColor: parseFloat(row.unit_price) === parseFloat(row.price_retail) ? '#2563eb' : '#334155',
                                                                    padding: '2px 6px',
                                                                    borderRadius: '4px',
                                                                    border: '1px solid #475569',
                                                                    transition: 'all 0.2s',
                                                                    whiteSpace: 'nowrap'
                                                                }}
                                                                title="Aplicar Precio Minorista"
                                                            >
                                                                Min: {row.price_retail}
                                                            </span>
                                                        )}
                                                        {row.price_wholesale > 0 && (
                                                            <span
                                                                onClick={() => handleRowChange(index, 'unit_price', row.price_wholesale)}
                                                                style={{
                                                                    cursor: 'pointer',
                                                                    color: 'white',
                                                                    backgroundColor: parseFloat(row.unit_price) === parseFloat(row.price_wholesale) ? '#059669' : '#334155',
                                                                    padding: '2px 6px',
                                                                    borderRadius: '4px',
                                                                    border: '1px solid #475569',
                                                                    transition: 'all 0.2s',
                                                                    whiteSpace: 'nowrap'
                                                                }}
                                                                title="Aplicar Precio Mayorista"
                                                            >
                                                                May: {row.price_wholesale}
                                                            </span>
                                                        )}
                                                    </>
                                                ) : (
                                                    <span style={{ color: '#64748b', fontStyle: 'italic' }}>
                                                        Sin precios sugeridos
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </td>

                            {/* SUBTOTAL */}
                            <td style={{ padding: '0.5rem', textAlign: 'right', color: '#cbd5e1', fontWeight: 'bold', verticalAlign: 'top', paddingTop: '0.85rem' }}>
                                {formatCurrency(row.subtotal)}
                            </td>

                            {/* ACTIONS */}
                            {/* ACTIONS */}
                            {!readOnly && (
                                <td style={{ textAlign: 'center', verticalAlign: 'top', paddingTop: '0.75rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                        {row.product_sku && (
                                            <button
                                                type="button"
                                                onClick={() => setHistoryModal({ visible: true, sku: row.product_sku, name: row.product_name })}
                                                style={{
                                                    background: 'transparent',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    color: '#60a5fa',
                                                    padding: '4px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}
                                                title="Ver historial"
                                            >
                                                <Clock size={18} />
                                            </button>
                                        )}

                                        <button
                                            type="button"
                                            onClick={() => removeRow(index)}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                color: '#ef4444',
                                                cursor: 'pointer',
                                                fontSize: '1.5rem',
                                                lineHeight: 1,
                                                opacity: 0.8
                                            }}
                                            title="Eliminar fila"
                                        >
                                            &times;
                                        </button>
                                    </div>
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* History Modal Reuse */}
            <ProductHistoryModal
                visible={historyModal.visible}
                onClose={() => setHistoryModal({ ...historyModal, visible: false })}
                sku={historyModal.sku}
                productName={historyModal.name}
                customerRuc={customerRuc}
            />

            <QuickImportModal
                visible={importModalVisible}
                onClose={() => setImportModalVisible(false)}
                onImport={handleImport}
            />
        </div>
    );
};

export default ProductItemsSection;
