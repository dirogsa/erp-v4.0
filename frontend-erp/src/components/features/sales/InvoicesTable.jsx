import React from 'react';
import Table from '../../common/Table';
import Badge from '../../common/Badge';
import Button from '../../common/Button';
import { formatCurrency, formatDate, formatStatus } from '../../../utils/formatters';

const InvoicesTable = ({
    invoices = [],
    loading = false,
    onView,
    onRegisterPayment,
    onDispatch,
    onEmitNote,
    onDelete
}) => {
    const columns = [
        {
            label: 'N° Factura',
            key: 'sunat_number',
            render: (val, invoice) => (
                <div>
                    <div style={{ fontWeight: 'bold', color: 'white' }}>{invoice.sunat_number || 'Borrador'}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Int: {invoice.invoice_number}</div>
                </div>
            )
        },
        { label: 'Cliente', key: 'customer_name' },
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
            label: 'Despacho',
            key: 'dispatch_status',
            align: 'center',
            render: (val) => <Badge status={val}>{formatStatus(val)}</Badge>
        },
        {
            label: 'Notas Rel.',
            key: 'linked_notes',
            render: (val, invoice) => (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                    {invoice.linked_notes?.map(note => (
                        <div
                            key={note.note_number}
                            title={`${note.type}: ${note.note_number} - ${formatCurrency(note.total_amount)}`}
                            style={{
                                fontSize: '0.7rem',
                                padding: '0.1rem 0.3rem',
                                borderRadius: '0.2rem',
                                color: 'white',
                                backgroundColor: note.type === 'CREDIT' ? '#ef4444' : '#3b82f6', // Rojo para NC, Azul para ND
                                cursor: 'help'
                            }}
                        >
                            {note.type === 'CREDIT' ? 'NC' : 'ND'}
                        </div>
                    ))}
                    {(!invoice.linked_notes || invoice.linked_notes.length === 0) && '-'}
                </div>
            )
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
                    {invoice.dispatch_status === 'NOT_DISPATCHED' && !invoice.guide_id && (
                        <Button
                            size="small"
                            variant="warning"
                            onClick={(e) => { e.stopPropagation(); onDispatch(invoice); }}
                        >
                            📦 Guía
                        </Button>
                    )}
                    <Button
                        size="small"
                        variant="info"
                        onClick={(e) => { e.stopPropagation(); onEmitNote(invoice); }}
                    >
                        Nota C/D
                    </Button>
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
            emptyMessage="No hay facturas registradas"
        />
    );
};

export default InvoicesTable;
