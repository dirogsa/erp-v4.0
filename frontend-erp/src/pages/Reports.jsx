import React, { useState } from 'react';
import DebtorsReport from '../components/features/reports/DebtorsReport';
import SalesReport from '../components/features/reports/SalesReport';
import InventoryReport from '../components/features/reports/InventoryReport';

const Reports = () => {
    const [activeReport, setActiveReport] = useState(null);

    const reportOptions = [
        {
            id: 'debtors',
            title: 'Cuentas por Cobrar',
            description: 'Reporte detallado de clientes con saldos pendientes, antigüedad de deuda y totales.',
            icon: '📄',
            color: '#f59e0b'
        },
        {
            id: 'sales',
            title: 'Reporte de Ventas',
            description: 'Desglose de todas las facturas emitidas por rango de fecha. Ideal para contabilidad.',
            icon: '💰',
            color: '#10b981'
        },
        {
            id: 'inventory',
            title: 'Valorización de Inventario',
            description: 'Análisis del valor total de tu mercadería actual (Costo vs Venta).',
            icon: '📦',
            color: '#3b82f6'
        }
    ];

    return (
        <div style={{ padding: '2rem' }}>
            <div style={{ marginBottom: '3rem' }}>
                <h1 style={{ color: 'white', marginBottom: '0.5rem', fontSize: '2rem' }}>Centro de Reportes</h1>
                <p style={{ color: '#94a3b8' }}>Selecciona un reporte para generar, visualizar o imprimir.</p>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '2rem'
            }}>
                {reportOptions.map(option => (
                    <div
                        key={option.id}
                        onClick={() => setActiveReport(option.id)}
                        style={{
                            backgroundColor: '#1e293b',
                            padding: '2rem',
                            borderRadius: '1rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            border: '1px solid transparent'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-5px)';
                            e.currentTarget.style.borderColor = option.color;
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.borderColor = 'transparent';
                        }}
                    >
                        <div style={{
                            fontSize: '3rem',
                            marginBottom: '1.5rem',
                            backgroundColor: 'rgba(255,255,255,0.05)',
                            display: 'inline-block',
                            padding: '1rem',
                            borderRadius: '0.75rem'
                        }}>
                            {option.icon}
                        </div>
                        <h3 style={{ color: 'white', marginBottom: '0.75rem', fontSize: '1.25rem' }}>{option.title}</h3>
                        <p style={{ color: '#94a3b8', lineHeight: '1.6' }}>{option.description}</p>
                        <div style={{
                            marginTop: '1.5rem',
                            color: option.color,
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            Generar Reporte →
                        </div>
                    </div>
                ))}
            </div>

            {/* Config/View Modals */}
            <DebtorsReport
                visible={activeReport === 'debtors'}
                onClose={() => setActiveReport(null)}
            />
            <SalesReport
                visible={activeReport === 'sales'}
                onClose={() => setActiveReport(null)}
            />
            <InventoryReport
                visible={activeReport === 'inventory'}
                onClose={() => setActiveReport(null)}
            />
        </div>
    );
};

export default Reports;
