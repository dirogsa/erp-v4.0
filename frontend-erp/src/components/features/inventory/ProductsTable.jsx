import React from 'react';
import Table from '../../common/Table';
import Button from '../../common/Button';
import { formatCurrency } from '../../../utils/formatters';

const ProductsTable = ({
    products = [],
    loading = false,
    onView,
    onEdit,
    onDelete,
    isMarketing = false,
    categories = []
}) => {
    const columns = [
        { label: 'SKU', key: 'sku' },
        {
            label: 'Categoría',
            key: 'category_id',
            render: (val) => {
                const cat = categories.find(c => c._id === val);
                return cat ? cat.name : '-';
            }
        },
        {
            label: 'Forma',
            key: 'custom_attributes',
            render: (val, row) => {
                // Try to find 'forma' in custom_attributes or in specs
                const forma = val?.forma || val?.shape;
                if (forma) return forma;

                // Fallback to specs if not in custom_attributes
                const formaSpec = row.specs?.find(s => s.label.toUpperCase() === 'FORMA');
                return formaSpec ? formaSpec.value : '-';
            }
        },
        { label: 'Marca', key: 'brand' },
        {
            label: 'Tienda',
            key: 'is_active_in_shop',
            align: 'center',
            render: (val) => val ? (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    color: '#10b981',
                    fontSize: '0.75rem',
                    fontWeight: '600'
                }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }}></div>
                    VISIBLE
                </div>
            ) : (
                <span style={{ color: '#475569', fontSize: '0.75rem' }}>Oculto</span>
            )
        },
        { label: 'Stock', key: 'stock_current', align: 'center' },
        // Marketing Columns (replacing prices)
        ...(isMarketing ? [
            {
                label: 'Costo Puntos',
                key: 'points_cost',
                align: 'center',
                render: (val) => (
                    <span style={{ fontWeight: 'bold', color: '#ed630f' }}>
                        🎁 {val || 0} pts
                    </span>
                )
            },
            {
                label: 'Imagen',
                key: 'image_url',
                align: 'center',
                render: (val) => val ? (
                    <img src={val} alt="tb" style={{ width: '32px', height: '32px', objectFit: 'cover', borderRadius: '4px' }} />
                ) : '-'
            }
        ] : [
            // Commercial Columns
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
            }
        ]),
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
