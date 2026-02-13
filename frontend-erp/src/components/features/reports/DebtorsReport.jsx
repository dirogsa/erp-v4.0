import React, { useState, useEffect } from 'react';
import PrintableModal from '../../common/receipt/PrintableModal';
import DualReceiptWrapper from '../../common/receipt/DualReceiptWrapper';
import { analyticsService, salesService, staffService } from '../../../services/api';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import { useCompany } from '../../../context/CompanyContext'; // Import Context
import Button from '../../common/Button';

const DebtorsReportPrintable = ({
    reportData,
    activeCompany,
    formatCurrency,
    formatDate,
    selectedCustomer,
    format = 'A5_SINGLE',
    staff = []
}) => {
    const companyName = activeCompany?.name || 'Empresa';
    const companyRuc = activeCompany?.ruc || '-';
    const bankName = activeCompany?.bank_name || '-';
    const accountSoles = activeCompany?.account_soles || '-';
    const accountDollars = activeCompany?.account_dollars || '-';

    // Grouping items by currency
    const groupedItems = reportData.items.reduce((acc, item) => {
        const curr = item.currency || 'PEN';
        if (!acc[curr]) acc[curr] = [];
        acc[curr].push(item);
        return acc;
    }, {});

    const designColors = {
        primary: '#1e293b',
        secondary: '#64748b',
        border: '#e2e8f0',
        accent: '#0f172a',
        background: '#f8fafc',
        success: '#10b981'
    };

    const CurrencySection = ({ currency, items }) => {
        const symbol = currency === 'USD' ? '$' : 'S/';
        const totalAmount = items.reduce((sum, i) => sum + (i.total_amount || 0), 0);
        const totalPaid = items.reduce((sum, i) => sum + (i.amount_paid || 0), 0);
        const totalBalance = items.reduce((sum, i) => sum + (i.balance || 0), 0);

        return (
            <div style={{ marginBottom: '2rem' }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.8rem',
                    padding: '0 0.2rem'
                }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', color: designColors.secondary }}>
                        Detalle en {currency === 'USD' ? 'Dólares' : 'Soles'}
                    </span>
                    <div style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: designColors.background,
                        border: `1px solid ${designColors.border}`,
                        borderRadius: '0.4rem',
                        textAlign: 'right',
                        minWidth: '160px'
                    }}>
                        <div style={{ fontSize: '0.6rem', fontWeight: '700', color: designColors.secondary, textTransform: 'uppercase', marginBottom: '2px' }}>Total Pendiente</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: '800', color: designColors.accent, lineHeight: '1' }}>
                            {formatCurrency(totalBalance, symbol)}
                        </div>
                    </div>
                </div>

                <table className="report-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr>
                            <th style={{ textAlign: 'left' }}>N° Doc..</th>
                            <th style={{ textAlign: 'center' }}>F. Venc.</th>
                            <th style={{ textAlign: 'right' }}>Total</th>
                            <th style={{ textAlign: 'right' }}>Abono</th>
                            <th style={{ textAlign: 'right' }}>Saldo</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, index) => (
                            <tr key={index}>
                                <td style={{ fontWeight: '500' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        {item.sunat_number || item.invoice_number}
                                        {item.amount_paid > 0 && (
                                            <span style={{
                                                fontSize: '7px',
                                                backgroundColor: '#d1fae5',
                                                color: '#065f46',
                                                padding: '1px 3px',
                                                borderRadius: '2px',
                                                fontWeight: '800'
                                            }}>PARCIAL</span>
                                        )}
                                    </div>
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                    {item.due_date ? formatDate(item.due_date) : '-'}
                                </td>
                                <td style={{ textAlign: 'right', color: designColors.secondary }}>
                                    {formatCurrency(item.total_amount, symbol)}
                                </td>
                                <td style={{ textAlign: 'right', color: designColors.success, fontWeight: '500' }}>
                                    {item.amount_paid > 0 ? formatCurrency(item.amount_paid, symbol) : '-'}
                                </td>
                                <td style={{ textAlign: 'right', fontWeight: '700' }}>
                                    {formatCurrency(item.balance, symbol)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colSpan={4} style={{
                                padding: '0.6rem 0.5rem',
                                textAlign: 'right',
                                fontSize: '0.6rem',
                                fontWeight: '600',
                                color: designColors.secondary,
                                textTransform: 'uppercase'
                            }}>Total Sección</td>
                            <td style={{
                                padding: '0.6rem 0.5rem',
                                textAlign: 'right',
                                fontSize: '0.85rem',
                                fontWeight: '700',
                                color: designColors.secondary,
                                borderTop: `1px solid ${designColors.border}`,
                                whiteSpace: 'nowrap'
                            }}>
                                {formatCurrency(totalBalance, symbol)}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        );
    };

    return (
        <div className={`receipt-content ${format === 'A4_FULL' ? 'format-a4-full' : ''}`} style={{ color: designColors.primary, fontFamily: "'Inter', system-ui, sans-serif" }}>
            {/* Header - Focus on Receptor */}
            <div style={{ padding: '0 0 1.5rem 0' }} className="print-header">
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    borderBottom: `2px solid ${designColors.accent}`,
                    paddingBottom: '0.8rem',
                    marginBottom: '1.5rem'
                }}>
                    <h1 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0, color: designColors.accent, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                        Estado de Cuenta
                    </h1>
                    <div style={{ fontSize: '0.75rem', fontWeight: '500', color: designColors.secondary }}>
                        Fecha de Emisión: <span style={{ color: designColors.primary, fontWeight: '600' }}>{formatDate(new Date())}</span>
                    </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.6rem', fontWeight: '700', color: designColors.secondary, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Receptor / Cliente</div>
                    {reportData.items.length > 0 ? (
                        <div>
                            <div style={{ fontSize: '0.9rem', fontWeight: '700', color: designColors.accent, lineHeight: '1.1' }}>
                                {reportData.items[0].customer_name}
                            </div>
                            <div style={{ fontSize: '0.75rem', fontWeight: '600', color: designColors.secondary, marginTop: '2px' }}>
                                RUC: {reportData.items[0].customer_ruc}
                            </div>
                        </div>
                    ) : (
                        <div style={{ fontSize: '0.8rem', color: designColors.secondary }}>Sin documentos pendientes</div>
                    )}
                </div>
            </div>

            <style>{`
                /* Garantizar sincronía entre vista previa y PDF */
                .receipt-half {
                    overflow: visible !important;
                    height: auto !important;
                    min-height: 210mm !important;
                }
                
                @media print {
                    .receipt-half {
                        height: 210mm !important;
                        overflow: hidden !important;
                    }
                    .report-table { width: 100% !important; border-collapse: collapse !important; }
                    .report-table th {
                        padding: 8px 6px !important;
                        font-size: 8px !important;
                        text-transform: uppercase !important;
                        border-bottom: 1.5px solid ${designColors.accent} !important;
                        color: ${designColors.secondary} !important;
                        font-weight: 700 !important;
                        text-align: left;
                    }
                    .report-table td {
                        padding: 8px 6px !important;
                        font-size: 9px !important;
                        border-bottom: 1px solid ${designColors.border} !important;
                    }
                    .report-table tr:nth-child(even) { background-color: ${designColors.background} !important; }
                }
            `}</style>

            {/* Currency Sections */}
            {Object.keys(groupedItems).sort().map(curr => (
                <CurrencySection key={curr} currency={curr} items={groupedItems[curr]} />
            ))}

            {/* Footer - Payment Channels & Emisor */}
            <div className="print-footer" style={{ marginTop: '1.5rem' }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1.2fr 0.8fr',
                    gap: '2rem',
                    padding: '1.5rem',
                    borderRadius: '0.75rem',
                    backgroundColor: designColors.background,
                    border: `1.5px solid ${designColors.border}`
                }}>
                    <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: '800', color: designColors.accent, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem', borderBottom: `2px solid ${designColors.accent}`, paddingBottom: '4px' }}>
                            Canales de Pago Autorizados
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <div style={{ fontSize: '0.65rem', fontWeight: '600', color: designColors.secondary, textTransform: 'uppercase' }}>Emisor del Comprobante</div>
                            <div style={{ fontSize: '0.9rem', fontWeight: '700', color: designColors.accent }}>{companyName}</div>
                            <div style={{ fontSize: '0.75rem', fontWeight: '600', color: designColors.secondary }}>RUC: {companyRuc}</div>
                        </div>

                        <div style={{ fontSize: '0.75rem', lineHeight: '1.6' }}>
                            <div style={{ display: 'flex', borderBottom: `1px dashed ${designColors.border}`, padding: '4px 0' }}>
                                <span style={{ fontWeight: '700', width: '90px', color: designColors.secondary }}>BANCO:</span>
                                <span style={{ fontWeight: '700' }}>{bankName}</span>
                            </div>
                            <div style={{ display: 'flex', borderBottom: `1px dashed ${designColors.border}`, padding: '4px 0' }}>
                                <span style={{ fontWeight: '700', width: '90px', color: designColors.secondary }}>CTA SOLES:</span>
                                <span style={{ fontWeight: '800', letterSpacing: '0.5px' }}>{accountSoles}</span>
                            </div>
                            <div style={{ display: 'flex', padding: '4px 0' }}>
                                <span style={{ fontWeight: '700', width: '90px', color: designColors.secondary }}>CTA DOLARES:</span>
                                <span style={{ fontWeight: '800', letterSpacing: '0.5px' }}>{accountDollars}</span>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', borderLeft: `2px solid ${designColors.border}`, paddingLeft: '1.5rem' }}>
                        <p style={{ fontSize: '0.8rem', color: designColors.accent, textAlign: 'center', margin: '0 0 1rem 0', fontWeight: '600', lineHeight: '1.4' }}>
                            "Favor enviar el comprobante para regularizar su saldo al correo:"
                        </p>
                        <div style={{
                            textAlign: 'center',
                            padding: '0.75rem',
                            backgroundColor: designColors.accent,
                            borderRadius: '0.4rem',
                            fontSize: '0.9rem',
                            fontWeight: '800',
                            color: '#fff',
                            letterSpacing: '0.5px'
                        }}>
                            {(() => {
                                const dept = activeCompany?.departments?.find(d => d.name.toLowerCase().includes('cobranza'));
                                if (dept?.staff_id) {
                                    const member = staff.find(s => s._id === dept.staff_id);
                                    if (member?.email) return member.email.toLowerCase();
                                }
                                return (activeCompany?.email || 'ventas@empresa.com').toLowerCase();
                            })()}
                        </div>
                    </div>
                </div>

                {/* Signature Area */}
                <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '2.5rem' }}>
                    <div style={{ textAlign: 'center', width: '160px' }}>
                        <div style={{ borderBottom: `1.5px solid ${designColors.accent}`, marginBottom: '0.5rem' }}></div>
                        <div style={{ fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase', color: designColors.secondary }}>Dept. Cobranzas</div>
                    </div>
                    <div style={{ textAlign: 'center', width: '160px' }}>
                        <div style={{ borderBottom: `1.5px solid ${designColors.accent}`, marginBottom: '0.5rem' }}></div>
                        <div style={{ fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase', color: designColors.secondary }}>Aceptación Cliente</div>
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

    const { data: staff = [] } = useQuery({
        queryKey: ['staff', 'active'],
        queryFn: () => staffService.getStaff({ active_only: true }).then(res => res.data),
        enabled: visible
    });

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
                        staff={staff}
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
