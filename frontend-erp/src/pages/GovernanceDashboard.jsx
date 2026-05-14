import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useNotification } from '../hooks/useNotification';
import { useCompany } from '../context/CompanyContext';
import { useAuth } from '../context/AuthContext';
import { 
    Shield, 
    Briefcase, 
    Users, 
    Package, 
    ArrowRight, 
    RefreshCw, 
    CheckCircle2, 
    AlertTriangle,
    Database,
    Globe,
    Building2,
    Settings2,
    Lock,
    ExternalLink
} from 'lucide-react';
import axios from 'axios';

const GovernanceDashboard = () => {
    const { showNotification } = useNotification();
    const { activeCompany } = useCompany();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    
    const [stats, setStats] = useState({
        suppliers: { total: 45, progress: 100, status: 'SOBERANO' },
        customers: { total: 1280, progress: 100, status: 'SOBERANO' },
        inventory: { total: 8500, mode: 'SHARED' },
        users: { total: 24, status: 'SEGREGADO' }
    });

    const [settings, setSettings] = useState({
        inventory_mode: 'SHARED',
        auto_intercompany_settlement: true,
        allow_cross_company_sales: true
    });

    useEffect(() => {
        if (activeCompany?.enterprise_settings) {
            setSettings(activeCompany.enterprise_settings);
        }
    }, [activeCompany]);

    const handleToggleSetting = (key) => {
        const newValue = !settings[key];
        setSettings(prev => ({ ...prev, [key]: newValue }));
        showNotification('Configuración de gobernanza actualizada localmente', 'info');
    };

    const handleSwitchInventoryMode = () => {
        const newMode = settings.inventory_mode === 'SHARED' ? 'SOVEREIGN' : 'SHARED';
        if (newMode === 'SOVEREIGN') {
            const confirm = window.confirm("¿ESTÁ SEGURO? Activar el MODO SOBERANO dividirá el stock físicamente por empresa. Esta es una operación de alta criticidad.");
            if (!confirm) return;
        }
        setSettings(prev => ({ ...prev, inventory_mode: newMode }));
        showNotification(`Modo de Inventario cambiado a ${newMode}`, 'success');
    };

    // Estilos de Alta Fidelidad (Vanilla CSS Inline)
    const styles = {
        container: {
            padding: '2rem',
            maxWidth: '1200px',
            margin: '0 auto',
            color: '#f8fafc'
        },
        header: {
            marginBottom: '2.5rem',
            borderBottom: '1px solid #334155',
            paddingBottom: '1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
        },
        title: {
            fontSize: '2rem',
            fontWeight: '900',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            background: 'linear-gradient(to right, #60a5fa, #a855f7)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
        },
        grid4: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1.5rem',
            marginBottom: '3rem'
        },
        cardStatus: {
            background: '#1e293b',
            borderRadius: '1.25rem',
            padding: '1.5rem',
            border: '1px solid #334155',
            transition: 'all 0.3s ease',
            position: 'relative',
            overflow: 'hidden'
        },
        iconBox: (color) => ({
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: `${color}20`,
            color: color,
            marginBottom: '1rem'
        }),
        badge: (color) => ({
            fontSize: '0.65rem',
            fontWeight: '900',
            padding: '2px 8px',
            borderRadius: '20px',
            background: `${color}20`,
            color: color,
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
        }),
        mainContent: {
            display: 'grid',
            gridTemplateColumns: '2fr 1fr',
            gap: '2rem'
        },
        panel: {
            background: '#0f172a',
            borderRadius: '1.5rem',
            border: '1px solid #334155',
            overflow: 'hidden',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)'
        },
        panelHeader: {
            padding: '1.5rem 2rem',
            background: 'rgba(255,255,255,0.02)',
            borderBottom: '1px solid #334155'
        },
        settingRow: {
            padding: '1.5rem 2rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #1e293b'
        },
        toggle: (active) => ({
            width: '50px',
            height: '26px',
            borderRadius: '20px',
            background: active ? '#3b82f6' : '#334155',
            position: 'relative',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            border: 'none',
            padding: 0
        }),
        toggleCircle: (active) => ({
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            background: 'white',
            position: 'absolute',
            top: '3px',
            left: active ? '27px' : '3px',
            transition: 'all 0.3s ease'
        }),
        sidebarCard: {
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            borderRadius: '1.5rem',
            padding: '2rem',
            border: '1px solid #334155',
            position: 'sticky',
            top: '2rem'
        }
    };

    if (user?.role !== 'SUPERADMIN' && user?.role !== 'ADMIN') {
        return <Layout><div style={{textAlign: 'center', padding: '5rem', color: 'white'}}>Acceso Denegado</div></Layout>;
    }

    return (
        <Layout>
            <div style={styles.container}>
                {/* Header */}
                <div style={styles.header}>
                    <div>
                        <h1 style={styles.title}>
                            <Shield size={32} />
                            Centro de Gobierno Corporativo
                        </h1>
                        <p style={{color: '#94a3b8', marginTop: '0.5rem', fontWeight: '500'}}>
                            Soberanía de Datos & Arquitectura Multi-Empresa v4.0
                        </p>
                    </div>
                    <button 
                        style={{
                            background: '#1e293b', 
                            color: 'white', 
                            border: '1px solid #334155', 
                            padding: '0.6rem 1.2rem', 
                            borderRadius: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            cursor: 'pointer',
                            fontWeight: '600'
                        }}
                        onClick={() => {setLoading(true); setTimeout(()=>setLoading(false), 1000)}}
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        Auditoría en Tiempo Real
                    </button>
                </div>

                {/* Status Cards */}
                <div style={styles.grid4}>
                    <div style={styles.cardStatus}>
                        <div style={styles.iconBox('#3b82f6')}><Users size={20} /></div>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                            <span style={{color: '#94a3b8', fontSize: '0.8rem', fontWeight: '700'}}>CLIENTES</span>
                            <span style={styles.badge('#10b981')}>SOBERANO</span>
                        </div>
                        <div style={{fontSize: '1.8rem', fontWeight: '900', margin: '0.5rem 0'}}>{stats.customers.total}</div>
                        <div style={{fontSize: '0.7rem', color: '#64748b', fontWeight: '600'}}>Cartera de clientes aislada por RUC</div>
                    </div>

                    <div style={styles.cardStatus}>
                        <div style={styles.iconBox('#f59e0b')}><Briefcase size={20} /></div>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                            <span style={{color: '#94a3b8', fontSize: '0.8rem', fontWeight: '700'}}>PROVEEDORES</span>
                            <span style={styles.badge('#10b981')}>SOBERANO</span>
                        </div>
                        <div style={{fontSize: '1.8rem', fontWeight: '900', margin: '0.5rem 0'}}>{stats.suppliers.total}</div>
                        <div style={{fontSize: '0.7rem', color: '#64748b', fontWeight: '600'}}>Proveedores asignados por entidad</div>
                    </div>

                    <div style={styles.cardStatus}>
                        <div style={styles.iconBox('#10b981')}><Package size={20} /></div>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                            <span style={{color: '#94a3b8', fontSize: '0.8rem', fontWeight: '700'}}>INVENTARIO</span>
                            <span style={styles.badge(settings.inventory_mode === 'SHARED' ? '#3b82f6' : '#10b981')}>
                                {settings.inventory_mode}
                            </span>
                        </div>
                        <div style={{fontSize: '1.8rem', fontWeight: '900', margin: '0.5rem 0'}}>{stats.inventory.total}</div>
                        <div style={{fontSize: '0.7rem', color: '#64748b', fontWeight: '600'}}>Total SKUs en el catálogo maestro</div>
                    </div>

                    <div style={styles.cardStatus}>
                        <div style={styles.iconBox('#8b5cf6')}><RefreshCw size={20} /></div>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                            <span style={{color: '#94a3b8', fontSize: '0.8rem', fontWeight: '700'}}>INTERCOMPANY</span>
                            <span style={styles.badge('#8b5cf6')}>ACTIVO</span>
                        </div>
                        <div style={{fontSize: '1.8rem', fontWeight: '900', margin: '0.5rem 0'}}>Auto</div>
                        <div style={{fontSize: '0.7rem', color: '#64748b', fontWeight: '600'}}>Liquidación automática de deudas</div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div style={styles.mainContent}>
                    <div style={styles.panel}>
                        <div style={styles.panelHeader}>
                            <h2 style={{margin: 0, fontSize: '1.25rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                                <Settings2 size={20} color="#60a5fa" />
                                Interruptores de Soberanía (Master Switches)
                            </h2>
                        </div>

                        <div style={styles.settingRow}>
                            <div style={{maxWidth: '70%'}}>
                                <h3 style={{margin: 0, fontSize: '1.05rem', fontWeight: '700'}}>Modo de Inventario (Sovereignty Mode)</h3>
                                <p style={{fontSize: '0.85rem', color: '#64748b', margin: '0.4rem 0 0'}}>
                                    {settings.inventory_mode === 'SHARED' 
                                        ? 'Las empresas comparten el stock físico globalmente (Pool común).' 
                                        : 'Cada empresa tiene su propio balance de stock independiente y ciego.'}
                                </p>
                            </div>
                            <button 
                                style={styles.toggle(settings.inventory_mode === 'SOVEREIGN')}
                                onClick={handleSwitchInventoryMode}
                            >
                                <div style={styles.toggleCircle(settings.inventory_mode === 'SOVEREIGN')}></div>
                            </button>
                        </div>

                        <div style={styles.settingRow}>
                            <div style={{maxWidth: '70%'}}>
                                <h3 style={{margin: 0, fontSize: '1.05rem', fontWeight: '700'}}>Liquidación Automática Intercompany</h3>
                                <p style={{fontSize: '0.85rem', color: '#64748b', margin: '0.4rem 0 0'}}>
                                    Genera facturas de compra/venta automáticas cuando una empresa cede stock a otra para una venta.
                                </p>
                            </div>
                            <button 
                                style={styles.toggle(settings.auto_intercompany_settlement)}
                                onClick={() => handleToggleSetting('auto_intercompany_settlement')}
                            >
                                <div style={styles.toggleCircle(settings.auto_intercompany_settlement)}></div>
                            </button>
                        </div>

                        <div style={styles.settingRow}>
                            <div style={{maxWidth: '70%'}}>
                                <h3 style={{margin: 0, fontSize: '1.05rem', fontWeight: '700'}}>Ventas Cruzadas Permitidas</h3>
                                <p style={{fontSize: '0.85rem', color: '#64748b', margin: '0.4rem 0 0'}}>
                                    Permite que vendedores de una empresa visualicen y vendan stock de las otras empresas del grupo.
                                </p>
                            </div>
                            <button 
                                style={styles.toggle(settings.allow_cross_company_sales)}
                                onClick={() => handleToggleSetting('allow_cross_company_sales')}
                            >
                                <div style={styles.toggleCircle(settings.allow_cross_company_sales)}></div>
                            </button>
                        </div>
                    </div>

                    <div style={styles.sidebarCard}>
                        <h3 style={{marginTop: 0, fontSize: '1.1rem', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                            <Building2 size={20} color="#818cf8" />
                            Entidad Activa
                        </h3>
                        
                        <div style={{background: 'rgba(255,255,255,0.05)', padding: '1.25rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '1.5rem'}}>
                            <div style={{fontSize: '0.65rem', fontWeight: '800', color: '#818cf8', marginBottom: '0.25rem'}}>RUC REGISTRADO</div>
                            <div style={{fontSize: '1.2rem', fontWeight: '900'}}>{activeCompany?.name || 'Holding Global'}</div>
                            <div style={{fontSize: '0.85rem', color: '#94a3b8', fontFamily: 'monospace', marginTop: '0.25rem'}}>{activeCompany?.ruc || 'CORPORATIVO'}</div>
                        </div>

                        <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
                            <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8rem', color: '#94a3b8'}}>
                                <Lock size={14} color="#10b981" />
                                <span>Aislamiento de CRM Activo</span>
                            </div>
                            <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8rem', color: '#94a3b8'}}>
                                <Database size={14} color="#10b981" />
                                <span>DB Segregada Lógicamente</span>
                            </div>
                        </div>

                        <div style={{marginTop: '2rem', padding: '1rem', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '1rem', border: '1px solid rgba(245, 158, 11, 0.2)'}}>
                            <div style={{display: 'flex', gap: '0.5rem', color: '#f59e0b'}}>
                                <AlertTriangle size={18} />
                                <span style={{fontSize: '0.75rem', fontWeight: '800'}}>AVISO DE SEGURIDAD</span>
                            </div>
                            <p style={{fontSize: '0.7rem', color: '#d97706', marginTop: '0.5rem', lineHeight: '1.4'}}>
                                Cambiar el modo de inventario requiere una conciliación física obligatoria para evitar discrepancias fiscales.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default GovernanceDashboard;
