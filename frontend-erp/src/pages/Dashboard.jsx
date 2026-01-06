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

    const MetricTile = ({ label, value, subtext, color, icon }) => (
        <div style={{
            padding: '1.25rem',
            borderRight: '1px solid #334155',
            borderBottom: '1px solid #334155',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            backgroundColor: '#1e293b'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1rem' }}>{icon}</span>
                <span style={{
                    color: '#94a3b8',
                    fontSize: '0.65rem',
                    fontWeight: '800',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em'
                }}>
                    {label}
                </span>
            </div>
            <div style={{
                fontSize: '1.75rem',
                fontWeight: '900',
                color: 'white',
                lineHeight: '1.2',
                marginBottom: '0.25rem',
                letterSpacing: '-0.02em'
            }}>
                {value}
            </div>
            <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.7rem',
                color: '#64748b',
                fontWeight: '500'
            }}>
                <div style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: color }}></div>
                {subtext}
            </div>
        </div>
    );

    return (
        <div style={{ padding: '0', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Compact Header */}
            <div style={{
                padding: '1.5rem 2rem',
                borderBottom: '1px solid #334155',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div>
                    <h1 style={{ color: 'white', fontSize: '1.2rem', fontWeight: '900', margin: 0 }}>Dashboard Resumen</h1>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: '700' }}>
                        {new Date().toLocaleDateString('es-PE', { month: 'long', year: 'numeric' }).toUpperCase()}
                    </div>
                </div>
            </div>

            {/* Grid Layout */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                width: '100%',
                borderLeft: '1px solid #334155',
                borderTop: '1px solid #334155'
            }}>
                {/* Main Billing Cell - Slightly larger */}
                <div style={{
                    gridColumn: 'span 2',
                    gridRow: 'span 1',
                    padding: '2rem',
                    backgroundColor: '#0f172a',
                    borderRight: '1px solid #334155',
                    borderBottom: '1px solid #334155',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                }}>
                    <span style={{ color: '#3b82f6', fontSize: '0.65rem', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '0.75rem' }}>
                        Ventas del Mes
                    </span>
                    <h2 style={{ color: 'white', fontSize: '2.5rem', fontWeight: '900', margin: 0, letterSpacing: '-0.04em' }}>
                        {formatCurrency(data.sales_month)}
                    </h2>
                </div>

                <MetricTile
                    label="Backorders"
                    value={data.backorder_count}
                    subtext="Retenidas"
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
                    subtext="Bajo Mínimo"
                    color="#ef4444"
                    icon="⚠️"
                />

                <MetricTile
                    label="Web (48h)"
                    value={data.recent_shop_orders}
                    subtext="Cotizaciones"
                    color="#06b6d4"
                    icon="🌐"
                />

                {/* Empty spacer cell to complete the 4-column grid if needed */}
                <div style={{ backgroundColor: '#1e293b', borderRight: '1px solid #334155', borderBottom: '1px solid #334155' }}></div>
            </div>

            {/* Footer */}
            <div style={{
                padding: '0.75rem 2rem',
                display: 'flex',
                justifyContent: 'flex-end',
                fontSize: '0.65rem',
                color: '#475569',
                fontWeight: '700',
                textTransform: 'uppercase'
            }}>
                Actualizado: {new Date().toLocaleTimeString()}
            </div>
        </div>
    );
};

export default Dashboard;
