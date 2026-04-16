import React, { useState, useEffect } from 'react';
import Table from '../../common/Table';
import Button from '../../common/Button';
import { formatCurrency } from '../../../utils/formatters';
import { salesPolicyService } from '../../../services/api';

// ─── Switch Toggle Component ─────────────────────────────────────────────────
const VisibilitySwitch = ({ value, onChange, loading, color = '#10b981', label, productKey }) => {
    const on = value === true || value === 'true' || value === '1' || value === 1;
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
            <button
                id={`vis-switch-${label}-${productKey}`}
                onClick={onChange}
                disabled={loading}
                title={on ? `Ocultar en ${label}` : `Mostrar en ${label}`}
                style={{
                    width: '44px',
                    height: '24px',
                    borderRadius: '12px',
                    border: 'none',
                    cursor: loading ? 'wait' : 'pointer',
                    background: on ? color : '#334155',
                    position: 'relative',
                    transition: 'background 0.2s ease',
                    flexShrink: 0,
                    opacity: loading ? 0.6 : 1,
                    boxShadow: on ? `0 0 8px ${color}66` : 'none'
                }}
            >
                <span
                    style={{
                        position: 'absolute',
                        top: '3px',
                        left: on ? '22px' : '3px',
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        background: 'white',
                        transition: 'left 0.2s ease',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                    }}
                />
            </button>
            <span style={{
                fontSize: '0.6rem',
                color: on ? color : '#475569',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
            }}>
                {on ? 'SÍ' : 'NO'}
            </span>
        </div>
    );
};
// ─────────────────────────────────────────────────────────────────────────────

const ProductsTable = ({
    products = [],
    loading = false,
    onView,
    onEdit,
    onDelete,
    onToggleVisibility,   // (product, field, newBoolValue) => Promise
    isMarketing = false,
    categories = [],
    selectedIds = [],
    onSelectionChange
}) => {
    const [policies, setPolicies] = useState(null);
    const [togglingId, setTogglingId] = useState(null);

    useEffect(() => {
        const loadPolicies = async () => {
            try {
                const res = await salesPolicyService.getPolicies();
                setPolicies(res.data);
            } catch (err) { console.error("Error loading policies for table", err); }
        };
        loadPolicies();
    }, []);

    const handleToggle = async (product, field, currentValue) => {
        if (!onToggleVisibility) return;
        const productKey = product.id || product._id;
        const key = `${productKey}-${field}`;
        if (togglingId === key) return; // prevent double click
        setTogglingId(key);
        try {
            const on = currentValue === true || currentValue === 'true' || currentValue === '1' || currentValue === 1;
            await onToggleVisibility(product, field, !on);
        } finally {
            setTogglingId(null);
        }
    };

    const columns = [
        { label: 'SKU', key: 'sku' },
        {
            label: 'Categoría',
            key: 'category_id',
            render: (val, row) => {
                const cat = categories.find(c => c._id === val);
                if (cat) return cat.name;
                return row.category_name || '-';
            }
        },
        {
            label: 'Forma',
            key: 'custom_attributes',
            render: (val, row) => {
                const forma = val?.forma || val?.shape;
                if (forma) return forma;
                const formaSpec = row.specs?.find(s => s.label.toUpperCase() === 'FORMA');
                return formaSpec ? formaSpec.value : '-';
            }
        },
        { label: 'Marca', key: 'brand' },
        {
            label: '🛒 Tienda',
            key: 'is_active_in_shop',
            align: 'center',
            render: (val, product) => {
                const productKey = product.id || product._id;
                const isLoading = togglingId === `${productKey}-is_active_in_shop`;
                return (
                    <VisibilitySwitch
                        value={val}
                        loading={isLoading}
                        color="#10b981"
                        label="tienda"
                        productKey={productKey}
                        onChange={(e) => { e.stopPropagation(); handleToggle(product, 'is_active_in_shop', val); }}
                    />
                );
            }
        },
        {
            label: '✨ Novedad',
            key: 'is_new',
            align: 'center',
            render: (val, product) => {
                const productKey = product.id || product._id;
                const isLoading = togglingId === `${productKey}-is_new`;
                return (
                    <VisibilitySwitch
                        value={val}
                        loading={isLoading}
                        color="#f59e0b"
                        label="novedad"
                        productKey={productKey}
                        onChange={(e) => { e.stopPropagation(); handleToggle(product, 'is_new', val); }}
                    />
                );
            }
        },
        { label: 'Stock', key: 'stock_current', align: 'center' },
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
            {
                label: 'P. Minorista',
                key: 'price_retail',
                align: 'right',
                render: (val, row) => {
                    if (val > 0) return formatCurrency(val);
                    if (policies && row.price_wholesale > 0) {
                        const calculated = row.price_wholesale * (1 + (policies.retail_markup_pct || 20) / 100);
                        return (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>{formatCurrency(calculated)}</span>
                                <span style={{ fontSize: '0.6rem', color: '#64748b', textTransform: 'uppercase' }}>Sugerido (+{policies.retail_markup_pct}%)</span>
                            </div>
                        );
                    }
                    return formatCurrency(0);
                }
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
                    <Button size="small" variant="secondary" onClick={(e) => { e.stopPropagation(); onView(product); }}>
                        Ver
                    </Button>
                    <Button size="small" variant="warning" onClick={(e) => { e.stopPropagation(); onEdit(product); }}>
                        Editar
                    </Button>
                    <Button size="small" variant="danger" onClick={(e) => { e.stopPropagation(); onDelete(product); }}>
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
            enableSelection={true}
            selectedKeys={selectedIds}
            onSelectionChange={onSelectionChange}
            keyField="_id"
        />
    );
};

export default ProductsTable;
