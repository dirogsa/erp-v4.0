import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../services/api';
import { formatCurrency } from '../utils/formatters';
import Loading from '../components/common/Loading';
import Table from '../components/common/Table';

const Dashboard = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        sales_month: 0,
        pending_orders: 0,
        low_stock_items: 0,
        recent_orders: []
    });

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const response = await api.get('/analytics/dashboard');
                setData(response.data);
            } catch (error) {
                console.error("Dashboard: Error fetching dashboard data:", error);
                // Fallback / Mock for dev if backend not ready
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) return <Loading />;

    const KpiCard = ({ title, value, color, icon }) => (
        <div style={{
            backgroundColor: '#1e293b',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            borderLeft: `4px solid ${color}`,
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
            <h3 style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>{title}</h3>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>{value}</div>
        </div>
    );

    const recentOrdersColumns = [
        { label: 'Orden', key: 'order_number' },
        { label: 'Cliente', key: 'customer_name' },
        { label: 'Total', key: 'total_amount', render: (val) => formatCurrency(val) },
        { label: 'Estado', key: 'status' }
    ];

    return (
        <div style={{ padding: '2rem' }}>
            <h1 style={{ color: 'white', marginBottom: '2rem' }}>Panel de Control</h1>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '1.5rem',
                marginBottom: '2rem'
            }}>
                <KpiCard
                    title="Ventas del Mes"
                    value={formatCurrency(data.sales_month)}
                    color="#22c55e"
                />
                <KpiCard
                    title="Órdenes Pendientes"
                    value={data.pending_orders}
                    color="#f59e0b"
                />
                <KpiCard
                    title="Stock Crítico"
                    value={data.low_stock_items}
                    color="#ef4444"
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
                <div style={{ backgroundColor: '#1e293b', padding: '1.5rem', borderRadius: '0.5rem' }}>
                    <h2 style={{ color: 'white', marginBottom: '1rem', fontSize: '1.1rem' }}>Actividad Reciente</h2>
                    <Table
                        columns={recentOrdersColumns}
                        data={data.recent_orders}
                        emptyMessage="No hay actividad reciente"
                    />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
