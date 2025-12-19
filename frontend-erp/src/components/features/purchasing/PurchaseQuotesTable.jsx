import React from 'react';
import Table from '../../common/Table';
import Badge from '../../common/Badge';
import Button from '../../common/Button';
import { formatCurrency, formatDate, formatStatus } from '../../../utils/formatters';

const PurchaseQuotesTable = ({
    quotes = [],
    loading = false,
    onView,
    onConvert,
    onDelete
}) => {
    const columns = [
        { label: 'N° Solicitud', key: 'quote_number' },
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
            render: (_, quote) => (
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                    <Button
                        size="small"
                        variant="secondary"
                        onClick={(e) => { e.stopPropagation(); onView(quote); }}
                    >
                        Ver
                    </Button>
                    {quote.status !== 'CONVERTED' && quote.status !== 'REJECTED' && (
                        <>
                            <Button
                                size="small"
                                variant="success"
                                onClick={(e) => { e.stopPropagation(); onConvert(quote); }}
                            >
                                Convertir
                            </Button>
                            <Button
                                size="small"
                                variant="danger"
                                onClick={(e) => { e.stopPropagation(); onDelete(quote); }}
                            >
                                Eliminar
                            </Button>
                        </>
                    )}
                </div>
            )
        }
    ];

    return (
        <Table
            columns={columns}
            data={quotes}
            loading={loading}
            onRowClick={onView}
            emptyMessage="No hay solicitudes registradas"
        />
    );
};

export default PurchaseQuotesTable;
