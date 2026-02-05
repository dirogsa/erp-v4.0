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
    format = 'A5_SINGLE'
}) => {
    const companyName = activeCompany?.name || 'Empresa';
    const companyRuc = activeCompany?.ruc || '-';
    const bankName = activeCompany?.bank_name || '-';
    const accountSoles = activeCompany?.account_soles || '-';
    const accountDollars = activeCompany?.account_dollars || '-';

    // Design Tokens
    const colors = {
        primary: '#1e293b',    // Charcoal gray instead of pure black
        secondary: '#64748b',  // Slate gray for labels
        border: '#e2e8f0',     // Light gray for lines
        accent: '#0f172a',     // Darkest for emphasis
        background: '#f8fafc'  // Very light gray for fills
    };

    return (
        <div className={`receipt-content ${format === 'A4_FULL' ? 'format-a4-full' : ''}`} style={{ color: colors.primary, fontFamily: "'Inter', system-ui, sans-serif" }}>
            {/* Header */}
            <div style={{ padding: '0 0 1.5rem 0' }} className="print-header">
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    borderBottom: `1.5px solid ${colors.accent}`,
                    paddingBottom: '0.8rem',
                    marginBottom: '1.2rem'
                }}>
                    <h1 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0, color: colors.accent, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                        Estado de Cuenta
                    </h1>
                    <div style={{ fontSize: '0.75rem', fontWeight: '500', color: colors.secondary }}>
                        Generado el: <span style={{ color: colors.primary, fontWeight: '600' }}>{formatDate(new Date())}</span>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '2rem', alignItems: 'start' }}>
                    {reportData.items.length > 0 ? (
                        <div>
                            <div style={{ fontSize: '0.65rem', fontWeight: '700', color: colors.secondary, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Cliente</div>
                            <div style={{ fontSize: '1rem', fontWeight: '700', color: colors.accent, lineHeight: '1.2', maxWidth: '300px' }}>
                                {reportData.items[0].customer_name}
                            </div>
                            <div style={{ fontSize: '0.8rem', fontWeight: '500', color: colors.secondary, marginTop: '2px' }}>
                                RUC: <span style={{ color: colors.primary }}>{reportData.items[0].customer_ruc}</span>
                            </div>
                        </div>
                    ) : (
                        <div style={{ fontSize: '0.9rem', color: colors.secondary }}>Sin saldos pendientes</div>
                    )}

                    <div style={{
                        padding: '0.75rem 1.25rem',
                        border: `1px solid ${colors.border}`,
                        borderRadius: '0.5rem',
                        backgroundColor: colors.background,
                        textAlign: 'right'
                    }}>
                        <div style={{ fontSize: '0.6rem', fontWeight: '700', color: colors.secondary, textTransform: 'uppercase', marginBottom: '2px' }}>Total Pendiente</div>
                        <div style={{ fontSize: '1.4rem', fontWeight: '800', color: colors.accent, lineHeight: '1' }}>
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
                        margin-top: 0.5rem !important;
                    }
                    .report-table th {
                        padding: 10px 8px !important;
                        font-size: 8px !important;
                        text-transform: uppercase !important;
                        letter-spacing: 0.05em !important;
                        border-bottom: 1.5px solid ${colors.accent} !important;
                        color: ${colors.secondary} !important;
                        font-weight: 700 !important;
                        text-align: left;
                    }
                    .report-table td {
                        padding: 10px 8px !important;
                        font-size: 9px !important;
                        border-bottom: 1px solid ${colors.border} !important;
                        color: ${colors.primary} !important;
                    }
                    .report-table tr:nth-child(even) {
                        background-color: ${colors.background} !important;
                    }
                }
            `}</style>

            <table className="report-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr>
                        {!selectedCustomer && <th style={{ textAlign: 'left' }}>Cliente</th>}
                        <th style={{ textAlign: 'left' }}>N° Documento</th>
                        <th style={{ textAlign: 'center' }}>F. Vencimiento</th>
                        <th style={{ textAlign: 'right' }}>Saldo Pendiente</th>
                    </tr>
                </thead>
                <tbody>
                    {reportData.items.map((item, index) => (
                        <tr key={index}>
                            {!selectedCustomer && (
                                <td style={{ fontWeight: '600' }}>{item.customer_name}</td>
                            )}
                            <td style={{ fontWeight: '500' }}>
                                {item.sunat_number || item.invoice_number}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                                {item.due_date ? formatDate(item.due_date) : '-'}
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: '700' }}>
                                {formatCurrency(item.balance)}
                            </td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr>
                        <td colSpan={selectedCustomer ? 2 : 3} style={{
                            padding: '1.2rem 0.5rem',
                            textAlign: 'right',
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            color: colors.secondary,
                            textTransform: 'uppercase'
                        }}>Total General Acumulado</td>
                        <td style={{
                            padding: '1.2rem 0.5rem',
                            textAlign: 'right',
                            fontSize: '1.1rem',
                            fontWeight: '800',
                            color: colors.accent,
                            borderTop: `2px solid ${colors.accent}`
                        }}>
                            {formatCurrency(reportData.total_receivable)}
                        </td>
                    </tr>
                </tfoot>
            </table>

            {/* Footer */}
            <div className="print-footer" style={{ marginTop: '2rem', color: colors.primary }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1.2fr 0.8fr',
                    gap: '2rem',
                    padding: '1.25rem',
                    borderRadius: '0.75rem',
                    backgroundColor: colors.background,
                    border: `1px solid ${colors.border}`
                }}>
                    <div>
                        <div style={{ fontSize: '0.7rem', fontWeight: '700', color: colors.secondary, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.75rem', borderBottom: `1px solid ${colors.border}`, paddingBottom: '4px' }}>
                            Canales de Pago
                        </div>

                        <div style={{ marginBottom: '0.75rem' }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: '700', color: colors.accent }}>{companyName}</div>
                            <div style={{ fontSize: '0.7rem', fontWeight: '500', color: colors.secondary }}>RUC: {companyRuc}</div>
                        </div>

                        <div style={{ fontSize: '0.7rem', lineHeight: '1.6' }}>
                            <div style={{ display: 'flex', borderBottom: `1px dashed ${colors.border}`, padding: '2px 0' }}>
                                <span style={{ fontWeight: '600', width: '85px', color: colors.secondary }}>BANCO:</span>
                                <span style={{ fontWeight: '600' }}>{bankName}</span>
                            </div>
                            <div style={{ display: 'flex', borderBottom: `1px dashed ${colors.border}`, padding: '2px 0' }}>
                                <span style={{ fontWeight: '600', width: '85px', color: colors.secondary }}>CTA SOLES:</span>
                                <span style={{ fontWeight: '700', letterSpacing: '0.3px' }}>{accountSoles}</span>
                            </div>
                            <div style={{ display: 'flex', padding: '2px 0' }}>
                                <span style={{ fontWeight: '600', width: '85px', color: colors.secondary }}>CTA DOLARES:</span>
                                <span style={{ fontWeight: '700', letterSpacing: '0.3px' }}>{accountDollars}</span>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', borderLeft: `1px solid ${colors.border}`, paddingLeft: '1.5rem' }}>
                        <p style={{ fontSize: '0.75rem', color: colors.secondary, textAlign: 'center', margin: '0 0 1rem 0', fontWeight: '500', lineHeight: '1.4' }}>
                            Favor enviar el comprobante para regularizar su saldo a:
                        </p>
                        <div style={{
                            textAlign: 'center',
                            padding: '0.5rem',
                            backgroundColor: colors.accent,
                            borderRadius: '0.4rem',
                            fontSize: '0.85rem',
                            fontWeight: '700',
                            color: '#fff',
                            letterSpacing: '0.3px'
                        }}>
                            {(() => {
                                const dept = activeCompany?.departments?.find(d => d.name.toLowerCase().includes('cobranza'));
                                return (dept?.lead_email || activeCompany?.email || 'ventas@empresa.com').toLowerCase();
                            })()}
                        </div>
                    </div>
                </div>

                {/* Signature Area */}
                <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '4rem' }}>
                    <div style={{ textAlign: 'center', width: '160px' }}>
                        <div style={{ borderBottom: `1px solid ${colors.primary}`, marginBottom: '0.5rem', width: '100%' }}></div>
                        <div style={{ fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', color: colors.secondary }}>Dept. Cobranzas</div>
                    </div>
                    <div style={{ textAlign: 'center', width: '160px' }}>
                        <div style={{ borderBottom: `1px solid ${colors.primary}`, marginBottom: '0.5rem', width: '100%' }}></div>
                        <div style={{ fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', color: colors.secondary }}>Aceptación Cliente</div>
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
