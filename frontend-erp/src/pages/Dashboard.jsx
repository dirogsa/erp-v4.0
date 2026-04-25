import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { formatCurrency } from '../utils/formatters';
import Loading from '../components/common/Loading';

const Dashboard = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        sales_month: 0,
        pending_orders: 0,
        low_stock_items: 0,
        backorder_count: 0,
        pending_b2b: 0,
        recent_shop_orders: 0,
        invoiced_not_dispatched: 0
    });

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const response = await api.get('/analytics/dashboard');
                setData(response.data);
            } catch (error) {
                console.error("Dashboard: Error fetching dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    if (loading) return <Loading />;

    const MetricTile = ({ label, value, subtext, color, icon, gradient }) => (
        <div style={{
            padding: '2rem',
            backgroundColor: 'rgba(30, 41, 59, 0.4)',
            backdropFilter: 'blur(12px)',
            borderRadius: '1.5rem',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            transition: 'all 0.3s ease',
            cursor: 'default',
            position: 'relative',
            overflow: 'hidden'
        }}
        onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-5px)';
            e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.6)';
        }}
        onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.4)';
        }}
        >
            <div style={{ 
                position: 'absolute', top: '-20px', right: '-20px', 
                width: '80px', height: '80px', background: color, 
                filter: 'blur(50px)', opacity: 0.15 
            }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <span style={{ 
                    fontSize: '1.25rem', padding: '0.5rem', background: 'rgba(15, 23, 42, 0.5)', 
                    borderRadius: '0.75rem', border: `1px solid ${color}33` 
                }}>{icon}</span>
                <span style={{
                    color: '#94a3b8',
                    fontSize: '0.75rem',
                    fontWeight: '800',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em'
                }}>
                    {label}
                </span>
            </div>
            <div style={{
                fontSize: '2.2rem',
                fontWeight: '900',
                color: 'white',
                lineHeight: '1',
                marginBottom: '0.5rem',
                letterSpacing: '-0.04em'
            }}>
                {value}
            </div>
            <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.8rem',
                color: '#64748b',
                fontWeight: '500'
            }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: color }}></div>
                {subtext}
            </div>
        </div>
    );

    return (
        <div style={{ padding: '2.5rem', maxWidth: '1400px', margin: '0 auto', backgroundColor: '#0f172a', minHeight: '100vh' }}>
            {/* Premium Header */}
            <header style={{
                marginBottom: '3rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div>
                    <h1 style={{ color: 'white', fontSize: '2.5rem', fontWeight: '900', margin: 0, letterSpacing: '-0.03em' }}>
                        Dashboard <span style={{ color: '#3b82f6' }}>Estratégico</span>
                    </h1>
                    <p style={{ color: '#64748b', fontSize: '1rem', marginTop: '0.5rem' }}>Control operativo en tiempo real.</p>
                </div>
                <div style={{ 
                    background: 'rgba(30, 41, 59, 0.5)', padding: '0.75rem 1.5rem', 
                    borderRadius: '1rem', border: '1px solid rgba(255, 255, 255, 0.05)',
                    textAlign: 'right'
                }}>
                    <div style={{ color: '#3b82f6', fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase' }}>
                        {new Date().toLocaleDateString('es-PE', { month: 'long', year: 'numeric' })}
                    </div>
                    <div style={{ color: 'white', fontSize: '1.2rem', fontWeight: '700' }}>{new Date().toLocaleDateString()}</div>
                </div>
            </header>

            {/* Layout Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '2rem',
                width: '100%'
            }}>
                {/* Main Billing Card - Spans 2 columns */}
                <div style={{
                    gridColumn: 'span 2',
                    padding: '3rem',
                    backgroundColor: 'rgba(30, 41, 59, 0.4)',
                    backdropFilter: 'blur(12px)',
                    borderRadius: '2rem',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '300px', height: '300px', background: '#3b82f6', filter: 'blur(150px)', opacity: 0.1 }} />
                    
                    <span style={{ color: '#3b82f6', fontSize: '0.8rem', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '1rem' }}>
                        Ventas Consolidadas (Mes)
                    </span>
                    <h2 style={{ color: 'white', fontSize: '4rem', fontWeight: '900', margin: 0, letterSpacing: '-0.05em' }}>
                        {formatCurrency(data.sales_month)}
                    </h2>
                    <div style={{ marginTop: '1.5rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
                        <span style={{ fontSize: '1.2rem' }}>↑</span> Tendencia positiva detectada
                    </div>
                </div>

                <MetricTile
                    label="Backorders"
                    value={data.backorder_count}
                    subtext="Órdenes retenidas"
                    color="#ec4899"
                    icon="⏳"
                />

                <MetricTile
                    label="Por Despachar"
                    value={data.invoiced_not_dispatched}
                    subtext="Pendiente Almacén"
                    color="#8b5cf6"
                    icon="📦"
                />

                <MetricTile
                    label="Órdenes"
                    value={data.pending_orders}
                    subtext="Por Facturar"
                    color="#f59e0b"
                    icon="📝"
                />

                <MetricTile
                    label="Stock Crítico"
                    value={data.low_stock_items}
                    subtext="Ítems bajo mínimo"
                    color="#ef4444"
                    icon="⚠️"
                />

                <MetricTile
                    label="Web (48h)"
                    value={data.recent_shop_orders}
                    subtext="Cotizaciones online"
                    color="#06b6d4"
                    icon="🌐"
                />

                <MetricTile
                    label="Solicitudes B2B"
                    value={data.pending_b2b || 0}
                    subtext="Nuevos socios"
                    color="#10b981"
                    icon="🤝"
                />
            </div>

            {/* Footer Status */}
            <footer style={{
                marginTop: '4rem',
                paddingTop: '2rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                display: 'flex',
                justifyContent: 'space-between',
                color: '#475569',
                fontSize: '0.75rem',
                fontWeight: '700',
                textTransform: 'uppercase'
            }}>
                <span>Sistema Operativo - Dirogsa ERP v4.0</span>
                <span>Última Sincronización: {new Date().toLocaleTimeString()}</span>
            </footer>
        </div>
    );
};

export default Dashboard;
