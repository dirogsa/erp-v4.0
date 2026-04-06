import React from 'react';
import Table from '../../common/Table';
import Badge from '../../common/Badge';
import Button from '../../common/Button';
import { formatCurrency, formatDate, formatStatus } from '../../../utils/formatters';

const QuotesTable = ({
    quotes = [],
    loading = false,
    onView,
    onEdit,
    onConvert,
    onDelete
}) => {
    const columns = [
        {
            label: 'N° Cotización',
            key: 'quote_number',
            render: (val, quote) => (
                <div>
                    <div style={{ fontWeight: '600' }}>{val}</div>
                    {quote.issuer_info?.name && (
                        <div style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase', marginTop: '0.1rem' }}>
                            {quote.issuer_info.name.split(' ')[0]} {/* Show first word or short version */}
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
            label: 'Origen',
            key: 'source',
            align: 'center',
            render: (val) => (
                <span title={val === 'SHOP' ? 'Viene de Tienda Online' : 'Creado en ERP'} style={{
                    fontSize: '0.7rem',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.3rem',
                    color: val === 'SHOP' ? '#10b981' : '#3b82f6',
                }}>
                    {val === 'SHOP' ? '🛒' : '🏢'} 
                    <span style={{ fontSize: '0.6rem' }}>{val}</span>
                </span>
            )
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
                                variant="warning"
                                onClick={(e) => { e.stopPropagation(); onEdit(quote); }}
                            >
                                Editar
                            </Button>
                            <Button
                                size="small"
                                variant="success"
                                onClick={(e) => { e.stopPropagation(); onConvert(quote); }}
                            >
                                Convertir
                            </Button>
                        </>
                    )}
                    <Button
                        size="small"
                        variant="danger"
                        onClick={(e) => { e.stopPropagation(); onDelete(quote); }}
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
            data={quotes}
            loading={loading}
            onRowClick={onView}
            emptyMessage="No hay cotizaciones registradas"
        />
    );
};

export default QuotesTable;
