import React, { useState, useEffect } from 'react';
import ReportViewerModal from './ReportViewerModal';
import { analyticsService } from '../../../services/api';
import { formatCurrency } from '../../../utils/formatters';
import { useCompany } from '../../../context/CompanyContext';

const InventoryReport = ({ visible, onClose }) => {
    const { activeCompany } = useCompany();
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState(null);

    useEffect(() => {
        if (visible) {
            generateReport();
        }
    }, [visible]);

    const generateReport = async () => {
        setLoading(true);
        try {
            const res = await analyticsService.getInventoryValuation();
            setReportData(res.data);
        } catch (error) {
            console.error("Error generating report", error);
        } finally {
            setLoading(false);
        }
    };

    if (!visible) return null;

    const companyName = activeCompany?.name || 'Empresa';
    const companyRuc = activeCompany?.ruc || '-';
    const companyAddress = activeCompany?.address || '-';

    return (
        <ReportViewerModal
            visible={visible}
            onClose={onClose}
            title="Valorización de Inventario"
        >
            {/* Header for Print */}
            <div style={{ marginBottom: '2rem', display: 'none', borderBottom: '2px solid #0f172a', paddingBottom: '1rem' }} className="print-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                        <h1 style={{ fontSize: '1.4rem', fontWeight: 'bold', margin: '0' }}>{companyName}</h1>
                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>RUC: {companyRuc}</p>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#444' }}>{companyAddress}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <h2 style={{ fontSize: '1.2rem', margin: '0', color: '#0f172a' }}>VALORIZACIÓN DE INVENTARIO</h2>
                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', color: '#666' }}>Fecha: {new Date().toLocaleDateString()}</p>
                    </div>
                </div>
            </div>

            <style>{`
                @media print {
                    .print-header { display: block !important; }
                    .no-print { display: none !important; }
                    .summary-cards { display: grid !important; grid-template-columns: 1fr 1fr !important; gap: 1rem !important; }
                    .report-table th, .report-table td {
                        padding: 4px 2px !important;
                        font-size: 9px !important;
                        border-bottom: 1px solid #e2e8f0 !important;
                    }
                    .report-table th { background-color: #f1f5f9 !important; -webkit-print-color-adjust: exact; }
                }
            `}</style>

            {reportData ? (
                <>
                    <div style={{ marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }} className="summary-cards">
                        <div style={{ padding: '1rem', backgroundColor: '#f0f9ff', borderRadius: '0.5rem', border: '1px solid #bae6fd' }}>
                            <div style={{ fontSize: '0.75rem', color: '#0369a1', textTransform: 'uppercase', fontWeight: 'bold' }}>Valor a Costo</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#0c4a6e' }}>
                                {formatCurrency(reportData.total_cost_value)}
                            </div>
                        </div>
                        <div style={{ padding: '1rem', backgroundColor: '#f0fdf4', borderRadius: '0.5rem', border: '1px solid #bbf7d0' }}>
                            <div style={{ fontSize: '0.75rem', color: '#15803d', textTransform: 'uppercase', fontWeight: 'bold' }}>Valor a Venta Retail</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#14532d' }}>
                                {formatCurrency(reportData.total_retail_value)}
                            </div>
                        </div>
                    </div>

                    <div style={{ marginBottom: '1rem', fontSize: '0.9rem' }} className="no-print">
                        Total de SKU en inventario: <strong>{reportData.product_count}</strong>
                    </div>

                    <table className="report-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f8fafc' }}>
                                <th style={{ textAlign: 'left', padding: '0.75rem', borderBottom: '2px solid #0f172a' }}>SKU</th>
                                <th style={{ textAlign: 'left', padding: '0.75rem', borderBottom: '2px solid #0f172a' }}>Producto</th>
                                <th style={{ textAlign: 'center', padding: '0.75rem', borderBottom: '2px solid #0f172a' }}>Stock</th>
                                <th style={{ textAlign: 'right', padding: '0.75rem', borderBottom: '2px solid #0f172a' }}>Costo U.</th>
                                <th style={{ textAlign: 'right', padding: '0.75rem', borderBottom: '2px solid #0f172a' }}>Subtotal Costo</th>
                                <th style={{ textAlign: 'right', padding: '0.75rem', borderBottom: '2px solid #0f172a' }}>Precio U.</th>
                                <th style={{ textAlign: 'right', padding: '0.75rem', borderBottom: '2px solid #0f172a' }}>Subtotal Venta</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportData.items.map((item, index) => (
                                <tr key={index}>
                                    <td style={{ padding: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>{item.sku}</td>
                                    <td style={{ padding: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>{item.name}</td>
                                    <td style={{ padding: '0.5rem', borderBottom: '1px solid #e2e8f0', textAlign: 'center' }}>{item.stock}</td>
                                    <td style={{ padding: '0.5rem', borderBottom: '1px solid #e2e8f0', textAlign: 'right' }}>
                                        {formatCurrency(item.unit_cost)}
                                    </td>
                                    <td style={{ padding: '0.5rem', borderBottom: '1px solid #e2e8f0', textAlign: 'right', fontWeight: '600' }}>
                                        {formatCurrency(item.total_cost)}
                                    </td>
                                    <td style={{ padding: '0.5rem', borderBottom: '1px solid #e2e8f0', textAlign: 'right', color: '#64748b' }}>
                                        {formatCurrency(item.unit_price)}
                                    </td>
                                    <td style={{ padding: '0.5rem', borderBottom: '1px solid #e2e8f0', textAlign: 'right', color: '#64748b' }}>
                                        {formatCurrency(item.total_retail)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr style={{ backgroundColor: '#f8fafc', fontWeight: 'bold' }}>
                                <td colSpan={4} style={{ padding: '1rem', textAlign: 'right' }}>TOTAL VALORIZACIÓN:</td>
                                <td style={{ padding: '1rem', textAlign: 'right', color: '#0c4a6e' }}>{formatCurrency(reportData.total_cost_value)}</td>
                                <td></td>
                                <td style={{ padding: '1rem', textAlign: 'right', color: '#14532d' }}>{formatCurrency(reportData.total_retail_value)}</td>
                            </tr>
                        </tfoot>
                    </table>

                    <div className="print-footer" style={{ display: 'none', marginTop: '3rem', textAlign: 'center', fontSize: '0.8rem', color: '#666', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
                        Documento generado automáticamente por el Sistema de Gestión ERP - {companyName}
                    </div>
                </>
            ) : (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                    Calculando valorización...
                </div>
            )}
        </ReportViewerModal>
    );
};

export default InventoryReport;
