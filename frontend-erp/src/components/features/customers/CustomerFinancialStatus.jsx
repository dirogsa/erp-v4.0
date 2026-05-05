import React, { useEffect } from 'react';
import { useFinancial } from '../../../hooks/useFinancial';
import LoadingScreen from '../../common/LoadingScreen';

const CustomerFinancialStatus = ({ documentNumber }) => {
    const { statement, loading, fetchCustomerStatement } = useFinancial();

    useEffect(() => {
        if (documentNumber) {
            fetchCustomerStatement(documentNumber);
        }
    }, [documentNumber, fetchCustomerStatement]);

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}><p style={{ color: '#94a3b8' }}>Consultando salud financiera...</p></div>;
    if (!statement) return null;

    const { summary, items } = statement;
    const creditUsagePercent = summary.credit_limit > 0 
        ? Math.min(100, (summary.total_debt / summary.credit_limit) * 100) 
        : 0;

    const getStatusColor = () => {
        if (summary.is_blocked) return '#ef4444'; // Red for blocked
        if (summary.overdue_debt > 0) return '#f59e0b'; // Amber for overdue
        return '#10b981'; // Green for healthy
    };

    return (
        <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
            {/* Header Dashboard */}
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
                gap: '1rem',
                marginBottom: '1.5rem'
            }}>
                <div style={cardStyle}>
                    <p style={labelStyle}>Deuda Total</p>
                    <p style={{ ...valueStyle, color: 'white' }}>
                        S/ {summary.total_debt.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                    </p>
                </div>
                <div style={cardStyle}>
                    <p style={labelStyle}>Deuda Vencida</p>
                    <p style={{ ...valueStyle, color: summary.overdue_debt > 0 ? '#ef4444' : '#10b981' }}>
                        S/ {summary.overdue_debt.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                    </p>
                </div>
                <div style={cardStyle}>
                    <p style={labelStyle}>Crédito Disponible</p>
                    <p style={{ ...valueStyle, color: '#3b82f6' }}>
                        S/ {summary.available_credit.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                    </p>
                </div>
                <div style={{ ...cardStyle, borderLeft: `4px solid ${getStatusColor()}` }}>
                    <p style={labelStyle}>Estado de Cuenta</p>
                    <p style={{ ...valueStyle, fontSize: '1rem', color: getStatusColor() }}>
                        {summary.is_blocked ? '🛑 BLOQUEADO' : (summary.overdue_debt > 0 ? '⚠️ CON DEUDA' : '✅ AL DÍA')}
                    </p>
                </div>
            </div>

            {/* Credit Line Progress */}
            {summary.credit_limit > 0 && (
                <div style={{ marginBottom: '2rem', background: '#1e293b', padding: '1rem', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Uso de Línea de Crédito</span>
                        <span style={{ fontSize: '0.8rem', color: 'white' }}>{creditUsagePercent.toFixed(1)}% de S/ {summary.credit_limit}</span>
                    </div>
                    <div style={{ height: '8px', background: '#0f172a', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ 
                            height: '100%', 
                            width: `${creditUsagePercent}%`, 
                            background: creditUsagePercent > 90 ? '#ef4444' : (creditUsagePercent > 70 ? '#f59e0b' : '#3b82f6'),
                            transition: 'width 1s ease-in-out'
                        }} />
                    </div>
                </div>
            )}

            {/* Pending Invoices Table */}
            <h4 style={{ color: '#e2e8f0', marginBottom: '1rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                📄 Facturas Pendientes de Pago
            </h4>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                            <th style={thStyle}>Documento</th>
                            <th style={thStyle}>Emisión</th>
                            <th style={thStyle}>Vencimiento</th>
                            <th style={thStyle}>Estado</th>
                            <th style={{ ...thStyle, textAlign: 'right' }}>Saldo</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.length > 0 ? items.map((item, index) => (
                            <tr key={index} style={{ borderBottom: '1px solid #1e293b', color: '#e2e8f0' }}>
                                <td style={tdStyle}>
                                    <div style={{ fontWeight: 'bold' }}>{item.sunat_number || item.invoice_number}</div>
                                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{item.invoice_number}</div>
                                </td>
                                <td style={tdStyle}>{new Date(item.date).toLocaleDateString()}</td>
                                <td style={tdStyle}>{new Date(item.due_date).toLocaleDateString()}</td>
                                <td style={tdStyle}>
                                    {item.is_overdue ? (
                                        <span style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                                            Vencida ({item.days_overdue}d)
                                        </span>
                                    ) : (
                                        <span style={{ color: '#10b981' }}>Pendiente</span>
                                    )}
                                </td>
                                <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 'bold' }}>
                                    {item.currency} {item.net_balance.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No hay documentos pendientes</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const cardStyle = {
    background: '#1e293b',
    padding: '1rem',
    borderRadius: '12px',
    border: '1px solid #334155'
};

const labelStyle = {
    color: '#94a3b8',
    fontSize: '0.75rem',
    margin: '0 0 0.25rem 0',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
};

const valueStyle = {
    fontSize: '1.25rem',
    fontWeight: '700',
    margin: 0
};

const thStyle = {
    textAlign: 'left',
    padding: '0.75rem 0.5rem',
    fontWeight: '600'
};

const tdStyle = {
    padding: '0.75rem 0.5rem'
};

export default CustomerFinancialStatus;
