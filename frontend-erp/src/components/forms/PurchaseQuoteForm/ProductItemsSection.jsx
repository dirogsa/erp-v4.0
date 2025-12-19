import React, { useState, useEffect } from 'react';
import Input from '../../common/Input';
import Button from '../../common/Button';
import Table from '../../common/Table';
import ProductSearchInput from '../../common/ProductSearchInput';
import { useProducts } from '../../../hooks/useProducts';
import { formatCurrency } from '../../../utils/formatters';

const ProductItemsSection = ({
    items = [],
    onItemsChange,
    readOnly = false,
    isPurchase = false
}) => {
    // Keep for initial load if needed, but search handles it
    const { } = useProducts();
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [unitCost, setUnitCost] = useState(0);

    const [searchKey, setSearchKey] = useState(0);

    // When product selected, update suggested cost
    useEffect(() => {
        if (selectedProduct) {
            // For purchase, we might default to 0 or last cost. 
            // selectedProduct might have a 'cost' field from DB.
            setUnitCost(selectedProduct.cost || 0);
        }
    }, [selectedProduct]);

    const handleAddItem = () => {
        if (!selectedProduct || quantity <= 0 || unitCost < 0) return;

        const newItem = {
            product_sku: selectedProduct.sku,
            product_name: selectedProduct.name,
            quantity: parseInt(quantity),
            unit_cost: parseFloat(unitCost),
            subtotal: parseInt(quantity) * parseFloat(unitCost)
        };

        onItemsChange([...items, newItem]);

        // Reset fields
        setSelectedProduct(null);
        setQuantity(1);
        setUnitCost(0);
        setSearchKey(prev => prev + 1); // Force reset of search input
    };

    const handleRemoveItem = (index) => {
        const newItems = items.filter((_, i) => i !== index);
        onItemsChange(newItems);
    };

    const handleCostChange = (index, newCost) => {
        const updatedItems = [...items];
        updatedItems[index].unit_cost = parseFloat(newCost);
        updatedItems[index].subtotal = updatedItems[index].quantity * parseFloat(newCost);
        onItemsChange(updatedItems);
    };

    const columns = [
        { label: 'SKU', key: 'product_sku' },
        { label: 'Producto', key: 'product_name' },
        { label: 'Cantidad', key: 'quantity', align: 'center' },
        {
            label: 'Costo Unit.',
            key: 'unit_cost',
            align: 'right',
            render: (val, row, index) => readOnly ? formatCurrency(val) : (
                <input
                    type="number"
                    value={val}
                    onChange={(e) => handleCostChange(index, e.target.value)}
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
                    alignItems: 'end',
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
                    <Input
                        label="Costo Unit."
                        type="number"
                        value={unitCost}
                        onChange={(e) => setUnitCost(e.target.value)}
                        min="0"
                        step="0.01"
                    />
                    <div style={{ marginBottom: '1rem' }}>
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
        </div>
    );
};

export default ProductItemsSection;
