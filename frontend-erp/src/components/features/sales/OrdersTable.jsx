import React from 'react';
import Table from '../../common/Table';
import Badge from '../../common/Badge';
import Button from '../../common/Button';
import { formatCurrency, formatDate, formatStatus } from '../../../utils/formatters';

const OrdersTable = ({
    orders = [],
    loading = false,
    onView,
    onCreateInvoice,
    onCheckAvailability,  // New: for backorders
    onDelete,
    showCheckStockButton = false  // New: controls which button to show
}) => {
    const columns = [
        {
            label: 'N° Orden',
            key: 'order_number',
            render: (val, order) => (
                <div>
                   <div style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                       {val}
                       {order.source === 'SHOP' && (
                           <span className="status-badge approved" style={{ fontSize: '0.55rem', padding: '0.1rem 0.2rem' }}>TIENDA</span>
                       )}
                   </div>
                   {order.issuer_info?.name && (
                       <div style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase', marginTop: '0.1rem' }}>
                           {order.issuer_info.name.split(' ')[0]}
                       </div>
                   )}
                </div>
            )
        },
        { label: 'Cliente', key: 'customer_name' },
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

                    {/* Show invoice button for PENDING or PARTIALLY_INVOICED orders */}
                    {['PENDING', 'PARTIALLY_INVOICED'].includes(order.status) && onCreateInvoice && (
                        <>
                            <Button
                                size="small"
                                variant="success"
                                onClick={(e) => { e.stopPropagation(); onCreateInvoice(order); }}
                            >
                                {order.source === 'SHOP' ? '📝 Procesar Web' : 'Facturar'}
                            </Button>
                            {onDelete && (
                                <Button
                                    size="small"
                                    variant="danger"
                                    onClick={(e) => { e.stopPropagation(); onDelete(order); }}
                                >
                                    Eliminar
                                </Button>
                            )}
                        </>
                    )}

                    {/* Allow deleting CANCELLED orders */}
                    {order.status === 'CANCELLED' && onDelete && (
                        <Button
                            size="small"
                            variant="danger"
                            onClick={(e) => { e.stopPropagation(); onDelete(order); }}
                        >
                            Eliminar
                        </Button>
                    )}

                    {/* Allow deleting CONVERTED orders (Audit trail clean up) */}
                    {order.status === 'CONVERTED' && onDelete && (
                        <Button
                            size="small"
                            variant="danger"
                            onClick={(e) => { e.stopPropagation(); onDelete(order); }}
                        >
                            Eliminar
                        </Button>
                    )}

                    {/* Show stock check button for BACKORDER orders */}
                    {showCheckStockButton && onCheckAvailability && (
                        <>
                            <Button
                                size="small"
                                variant="primary"
                                onClick={(e) => { e.stopPropagation(); onCheckAvailability(order); }}
                            >
                                🔄 Revisar Stock
                            </Button>
                            {onDelete && (
                                <Button
                                    size="small"
                                    variant="danger"
                                    onClick={(e) => { e.stopPropagation(); onDelete(order); }}
                                >
                                    Eliminar
                                </Button>
                            )}
                        </>
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
            emptyMessage="No hay órdenes de venta registradas"
        />
    );
};

export default OrdersTable;
