import React from 'react';
import Table from '../../common/Table';
import Badge from '../../common/Badge';
import Button from '../../common/Button';
import { formatCurrency, formatDate, formatStatus } from '../../../utils/formatters';

const PurchaseInvoicesTable = ({
    invoices = [],
    loading = false,
    onView,
    onRegisterPayment,

    onReceive,
    onDelete
}) => {
    const columns = [
        { label: 'N° Factura', key: 'invoice_number' },
        { label: 'Proveedor', key: 'supplier_name' },
        {
            label: 'Fecha',
            key: 'invoice_date',
            render: (val) => formatDate(val)
        },
        {
            label: 'Total',
            key: 'total_amount',
            align: 'right',
            render: (val) => formatCurrency(val)
        },
        {
            label: 'Pago',
            key: 'payment_status',
            align: 'center',
            render: (val) => <Badge status={val}>{formatStatus(val)}</Badge>
        },
        {
            label: 'Recepción',
            key: 'reception_status',
            align: 'center',
            render: (val) => <Badge status={val}>{formatStatus(val)}</Badge>
        },
        {
            label: 'Acciones',
            key: 'actions',
            align: 'center',
            render: (_, invoice) => (
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                    <Button
                        size="small"
                        variant="secondary"
                        onClick={(e) => { e.stopPropagation(); onView(invoice); }}
                    >
                        Ver
                    </Button>
                    {invoice.payment_status !== 'PAID' && (
                        <Button
                            size="small"
                            variant="success"
                            onClick={(e) => { e.stopPropagation(); onRegisterPayment(invoice); }}
                        >
                            Pagar
                        </Button>
                    )}
                    {invoice.reception_status === 'NOT_RECEIVED' && (
                        <Button
                            size="small"
                            variant="warning"
                            onClick={(e) => { e.stopPropagation(); onReceive(invoice); }}
                        >
                            Recibir
                        </Button>
                    )}
                    <Button
                        size="small"
                        variant="danger"
                        onClick={(e) => { e.stopPropagation(); onDelete(invoice); }}
                    >
                        Eliminar
                    </Button>
                </div>
            )
        }
    ];

    return (
        <Table
            columns={columns}
            data={invoices}
            loading={loading}
            onRowClick={onView}
            emptyMessage="No hay facturas de compra registradas"
        />
    );
};

export default PurchaseInvoicesTable;
