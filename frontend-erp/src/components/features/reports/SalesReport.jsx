import React, { useState, useEffect } from 'react';
import ReportViewerModal from './ReportViewerModal';
import { analyticsService } from '../../../services/api';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import Button from '../../common/Button';

const SalesReport = ({ visible, onClose }) => {
    const [loading, setLoading] = useState(false);

    // Default to current month
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

    const [startDate, setStartDate] = useState(firstDay.toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);
    const [reportData, setReportData] = useState(null);

    useEffect(() => {
        if (visible) {
            generateReport();
        }
    }, [visible]);

    const generateReport = async () => {
        setLoading(true);
        try {
            const res = await analyticsService.getSalesReport(startDate, endDate);
            setReportData(res.data);
        } catch (error) {
            console.error("Error generating report", error);
        } finally {
            setLoading(false);
        }
    };

    if (!visible) return null;

    return (
        <ReportViewerModal
            visible={visible}
            onClose={onClose}
            title="Reporte de Ventas Detallado"
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
                <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                        Desde
                    </label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        style={{ padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #cbd5e1' }}
                    />
                </div>
                <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                        Hasta
                    </label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        style={{ padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #cbd5e1' }}
                    />
                </div>
                <Button onClick={generateReport} disabled={loading}>
                    {loading ? 'Generando...' : 'Actualizar'}
                </Button>
            </div>

            {/* Report Table */}
            {reportData ? (
                <>
                    <div style={{ marginBottom: '1rem', fontWeight: 'bold' }}>
                        Periodo: {startDate} al {endDate} | Registros: {reportData.items.length}
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f8fafc' }}>
                                <th style={{ textAlign: 'left', padding: '0.75rem', borderBottom: '2px solid #000' }}>Fecha</th>
                                <th style={{ textAlign: 'left', padding: '0.75rem', borderBottom: '2px solid #000' }}>Documento</th>
                                <th style={{ textAlign: 'left', padding: '0.75rem', borderBottom: '2px solid #000' }}>Cliente</th>
                                <th style={{ textAlign: 'left', padding: '0.75rem', borderBottom: '2px solid #000' }}>Estado Pago</th>
                                <th style={{ textAlign: 'right', padding: '0.75rem', borderBottom: '2px solid #000' }}>Total (S/)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportData.items.map((item, index) => (
                                <tr key={index}>
                                    <td style={{ padding: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>{formatDate(item.date)}</td>
                                    <td style={{ padding: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>{item.sunat_number || item.invoice_number}</td>
                                    <td style={{ padding: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>{item.customer}</td>
                                    <td style={{ padding: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>
                                        <span style={{
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            backgroundColor: item.status === 'PAID' ? '#dcfce7' : '#fee2e2',
                                            color: item.status === 'PAID' ? '#166534' : '#991b1b',
                                            fontSize: '0.75rem'
                                        }}>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '0.5rem', borderBottom: '1px solid #e2e8f0', textAlign: 'right' }}>
                                        {formatCurrency(item.total)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr style={{ backgroundColor: '#f1f5f9', fontWeight: 'bold' }}>
                                <td colSpan={4} style={{ padding: '1rem', textAlign: 'right' }}>VENTA TOTAL:</td>
                                <td style={{ padding: '1rem', textAlign: 'right', fontSize: '1.1rem' }}>
                                    {formatCurrency(reportData.total_sales)}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </>
            ) : (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                    Cargando datos...
                </div>
            )}
        </ReportViewerModal>
    );
};

export default SalesReport;
