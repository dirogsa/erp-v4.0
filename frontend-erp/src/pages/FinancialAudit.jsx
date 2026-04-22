import React, { useState } from 'react';
import { auditService } from '../services/api';
import { useNotification } from '../hooks/useNotification';
import { 
    ShieldCheck, 
    AlertTriangle, 
    CheckCircle2, 
    Info, 
    Calendar, 
    RefreshCcw, 
    ArrowRight,
    TrendingUp,
    FileSearch,
    AlertCircle
} from 'lucide-react';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Layout from '../components/Layout';
import LoadingOverlay from '../components/common/LoadingOverlay';

const FinancialAudit = () => {
    const { showNotification } = useNotification();
    const [loading, setLoading] = useState(false);
    const [auditType, setAuditType] = useState('SALES');
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(1); // Primero del mes
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => {
        return new Date().toISOString().split('T')[0];
    });
    const [report, setReport] = useState(null);

    const runAudit = async () => {
        setLoading(true);
        try {
            const res = await auditService.getFinancialHealth(startDate, endDate, auditType);
            setReport(res.data);
            if (res.data.critical_issues > 0) {
                showNotification(`Se encontraron ${res.data.critical_issues} problemas críticos de integridad.`, 'warning');
            } else {
                showNotification('Auditoría completada sin problemas críticos.', 'success');
            }
        } catch (err) {
            console.error(err);
            showNotification('Error al ejecutar la auditoría financiera.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'CRITICAL': return '#ef4444';
            case 'WARNING': return '#f59e0b';
            case 'INFO': return '#3b82f6';
            default: return '#94a3b8';
        }
    };

    const getSeverityBg = (severity) => {
        switch (severity) {
            case 'CRITICAL': return 'rgba(239, 68, 68, 0.1)';
            case 'WARNING': return 'rgba(245, 158, 11, 0.1)';
            case 'INFO': return 'rgba(59, 130, 246, 0.1)';
            default: return 'rgba(148, 163, 184, 0.1)';
        }
    };

    return (
        <Layout>
            <LoadingOverlay visible={loading} message="Analizando Integridad Contable..." />
            
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem' }}>
                {/* Header */}
                <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <h1 style={{ color: 'white', marginBottom: '0.4rem', fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <ShieldCheck size={36} color="#10b981" />
                            Auditoría Preventiva y Salud Contable
                        </h1>
                        <p style={{ color: '#64748b', margin: 0 }}>
                            Motor de reglas avanzado para detectar inconsistencias, saltos de serie y errores aritméticos en XMLs.
                        </p>
                    </div>
                    
                    <div style={{ display: 'flex', background: '#0f172a', padding: '0.4rem', borderRadius: '1rem', border: '1px solid #1e293b' }}>
                        <button 
                            onClick={() => setAuditType('SALES')}
                            style={{ 
                                padding: '0.6rem 1.5rem', borderRadius: '0.75rem', border: 'none', cursor: 'pointer',
                                background: auditType === 'SALES' ? '#10b981' : 'transparent',
                                color: auditType === 'SALES' ? '#064e3b' : '#94a3b8',
                                fontWeight: 'bold', transition: 'all 0.2s'
                            }}
                        >
                            Ventas
                        </button>
                        <button 
                            onClick={() => setAuditType('PURCHASE')}
                            style={{ 
                                padding: '0.6rem 1.5rem', borderRadius: '0.75rem', border: 'none', cursor: 'pointer',
                                background: auditType === 'PURCHASE' ? '#3b82f6' : 'transparent',
                                color: auditType === 'PURCHASE' ? '#eff6ff' : '#94a3b8',
                                fontWeight: 'bold', transition: 'all 0.2s'
                            }}
                        >
                            Compras
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <Card style={{ marginBottom: '2rem', background: '#1e293b', border: '1px solid #334155' }}>
                    <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: '200px' }}>
                            <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.75rem', marginBottom: '0.5rem', textTransform: 'uppercase', fontWeight: 'bold' }}>Periodo de Inicio</label>
                            <div style={{ position: 'relative' }}>
                                <Calendar style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} size={18} />
                                <input 
                                    type="date" 
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: 'white', padding: '0.75rem 1rem 0.75rem 3rem', borderRadius: '0.75rem', outline: 'none' }}
                                />
                            </div>
                        </div>
                        <div style={{ flex: 1, minWidth: '200px' }}>
                            <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.75rem', marginBottom: '0.5rem', textTransform: 'uppercase', fontWeight: 'bold' }}>Periodo de Fin</label>
                            <div style={{ position: 'relative' }}>
                                <Calendar style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} size={18} />
                                <input 
                                    type="date" 
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: 'white', padding: '0.75rem 1rem 0.75rem 3rem', borderRadius: '0.75rem', outline: 'none' }}
                                />
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-end', height: '100%' }}>
                            <Button 
                                variant="primary" 
                                size="large" 
                                onClick={runAudit}
                                style={{ 
                                    background: auditType === 'SALES' ? '#10b981' : '#3b82f6', 
                                    padding: '0.85rem 2.5rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' 
                                }}
                            >
                                <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
                                Ejecutar Auditoría Global
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* Results Section */}
                {report ? (
                    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
                        {/* Period Continuity & SUNAT Deadlines Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2.5rem' }}>
                            {/* Continuity Radar */}
                            <Card style={{ background: '#0f172a', border: '1px solid #1e293b' }}>
                                <h3 style={{ color: 'white', marginTop: 0, marginBottom: '1.5rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <RefreshCcw size={18} color="#10b981" />
                                    Radar de Continuidad de Periodos
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {report.continuity.coverage && (
                                        <div style={{ marginBottom: '1rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                                                <span>Cobertura Histórica</span>
                                                <span style={{ color: '#10b981', fontWeight: 'bold' }}>
                                                    {Math.round((report.continuity.coverage.total_actual / report.continuity.coverage.total_expected) * 100)}%
                                                </span>
                                            </div>
                                            <div style={{ height: '6px', background: '#1e293b', borderRadius: '3px', overflow: 'hidden' }}>
                                                <div style={{ 
                                                    height: '100%', 
                                                    width: `${(report.continuity.coverage.total_actual / report.continuity.coverage.total_expected) * 100}%`,
                                                    background: 'linear-gradient(90deg, #10b981, #34d399)'
                                                }} />
                                            </div>
                                        </div>
                                    )}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '0.5rem' }}>
                                        {report.deadlines.map((d, i) => {
                                            const isMissing = report.continuity.missing_months.includes(d.period);
                                            return (
                                                <div 
                                                    key={i}
                                                    style={{ 
                                                        padding: '0.5rem', 
                                                        borderRadius: '0.5rem', 
                                                        background: isMissing ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                                        border: `1px solid ${isMissing ? '#ef4444' : '#10b981'}44`,
                                                        textAlign: 'center'
                                                    }}
                                                >
                                                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 'bold' }}>{d.period}</div>
                                                    <div style={{ fontSize: '0.6rem', color: isMissing ? '#ef4444' : '#10b981' }}>
                                                        {isMissing ? 'VACÍO' : 'OK'}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </Card>

                            {/* SUNAT Deadlines */}
                            <Card style={{ background: '#0f172a', border: '1px solid #1e293b' }}>
                                <h3 style={{ color: 'white', marginTop: 0, marginBottom: '1.5rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Calendar size={18} color="#3b82f6" />
                                    Cronograma de Vencimientos SUNAT
                                </h3>
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid #1e293b' }}>
                                                <th style={{ textAlign: 'left', padding: '0.5rem', color: '#64748b', fontSize: '0.7rem' }}>PERIODO</th>
                                                <th style={{ textAlign: 'left', padding: '0.5rem', color: '#64748b', fontSize: '0.7rem' }}>VENCIMIENTO</th>
                                                <th style={{ textAlign: 'right', padding: '0.5rem', color: '#64748b', fontSize: '0.7rem' }}>ESTADO</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {report.deadlines.map((d, i) => (
                                                <tr key={i} style={{ borderBottom: '1px solid #1e293b' }}>
                                                    <td style={{ padding: '0.75rem 0.5rem', color: 'white', fontSize: '0.85rem' }}>{d.month_name}</td>
                                                    <td style={{ padding: '0.75rem 0.5rem', color: '#94a3b8', fontSize: '0.85rem' }}>{d.deadline}</td>
                                                    <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>
                                                        <span style={{ 
                                                            padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold',
                                                            background: d.status === 'VENCIDO' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                                                            color: d.status === 'VENCIDO' ? '#ef4444' : '#3b82f6'
                                                        }}>
                                                            {d.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        </div>

                        {/* Summary Cards */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                            <Card style={{ background: '#0f172a', border: '1px solid #1e293b', padding: '1.5rem' }}>
                                <div style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '1rem' }}>Docs Analizados</div>
                                <div style={{ fontSize: '2.5rem', fontWeight: '900', color: 'white', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    {report.total_docs}
                                    <TrendingUp size={32} color="#10b981" />
                                </div>
                            </Card>
                            <Card style={{ background: '#0f172a', border: report.critical_issues > 0 ? '1px solid #ef4444' : '1px solid #1e293b', padding: '1.5rem' }}>
                                <div style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '1rem' }}>Críticos / Bloqueantes</div>
                                <div style={{ fontSize: '2.5rem', fontWeight: '900', color: report.critical_issues > 0 ? '#ef4444' : '#10b981', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    {report.critical_issues}
                                    {report.critical_issues > 0 ? <AlertCircle size={32} /> : <CheckCircle2 size={32} />}
                                </div>
                            </Card>
                            <Card style={{ background: '#0f172a', border: '1px solid #1e293b', padding: '1.5rem' }}>
                                <div style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '1rem' }}>Advertencias</div>
                                <div style={{ fontSize: '2.5rem', fontWeight: '900', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    {report.warnings}
                                    <AlertTriangle size={32} />
                                </div>
                            </Card>
                        </div>

                        {/* Finding List */}
                        <h3 style={{ color: 'white', marginBottom: '1.5rem', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FileSearch size={24} color="#60a5fa" />
                            Listado de Hallazgos y Discrepancias
                        </h3>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {report.findings.length === 0 ? (
                                <div style={{ padding: '4rem', textAlign: 'center', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '1rem', border: '1px dashed #10b981' }}>
                                    <CheckCircle2 size={48} color="#10b981" style={{ margin: '0 auto 1rem' }} />
                                    <h4 style={{ color: 'white', margin: '0 0 0.5rem' }}>¡Integridad Impecable!</h4>
                                    <p style={{ color: '#94a3b8', margin: 0 }}>No se encontraron inconsistencias en el periodo seleccionado.</p>
                                </div>
                            ) : report.findings.map((f, idx) => (
                                <div 
                                    key={idx} 
                                    style={{ 
                                        background: '#1e293b', 
                                        borderRadius: '1rem', 
                                        border: `1px solid ${getSeverityColor(f.severity)}33`,
                                        padding: '1.25rem',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        borderLeft: `5px solid ${getSeverityColor(f.severity)}`
                                    }}
                                >
                                    <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                                        <div style={{ 
                                            width: '40px', height: '40px', borderRadius: '10px', 
                                            background: getSeverityBg(f.severity),
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            {f.severity === 'CRITICAL' ? <AlertCircle color="#ef4444" /> : 
                                             f.severity === 'WARNING' ? <AlertTriangle color="#f59e0b" /> : 
                                             <Info color="#3b82f6" />}
                                        </div>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                                                <span style={{ color: 'white', fontWeight: 'bold', fontSize: '1rem' }}>{f.message}</span>
                                                <span style={{ 
                                                    fontSize: '0.65rem', padding: '2px 8px', borderRadius: '4px', 
                                                    background: '#0f172a', color: '#94a3b8', border: '1px solid #334155', fontWeight: 'bold'
                                                }}>
                                                    {f.category}
                                                </span>
                                            </div>
                                            <div style={{ color: '#64748b', fontSize: '0.8rem' }}>
                                                Identificador: {f.entity_name || 'N/A'} • Regla: {f.type}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {f.entity_id && (
                                        <button 
                                            style={{ 
                                                background: 'transparent', border: '1px solid #334155', color: '#94a3b8', 
                                                padding: '0.5rem 1rem', borderRadius: '0.5rem', cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseOver={e => e.currentTarget.style.borderColor = '#60a5fa'}
                                            onMouseOut={e => e.currentTarget.style.borderColor = '#334155'}
                                            onClick={() => window.open(auditType === 'SALES' ? `/sales?search=${f.entity_name}` : `/purchasing?search=${f.entity_name}`, '_blank')}
                                        >
                                            Ver Detalles <ArrowRight size={16} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '10rem 2rem', color: '#64748b' }}>
                        <RefreshCcw size={64} style={{ opacity: 0.1, margin: '0 auto 2rem' }} />
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Listo para Auditar</h2>
                        <p>Seleccione el rango de fechas y presione el botón para iniciar el análisis profundo de consistencia.</p>
                    </div>
                )}
                
                <style>{`
                    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                    .animate-spin { animation: spin 1s linear infinite; }
                    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                `}</style>
            </div>
        </Layout>
    );
};

export default FinancialAudit;
