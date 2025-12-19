import React from 'react';
import Table from '../../common/Table';
import Button from '../../common/Button';
import { formatCurrency } from '../../../utils/formatters';

const ProductsTable = ({
    products = [],
    loading = false,
    onView,
    onEdit,
    onDelete
}) => {
    const columns = [
        { label: 'SKU', key: 'sku' },
        { label: 'Nombre', key: 'name' },
        { label: 'Marca', key: 'brand' },
        {
            label: 'Tienda',
            key: 'is_active_in_shop',
            align: 'center',
            render: (val) => val ? (
                <span className="status-badge approved" style={{ fontSize: '0.7rem' }}>SINC</span>
            ) : (
                <span className="status-badge draft" style={{ fontSize: '0.7rem', opacity: 0.5 }}>-</span>
            )
        },
        { label: 'Stock', key: 'stock_current', align: 'center' },
        {
            label: 'P. Minorista',
            key: 'price_retail',
            align: 'right',
            render: (val) => formatCurrency(val)
        },
        {
            label: 'P. Mayorista',
            key: 'price_wholesale',
            align: 'right',
            render: (val) => formatCurrency(val)
        },
        {
            label: 'Costo Prom.',
            key: 'cost',
            align: 'right',
            render: (val) => formatCurrency(val)
        },
        {
            label: 'Acciones',
            key: 'actions',
            align: 'center',
            render: (_, product) => (
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                    <Button
                        size="small"
                        variant="secondary"
                        onClick={(e) => { e.stopPropagation(); onView(product); }}
                    >
                        Ver
                    </Button>
                    <Button
                        size="small"
                        variant="warning"
                        onClick={(e) => { e.stopPropagation(); onEdit(product); }}
                    >
                        Editar
                    </Button>
                    <Button
                        size="small"
                        variant="danger"
                        onClick={(e) => { e.stopPropagation(); onDelete(product); }}
                    >
                        ✕
                    </Button>
                </div>
            )
        }
    ];

    return (
        <Table
            columns={columns}
            data={products}
            loading={loading}
            onRowClick={onView}
            emptyMessage="No hay productos registrados"
        />
    );
};

export default ProductsTable;
