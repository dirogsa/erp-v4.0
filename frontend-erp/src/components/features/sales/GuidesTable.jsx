import React from 'react';
import Table from '../../common/Table';
import Button from '../../common/Button';
import { formatDate } from '../../../utils/formatters';

const GuidesTable = ({
    guides = [],
    loading = false,
    selectedIds = [],
    onSelectionChange,
    onView,
    onDispatch,
    onDeliver,
    onCancel,
    onPrint,
    onPrepare,
    onRestore
}) => {
    const getStatusBadge = (status) => {
        const statusConfig = {
            DRAFT: { color: '#fbbf24', bg: '#451a03', label: 'Pendiente' },
            READY: { color: '#8b5cf6', bg: '#2e1065', label: 'Lista para despacho' },
            DISPATCHED: { color: '#3b82f6', bg: '#1e3a5f', label: 'En camino' },
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
            render: (value, row) => (
                <div>
                    <span style={{ fontWeight: '500', color: '#3b82f6' }}>
                        {value}
                    </span>
                    {row.issuer_info?.name && (
                        <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', marginTop: '0.1rem' }}>
                            {row.issuer_info.name.split(' ')[0]}
                        </div>
                    )}
                </div>
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
                <div style={{ minWidth: '220px', maxWidth: '350px', lineHeight: '1.4' }}>
                    <div style={{ fontWeight: '500', whiteSpace: 'normal', wordWrap: 'break-word' }}>
                        {row.customer_name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
                        RUC: {row.customer_ruc}
                    </div>
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
                        <>
                            <Button
                                size="small"
                                onClick={() => onPrepare(row.guide_number)}
                                style={{ backgroundColor: '#8b5cf6', fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}
                            >
                                Marcar Listo
                            </Button>
                            <Button
                                size="small"
                                onClick={() => onDispatch(row.guide_number)}
                                style={{ backgroundColor: '#3b82f6', fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}
                            >
                                Despachar
                            </Button>
                        </>
                    )}
                    {row.status === 'READY' && (
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
                    {row.status === 'CANCELLED' && (
                        <Button
                            size="small"
                            onClick={() => onRestore(row.guide_number)}
                            style={{ backgroundColor: '#6366f1', fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}
                        >
                            🔄 Restaurar
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
                </div>
            )
        }
    ];

    return (
        <Table
            columns={columns}
            data={guides}
            loading={loading}
            enableSelection={true}
            selectedKeys={selectedIds}
            onSelectionChange={onSelectionChange}
            keyField="guide_number"
            emptyMessage="No hay guías de remisión"
            onRowClick={onView}
        />
    );
};

export default GuidesTable;
