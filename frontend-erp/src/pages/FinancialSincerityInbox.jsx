import React, { useState, useEffect } from 'react';
import { useSalesInvoices } from '../hooks/useSalesInvoices';
import { usePurchaseInvoices } from '../hooks/usePurchaseInvoices';
import { useNotification } from '../hooks/useNotification';
import { salesService, purchasingService } from '../services/api';
import Button from '../components/common/Button';
import Loading from '../components/common/Loading';
import Input from '../components/common/Input';
import Pagination from '../components/common/Table/Pagination';
import { CheckCircle, AlertTriangle, Info, Clock, ArrowRight, ShieldCheck, Search, Filter, Trash2 } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';

const FinancialSincerityInbox = () => {
    const [activeTab, setActiveTab] = useState('sales');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [search, setSearch] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);
    const { showNotification } = useNotification();

    // Reset pagination and selection on tab change
    useEffect(() => {
        setPage(1);
        setSelectedIds([]);
    }, [activeTab]);

    // Data hooks - Fetching ONLY unconfirmed invoices
    const salesData = useSalesInvoices({ 
        page, 
        limit, 
        search, 
        is_confirmed: false 
    });

    const purchaseData = usePurchaseInvoices({ 
        page, 
        limit, 
        search, 
        is_confirmed: false 
    });

    const currentData = activeTab === 'sales' ? salesData : purchaseData;
    const { invoices, pagination, loading, fetchInvoices, deleteInvoice } = currentData;

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(invoices.map(inv => inv.invoice_number));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (invoiceNumber) => {
        setSelectedIds(prev => 
            prev.includes(invoiceNumber) 
                ? prev.filter(id => id !== invoiceNumber)
                : [...prev, invoiceNumber]
        );
    };

    const handleBulkSincerity = async (condition) => {
        if (selectedIds.length === 0) return;

        const label = condition === 'CONTADO' ? 'CONTADO (Pagado)' : 'CRÉDITO (Por Pagar/Cobrar)';
        if (!window.confirm(`¿Desea sincerar ${selectedIds.length} facturas como ${label}?`)) return;

        try {
            const service = activeTab === 'sales' ? salesService : purchasingService;
            await service.bulkUpdatePaymentCondition({
                invoice_numbers: selectedIds,
                condition
            });
            showNotification(`Se sinceraron ${selectedIds.length} facturas correctamente`, 'success');
            setSelectedIds([]);
            fetchInvoices();
        } catch (error) {
            showNotification('Error al sincerar facturas', 'error');
        }
    };

    const handleDelete = async (invoiceNumber) => {
        if (!window.confirm('¿Está seguro de eliminar esta factura importada? Se revertirán los movimientos internos.')) return;
        try {
            await deleteInvoice(invoiceNumber);
            showNotification('Factura eliminada', 'success');
        } catch (error) {
            // Error handled by hook
        }
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '1600px', margin: '0 auto' }}>
            {/* Header section with industrial tech aesthetic */}
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'flex-start', 
                marginBottom: '2.5rem',
                borderBottom: '1px solid #334155',
                paddingBottom: '1.5rem'
            }}>
                <div>
                    <h1 style={{ color: 'white', fontSize: '2rem', fontWeight: '800', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <ShieldCheck size={32} color="#3b82f6" />
                        Buzón de Sinceramiento Financiero
                    </h1>
                    <p style={{ color: '#94a3b8', fontSize: '1.1rem' }}>
                        Validación humana obligatoria para importaciones masivas de XML
                    </p>
                </div>
                
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ 
                        backgroundColor: '#1e293b', 
                        padding: '1rem 1.5rem', 
                        borderRadius: '0.75rem', 
                        border: '1px solid #334155',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Pendientes Hoy</div>
                        <div style={{ fontSize: '1.5rem', color: '#3b82f6', fontWeight: 'bold' }}>
                            {pagination.totalItems || 0}
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                <button
                    onClick={() => setActiveTab('sales')}
                    style={{
                        padding: '1rem 2rem',
                        borderRadius: '0.75rem',
                        border: 'none',
                        backgroundColor: activeTab === 'sales' ? '#3b82f6' : '#1e293b',
                        color: 'white',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        boxShadow: activeTab === 'sales' ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none'
                    }}
                >
                    💰 Facturas de Ventas
                </button>
                <button
                    onClick={() => setActiveTab('purchasing')}
                    style={{
                        padding: '1rem 2rem',
                        borderRadius: '0.75rem',
                        border: 'none',
                        backgroundColor: activeTab === 'purchasing' ? '#3b82f6' : '#1e293b',
                        color: 'white',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        boxShadow: activeTab === 'purchasing' ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none'
                    }}
                >
                    🛒 Facturas de Compras
                </button>
            </div>

            {/* Search and Table Container */}
            <div style={{ backgroundColor: '#0f172a', borderRadius: '1rem', border: '1px solid #334155', overflow: 'hidden' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ position: 'relative', width: '400px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                        <input 
                            type="text"
                            placeholder="Buscar por número, RUC o cliente..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{
                                width: '100%',
                                backgroundColor: '#1e293b',
                                border: '1px solid #334155',
                                borderRadius: '0.5rem',
                                padding: '0.75rem 1rem 0.75rem 2.75rem',
                                color: 'white',
                                outline: 'none'
                            }}
                        />
                    </div>
                    
                    <div style={{ color: '#94a3b8', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Info size={16} />
                        Las facturas en este buzón NO han generado movimientos de caja aún.
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#1e293b' }}>
                                <th style={{ padding: '1.25rem 1rem' }}>
                                    <input 
                                        type="checkbox" 
                                        onChange={handleSelectAll}
                                        checked={selectedIds.length === invoices.length && invoices.length > 0}
                                        style={{ width: '1.1rem', height: '1.1rem', cursor: 'pointer' }}
                                    />
                                </th>
                                <th style={{ padding: '1.25rem 1rem', color: '#94a3b8', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Documento</th>
                                <th style={{ padding: '1.25rem 1rem', color: '#94a3b8', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Fecha</th>
                                <th style={{ padding: '1.25rem 1rem', color: '#94a3b8', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Cliente / Proveedor</th>
                                <th style={{ padding: '1.25rem 1rem', color: '#94a3b8', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Monto</th>
                                <th style={{ padding: '1.25rem 1rem', color: '#94a3b8', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Condición XML</th>
                                <th style={{ padding: '1.25rem 1rem', color: '#94a3b8', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="7" style={{ padding: '4rem', textAlign: 'center' }}>
                                        <Loading />
                                    </td>
                                </tr>
                            ) : invoices.length === 0 ? (
                                <tr>
                                    <td colSpan="7" style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>
                                        <div style={{ marginBottom: '1rem' }}><Clock size={48} opacity={0.5} style={{ margin: '0 auto' }} /></div>
                                        No hay facturas pendientes de sinceramiento.
                                    </td>
                                </tr>
                            ) : (
                                invoices.map((inv) => (
                                    <tr key={inv.invoice_number} style={{ borderBottom: '1px solid #1e293b', transition: 'background 0.2s' }}>
                                        <td style={{ padding: '1.25rem 1rem' }}>
                                            <input 
                                                type="checkbox" 
                                                checked={selectedIds.includes(inv.invoice_number)}
                                                onChange={() => handleSelectOne(inv.invoice_number)}
                                                style={{ width: '1.1rem', height: '1.1rem', cursor: 'pointer' }}
                                            />
                                        </td>
                                        <td style={{ padding: '1.25rem 1rem' }}>
                                            <div style={{ color: 'white', fontWeight: '600' }}>{inv.sunat_number || inv.invoice_number}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>#{inv.invoice_number}</div>
                                        </td>
                                        <td style={{ padding: '1.25rem 1rem', color: '#e2e8f0' }}>
                                            {formatDate(inv.invoice_date)}
                                        </td>
                                        <td style={{ padding: '1.25rem 1rem' }}>
                                            <div style={{ color: 'white' }}>{inv.customer_name || inv.supplier_name}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{inv.customer_ruc || inv.supplier_ruc}</div>
                                        </td>
                                        <td style={{ padding: '1.25rem 1rem', color: 'white', fontWeight: 'bold' }}>
                                            {formatCurrency(inv.total_amount)}
                                        </td>
                                        <td style={{ padding: '1.25rem 1rem' }}>
                                            <span style={{ 
                                                padding: '0.25rem 0.6rem', 
                                                borderRadius: '0.4rem', 
                                                fontSize: '0.75rem', 
                                                fontWeight: '700',
                                                backgroundColor: inv.payment_condition === 'CONTADO' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                                color: inv.payment_condition === 'CONTADO' ? '#10b981' : '#f59e0b',
                                                border: `1px solid ${inv.payment_condition === 'CONTADO' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`
                                            }}>
                                                {inv.payment_condition}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1.25rem 1rem' }}>
                                            <button 
                                                onClick={() => handleDelete(inv.invoice_number)}
                                                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.5rem' }}
                                                title="Eliminar Factura"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div style={{ padding: '1.5rem', backgroundColor: '#1e293b' }}>
                    <Pagination
                        current={pagination.current}
                        total={pagination.total}
                        onChange={setPage}
                        pageSize={limit}
                        onPageSizeChange={setLimit}
                    />
                </div>
            </div>

            {/* Selection Toolbar (Floating) */}
            {selectedIds.length > 0 && (
                <div style={{
                    position: 'fixed',
                    bottom: '2.5rem',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: '#1e293b',
                    padding: '1.25rem 2.5rem',
                    borderRadius: '1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2.5rem',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4)',
                    border: '1px solid #3b82f6',
                    zIndex: 1000,
                    animation: 'slideUp 0.3s ease-out'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ 
                            backgroundColor: '#3b82f6', 
                            color: 'white', 
                            width: '32px', 
                            height: '32px', 
                            borderRadius: '50%', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            fontWeight: 'bold'
                        }}>
                            {selectedIds.length}
                        </div>
                        <span style={{ color: 'white', fontWeight: '600', fontSize: '1.1rem' }}>Documentos seleccionados</span>
                    </div>

                    <div style={{ height: '32px', width: '1px', backgroundColor: '#334155' }}></div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <Button 
                            variant="success" 
                            onClick={() => handleBulkSincerity('CONTADO')}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <CheckCircle size={18} /> Confirmar CONTADO
                        </Button>
                        <Button 
                            variant="warning" 
                            onClick={() => handleBulkSincerity('CREDITO')}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <Clock size={18} /> Confirmar CRÉDITO
                        </Button>
                        <button 
                            onClick={() => setSelectedIds([])}
                            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontWeight: '500' }}
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes slideUp {
                    from { transform: translate(-50%, 100%); opacity: 0; }
                    to { transform: translate(-50%, 0); opacity: 1; }
                }
                tr:hover {
                    background-color: #1e293b !important;
                }
            `}</style>
        </div>
    );
};

export default FinancialSincerityInbox;
