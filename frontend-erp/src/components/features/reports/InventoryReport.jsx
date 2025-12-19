import React, { useState, useEffect } from 'react';
import ReportViewerModal from './ReportViewerModal';
import { analyticsService } from '../../../services/api';
import { formatCurrency } from '../../../utils/formatters';

const InventoryReport = ({ visible, onClose }) => {
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

    return (
        <ReportViewerModal
            visible={visible}
            onClose={onClose}
            title="Valorización de Inventario"
        >
            {reportData ? (
                <>
                    <div style={{ marginBottom: '1rem', fontWeight: 'bold' }}>
                        Total Productos: {reportData.product_count}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                        <div style={{ padding: '1rem', backgroundColor: '#f0f9ff', borderRadius: '0.5rem', border: '1px solid #bae6fd' }}>
                            <div style={{ fontSize: '0.875rem', color: '#0369a1' }}>Valor Total (Costo)</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#0c4a6e' }}>
                                {formatCurrency(reportData.total_cost_value)}
                            </div>
                        </div>
                        <div style={{ padding: '1rem', backgroundColor: '#f0fdf4', borderRadius: '0.5rem', border: '1px solid #bbf7d0' }}>
                            <div style={{ fontSize: '0.875rem', color: '#15803d' }}>Valor Total (Venta Retail)</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#14532d' }}>
                                {formatCurrency(reportData.total_retail_value)}
                            </div>
                        </div>
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f8fafc' }}>
                                <th style={{ textAlign: 'left', padding: '0.75rem', borderBottom: '2px solid #000' }}>SKU</th>
                                <th style={{ textAlign: 'left', padding: '0.75rem', borderBottom: '2px solid #000' }}>Producto</th>
                                <th style={{ textAlign: 'center', padding: '0.75rem', borderBottom: '2px solid #000' }}>Stock</th>
                                <th style={{ textAlign: 'right', padding: '0.75rem', borderBottom: '2px solid #000' }}>Costo Unit.</th>
                                <th style={{ textAlign: 'right', padding: '0.75rem', borderBottom: '2px solid #000' }}>Total Costo</th>
                                <th style={{ textAlign: 'right', padding: '0.75rem', borderBottom: '2px solid #000' }}>Precio Unit.</th>
                                <th style={{ textAlign: 'right', padding: '0.75rem', borderBottom: '2px solid #000' }}>Total Venta</th>
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
                                    <td style={{ padding: '0.5rem', borderBottom: '1px solid #e2e8f0', textAlign: 'right', fontWeight: '500' }}>
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
                    </table>
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
