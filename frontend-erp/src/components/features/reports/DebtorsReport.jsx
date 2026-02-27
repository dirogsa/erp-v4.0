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
    const companyName = activeCompany?.name || 'ROJAS GARCIA JEEF GELDER';
    const companyRuc = activeCompany?.ruc || '10434346318';
    const companyAddress = activeCompany?.address || 'CAL.JOSE ORENGO NRO. 850 URB. EL TREBOL LIMA - LIMA - SAN LUIS';
    const companyTel = activeCompany?.phone || '+5114742827';

    const bankName = activeCompany?.bank_name || 'BCP';
    const accountSoles = activeCompany?.account_soles || '193-15439649-0-03';
    const accountDollars = activeCompany?.account_dollars || '193-18003034-1-82';

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
        success: '#10b981',
        tableHeader: '#f1f5f9'
    };

    const generationDateStr = new Date().toLocaleString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });

    const emissionDateStr = new Date().toLocaleDateString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });

    const CurrencySection = ({ currency, items }) => {
        const symbol = currency === 'USD' ? '$' : 'S/';
        const totalBalance = items.reduce((sum, i) => sum + (i.balance || 0), 0);

        return (
            <div style={{ marginBottom: '1.5rem' }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.5rem',
                    padding: '0 0.2rem'
                }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', color: designColors.secondary }}>
                        Detalle de Deuda en {currency === 'USD' ? 'Dólares' : 'Soles'}
                    </span>
                </div>

                <table className="report-table" style={{ width: '100%', borderCollapse: 'collapse', border: `1.5px solid ${designColors.accent}` }}>
                    <thead>
                        <tr style={{ backgroundColor: designColors.tableHeader }}>
                            <th style={{ textAlign: 'left', width: '30%' }}>CLIENTE/RUC</th>
                            <th style={{ textAlign: 'left', width: '15%' }}>DOC.</th>
                            <th style={{ textAlign: 'center', width: '12%' }}>EMISIÓN</th>
                            <th style={{ textAlign: 'center', width: '12%' }}>VENC.</th>
                            <th style={{ textAlign: 'right', width: '10%' }}>TOTAL</th>
                            <th style={{ textAlign: 'right', width: '10%' }}>ABONADO</th>
                            <th style={{ textAlign: 'right', width: '11%' }}>SALDO</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, index) => (
                            <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#fff' : designColors.background }}>
                                <td style={{ fontSize: '8px', lineHeight: '1.2' }}>
                                    <div style={{ fontWeight: '700', color: designColors.accent }}>{item.customer_name}</div>
                                    <div style={{ fontSize: '7px', color: designColors.secondary }}>{item.customer_ruc}</div>
                                </td>
                                <td style={{ fontWeight: '600', color: designColors.accent }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                        {item.sunat_number || item.invoice_number}
                                        {item.days_overdue > 0 && (
                                            <span style={{
                                                fontSize: '7px',
                                                color: '#e11d48',
                                                fontWeight: '800',
                                                textTransform: 'uppercase'
                                            }}>
                                                Vencido ({item.days_overdue} d)
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td style={{ textAlign: 'center', color: designColors.secondary }}>
                                    {formatDate(item.issue_date || item.created_at)}
                                </td>
                                <td style={{ textAlign: 'center', color: item.days_overdue > 0 ? '#e11d48' : designColors.secondary, fontWeight: item.days_overdue > 0 ? '700' : '400' }}>
                                    {item.due_date ? formatDate(item.due_date) : '-'}
                                </td>
                                <td style={{ textAlign: 'right', color: designColors.secondary }}>
                                    {formatCurrency(item.total_amount, symbol)}
                                </td>
                                <td style={{ textAlign: 'right', color: designColors.success, fontWeight: '500' }}>
                                    {item.amount_paid > 0 ? formatCurrency(item.amount_paid, symbol) : '-'}
                                </td>
                                <td style={{ textAlign: 'right', fontWeight: '800', color: designColors.accent }}>
                                    {formatCurrency(item.balance, symbol)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr style={{ borderTop: `2px solid ${designColors.accent}` }}>
                            <td colSpan={6} style={{
                                padding: '0.4rem 0.5rem',
                                textAlign: 'right',
                                fontSize: '0.7rem',
                                fontWeight: '800',
                                color: designColors.accent,
                                textTransform: 'uppercase'
                            }}>TOTAL:</td>
                            <td style={{
                                padding: '0.4rem 0.5rem',
                                textAlign: 'right',
                                fontSize: '0.85rem',
                                fontWeight: '900',
                                color: designColors.accent,
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
        <div className={`receipt-content ${format === 'A4_FULL' ? 'format-a4-full' : ''}`} style={{ color: designColors.primary, fontFamily: "'Inter', system-ui, sans-serif", padding: '10px' }}>
            {/* Main Title - Matches Image */}
            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                <h1 style={{ fontSize: '1.4rem', fontWeight: '900', margin: '0 0 2px 0', color: designColors.accent, letterSpacing: '-0.5px' }}>
                    Reporte de Cuentas por Cobrar
                </h1>
                <div style={{ fontSize: '0.7rem', fontWeight: '500', color: designColors.secondary }}>
                    Generado el {generationDateStr}
                </div>
            </div>

            {/* Header Split Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                {/* Left Side: Company & Banks */}
                <div style={{ flex: 1.5 }}>
                    <div style={{ marginBottom: '0.6rem' }}>
                        <div style={{ fontSize: '0.95rem', fontWeight: '900', color: designColors.accent, marginBottom: '2px', textTransform: 'uppercase' }}>
                            {companyName}
                        </div>
                        <div style={{ fontSize: '0.65rem', color: designColors.secondary, lineHeight: '1.2' }}>
                            <div style={{ fontWeight: '600' }}>RUC: {companyRuc}</div>
                            <div>{companyAddress}</div>
                            <div>Tel: {companyTel}</div>
                        </div>
                    </div>

                    <div style={{ marginBottom: '0.4rem' }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: '800', color: designColors.accent, marginBottom: '2px' }}>
                            Cuentas Bancarias ({bankName}):
                        </div>
                        <div style={{ fontSize: '0.75rem', color: designColors.accent, lineHeight: '1.2' }}>
                            <div>Soles: <span style={{ fontWeight: '700' }}>{accountSoles}</span></div>
                            <div>Dólares: <span style={{ fontWeight: '700' }}>{accountDollars}</span></div>
                        </div>
                    </div>

                    <div style={{ padding: '6px 10px', backgroundColor: '#eff6ff', borderRadius: '6px', border: '1px solid #dbeafe', display: 'inline-block' }}>
                        <div style={{ fontSize: '0.65rem', color: '#1e40af', fontWeight: '700', textTransform: 'uppercase', marginBottom: '2px' }}>
                            Instrucción de Pago:
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#1e3a8a', fontWeight: '500' }}>
                            Favor enviar el comprobante al correo:
                            <span style={{ fontWeight: '800', marginLeft: '4px' }}>jergff@msn.com</span>
                        </div>
                    </div>
                </div>

                {/* Right Side: Report Meta */}
                <div style={{ flex: 1, textAlign: 'right' }}>
                    <div style={{
                        fontSize: '0.8rem',
                        fontWeight: '900',
                        color: designColors.accent,
                        borderBottom: `2px solid ${designColors.accent}`,
                        display: 'inline-block',
                        paddingBottom: '2px',
                        marginBottom: '4px'
                    }}>
                        ESTADO DE CUENTA
                    </div>
                    <div style={{ fontSize: '0.6rem', fontWeight: '600', color: designColors.secondary }}>
                        Fecha de Emisión: <span style={{ color: designColors.accent }}>{emissionDateStr}</span>
                    </div>
                </div>
            </div>

            {/* Client Section - Boxed like in image */}
            <div style={{
                backgroundColor: '#fff',
                border: `1px solid ${designColors.secondary}20`,
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '1rem',
                boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
            }}>
                <div style={{ fontSize: '0.9rem', fontWeight: '800', color: designColors.accent, marginBottom: '4px' }}>Cliente:</div>
                <div style={{ fontSize: '1.2rem', fontWeight: '900', color: designColors.accent, textTransform: 'uppercase', lineHeight: '1' }}>
                    {reportData.items.length > 0 ? reportData.items[0].customer_name : 'SELECCIONAR CLIENTE'}
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: '600', color: designColors.secondary, marginTop: '2px' }}>
                    RUC: {reportData.items.length > 0 ? reportData.items[0].customer_ruc : '-'}
                </div>
            </div>

            <style>{`
                .report-table th {
                    padding: 6px 8px !important;
                    font-size: 8px !important;
                    text-transform: uppercase !important;
                    color: ${designColors.accent} !important;
                    font-weight: 800 !important;
                    border-bottom: 2px solid ${designColors.accent} !important;
                }
                .report-table td {
                    padding: 8px !important;
                    font-size: 9px !important;
                    border-bottom: 1px solid ${designColors.border} !important;
                }
                @media print {
                    .receipt-content { padding: 0 !important; }
                    .report-table { border: 2px solid ${designColors.accent} !important; }
                }
            `}</style>

            {/* Currency Sections */}
            {Object.keys(groupedItems).sort().map(curr => (
                <CurrencySection key={curr} currency={curr} items={groupedItems[curr]} />
            ))}

            {/* Footer - Signatures */}
            <div style={{ marginTop: 'auto', paddingTop: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '3rem' }}>

                    <div style={{ display: 'flex', gap: '3rem' }}>
                        <div style={{ textAlign: 'center', width: '150px' }}>
                            <div style={{ borderBottom: `1px solid ${designColors.secondary}`, marginBottom: '5px', height: '40px' }}></div>
                            <div style={{ fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase', color: designColors.secondary }}>Dept. Cobranzas</div>
                        </div>
                        <div style={{ textAlign: 'center', width: '150px' }}>
                            <div style={{ borderBottom: `1px solid ${designColors.secondary}`, marginBottom: '5px', height: '40px' }}></div>
                            <div style={{ fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase', color: designColors.secondary }}>Aceptación Cliente</div>
                        </div>
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
