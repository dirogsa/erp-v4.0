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
            description: 'Reporte detallado de clientes con saldos pendientes, antigüedad de deuda y totales proyectados.',
            icon: '📊',
            color: '#f59e0b',
            gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
        },
        {
            id: 'sales',
            title: 'Reporte de Ventas',
            description: 'Análisis profundo de facturación por periodos. Desglose detallado de IGV y montos netos.',
            icon: '📈',
            color: '#10b981',
            gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
        },
        {
            id: 'inventory',
            title: 'Valor de Inventario',
            description: 'Valorización total de stock a costo actual vs precio de venta sugerido. Análisis de merma.',
            icon: '📦',
            color: '#3b82f6',
            gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
        }
    ];

    return (
        <div style={{ padding: '2.5rem', minHeight: '100vh', backgroundColor: '#0f172a' }}>
            <style>{`
                @keyframes slideInUp {
                    from { transform: translateY(30px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .report-card:hover {
                    transform: translateY(-8px) scale(1.02);
                    box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.5);
                    background: rgba(30, 41, 59, 0.8) !important;
                }
                .report-card:hover .icon-box {
                    transform: scale(1.1) rotate(5deg);
                }
            `}</style>

            <div className="no-print">
                <header style={{ marginBottom: '4rem', animation: 'slideInUp 0.5s ease-out' }}>
                    <h1 style={{ color: 'white', marginBottom: '0.75rem', fontSize: '2.5rem', fontWeight: '900', letterSpacing: '-0.02em' }}>
                        Centro de Inteligencia <span style={{ color: '#3b82f6' }}>Analítica</span>
                    </h1>
                    <p style={{ color: '#94a3b8', fontSize: '1.1rem', maxWidth: '600px', lineHeight: '1.6' }}>
                        Genera reportes técnicos y financieros con precisión quirúrgica. Visualiza, exporta e imprime la salud de tu empresa.
                    </p>
                </header>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                    gap: '2.5rem',
                    animation: 'slideInUp 0.7s ease-out'
                }}>
                    {reportOptions.map(option => (
                        <div
                            key={option.id}
                            className="report-card"
                            onClick={() => setActiveReport(option.id)}
                            style={{
                                backgroundColor: 'rgba(30, 41, 59, 0.4)',
                                backdropFilter: 'blur(12px)',
                                padding: '2.5rem',
                                borderRadius: '1.5rem',
                                cursor: 'pointer',
                                transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                border: '1px solid rgba(255, 255, 255, 0.05)',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                        >
                            {/* Decorative Glow */}
                            <div style={{
                                position: 'absolute', top: '-50px', right: '-50px',
                                width: '150px', height: '150px',
                                background: option.color, filter: 'blur(100px)', opacity: 0.1,
                                borderRadius: '50%'
                            }} />

                            <div className="icon-box" style={{
                                fontSize: '2.5rem',
                                marginBottom: '2rem',
                                backgroundColor: 'rgba(15, 23, 42, 0.6)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '70px',
                                height: '70px',
                                borderRadius: '1.25rem',
                                border: `1px solid ${option.color}33`,
                                transition: 'all 0.3s'
                            }}>
                                {option.icon}
                            </div>

                            <h3 style={{ color: 'white', marginBottom: '1rem', fontSize: '1.5rem', fontWeight: '800' }}>
                                {option.title}
                            </h3>
                            <p style={{ color: '#94a3b8', lineHeight: '1.7', fontSize: '0.95rem', marginBottom: '2rem' }}>
                                {option.description}
                            </p>

                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                paddingTop: '1.5rem',
                                borderTop: '1px solid rgba(255, 255, 255, 0.05)'
                            }}>
                                <span style={{
                                    color: option.color,
                                    fontWeight: '700',
                                    fontSize: '0.9rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}>
                                    Ejecutar Análisis
                                </span>
                                <div style={{
                                    width: '32px', height: '32px', borderRadius: '50%',
                                    background: option.gradient, display: 'flex',
                                    alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1rem'
                                }}>
                                    →
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Modals con Renderizado Condicional para evitar sobrecarga */}
            {activeReport === 'debtors' && (
                <DebtorsReport
                    visible={true}
                    onClose={() => setActiveReport(null)}
                />
            )}
            {activeReport === 'sales' && (
                <SalesReport
                    visible={true}
                    onClose={() => setActiveReport(null)}
                />
            )}
            {activeReport === 'inventory' && (
                <InventoryReport
                    visible={true}
                    onClose={() => setActiveReport(null)}
                />
            )}
        </div>
    );
};

export default Reports;
