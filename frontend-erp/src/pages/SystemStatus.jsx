import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useNotification } from '../hooks/useNotification';
import { useLoading } from '../context/LoadingContext';
import { 
    ServerStackIcon, 
    GlobeAltIcon, 
    DevicePhoneMobileIcon, 
    CheckCircleIcon, 
    XCircleIcon, 
    ArrowPathIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const SystemStatus = () => {
    const [services, setServices] = useState([]);
    const [lastSync, setLastSync] = useState(null);
    const { showNotification } = useNotification();
    const { showLoading, hideLoading } = useLoading();

    const COLORS = {
        live: '#10b981',
        build_failed: '#ef4444',
        building: '#3b82f6',
        canceled: '#64748b',
        bg: '#0f172a',
        card: 'rgba(30, 41, 59, 0.4)',
        border: 'rgba(255, 255, 255, 0.05)'
    };

    const fetchStatus = async (isSilent = false) => {
        if (!isSilent) showLoading("Escaneando Infraestructura...", "Consultando nodos de Render API.");
        try {
            const res = await api.get('/config/infrastructure/status');
            setServices(res.data);
            setLastSync(new Date());
            if (!isSilent) showNotification("Sincronización de salud exitosa", "success");
        } catch (error) {
            console.error("Health check failed", error);
            showNotification("Error de conexión con la API de Infraestructura", "error");
        } finally {
            if (!isSilent) hideLoading();
        }
    };

    useEffect(() => {
        fetchStatus();
        const interval = setInterval(() => fetchStatus(true), 30000); // Auto-refresh cada 30s
        return () => clearInterval(interval);
    }, []);

    const getIcon = (type) => {
        switch(type) {
            case 'web': return <ServerStackIcon className="w-8 h-8" />;
            case 'static': return <GlobeAltIcon className="w-8 h-8" />;
            case 'mobile': return <DevicePhoneMobileIcon className="w-8 h-8" />;
            default: return <GlobeAltIcon className="w-8 h-8" />;
        }
    };

    const getStatusColor = (status) => {
        if (status === 'live' || status === 'operational') return COLORS.live;
        if (status === 'build_failed') return COLORS.build_failed;
        if (status === 'building') return COLORS.building;
        return COLORS.canceled;
    };

    return (
        <div style={{ padding: '2.5rem', maxWidth: '1400px', margin: '0 auto', backgroundColor: COLORS.bg, minHeight: '100vh' }}>
            <header style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ color: 'white', fontSize: '2.5rem', fontWeight: '900', letterSpacing: '-0.04em' }}>
                        Dirogsa <span style={{ color: '#3b82f6' }}>Control Tower</span>
                    </h1>
                    <p style={{ color: '#64748b', marginTop: '0.5rem' }}>Monitoreo en tiempo real de la infraestructura en la nube.</p>
                </div>
                <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                    <button 
                        onClick={() => fetchStatus()}
                        className="group flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-5 py-2.5 rounded-xl border border-white/5 transition-all active:scale-95"
                    >
                        <ArrowPathIcon className="w-5 h-5 text-blue-400 group-hover:rotate-180 transition-transform duration-500" />
                        <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Sincronizar Ahora</span>
                    </button>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Último Pulso</div>
                        <div style={{ color: 'white', fontSize: '1.2rem', fontWeight: '700' }}>
                            {lastSync ? lastSync.toLocaleTimeString() : '--:--:--'}
                        </div>
                    </div>
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
                {services.map((svc) => (
                    <div key={svc.name} style={{
                        backgroundColor: COLORS.card,
                        backdropFilter: 'blur(10px)',
                        padding: '2rem',
                        borderRadius: '1.5rem',
                        border: `1px solid ${COLORS.border}`,
                        borderTop: `4px solid ${getStatusColor(svc.status)}`,
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                            <div style={{ color: getStatusColor(svc.status) }}>
                                {getIcon(svc.name.includes('mobile') ? 'mobile' : svc.type)}
                            </div>
                            <div style={{ 
                                backgroundColor: `${getStatusColor(svc.status)}22`, 
                                color: getStatusColor(svc.status),
                                padding: '0.4rem 1rem',
                                borderRadius: '2rem',
                                fontSize: '0.7rem',
                                fontWeight: '900',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em'
                            }}>
                                {svc.status}
                            </div>
                        </div>

                        <h3 style={{ color: 'white', fontSize: '1.25rem', fontWeight: '900', marginBottom: '0.25rem' }}>{svc.name}</h3>
                        <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1.5rem' }}>{svc.url || 'Internal Service'}</p>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                {svc.status === 'live' || svc.status === 'operational' ? (
                                    <CheckCircleIcon className="w-5 h-5" style={{ color: COLORS.live }} />
                                ) : svc.status === 'building' ? (
                                    <ArrowPathIcon className="w-5 h-5 animate-spin" style={{ color: COLORS.building }} />
                                ) : (
                                    <XCircleIcon className="w-5 h-5" style={{ color: COLORS.build_failed }} />
                                )}
                                <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                    {svc.status === 'live' ? 'Servicio Operativo' : svc.status === 'building' ? 'Construyendo...' : 'Fallo en Despliegue'}
                                </span>
                            </div>
                            
                            {svc.commit_id && (
                                <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#475569', display: 'flex', gap: '0.5rem' }}>
                                    <span style={{ backgroundColor: '#1e293b', padding: '0.1rem 0.4rem', borderRadius: '0.25rem', color: '#94a3b8' }}>
                                        #{svc.commit_id}
                                    </span>
                                    <span className="truncate" title={svc.commit_msg}>
                                        {svc.commit_msg || 'Sin mensaje de commit'}
                                    </span>
                                </div>
                            )}
                        </div>

                        {svc.last_error && (
                            <div style={{ 
                                marginTop: '0.5rem', 
                                padding: '1rem', 
                                backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                                borderRadius: '1rem',
                                border: '1px solid rgba(239, 68, 68, 0.2)'
                            }}>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                                    <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />
                                    <span style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 'bold' }}>ERROR DE RENDER</span>
                                </div>
                                <p style={{ color: '#f87171', fontSize: '0.75rem', fontFamily: 'monospace', margin: 0, overflowWrap: 'break-word' }}>
                                    {svc.last_error}
                                </p>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {services.length === 0 && (
                <div style={{ textAlign: 'center', padding: '5rem', color: '#64748b' }}>
                    <ServerStackIcon className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p>No se encontraron servicios configurados en Render.</p>
                    <p style={{ fontSize: '0.8rem' }}>Asegúrate de configurar la RENDER_API_KEY en el backend.</p>
                </div>
            )}
        </div>
    );
};

export default SystemStatus;
