import React, { useState, useEffect, useRef } from 'react';
import Button from '../../common/Button';
import Table from '../../common/Table';
import { inventoryService } from '../../../services/api';
import { formatCurrency } from '../../../utils/formatters';
import PurchaseQuickImportModal from '../../features/purchasing/PurchaseQuickImportModal';

const ProductItemsSection = ({
    items = [],
    onItemsChange,
    readOnly = false,
    showPrices = false
}) => {
    const [rows, setRows] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [activeSearchRow, setActiveSearchRow] = useState(null);
    const [searchLoading, setSearchLoading] = useState(false);
    const [importModalVisible, setImportModalVisible] = useState(false);
    
    const gridRef = useRef([]);

    // Sync items from parent to rows
    useEffect(() => {
        if (!items || items.length === 0) {
            setRows([{ _id: Date.now(), product_sku: '', product_name: '', quantity: 1, unit_cost: 0, subtotal: 0, is_custom: false }]);
        } else {
            setRows(items.map((item, idx) => ({
                ...item,
                _id: item._id || Date.now() + idx
            })).concat(readOnly ? [] : [{ _id: Date.now() + 9999, product_sku: '', product_name: '', quantity: 1, unit_cost: 0, subtotal: 0, is_custom: false }]));
        }
    }, [items.length, readOnly]);

    const updateParent = (currentRows) => {
        const validItems = currentRows.filter(r => 
            (r.product_sku && r.product_sku.trim() !== '') || 
            (r.product_name && r.product_name.trim() !== '')
        );
        onItemsChange(validItems);
    };

    const handleRowChange = (index, field, value) => {
        const newRows = [...rows];
        newRows[index] = { ...newRows[index], [field]: value };

        if (field === 'quantity' || field === 'unit_cost') {
            const q = parseFloat(newRows[index].quantity) || 0;
            const c = parseFloat(newRows[index].unit_cost) || 0;
            newRows[index].subtotal = q * c;
        }

        // If editing name manually, mark as custom
        if (field === 'product_name') {
            newRows[index].is_custom = true;
        }

        setRows(newRows);
        updateParent(newRows);
    };

    const handleProductSearch = async (rowIndex, query) => {
        const newRows = [...rows];
        newRows[rowIndex] = { 
            ...newRows[rowIndex], 
            product_sku: query,
            is_custom: true // Mark as custom while typing/searching
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
                setSearchResults([]);
            } finally {
                setSearchLoading(false);
            }
        } else {
            setActiveSearchRow(null);
        }
    };

    const selectProduct = (rowIndex, product) => {
        const newRows = [...rows];
        newRows[rowIndex] = {
            ...newRows[rowIndex],
            product_sku: product.sku,
            product_name: product.name,
            unit_cost: product.cost || 0,
            subtotal: (product.cost || 0) * (newRows[rowIndex].quantity || 1),
            is_custom: false
        };
        setRows(newRows);
        setActiveSearchRow(null);

        if (rowIndex === rows.length - 1) {
            addRow();
        }
        updateParent(newRows);
    };

    const addRow = () => {
        setRows(prev => [...prev, { _id: Date.now(), product_sku: '', product_name: '', quantity: 1, unit_cost: 0, subtotal: 0, is_custom: false }]);
    };

    const removeRow = (index) => {
        const newRows = rows.filter((_, i) => i !== index);
        if (newRows.length === 0 && !readOnly) {
            newRows.push({ _id: Date.now(), product_sku: '', product_name: '', quantity: 1, unit_cost: 0, subtotal: 0, is_custom: false });
        }
        setRows(newRows);
        updateParent(newRows);
    };

    const handleImport = (importedItems) => {
        const currentValidRows = rows.filter(r => r.product_sku);
        const newRows = [...currentValidRows, ...importedItems.map((item, idx) => ({ ...item, _id: Date.now() + idx }))];
        if (!readOnly) {
            newRows.push({ _id: Date.now() + 9999, product_sku: '', product_name: '', quantity: 1, unit_cost: 0, subtotal: 0, is_custom: false });
        }
        setRows(newRows);
        updateParent(newRows);
    };

    const handleExportCopy = () => {
        const validRows = rows.filter(r => r.product_sku && r.product_sku.trim() !== '');
        if (validRows.length === 0) return;
        const header = ["Cant.", "SKU", "Producto", ...(showPrices ? ["Costo Unit.", "Subtotal"] : [])].join('\t');
        const body = validRows.map(r => [
            r.quantity,
            r.product_sku, 
            r.product_name, 
            ...(showPrices ? [r.unit_cost, r.subtotal] : [])
        ].join('\t')).join('\n');
        navigator.clipboard.writeText(`${header}\n${body}`);
    };

    return (
        <div style={{ backgroundColor: '#1e293b', borderRadius: '0.5rem', padding: '1.25rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, color: '#e2e8f0', fontSize: '1.1rem' }}>
                    {showPrices ? 'Cotización de Compra' : 'Solicitud de Cotización (RFQ)'}
                </h3>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {!readOnly && (
                        <Button variant="secondary" size="small" onClick={() => setImportModalVisible(true)} style={{ fontSize: '0.8rem' }}>
                            🚀 Importar Excel
                        </Button>
                    )}
                    <Button variant="secondary" size="small" onClick={handleExportCopy} style={{ fontSize: '0.8rem', backgroundColor: '#334155' }}>
                        📋 Copiar a Excel
                    </Button>
                </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                    <tr style={{ borderBottom: '1px solid #334155', color: '#94a3b8', textAlign: 'left' }}>
                        <th style={{ padding: '0.75rem', width: '8%', textAlign: 'center' }}>Cant.</th>
                        <th style={{ padding: '0.75rem', width: '20%' }}>SKU / Código</th>
                        <th style={{ padding: '0.75rem', width: showPrices ? '32%' : '62%' }}>Nombre del Producto</th>
                        {showPrices && (
                            <>
                                <th style={{ padding: '0.75rem', width: '15%', textAlign: 'right' }}>Costo Unit.</th>
                                <th style={{ padding: '0.75rem', width: '15%', textAlign: 'right' }}>Total</th>
                            </>
                        )}
                        {!readOnly && <th style={{ padding: '0.75rem', width: '10%', textAlign: 'center' }}>Acc.</th>}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, index) => (
                        <tr key={row._id} style={{ borderBottom: '1px solid #1e293b' }}>
                            <td style={{ padding: '0.5rem' }}>
                                <input
                                    type="number"
                                    value={row.quantity}
                                    onChange={(e) => handleRowChange(index, 'quantity', e.target.value)}
                                    style={{ width: '100%', padding: '0.5rem', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '0.25rem', color: 'white', textAlign: 'center' }}
                                    readOnly={readOnly}
                                />
                            </td>
                            <td style={{ padding: '0.5rem', position: 'relative' }}>
                                {readOnly ? (
                                    <div style={{ color: '#cbd5e1', fontSize: '0.85rem' }}>{row.product_sku}</div>
                                ) : (
                                    <>
                                        <input
                                            type="text"
                                            value={row.product_sku}
                                            onChange={(e) => handleProductSearch(index, e.target.value)}
                                            placeholder="SKU..."
                                            style={{ width: '100%', padding: '0.5rem', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '0.25rem', color: 'white' }}
                                        />
                                        {row.is_custom && <div style={{ fontSize: '0.6rem', color: '#94a3b8', marginTop: '2px', backgroundColor: '#334155', display: 'inline-block', padding: '1px 4px', borderRadius: '2px' }}>NO EN CATÁLOGO</div>}
                                        
                                        {activeSearchRow === index && searchResults.length > 0 && (
                                            <div style={{ position: 'absolute', top: '100%', left: 0, width: '200%', zIndex: 100, backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '0.375rem', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)', maxHeight: '200px', overflowY: 'auto' }}>
                                                {searchResults.map(p => (
                                                    <div key={p.sku} onClick={() => selectProduct(index, p)} style={{ padding: '0.5rem', cursor: 'pointer', borderBottom: '1px solid #334155', color: 'white', transition: 'background 0.2s' }} onMouseEnter={(e) => e.target.style.backgroundColor='#334155'} onMouseLeave={(e) => e.target.style.backgroundColor='transparent'}>
                                                        <div style={{ fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
                                                            <span>{p.sku}</span>
                                                            <span style={{ fontSize: '0.7rem', color: '#10b981' }}>{formatCurrency(p.cost)}</span>
                                                        </div>
                                                        <div style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>{p.name}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                )}
                            </td>
                            <td style={{ padding: '0.5rem' }}>
                                {readOnly ? (
                                    <div style={{ color: 'white' }}>{row.product_name}</div>
                                ) : (
                                    <input
                                        type="text"
                                        value={row.product_name}
                                        onChange={(e) => handleRowChange(index, 'product_name', e.target.value)}
                                        placeholder="Nombre del producto..."
                                        style={{ 
                                            width: '100%', 
                                            padding: '0.5rem', 
                                            backgroundColor: '#1e293b', 
                                            border: '1px solid #334155', 
                                            borderRadius: '0.25rem', 
                                            color: row.is_custom ? '#eab308' : 'white',
                                            fontStyle: row.is_custom ? 'italic' : 'normal'
                                        }}
                                    />
                                )}
                            </td>
                            {showPrices && (
                                <>
                                    <td style={{ padding: '0.5rem' }}>
                                        <input
                                            type="number"
                                            value={row.unit_cost}
                                            onChange={(e) => handleRowChange(index, 'unit_cost', e.target.value)}
                                            style={{ width: '100%', padding: '0.5rem', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '0.25rem', color: 'white', textAlign: 'right' }}
                                            readOnly={readOnly}
                                        />
                                    </td>
                                    <td style={{ padding: '0.5rem', textAlign: 'right', color: '#cbd5e1', fontWeight: 'bold' }}>
                                        {formatCurrency(row.subtotal)}
                                    </td>
                                </>
                            )}
                            {!readOnly && (
                                <td style={{ textAlign: 'center' }}>
                                    <button onClick={() => removeRow(index)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.25rem' }}>&times;</button>
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>

            <PurchaseQuickImportModal
                visible={importModalVisible}
                onClose={() => setImportModalVisible(false)}
                onImport={handleImport}
            />
        </div>
    );
};

export default ProductItemsSection;
