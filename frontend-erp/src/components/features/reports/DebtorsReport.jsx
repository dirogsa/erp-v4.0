import React, { useState, useEffect } from 'react';
import PrintableModal from '../../common/receipt/PrintableModal';
import DualReceiptWrapper from '../../common/receipt/DualReceiptWrapper';
import { analyticsService, salesService } from '../../../services/api';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import { useCompany } from '../../../context/CompanyContext'; // Import Context
import Button from '../../common/Button';

const DebtorsReportPrintable = ({
    reportData,
    activeCompany,
    formatCurrency,
    formatDate,
    selectedCustomer,
    format = 'A5_SINGLE' // Injected by DualReceiptWrapper or PrintableModal
}) => {
    const companyName = activeCompany?.name || 'Empresa';
    const companyRuc = activeCompany?.ruc || '-';
    const bankName = activeCompany?.bank_name || '-';
    const accountSoles = activeCompany?.account_soles || '-';
    const accountDollars = activeCompany?.account_dollars || '-';

    return (
        <div className={`receipt-content ${format === 'A4_FULL' ? 'format-a4-full' : ''}`}>
            {/* Header - A5 Optimized */}
            <div style={{ padding: '0 0 1rem 0' }} className="print-header">
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '2.5px solid #000',
                    paddingBottom: '0.6rem',
                    marginBottom: '1rem'
                }}>
                    <div>
                        <h1 style={{ fontSize: '1.4rem', fontWeight: '900', margin: 0, color: '#000', letterSpacing: '-0.5px' }}>
                            ESTADO DE CUENTA
                        </h1>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#000' }}>
                            {formatDate(new Date())}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: '1rem', alignItems: 'center' }}>
                    {reportData.items.length > 0 ? (
                        <div>
                            <div style={{ fontSize: '0.65rem', fontWeight: '800', color: '#666', textTransform: 'uppercase', marginBottom: '2px' }}>Cliente</div>
                            <div style={{ fontSize: '1.15rem', fontWeight: '900', color: '#000', lineHeight: '1.1' }}>
                                {reportData.items[0].customer_name}
                            </div>
                            <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#444', marginTop: '4px' }}>
                                RUC: {reportData.items[0].customer_ruc}
                            </div>
                        </div>
                    ) : (
                        <div style={{ fontSize: '1rem', fontWeight: '700' }}>Sin saldos pendientes</div>
                    )}

                    <div style={{
                        padding: '0.6rem 1rem',
                        border: '2px solid #000',
                        borderRadius: '0.4rem',
                        backgroundColor: '#111',
                        color: 'white',
                        textAlign: 'right'
                    }}>
                        <div style={{ fontSize: '0.6rem', fontWeight: '800', textTransform: 'uppercase', opacity: 0.8, marginBottom: '2px' }}>Total Pendiente</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: '950', lineHeight: '1' }}>
                            {formatCurrency(reportData.total_receivable)}
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @media print {
                    .report-table {
                        width: 100% !important;
                        border-collapse: collapse !important;
                        margin-top: 1rem !important;
                        color: #000 !important;
                    }
                    .report-table th {
                        padding: 8px 6px !important;
                        font-size: 8.5px !important;
                        text-transform: uppercase !important;
                        border-bottom: 2px solid #000 !important;
                        font-weight: 800 !important;
                        text-align: left;
                    }
                    .report-table td {
                        padding: 8px 6px !important;
                        font-size: 9px !important;
                        border-bottom: 1px solid #ddd !important;
                    }
                    .report-table tr:nth-child(even) {
                        background-color: #f9f9f9 !important;
                    }
                }
            `}</style>

            <table className="report-table" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '0.5rem' }}>
                <thead>
                    <tr>
                        {!selectedCustomer && <th style={{ textAlign: 'left' }}>Cliente</th>}
                        <th style={{ textAlign: 'left' }}>N° Documento</th>
                        <th style={{ textAlign: 'center' }}>F. Venc.</th>
                        <th style={{ textAlign: 'right' }}>Saldo Pendiente</th>
                    </tr>
                </thead>
                <tbody>
                    {reportData.items.map((item, index) => (
                        <tr key={index}>
                            {!selectedCustomer && (
                                <td style={{ fontWeight: '700' }}>{item.customer_name}</td>
                            )}
                            <td style={{ fontFamily: 'monospace', fontWeight: '600' }}>
                                {item.sunat_number || item.invoice_number}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                                {item.due_date ? formatDate(item.due_date) : '-'}
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: '900', fontSize: '10px' }}>
                                {formatCurrency(item.balance)}
                            </td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr>
                        <td colSpan={selectedCustomer ? 2 : 3} style={{
                            padding: '1rem 0.6rem',
                            textAlign: 'right',
                            fontSize: '0.85rem',
                            fontWeight: '800'
                        }}>TOTAL GENERAL ACUMULADO</td>
                        <td style={{
                            padding: '1rem 0.6rem',
                            textAlign: 'right',
                            fontSize: '1.2rem',
                            fontWeight: '950',
                            borderTop: '2.5px solid #000'
                        }}>
                            {formatCurrency(reportData.total_receivable)}
                        </td>
                    </tr>
                </tfoot>
            </table>

            {/* Footer - Optimized A5 Space */}
            <div className="print-footer" style={{ marginTop: 'auto', paddingTop: '2.5rem', color: '#000' }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1.2fr 0.8fr',
                    gap: '1.5rem',
                    padding: '1.2rem',
                    border: '2px solid #000',
                    borderRadius: '0.5rem',
                    backgroundColor: '#fff'
                }}>
                    <div>
                        <div style={{ fontSize: '0.8rem', fontWeight: '900', color: '#000', textTransform: 'uppercase', marginBottom: '0.8rem', borderBottom: '2px solid #000', paddingBottom: '4px' }}>
                            Canales de Pago Autorizados
                        </div>

                        <div style={{ marginBottom: '0.6rem' }}>
                            <div style={{ fontSize: '0.9rem', fontWeight: '950', color: '#000' }}>{companyName}</div>
                            <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#000' }}>RUC: {companyRuc}</div>
                        </div>

                        <div style={{ fontSize: '0.75rem', lineHeight: '1.4', color: '#000' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1px' }}>
                                <span style={{ fontWeight: '900', width: '75px', flexShrink: 0, fontSize: '0.65rem' }}>BANCO:</span>
                                <span style={{ fontWeight: '800' }}>{bankName}</span>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1px' }}>
                                <span style={{ fontWeight: '900', width: '75px', flexShrink: 0, fontSize: '0.65rem' }}>CTA SOLES:</span>
                                <span style={{ fontFamily: 'monospace', fontWeight: '900', fontSize: '0.85rem' }}>{accountSoles}</span>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <span style={{ fontWeight: '900', width: '75px', flexShrink: 0, fontSize: '0.65rem' }}>CTA DOLARES:</span>
                                <span style={{ fontFamily: 'monospace', fontWeight: '900', fontSize: '0.85rem' }}>{accountDollars}</span>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', borderLeft: '2px solid #eee', paddingLeft: '1.5rem' }}>
                        <p style={{ fontSize: '0.85rem', fontStyle: 'italic', color: '#000', textAlign: 'center', margin: '0 0 0.8rem 0', fontWeight: '700', lineHeight: '1.4' }}>
                            "Favor enviar el comprobante de pago al siguiente correo para regularizar su saldo"
                        </p>
                        <div style={{
                            textAlign: 'center',
                            padding: '0.6rem',
                            backgroundColor: '#000',
                            borderRadius: '0.3rem',
                            fontSize: '0.95rem',
                            fontWeight: '900',
                            color: '#fff'
                        }}>
                            {(() => {
                                const dept = activeCompany?.departments?.find(d => d.name.toLowerCase().includes('cobranza'));
                                return dept?.lead_email || activeCompany?.email || 'ventas@empresa.com';
                            })()}
                        </div>
                    </div>
                </div>

                {/* Signature Area */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4rem', padding: '0 1rem' }}>
                    <div style={{ textAlign: 'center', width: '180px' }}>
                        <div style={{ borderBottom: '2.5px solid #000', marginBottom: '0.6rem' }}></div>
                        <div style={{ fontSize: '0.75rem', fontWeight: '900', textTransform: 'uppercase', color: '#000' }}>DEPT. COBRANZAS</div>
                    </div>
                    <div style={{ textAlign: 'center', width: '180px' }}>
                        <div style={{ borderBottom: '2.5px solid #000', marginBottom: '0.6rem' }}></div>
                        <div style={{ fontSize: '0.75rem', fontWeight: '900', textTransform: 'uppercase', color: '#000' }}>ACEPTACIÓN CLIENTE</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

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

    return (
        <PrintableModal
            visible={visible}
            onClose={onClose}
            title="Estado de Cuenta por Cliente"
        >
            <div className="no-print" style={{
                marginBottom: '1rem',
                padding: '1.5rem',
                backgroundColor: 'white',
                borderRadius: '0.75rem',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                display: 'flex',
                gap: '1.5rem',
                alignItems: 'end',
                border: '1px solid #e2e8f0'
            }}>
                <div style={{ flex: 1.5 }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#64748b', marginBottom: '0.5rem' }}>
                        Seleccionar Cliente
                    </label>
                    <select
                        value={selectedCustomer}
                        onChange={(e) => setSelectedCustomer(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.6rem',
                            border: '1px solid #cbd5e1',
                            borderRadius: '0.5rem',
                            fontSize: '0.9rem',
                            fontWeight: '600'
                        }}
                    >
                        <option value="">Todos los Clientes</option>
                        {customers.map(c => (
                            <option key={c.ruc} value={c.ruc}>{c.name}</option>
                        ))}
                    </select>
                </div>

                <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#64748b', marginBottom: '0.5rem' }}>
                        Filtrar por Estado
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.6rem',
                                border: '1px solid #cbd5e1',
                                borderRadius: '0.5rem',
                                fontSize: '0.9rem',
                                fontWeight: '600'
                            }}
                        >
                            <option value="pending">Solo Pendientes</option>
                            <option value="paid">Solo Pagados</option>
                            <option value="all">Todo el Historial</option>
                        </select>
                        <Button
                            onClick={generateReport}
                            disabled={loading}
                            style={{ whiteSpace: 'nowrap' }}
                        >
                            {loading ? '...' : 'Filtrar'}
                        </Button>
                    </div>
                </div>
            </div>

            {reportData ? (
                <DualReceiptWrapper>
                    <DebtorsReportPrintable
                        reportData={reportData}
                        activeCompany={activeCompany}
                        formatCurrency={formatCurrency}
                        formatDate={formatDate}
                        selectedCustomer={selectedCustomer}
                    />
                </DualReceiptWrapper>
            ) : (
                <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📄</div>
                    Generando estado de cuenta...
                </div>
            )}
        </PrintableModal>
    );
};

export default DebtorsReport;
