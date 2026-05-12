import React from 'react';
import Table from '../../common/Table';
import Badge from '../../common/Badge';
import Button from '../../common/Button';
import { formatCurrency, formatDate, formatStatus } from '../../../utils/formatters';
import { AlertCircle } from 'lucide-react';

const PurchaseInvoicesTable = ({
    invoices = [],
    loading = false,
    onView,
    onRegisterPayment,
    onReceive,
    onDelete,
    selectedIds = [],
    onSelectionChange
}) => {
    const columns = [
        {
            label: 'N° Factura',
            key: 'sunat_number',
            render: (val, invoice) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {!invoice.is_financial_confirmed && (
                        <div title="Pendiente de Sinceramiento" style={{ color: '#ef4444' }}>
                            <AlertCircle size={16} />
                        </div>
                    )}
                    <div>
                        <div style={{ fontWeight: 'bold', color: 'white' }}>{invoice.sunat_number || 'S/N'}</div>
                        <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', marginTop: '0.1rem' }}>
                            ID Int: {invoice.invoice_number}
                        </div>
                    </div>
                </div>
            )
        },
        { label: 'Proveedor', key: 'supplier_name' },
        {
            label: 'Fecha',
            key: 'invoice_date',
            render: (val) => formatDate(val)
        },
        {
            label: 'Condición',
            key: 'payment_condition',
            align: 'center',
            render: (val) => (
                <span style={{ 
                    fontSize: '0.75rem', 
                    fontWeight: 'bold',
                    color: val === 'CREDITO' ? '#fbbf24' : '#10b981',
                    backgroundColor: val === 'CREDITO' ? '#451a03' : '#064e3b',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '0.5rem',
                    border: '1px solid currentColor'
                }}>
                    {val || 'CONTADO'}
                </span>
            )
        },
        {
            label: 'Vencimiento',
            key: 'due_date',
            align: 'center',
            render: (val, row) => {
                if (row.payment_status === 'PAID') return <span style={{ color: '#64748b' }}>-</span>;
                if (!val) return <span style={{ color: '#64748b' }}>-</span>;
                
                const dueDate = new Date(val);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                const diffTime = dueDate - today;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                let color = '#10b981'; // Green
                let label = formatDate(val);
                
                if (diffDays < 0) {
                    color = '#ef4444'; // Red (Vencida)
                    label = `VENCIDA (${Math.abs(diffDays)}d)`;
                } else if (diffDays <= 3) {
                    color = '#fbbf24'; // Yellow (Por vencer)
                    label = `Vence en ${diffDays}d`;
                }
                
                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: color, boxShadow: `0 0 10px ${color}` }}></div>
                        <span style={{ color, fontWeight: 'bold', fontSize: '0.8rem' }}>{label}</span>
                    </div>
                );
            }
        },
        {
            label: 'Total',
            key: 'total_amount',
            align: 'right',
            render: (val, invoice) => {
                const isUSD = invoice.currency === 'USD' || invoice.currency === 'DOLARES';
                const symbol = isUSD ? '$' : 'S/';
                const exchangeRate = invoice.exchange_rate || 1;
                
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <div style={{ fontWeight: 'bold', color: isUSD ? '#34d399' : 'white', fontSize: '1rem' }}>
                            {formatCurrency(val, symbol)}
                        </div>
                        {isUSD && exchangeRate > 1 && (
                            <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '-2px' }}>
                                Equiv. {formatCurrency(val * exchangeRate, 'S/')}
                            </div>
                        )}
                        {isUSD && (
                            <div style={{ fontSize: '0.6rem', color: '#64748b', fontStyle: 'italic' }}>
                                T.C. {exchangeRate.toFixed(3)}
                            </div>
                        )}
                    </div>
                );
            }
        },
        {
            label: 'Pago',
            key: 'payment_status',
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
            enableSelection={true}
            selectedKeys={selectedIds}
            onSelectionChange={onSelectionChange}
            keyField="invoice_number"
            emptyMessage="No hay facturas de compra registradas"
        />
    );
};

export default PurchaseInvoicesTable;
