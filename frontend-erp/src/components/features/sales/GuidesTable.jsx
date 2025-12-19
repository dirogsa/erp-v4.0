import React from 'react';
import Table from '../../common/Table';
import Button from '../../common/Button';
import { formatDate } from '../../../utils/formatters';

const GuidesTable = ({
    guides = [],
    loading = false,
    onView,
    onDispatch,
    onDeliver,
    onCancel,
    onPrint
}) => {
    const getStatusBadge = (status) => {
        const statusConfig = {
            DRAFT: { color: '#fbbf24', bg: '#451a03', label: 'Pendiente' },
            DISPATCHED: { color: '#3b82f6', bg: '#1e3a5f', label: 'Despachado' },
            DELIVERED: { color: '#10b981', bg: '#064e3b', label: 'Entregado' },
            CANCELLED: { color: '#ef4444', bg: '#450a0a', label: 'Anulada' }
        };

        const config = statusConfig[status] || statusConfig.DRAFT;

        return (
            <span style={{
                backgroundColor: config.bg,
                color: config.color,
                padding: '0.25rem 0.75rem',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: '500'
            }}>
                {config.label}
            </span>
        );
    };

    const columns = [
        {
            label: 'N° Interno',
            key: 'guide_number',
            render: (value) => (
                <span style={{ fontWeight: '500', color: '#3b82f6' }}>
                    {value}
                </span>
            )
        },
        {
            label: 'N° SUNAT',
            key: 'sunat_number',
            render: (value) => value || <span style={{ color: '#64748b' }}>-</span>
        },
        {
            label: 'Factura',
            key: 'invoice_number',
            render: (value) => value || '-'
        },
        {
            label: 'Cliente',
            key: 'customer_name',
            render: (_, row) => (
                <div>
                    <div>{row.customer_name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{row.customer_ruc}</div>
                </div>
            )
        },
        {
            label: 'Estado',
            key: 'status',
            render: (value) => getStatusBadge(value)
        },
        {
            label: 'Fecha',
            key: 'issue_date',
            render: (value) => formatDate(value)
        },
        {
            label: 'Acciones',
            key: 'actions',
            render: (_, row) => (
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {row.status === 'DRAFT' && (
                        <Button
                            size="small"
                            onClick={() => onDispatch(row.guide_number)}
                            style={{ backgroundColor: '#3b82f6', fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}
                        >
                            Despachar
                        </Button>
                    )}
                    {row.status === 'DISPATCHED' && (
                        <Button
                            size="small"
                            onClick={() => onDeliver(row)}
                            style={{ backgroundColor: '#10b981', fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}
                        >
                            Confirmar
                        </Button>
                    )}
                    <Button
                        size="small"
                        variant="secondary"
                        onClick={() => onPrint(row)}
                        style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}
                    >
                        🖨️
                    </Button>
                    <Button
                        size="small"
                        variant="danger"
                        onClick={() => onCancel(row.guide_number)}
                        style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}
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
            data={guides}
            loading={loading}
            emptyMessage="No hay guías de remisión"
        />
    );
};

export default GuidesTable;
