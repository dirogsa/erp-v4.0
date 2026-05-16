import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useNotification } from '../hooks/useNotification';
import { useLoading } from '../context/LoadingContext';
import { 
    Activity, ShieldAlert, ShieldCheck, ClipboardList, 
    Zap, AlertTriangle, CheckCircle2, ChevronRight, 
    HardDrive, RefreshCw, Info, Database
} from 'lucide-react';

const ReconciliationPage = () => {
    const [config, setConfig] = useState({ allow_negative_stock: false });
    const [rawData, setRawData] = useState('');
    const [results, setResults] = useState(null);
    const { showNotification } = useNotification();
    const { showLoading, hideLoading } = useLoading();

    const COLORS = {
        primary: '#3b82f6',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        bg: '#020617',
        card: 'rgba(15, 23, 42, 0.6)',
        border: 'rgba(255, 255, 255, 0.08)',
        accent: '#6366f1'
    };

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        showLoading("Cargando arquitectura...", "Sincronizando con el centro de mando de infraestructura.");
        try {
            const res = await api.get('/config/');
            setConfig(res.data);
        } catch (error) {
            showNotification("Fallo en enlace con infraestructura", "error");
        } finally {
            hideLoading();
        }
    };

    const handleToggleNegativeStock = async () => {
        const newValue = !config.allow_negative_stock;
        
        if (newValue && !window.confirm("¡PROTOCOLO DE RIESGO DETECTADO!\n\nEl 'Modo Conciliación' desactiva los frenos de inventario. El sistema operará sin validar existencias físicas.\n\n¿Desea romper el sello de seguridad?")) {
            return;
        }

        showLoading("Actualizando Protocolos...", "Cambiando validadores de stock en tiempo real.");
        try {
            await api.put('/config/', { allow_negative_stock: newValue });
            setConfig({ ...config, allow_negative_stock: newValue });
            showNotification(
                newValue ? "MODO CONCILIACIÓN ACTIVO" : "MODO ESTRICTO REESTABLECIDO",
                newValue ? "warning" : "success"
            );
        } catch (error) {
            showNotification("Fallo en cambio de protocolo", "error");
        } finally {
            hideLoading();
        }
    };

    const handlePreview = async () => {
        const lines = rawData.split('\n').filter(l => l.trim());
        const adjustments = lines.map(line => {
            const parts = line.split(/\t| {2,}/); // Soporta Tabs o múltiples espacios
            if (parts.length < 3) return null;
            return {
                sku: parts[0].trim(),
                brand: parts[1].trim(),
                quantity: parseFloat(parts[2].trim())
            };
        }).filter(a => a !== null);

        if (adjustments.length === 0) {
            showNotification("Detección de formato fallida", "warning");
            return;
        }

        showLoading("Iniciando Escaneo Masivo...", "Comparando registros ERP con datos de campo.");
        try {
            const res = await api.post('/inventory/physical-stocktake', adjustments);
            setResults(res.data);
            showNotification("Análisis de integridad completado", "success");
        } catch (error) {
            showNotification("Error en motor de sinceramiento", "error");
        } finally {
            hideLoading();
        }
    };

    const handleCommit = () => {
        showNotification("Stock sincerado con éxito", "success");
        setResults(null);
        setRawData('');
    };

    return (
        <div style={{ 
            padding: '2rem', maxWidth: '1600px', margin: '0 auto', 
            backgroundColor: COLORS.bg, minHeight: '100vh', color: 'white',
            fontFamily: "'Inter', sans-serif"
        }}>
            {/* 🛸 Industrial Header */}
            <header style={{ 
                marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', 
                alignItems: 'flex-end', borderBottom: `1px solid ${COLORS.border}`, 
                paddingBottom: '2rem' 
            }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                        <div style={{ padding: '0.5rem', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: '0.75rem' }}>
                            <Activity size={24} color={COLORS.primary} />
                        </div>
                        <span style={{ color: COLORS.primary, fontSize: '0.75rem', fontWeight: '900', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                            Infrastructure & Integrity
                        </span>
                    </div>
                    <h1 style={{ fontSize: '3rem', fontWeight: '900', margin: 0, letterSpacing: '-0.04em' }}>
                        Centro de <span style={{ background: `linear-gradient(to right, ${COLORS.primary}, ${COLORS.accent})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Conciliación</span>
                    </h1>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: '600' }}>ESTADO DE OPERACIONES</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: COLORS.success, boxShadow: `0 0 10px ${COLORS.success}` }}></div>
                        <span style={{ fontSize: '1.25rem', fontWeight: '800' }}>SISTEMA NOMINAL</span>
                    </div>
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '2.5rem', marginBottom: '3rem' }}>
                {/* 🛡️ Sovereign Mode Switch Card */}
                <div style={{ 
                    padding: '2.5rem', borderRadius: '2rem', backgroundColor: config.allow_negative_stock ? 'rgba(245, 158, 11, 0.03)' : COLORS.card,
                    border: `1px solid ${config.allow_negative_stock ? 'rgba(245, 158, 11, 0.3)' : COLORS.border}`,
                    position: 'relative', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
                }}>
                    {config.allow_negative_stock && (
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: `linear-gradient(90deg, ${COLORS.warning}, transparent)` }}></div>
                    )}
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                                {config.allow_negative_stock ? <ShieldAlert size={28} color={COLORS.warning} /> : <ShieldCheck size={28} color={COLORS.success} />}
                                <h2 style={{ fontSize: '1.75rem', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
                                    {config.allow_negative_stock ? 'Modo Conciliación' : 'Validación Estricta'}
                                </h2>
                            </div>
                            <p style={{ color: '#94a3b8', fontSize: '1rem', lineHeight: '1.6', maxWidth: '450px' }}>
                                Permite al ERP ignorar los frenos de stock físico. <br/>
                                <strong style={{ color: config.allow_negative_stock ? COLORS.warning : 'inherit' }}>
                                    {config.allow_negative_stock ? 'ADVERTENCIA: Se permiten saldos negativos para regularización.' : 'SISTEMA PROTEGIDO: No se puede vender lo que no existe.'}
                                </strong>
                            </p>
                        </div>
                        
                        <div style={{ textAlign: 'center' }}>
                            <div 
                                onClick={handleToggleNegativeStock}
                                style={{ 
                                    width: '180px', height: '80px', borderRadius: '40px', 
                                    backgroundColor: config.allow_negative_stock ? COLORS.warning : '#1e293b',
                                    display: 'flex', alignItems: 'center', padding: '10px',
                                    cursor: 'pointer', transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                    boxShadow: config.allow_negative_stock ? `0 0 30px ${COLORS.warning}44` : 'none',
                                    position: 'relative'
                                }}
                            >
                                <div style={{ 
                                    width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'white',
                                    transform: config.allow_negative_stock ? 'translateX(100px)' : 'translateX(0)',
                                    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
                                }}>
                                    {config.allow_negative_stock ? <AlertTriangle color={COLORS.warning} size={24} /> : <Zap color="#1e293b" size={24} />}
                                </div>
                                <span style={{ 
                                    position: 'absolute', left: config.allow_negative_stock ? '20px' : '85px',
                                    color: config.allow_negative_stock ? 'white' : '#64748b',
                                    fontWeight: '900', fontSize: '0.8rem', textTransform: 'uppercase',
                                    pointerEvents: 'none'
                                }}>
                                    {config.allow_negative_stock ? 'ACTIVO' : 'OFF'}
                                </span>
                            </div>
                            <div style={{ marginTop: '0.75rem', fontSize: '0.7rem', color: '#475569', fontWeight: 'bold' }}>SWITCH DE SEGURIDAD INDUSTRIAL</div>
                        </div>
                    </div>
                </div>

                {/* 📋 Workflow Cards */}
                <div style={{ padding: '2.5rem', borderRadius: '2rem', backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}`, display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <ClipboardList size={20} color={COLORS.primary} />
                        <h3 style={{ fontSize: '0.9rem', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Protocolo de Sinceramiento</h3>
                    </div>
                    <div style={{ position: 'relative' }}>
                        <div style={{ position: 'absolute', left: '15px', top: '20px', bottom: '20px', width: '2px', backgroundColor: 'rgba(59, 130, 246, 0.2)' }}></div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            {[
                                { step: '01', title: 'Apertura de Brecha', text: 'Active Modo Conciliación para inyectar ventas históricas sin stock.', icon: Database },
                                { step: '02', title: 'Equilibrio de Masa', text: 'Use el motor de inyección Excel para igualar el stock del ERP con el almacén.', icon: RefreshCw }
                            ].map((s, idx) => (
                                <div key={idx} style={{ display: 'flex', gap: '1.5rem', position: 'relative' }}>
                                    <div style={{ 
                                        width: '32px', height: '32px', borderRadius: '50%', backgroundColor: COLORS.bg, 
                                        border: `2px solid ${COLORS.primary}`, zIndex: 1, display: 'flex', 
                                        alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '900' 
                                    }}>
                                        {s.step}
                                    </div>
                                    <div>
                                        <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', fontWeight: '800' }}>{s.title}</h4>
                                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', lineHeight: '1.4' }}>{s.text}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* 🚀 Ingestor Engine Box */}
            <div style={{ 
                padding: '3rem', borderRadius: '2.5rem', backgroundColor: COLORS.card, 
                border: `1px solid ${COLORS.border}`, boxShadow: '0 30px 60px rgba(0,0,0,0.4)',
                position: 'relative'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                    <div>
                        <h2 style={{ fontSize: '2rem', fontWeight: '900', margin: 0 }}>Motor de Sinceramiento Masivo</h2>
                        <p style={{ color: '#64748b', marginTop: '0.5rem' }}>Procesamiento de matrices de stock físico mediante pegado directo.</p>
                    </div>
                    {results && (
                        <button onClick={() => setResults(null)} style={{ background: 'transparent', border: `1px solid ${COLORS.border}`, padding: '0.75rem 1.5rem', borderRadius: '1rem', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>Reiniciar Motor</button>
                    )}
                </div>

                {!results ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <div style={{ position: 'relative' }}>
                            <textarea
                                style={{
                                    width: '100%', height: '300px', backgroundColor: '#020617',
                                    border: `2px solid ${COLORS.border}`, borderRadius: '1.5rem',
                                    padding: '2rem', color: COLORS.success, fontFamily: "'JetBrains Mono', monospace",
                                    fontSize: '0.9rem', outline: 'none', resize: 'none',
                                    boxShadow: 'inset 0 10px 20px rgba(0,0,0,0.5)',
                                    lineHeight: '1.6'
                                }}
                                placeholder="Estructura: SKU [Tab] MARCA [Tab] CANTIDAD_FÍSICA"
                                value={rawData}
                                onChange={(e) => setRawData(e.target.value)}
                            />
                            <div style={{ position: 'absolute', bottom: '1.5rem', right: '1.5rem', display: 'flex', gap: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#475569', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                    <ChevronRight size={14} /> LISTO PARA ESCANEO
                                </div>
                            </div>
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <button 
                                onClick={handlePreview}
                                disabled={!rawData.trim()}
                                style={{
                                    padding: '1.25rem 5rem', borderRadius: '4rem', border: 'none',
                                    background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.accent})`,
                                    color: 'white', fontWeight: '900', fontSize: '1rem',
                                    textTransform: 'uppercase', letterSpacing: '0.2em', cursor: 'pointer',
                                    boxShadow: `0 20px 40px ${COLORS.primary}44`,
                                    transition: 'all 0.3s ease', opacity: !rawData.trim() ? 0.3 : 1,
                                    display: 'flex', alignItems: 'center', gap: '1rem'
                                }}
                            >
                                <Zap size={20} /> Ejecutar Análisis de Masa
                            </button>
                        </div>
                    </div>
                ) : (
                    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
                        {/* 📊 Summary Stats Dashboard */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
                            {[
                                { label: 'Ajustes de Inventario', value: results.summary.adjusted, color: COLORS.warning, icon: RefreshCw },
                                { label: 'Integridad Total', value: results.summary.equals, color: COLORS.success, icon: CheckCircle2 },
                                { label: 'SKUs No Encontrados', value: results.summary.failed, color: COLORS.danger, icon: ShieldAlert },
                                { label: 'Impacto en Valorización', value: `S/ ${results.summary.financial_impact.toLocaleString()}`, color: 'white', icon: HardDrive }
                            ].map((stat, idx) => (
                                <div key={idx} style={{ 
                                    backgroundColor: 'rgba(15, 23, 42, 0.4)', padding: '2rem', borderRadius: '1.5rem', 
                                    border: `1px solid ${COLORS.border}`, display: 'flex', flexDirection: 'column', gap: '1rem'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <stat.icon size={20} color={stat.color} />
                                        <span style={{ fontSize: '0.7rem', fontWeight: '900', color: '#475569', textTransform: 'uppercase' }}>T-METRIC</span>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '2rem', fontWeight: '900', color: stat.color }}>{stat.value}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', marginTop: '0.25rem' }}>{stat.label}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* 📋 Detailed Scan Results */}
                        <div style={{ 
                            backgroundColor: 'rgba(15, 23, 42, 0.5)', borderRadius: '1.5rem', 
                            overflow: 'hidden', border: `1px solid ${COLORS.border}`, marginBottom: '2rem' 
                        }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderBottom: `1px solid ${COLORS.border}` }}>
                                        <th style={{ padding: '1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '900', color: '#475569' }}>PRODUCTO / MARCA</th>
                                        <th style={{ padding: '1.5rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: '900', color: '#475569' }}>STOCK ERP</th>
                                        <th style={{ padding: '1.5rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: '900', color: '#475569' }}>CONTEO FÍSICO</th>
                                        <th style={{ padding: '1.5rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: '900', color: '#475569' }}>DELTA</th>
                                        <th style={{ padding: '1.5rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: '900', color: '#475569' }}>VALORIZACIÓN</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {results.results.map((r, i) => (
                                        <tr key={i} style={{ borderBottom: `1px solid ${COLORS.border}`, transition: 'background 0.2s' }}>
                                            <td style={{ padding: '1.5rem' }}>
                                                <div style={{ fontWeight: '900', color: 'white', fontSize: '1rem' }}>{r.sku}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>{r.brand}</div>
                                            </td>
                                            <td style={{ padding: '1.5rem', textAlign: 'center', fontFamily: "'JetBrains Mono', monospace", color: '#475569' }}>{r.system}</td>
                                            <td style={{ padding: '1.5rem', textAlign: 'center', fontFamily: "'JetBrains Mono', monospace", color: 'white', fontWeight: '900' }}>{r.physical}</td>
                                            <td style={{ padding: '1.5rem', textAlign: 'center' }}>
                                                <span style={{ 
                                                    padding: '0.5rem 1rem', borderRadius: '2rem', fontWeight: '900', fontSize: '0.85rem',
                                                    backgroundColor: r.delta > 0 ? 'rgba(16, 185, 129, 0.1)' : r.delta < 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                                                    color: r.delta > 0 ? COLORS.success : r.delta < 0 ? COLORS.danger : COLORS.primary
                                                }}>
                                                    {r.delta > 0 ? `+${r.delta}` : r.delta}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1.5rem', textAlign: 'right', fontWeight: '900', color: 'white' }}>
                                                S/ {r.impact?.toLocaleString() || 0}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1.5rem', alignItems: 'center' }}>
                            <span style={{ color: '#475569', fontSize: '0.85rem' }}>¿Confirmar ajustes en el maestro de inventarios?</span>
                            <button 
                                onClick={handleCommit}
                                style={{
                                    padding: '1.25rem 4rem', borderRadius: '1rem', border: 'none',
                                    backgroundColor: COLORS.success, color: 'white', fontWeight: '900',
                                    fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer',
                                    boxShadow: `0 20px 40px ${COLORS.success}44`
                                }}
                            >
                                Finalizar Sinceramiento
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* 🛸 Industrial Timeline Info */}
            <div style={{ marginTop: '3rem', textAlign: 'center' }}>
                <p style={{ color: '#475569', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <Info size={14} /> Todas las operaciones son auditadas bajo el protocolo de cumplimiento fiscal 2026.
                </p>
            </div>
        </div>
    );
};

export default ReconciliationPage;
