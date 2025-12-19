import React, { useState, useEffect } from 'react';
import Input from '../../common/Input';
import Button from '../../common/Button';
import Table from '../../common/Table';
import ProductSearchInput from '../../common/ProductSearchInput';
import ProductHistoryModal from '../../features/sales/ProductHistoryModal';
import { useProducts } from '../../../hooks/useProducts';
import { formatCurrency } from '../../../utils/formatters';

const ProductItemsSection = ({
    items = [],
    onItemsChange,
    readOnly = false
}) => {
    const { products } = useProducts(); // Keep for initial load if needed, but search handles it
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [price, setPrice] = useState(0);

    // History Modal State
    const [historyModalVisible, setHistoryModalVisible] = useState(false);
    const [historyProduct, setHistoryProduct] = useState(null);
    const [searchKey, setSearchKey] = useState(0);

    // Cuando se selecciona un producto, actualizar precio sugerido
    useEffect(() => {
        if (selectedProduct) {
            setPrice(selectedProduct.price_retail || 0);
        }
    }, [selectedProduct]);

    const handleAddItem = () => {
        if (!selectedProduct || quantity <= 0 || price < 0) return;

        const newItem = {
            product_sku: selectedProduct.sku,
            product_name: selectedProduct.name,
            quantity: parseInt(quantity),
            unit_price: parseFloat(price),
            subtotal: parseInt(quantity) * parseFloat(price)
        };

        onItemsChange([...items, newItem]);

        // Reset fields
        setSelectedProduct(null);
        setQuantity(1);
        setPrice(0);
        setSearchKey(prev => prev + 1); // Force reset of search input
    };

    const handleRemoveItem = (index) => {
        const newItems = items.filter((_, i) => i !== index);
        onItemsChange(newItems);
    };

    const handlePriceChange = (index, newPrice) => {
        const updatedItems = [...items];
        updatedItems[index].unit_price = parseFloat(newPrice);
        updatedItems[index].subtotal = updatedItems[index].quantity * parseFloat(newPrice);
        onItemsChange(updatedItems);
    };

    const openHistory = (item) => {
        setHistoryProduct({ sku: item.product_sku, name: item.product_name });
        setHistoryModalVisible(true);
    };

    const columns = [
        { label: 'SKU', key: 'product_sku' },
        { label: 'Producto', key: 'product_name' },
        { label: 'Cantidad', key: 'quantity', align: 'center' },
        {
            label: 'Precio Unit.',
            key: 'unit_price',
            align: 'right',
            render: (val, row, index) => readOnly ? formatCurrency(val) : (
                <input
                    type="number"
                    value={val}
                    onChange={(e) => handlePriceChange(index, e.target.value)}
                    style={{
                        width: '80px',
                        padding: '0.25rem',
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        color: 'white',
                        borderRadius: '0.25rem',
                        textAlign: 'right'
                    }}
                    step="0.01"
                />
            )
        },
        {
            label: 'Subtotal',
            key: 'subtotal',
            align: 'right',
            render: (val) => formatCurrency(val)
        },
        !readOnly && {
            label: 'Acciones',
            key: 'actions',
            align: 'center',
            render: (_, row, index) => (
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                    <Button
                        variant="secondary"
                        size="small"
                        onClick={() => openHistory(row)}
                        title="Ver historial de precios"
                    >
                        🕒
                    </Button>
                    <Button
                        variant="danger"
                        size="small"
                        onClick={() => handleRemoveItem(index)}
                        title="Eliminar"
                    >
                        ✕
                    </Button>
                </div>
            )
        }
    ].filter(Boolean);

    return (
        <div style={{
            padding: '1.5rem',
            backgroundColor: '#1e293b',
            borderRadius: '0.5rem',
            marginBottom: '1.5rem'
        }}>
            <h3 style={{ marginBottom: '1rem', color: '#e2e8f0', fontSize: '1.1rem' }}>
                Productos
            </h3>

            {!readOnly && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr auto',
                    gap: '1rem',
                    marginBottom: '1.5rem',
                    padding: '1rem',
                    backgroundColor: '#0f172a',
                    borderRadius: '0.375rem'
                }}>
                    <ProductSearchInput
                        key={searchKey}
                        onSelect={setSelectedProduct}
                        label="Producto (escriba 3 letras)"
                    />
                    <Input
                        label="Cantidad"
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        min="1"
                    />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <Input
                            label="Precio Unit."
                            type="number"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            min="0"
                            step="0.01"
                        />
                        {selectedProduct && (
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                <button
                                    type="button"
                                    onClick={() => setPrice(selectedProduct.price_retail || 0)}
                                    style={{
                                        fontSize: '0.7rem',
                                        padding: '0.25rem',
                                        background: '#3b82f6',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '0.25rem',
                                        cursor: 'pointer',
                                        flex: 1
                                    }}
                                    title="Usar Precio Minorista"
                                >
                                    Min: {formatCurrency(selectedProduct.price_retail || 0)}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPrice(selectedProduct.price_wholesale || 0)}
                                    style={{
                                        fontSize: '0.7rem',
                                        padding: '0.25rem',
                                        background: '#10b981',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '0.25rem',
                                        cursor: 'pointer',
                                        flex: 1
                                    }}
                                    title="Usar Precio Mayorista"
                                >
                                    May: {formatCurrency(selectedProduct.price_wholesale || 0)}
                                </button>
                            </div>
                        )}
                    </div>
                    <div style={{ marginTop: '1.8rem' }}>
                        <Button
                            onClick={handleAddItem}
                            disabled={!selectedProduct}
                            variant="success"
                        >
                            Agregar
                        </Button>
                    </div>
                </div>
            )}

            <Table
                columns={columns}
                data={items}
                emptyMessage="No hay productos agregados"
            />

            <ProductHistoryModal
                visible={historyModalVisible}
                onClose={() => setHistoryModalVisible(false)}
                sku={historyProduct?.sku}
                productName={historyProduct?.name}
            />
        </div>
    );
};

export default ProductItemsSection;
