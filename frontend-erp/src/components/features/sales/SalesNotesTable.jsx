import React from 'react';
import Table from '../../common/Table';
import Badge from '../../common/Badge';
import Button from '../../common/Button';
import { formatCurrency, formatDate } from '../../../utils/formatters';

const SalesNotesTable = ({
    notes = [],
    loading = false,
    onView
}) => {
    const columns = [
        { label: 'N° Nota', key: 'note_number' },
        { label: 'Factura Ref.', key: 'invoice_number' },
        { label: 'Cliente', key: 'customer_name' },
        {
            label: 'Fecha',
            key: 'date',
            render: (val) => formatDate(val)
        },
        {
            label: 'Tipo',
            key: 'type',
            align: 'center',
            render: (val) => (
                <Badge status={val === 'CREDIT' ? 'DANGER' : 'INFO'}>
                    {val === 'CREDIT' ? 'Nota de Crédito' : 'Nota de Débito'}
                </Badge>
            )
        },
        {
            label: 'Motivo',
            key: 'reason',
            render: (val) => {
                const map = {
                    'RETURN': 'Devolución',
                    'DISCOUNT': 'Descuento',
                    'ERROR': 'Error',
                    'ANNULMENT': 'Anulación'
                };
                return map[val] || val;
            }
        },
        {
            label: 'Total',
            key: 'total_amount',
            align: 'right',
            render: (val) => formatCurrency(val)
        },
        {
            label: 'Acciones',
            key: 'actions',
            align: 'center',
            render: (_, note) => (
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                    {/* TODO: Implement View Note Detail/PDF */}
                    <Button
                        size="small"
                        variant="secondary"
                        onClick={(e) => { e.stopPropagation(); onView && onView(note); }}
                    >
                        Ver
                    </Button>
                </div>
            )
        }
    ];

    return (
        <Table
            columns={columns}
            data={notes}
            loading={loading}
            emptyMessage="No hay notas registradas"
        />
    );
};

export default SalesNotesTable;
