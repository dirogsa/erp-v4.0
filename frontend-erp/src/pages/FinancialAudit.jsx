import React, { useState } from 'react';
import { auditService, companyService } from '../services/api';
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
    AlertCircle,
    Building2,
    Users,
    Truck,
    Package
} from 'lucide-react';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Layout from '../components/Layout';
import { useLoading } from '../context/LoadingContext';

const FinancialAudit = () => {
    const { showNotification } = useNotification();
    const { showLoading, hideLoading } = useLoading();
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
    const [companies, setCompanies] = React.useState([]);
    const [selectedCompany, setSelectedCompany] = useState(''); // Empty = Global (SuperAdmin only)
    const [report, setReport] = useState(null);
    const [showPolicyModal, setShowPolicyModal] = useState(false);
    const [editingPolicies, setEditingPolicies] = useState(null);

    React.useEffect(() => {
        const loadCompanies = async () => {
            try {
                const res = await companyService.getCompanies();
                setCompanies(res.data);
            } catch (err) {
                console.error("Error loading companies", err);
            }
        };
        loadCompanies();
    }, []);

    const runAudit = async () => {
        setLoading(true);
        showLoading("Analizando Integridad Contable...", "Ejecutando motor de reglas avanzado para detectar discrepancias y saltos de serie.");
        try {
            const res = await auditService.getFinancialHealth(startDate, endDate, auditType, selectedCompany || null);
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
            hideLoading();
        }
    };

    const handleSavePolicies = async () => {
        const targetId = selectedCompany || currentCompanyData?._id;
        if (!targetId) {
            showNotification("No se pudo identificar la empresa a actualizar.", "error");
            return;
        }
        try {
            showLoading("Actualizando Políticas de Gobernanza...", "Reconfigurando motor de segregación de datos.");
            await companyService.updateCompany(targetId, { enterprise_settings: editingPolicies });
            showNotification("Políticas actualizadas correctamente.", "success");
            setShowPolicyModal(false);
            // Recargar empresas para tener los datos frescos
            const res = await companyService.getCompanies();
            setCompanies(res.data);
        } catch (err) {
            showNotification("Error al actualizar políticas.", "error");
        } finally {
            hideLoading();
        }
    };

    const currentCompanyData = selectedCompany ? companies.find(c => c._id === selectedCompany) : companies.find(c => c.is_active_local);
    const policies = currentCompanyData?.enterprise_settings || {
        inventory_mode: 'SHARED',
        customers_mode: 'SOVEREIGN',
        suppliers_mode: 'SOVEREIGN',
        users_mode: 'SOVEREIGN'
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
                    
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={{ position: 'relative' }}>
                            <Building2 style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} size={18} />
                            <select 
                                value={selectedCompany}
                                onChange={(e) => setSelectedCompany(e.target.value)}
                                style={{ 
                                    background: '#0f172a', border: '1px solid #1e293b', color: 'white', 
                                    padding: '0.6rem 1rem 0.6rem 3rem', borderRadius: '0.75rem', outline: 'none',
                                    appearance: 'none', minWidth: '220px'
                                }}
                            >
                                <option value="">🌍 Auditoría Global (Holding)</option>
                                {companies.map(c => (
                                    <option key={c._id} value={c._id}>🏢 {c.name} ({c.ruc})</option>
                                ))}
                            </select>
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

                {/* Sovereignty Status Panel (Dynamic) */}
                <Card style={{ marginBottom: '2.5rem', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', border: '1px solid #334155' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ color: 'white', margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <ShieldCheck size={18} color="#60a5fa" />
                            Centro de Gobierno y Soberanía (Estado de Segregación)
                        </h3>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.7rem', color: '#64748b', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '20px' }}>
                                Modo: {selectedCompany ? (currentCompanyData?.name || 'Empresa Seleccionada') : 'Holding Global (Active Local View)'}
                            </span>
                            {currentCompanyData && (
                                <Button size="xs" variant="outline" onClick={() => { setEditingPolicies(policies); setShowPolicyModal(true); }}>Ajustar Políticas</Button>
                            )}
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                        {[
                            { label: 'Inventario', icon: Package, status: policies.inventory_mode === 'SHARED' ? 'COMPARTIDO' : 'SOBERANO', color: policies.inventory_mode === 'SHARED' ? '#f59e0b' : '#10b981', desc: policies.inventory_mode === 'SHARED' ? 'Pool común de stock' : 'Stock por RUC' },
                            { label: 'Clientes', icon: Users, status: policies.customers_mode === 'SHARED' ? 'COMPARTIDO' : 'SOBERANO', color: policies.customers_mode === 'SHARED' ? '#3b82f6' : '#10b981', desc: policies.customers_mode === 'SHARED' ? 'Cartera unificada' : 'Cartera segregada' },
                            { label: 'Proveedores', icon: Truck, status: policies.suppliers_mode === 'SHARED' ? 'COMPARTIDO' : 'SOBERANO', color: policies.suppliers_mode === 'SHARED' ? '#8b5cf6' : '#10b981', desc: policies.suppliers_mode === 'SHARED' ? 'Directorio Global' : 'Asignación por RUC' },
                            { label: 'Usuarios', icon: ShieldCheck, status: policies.users_mode === 'SHARED' ? 'COMPARTIDO' : 'SOBERANO', color: policies.users_mode === 'SHARED' ? '#ec4899' : '#10b981', desc: policies.users_mode === 'SHARED' ? 'Acceso total' : 'Permisos por entidad' }
                        ].map((item, idx) => (
                            <div key={idx} style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #334155' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    <item.icon size={16} color={item.color} />
                                    <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 'bold' }}>{item.label}</span>
                                </div>
                                <div style={{ color: 'white', fontSize: '0.9rem', fontWeight: 'bold' }}>{item.status}</div>
                                <div style={{ color: '#64748b', fontSize: '0.65rem', marginTop: '0.25rem' }}>{item.desc}</div>
                            </div>
                        ))}
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
                
                {/* Governance Policy Editor Modal */}
                {showPolicyModal && editingPolicies && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
                        <div style={{ backgroundColor: '#1e293b', padding: '2.5rem', borderRadius: '1.5rem', width: '550px', border: '1px solid #334155', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
                            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                                <div style={{ background: 'rgba(59, 130, 246, 0.1)', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                                    <ShieldCheck size={32} color="#3b82f6" />
                                </div>
                                <h3 style={{ color: 'white', margin: 0, fontSize: '1.5rem' }}>Ajustar Políticas de Soberanía</h3>
                                <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '0.5rem' }}>{currentCompanyData?.name}</p>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                {[
                                    { key: 'inventory_mode', label: 'Modo de Inventario', desc: 'Control de stock físico' },
                                    { key: 'customers_mode', label: 'Modo de Clientes', desc: 'Segregación de cartera' },
                                    { key: 'suppliers_mode', label: 'Modo de Proveedores', desc: 'Asignación de proveedores' },
                                    { key: 'users_mode', label: 'Modo de Usuarios', desc: 'Permisos de acceso' }
                                ].map(policy => (
                                    <div key={policy.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: '#0f172a', borderRadius: '1rem', border: '1px solid #334155' }}>
                                        <div>
                                            <div style={{ color: 'white', fontWeight: 'bold', fontSize: '0.9rem' }}>{policy.label}</div>
                                            <div style={{ color: '#64748b', fontSize: '0.7rem' }}>{policy.desc}</div>
                                        </div>
                                        <div style={{ display: 'flex', background: '#1e293b', padding: '0.25rem', borderRadius: '0.5rem' }}>
                                            <button 
                                                onClick={() => setEditingPolicies({...editingPolicies, [policy.key]: 'SHARED'})}
                                                style={{ 
                                                    padding: '4px 12px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 'bold',
                                                    background: editingPolicies[policy.key] === 'SHARED' ? '#3b82f6' : 'transparent',
                                                    color: editingPolicies[policy.key] === 'SHARED' ? 'white' : '#64748b'
                                                }}
                                            >
                                                SHARED
                                            </button>
                                            <button 
                                                onClick={() => setEditingPolicies({...editingPolicies, [policy.key]: 'SOVEREIGN'})}
                                                style={{ 
                                                    padding: '4px 12px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 'bold',
                                                    background: editingPolicies[policy.key] === 'SOVEREIGN' ? '#10b981' : 'transparent',
                                                    color: editingPolicies[policy.key] === 'SOVEREIGN' ? 'white' : '#64748b'
                                                }}
                                            >
                                                SOVEREIGN
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem' }}>
                                <Button variant="outline" onClick={() => setShowPolicyModal(false)} fullWidth>Cancelar</Button>
                                <Button variant="primary" onClick={handleSavePolicies} fullWidth>Guardar Cambios</Button>
                            </div>
                        </div>
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
