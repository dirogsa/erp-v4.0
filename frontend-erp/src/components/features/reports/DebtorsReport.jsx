import React, { useState, useEffect } from 'react';
import ReportViewerModal from './ReportViewerModal';
import { analyticsService, salesService } from '../../../services/api';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import { useCompany } from '../../../context/CompanyContext'; // Import Context
import Button from '../../common/Button';

const DebtorsReport = ({ visible, onClose }) => {
    const { activeCompany } = useCompany(); // Get active company
    const [loading, setLoading] = useState(false);
    const [customers, setCustomers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState('');
    const [statusFilter, setStatusFilter] = useState('pending');
    const [reportData, setReportData] = useState(null);

    // Load customers for filter
    useEffect(() => {
        if (visible) {
            loadCustomers();
            generateReport();
        }
    }, [visible]);

    const loadCustomers = async () => {
        try {
            const res = await salesService.getCustomers();
            setCustomers(res.data);
        } catch (error) {
            console.error("Error loading customers", error);
        }
    };

    const generateReport = async () => {
        setLoading(true);
        try {
            const res = await analyticsService.getDebtorsReport(selectedCustomer, statusFilter);
            setReportData(res.data);
        } catch (error) {
            console.error("Error generating report", error);
        } finally {
            setLoading(false);
        }
    };

    if (!visible) return null;

    // Fallback if no company selected (shouldn't happen usually)
    const companyName = activeCompany?.name || 'Empresa no seleccionada';
    const companyRuc = activeCompany?.ruc || '-';
    const companyAddress = activeCompany?.address || '-';
    const companyPhone = activeCompany?.phone || '-';
    const bankName = activeCompany?.bank_name || '-';
    const accountSoles = activeCompany?.account_soles || '-';
    const accountDollars = activeCompany?.account_dollars || '-';

    return (
        <ReportViewerModal
            visible={visible}
            onClose={onClose}
            title="Reporte de Cuentas por Cobrar"
        >
            {/* Filters - Hidden on Print */}
            <div className="no-print" style={{
                marginBottom: '2rem',
                padding: '1rem',
                backgroundColor: '#f1f5f9',
                borderRadius: '0.5rem',
                display: 'flex',
                gap: '1rem',
                alignItems: 'end'
            }}>
                <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                        Filtrar por Cliente
                    </label>
                    <select
                        value={selectedCustomer}
                        onChange={(e) => setSelectedCustomer(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.5rem',
                            border: '1px solid #cbd5e1',
                            borderRadius: '0.25rem'
                        }}
                    >
                        <option value="">Todos los Clientes</option>
                        {customers.map(c => (
                            <option key={c.ruc} value={c.ruc}>{c.name}</option>
                        ))}
                    </select>
                </div>
                {/* Status Filter */}
                <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                        Estado
                    </label>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.5rem',
                            border: '1px solid #cbd5e1',
                            borderRadius: '0.25rem'
                        }}
                    >
                        <option value="pending">Pendientes de Pago</option>
                        <option value="paid">Pagados / Completos</option>
                        <option value="all">Todos (Historial)</option>
                    </select>
                </div>

                <Button onClick={generateReport} disabled={loading}>
                    {loading ? 'Generando...' : 'Actualizar'}
                </Button>
            </div>

            {/* Report Table */}
            {reportData ? (

                <>
                    {/* Print Header (Visible on print) */}
                    <div style={{ marginBottom: '2rem', display: 'none' }} className="print-header">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '2rem' }}>
                            <div>
                                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>{companyName}</h1>
                                <p style={{ margin: 0, fontSize: '0.9rem' }}>RUC: {companyRuc}</p>
                                <p style={{ margin: 0, fontSize: '0.9rem' }}>{companyAddress}</p>
                                <p style={{ margin: 0, fontSize: '0.9rem' }}>Tel: {companyPhone}</p>
                                <div style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                                    <strong>Cuentas Bancarias ({bankName}):</strong>
                                    <div>Soles: {accountSoles}</div>
                                    <div>Dólares: {accountDollars}</div>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <h2 style={{ fontSize: '1.25rem', margin: '0 0 0.5rem 0', color: '#0f172a' }}>ESTADO DE CUENTA</h2>
                                <p style={{ margin: 0, fontSize: '0.9rem' }}>Fecha de Emisión: {new Date().toLocaleDateString('es-PE')}</p>
                            </div>
                        </div>

                        {selectedCustomer && reportData.items.length > 0 && (
                            <div style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }}>
                                <strong style={{ display: 'block', marginBottom: '0.5rem' }}>Cliente:</strong>
                                <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{reportData.items[0].customer_name}</div>
                                <div>RUC: {reportData.items[0].customer_ruc}</div>
                            </div>
                        )}
                    </div>
                    {/* Add print CSS for this specific header */}
                    <style>{`
                        @media print {
                            .print-header {
                                display: block !important;
                            }
                            .print-footer {
                                display: flex !important;
                            }
                        }
                    `}</style>

                    <div style={{ marginBottom: '1rem', fontWeight: 'bold' }} className="no-print">
                        Resumen: Se encontraron {reportData.items.length} documentos.
                    </div>

                    {/* CSS for narrow print layout */}
                    <style>{`
                        @media print {
                            .report-table th, .report-table td {
                                padding: 1px 2px !important;
                                font-size: 9px !important;
                                line-height: 1.1 !important;
                            }
                            .report-table th {
                                font-size: 8px !important;
                                text-transform: uppercase;
                                letter-spacing: -0.5px;
                            }
                            .print-header h1 { font-size: 14px !important; margin-bottom: 2px !important; }
                            .print-header h2 { font-size: 12px !important; margin-bottom: 2px !important; }
                            .print-header p { font-size: 9px !important; margin: 0 !important; }
                            @page {
                                margin: 0.3cm;
                            }
                            .customer-col {
                                /* Width handled by colgroup */
                            }
                        }
                    `}</style>
                    <table className="report-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', tableLayout: 'fixed' }}>
                        <colgroup>
                            <col style={{ width: '30%' }} />
                            <col style={{ width: '15%' }} />
                            <col style={{ width: '10%' }} />
                            <col style={{ width: '10%' }} />
                            <col style={{ width: '12%' }} />
                            <col style={{ width: '10%' }} />
                            <col style={{ width: '13%' }} />
                        </colgroup>
                        <thead>
                            <tr style={{ backgroundColor: '#f8fafc' }}>
                                <th className="customer-col" style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '2px solid #000', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>Cliente/RUC</th>
                                <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '2px solid #000' }}>Doc.</th>
                                <th style={{ textAlign: 'center', padding: '0.5rem', borderBottom: '2px solid #000' }}>Emisión</th>
                                <th style={{ textAlign: 'center', padding: '0.5rem', borderBottom: '2px solid #000' }}>Venc.</th>
                                <th style={{ textAlign: 'right', padding: '0.5rem', borderBottom: '2px solid #000' }}>Total</th>
                                <th style={{ textAlign: 'right', padding: '0.5rem', borderBottom: '2px solid #000' }}>Abonado</th>
                                <th style={{ textAlign: 'right', padding: '0.5rem', borderBottom: '2px solid #000' }}>Saldo</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportData.items.map((item, index) => (
                                <tr key={index}>
                                    <td className="customer-col" style={{ padding: '0.4rem', borderBottom: '1px solid #e2e8f0' }}>
                                        <div style={{ fontWeight: '600', fontSize: 'inherit', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.customer_name}</div>
                                        <div style={{ fontSize: '0.75em', color: '#64748b' }}>{item.customer_ruc}</div>
                                    </td>
                                    <td style={{ padding: '0.4rem', borderBottom: '1px solid #e2e8f0' }}>
                                        {item.sunat_number || item.invoice_number}
                                    </td>
                                    <td style={{ padding: '0.4rem', borderBottom: '1px solid #e2e8f0', textAlign: 'center' }}>
                                        {formatDate(item.issue_date)}
                                    </td>
                                    <td style={{ padding: '0.4rem', borderBottom: '1px solid #e2e8f0', textAlign: 'center' }}>
                                        {item.due_date ? formatDate(item.due_date) : '-'}
                                    </td>
                                    <td style={{ padding: '0.4rem', borderBottom: '1px solid #e2e8f0', textAlign: 'right' }}>
                                        {formatCurrency(item.total_amount)}
                                    </td>
                                    <td style={{ padding: '0.4rem', borderBottom: '1px solid #e2e8f0', textAlign: 'right', color: '#64748b' }}>
                                        {formatCurrency(item.amount_paid)}
                                    </td>
                                    <td style={{ padding: '0.4rem', borderBottom: '1px solid #e2e8f0', textAlign: 'right', fontWeight: 'bold' }}>
                                        {formatCurrency(item.balance)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr style={{ backgroundColor: '#f1f5f9', fontWeight: 'bold', borderTop: '2px solid #000' }}>
                                <td colSpan={6} style={{ padding: '1rem', textAlign: 'right' }}>TOTAL:</td>
                                <td style={{ padding: '1rem', textAlign: 'right', fontSize: '1.25rem' }}>
                                    {formatCurrency(reportData.total_receivable)}
                                </td>
                            </tr>
                        </tfoot>
                    </table>

                    {/* Signature lines for print */}
                    <div className="print-footer" style={{ display: 'none', marginTop: '4rem', justifyContent: 'space-between' }}>
                        <div style={{ textAlign: 'center', borderTop: '1px solid #000', width: '200px', paddingTop: '0.5rem' }}>
                            Recibí Conforme
                        </div>
                        <div style={{ textAlign: 'center', borderTop: '1px solid #000', width: '200px', paddingTop: '0.5rem' }}>
                            Visto Bueno
                        </div>
                    </div>
                </>
            ) : (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                    Cargando datos...
                </div>
            )}
        </ReportViewerModal>
    );
};

export default DebtorsReport;
