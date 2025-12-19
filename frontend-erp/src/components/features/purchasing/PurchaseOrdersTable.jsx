import React from 'react';
import Table from '../../common/Table';
import Badge from '../../common/Badge';
import Button from '../../common/Button';
import { formatCurrency, formatDate, formatStatus } from '../../../utils/formatters';

const PurchaseOrdersTable = ({
    orders = [],
    loading = false,
    onView,
    onCreateInvoice,
    onDelete
}) => {
    const columns = [
        { label: 'N° Orden', key: 'order_number' },
        { label: 'Proveedor', key: 'supplier_name' },
        {
            label: 'Fecha',
            key: 'date',
            render: (val) => formatDate(val)
        },
        {
            label: 'Total',
            key: 'total_amount',
            align: 'right',
            render: (val) => formatCurrency(val)
        },
        {
            label: 'Estado',
            key: 'status',
            align: 'center',
            render: (val) => <Badge status={val}>{formatStatus(val)}</Badge>
        },
        {
            label: 'Acciones',
            key: 'actions',
            align: 'center',
            render: (_, order) => (
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                    <Button
                        size="small"
                        variant="secondary"
                        onClick={(e) => { e.stopPropagation(); onView(order); }}
                    >
                        Ver
                    </Button>
                    {/* Facturar Button (PENDING) */}
                    {order.status === 'PENDING' && (
                        <Button
                            size="small"
                            variant="success"
                            onClick={(e) => { e.stopPropagation(); onCreateInvoice(order); }}
                        >
                            Facturar
                        </Button>
                    )}

                    {/* Delete Button (PENDING or CANCELLED) */}
                    {(order.status === 'PENDING' || order.status === 'CANCELLED') && onDelete && (
                        <Button
                            size="small"
                            variant="danger"
                            onClick={(e) => { e.stopPropagation(); onDelete(order); }}
                        >
                            Eliminar
                        </Button>
                    )}
                </div>
            )
        }
    ];

    return (
        <Table
            columns={columns}
            data={orders}
            loading={loading}
            onRowClick={onView}
            emptyMessage="No hay órdenes de compra registradas"
        />
    );
};

export default PurchaseOrdersTable;
