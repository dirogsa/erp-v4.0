import React, { useState, useEffect } from 'react';
import { marketingService } from '../services/api';
import { useNotification } from '../hooks/useNotification';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

const Marketing = () => {
    const { showNotification } = useNotification();
    const [config, setConfig] = useState({
        points_per_sole: 1,
        local_to_web_rate: 1.0,
        only_web_accumulation: false,
        is_active: true
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        try {
            const res = await marketingService.getLoyaltyConfig();
            setConfig(res.data);
        } catch (error) {
            console.error("Error loading loyalty config", error);
            showNotification("Error al cargar configuración", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        if (e) e.preventDefault();
        setSaving(true);
        try {
            await marketingService.updateLoyaltyConfig(config);
            showNotification("Configuración de marketing guardada", "success");
        } catch (error) {
            showNotification("Error al guardar cambios", "error");
        } finally {
            setSaving(false);
        }
    };

    const styles = {
        container: {
            padding: '2rem',
            maxWidth: '1200px',
            margin: '0 auto',
            color: '#e2e8f0',
        },
        header: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            paddingBottom: '1.5rem',
            marginBottom: '2rem'
        },
        badge: (active) => ({
            padding: '0.4rem 1rem',
            borderRadius: '99px',
            fontSize: '0.75rem',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            backgroundColor: active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            color: active ? '#10b981' : '#ef4444',
            border: `1px solid ${active ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
        }),
        grid: {
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) 350px',
            gap: '2rem',
        },
        card: {
            background: '#111827',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '1rem',
            overflow: 'hidden',
        },
        cardHeader: {
            padding: '1.25rem 1.5rem',
            background: 'rgba(255,255,255,0.03)',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            fontWeight: 'bold'
        },
        cardBody: {
            padding: '2rem'
        },
        inputGrid: {
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1.5rem',
            marginBottom: '2rem'
        },
        toggleCard: (active, color) => ({
            padding: '1.25rem',
            borderRadius: '0.75rem',
            border: `1px solid ${active ? color : 'transparent'}`,
            background: active ? `${color}10` : 'rgba(255,255,255,0.05)',
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start'
        }),
        tipBox: {
            background: 'rgba(59, 130, 246, 0.1)',
            padding: '1rem',
            borderRadius: '0.75rem',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            marginTop: '2rem'
        },
        simulator: {
            background: 'linear-gradient(135deg, #2563eb, #1e40af)',
            padding: '1.5rem',
            borderRadius: '1rem',
            color: 'white',
        },
        simBox: {
            background: 'rgba(255,255,255,0.1)',
            padding: '1rem',
            borderRadius: '0.75rem',
            border: '1px solid rgba(255,255,255,0.1)',
            marginTop: '1rem'
        }
    };

    if (loading) return (
        <div style={{ padding: '4rem', textAlign: 'center', color: 'white' }}>
            <span style={{ fontSize: '2rem' }}>⌛</span>
            <p>Cargando configuración...</p>
        </div>
    );

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: '800', color: 'white' }}>Marketing & Fidelización</h1>
                    <p style={{ margin: '0.5rem 0 0', color: '#94a3b8' }}>Estrategia de crecimiento y retención bimodal.</p>
                </div>
                <div style={styles.badge(config.is_active)}>
                    {config.is_active ? '● Sistema Activo' : '○ Sistema Pausado'}
                </div>
            </header>

            <div style={styles.grid}>
                {/* Panel Principal */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div style={styles.card}>
                        <div style={styles.cardHeader}>
                            <span style={{ padding: '4px 8px', background: 'rgba(59, 130, 246, 0.2)', borderRadius: '6px', fontSize: '0.8rem' }}>⚙️</span>
                            Motor de Puntos
                        </div>
                        <div style={styles.cardBody}>
                            <div style={styles.inputGrid}>
                                <div>
                                    <Input
                                        label="Ratio de Ganancia (Global)"
                                        type="number"
                                        step="0.1"
                                        value={config.points_per_sole}
                                        onChange={(e) => setConfig({ ...config, points_per_sole: parseFloat(e.target.value) || 0 })}
                                    />
                                    <small style={{ color: '#64748b' }}>Puntos por cada S/ 1.00</small>
                                </div>
                                <div>
                                    <Input
                                        label="Tasa de Conversión (L ➜ W)"
                                        type="number"
                                        step="0.1"
                                        value={config.local_to_web_rate}
                                        onChange={(e) => setConfig({ ...config, local_to_web_rate: parseFloat(e.target.value) || 0 })}
                                    />
                                    <small style={{ color: '#64748b' }}>1 Pto Local = X Puntos Web</small>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div
                                    style={styles.toggleCard(config.only_web_accumulation, '#3b82f6')}
                                    onClick={() => setConfig({ ...config, only_web_accumulation: !config.only_web_accumulation })}
                                >
                                    <div>
                                        <h4 style={{ margin: '0 0 0.25rem', fontSize: '0.9rem', color: 'white' }}>Exclusividad Web</h4>
                                        <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>
                                            {config.only_web_accumulation ? "Solo ventas web suman puntos." : "Ventas mixtas permitidas."}
                                        </p>
                                    </div>
                                    <div style={{ fontSize: '1.2rem' }}>{config.only_web_accumulation ? '🟦' : '⬜'}</div>
                                </div>

                                <div
                                    style={styles.toggleCard(config.is_active, '#10b981')}
                                    onClick={() => setConfig({ ...config, is_active: !config.is_active })}
                                >
                                    <div>
                                        <h4 style={{ margin: '0 0 0.25rem', fontSize: '0.9rem', color: 'white' }}>Estado Global</h4>
                                        <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>
                                            {config.is_active ? "Programa encendido." : "Programa apagado."}
                                        </p>
                                    </div>
                                    <div style={{ fontSize: '1.2rem' }}>{config.is_active ? '✅' : '⏹️'}</div>
                                </div>
                            </div>

                            <div style={styles.tipBox}>
                                <h5 style={{ color: '#60a5fa', margin: '0 0 0.5rem', fontSize: '0.85rem' }}>💡 Estrategia Híbrida</h5>
                                <p style={{ margin: 0, fontSize: '0.75rem', color: '#93c5fd', lineHeight: '1.4' }}>
                                    Los puntos de ventas locales se guardan en una "Bóveda Interna". Utiliza la Tasa de Conversión para premiar a clientes que migran a la tienda digital.
                                </p>
                            </div>

                            <div style={{ marginTop: '2.5rem', textAlign: 'right', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem' }}>
                                <Button
                                    onClick={handleSave}
                                    variant="primary"
                                    loading={saving}
                                    style={{ padding: '0.8rem 2.5rem', borderRadius: '10px' }}
                                >
                                    Guardar Cambios
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                        {[
                            { icon: '🎁', title: 'Premios', desc: 'Canjes en web' },
                            { icon: '📊', title: 'Ranking', desc: 'Próximamente' },
                            { icon: '⚡', title: 'Boosts', desc: 'Próximamente' }
                        ].map((item, i) => (
                            <div key={i} style={{ padding: '1rem', background: '#111827', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                                <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{item.icon}</div>
                                <h5 style={{ margin: '0 0 0.25rem', fontSize: '0.8rem', color: 'white' }}>{item.title}</h5>
                                <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b' }}>{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sidebar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={styles.simulator}>
                        <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span>🎮</span> Simulador
                        </h3>
                        <div style={styles.simBox}>
                            <p style={{ margin: '0 0 0.5rem', fontSize: '0.7rem', opacity: 0.8, textTransform: 'uppercase' }}>Venta de S/ 500</p>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{Math.floor(500 * config.points_per_sole)}</span>
                                <span style={{ fontSize: '0.8rem', opacity: 0.9 }}>Puntos</span>
                            </div>
                        </div>
                        <div style={styles.simBox}>
                            <p style={{ margin: '0 0 0.5rem', fontSize: '0.7rem', opacity: 0.8, textTransform: 'uppercase' }}>Conversión Local</p>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.85rem' }}>
                                <b>100 Local</b> ➜ <b>{Math.floor(100 * config.local_to_web_rate)} Web</b>
                            </div>
                        </div>
                    </div>

                    <div style={{ padding: '1.5rem', background: '#111827', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <h4 style={{ margin: '0 0 1rem', fontSize: '0.8rem', textTransform: 'uppercase', color: '#94a3b8', textAlign: 'center' }}>Flujos de Valor</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <span style={{ color: '#3b82f6' }}>🌐</span>
                                <div>
                                    <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 'bold', color: 'white' }}>Cisterna Web</p>
                                    <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b' }}>Saldo líquido de canje inmediato.</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <span style={{ color: '#a855f7' }}>🏢</span>
                                <div>
                                    <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 'bold', color: 'white' }}>Bóveda ERP</p>
                                    <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b' }}>Saldo interno acumulado en tienda.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Marketing;
