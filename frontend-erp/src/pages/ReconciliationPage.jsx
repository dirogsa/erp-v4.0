import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useNotification } from '../hooks/useNotification';
import { useLoading } from '../context/LoadingContext';

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
        bg: '#0f172a',
        card: 'rgba(30, 41, 59, 0.4)',
        border: 'rgba(255, 255, 255, 0.05)'
    };

    const cardStyle = {
        padding: '2rem',
        backgroundColor: COLORS.card,
        backdropFilter: 'blur(12px)',
        borderRadius: '1.5rem',
        border: `1px solid ${COLORS.border}`,
        transition: 'all 0.3s ease',
        position: 'relative',
        overflow: 'hidden'
    };

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        showLoading("Cargando configuración...", "Verificando parámetros del motor de stock.");
        try {
            const res = await api.get('/config/');
            setConfig(res.data);
        } catch (error) {
            console.error("Failed to fetch config", error);
            showNotification("Error al cargar la configuración", "error");
        } finally {
            hideLoading();
        }
    };

    const handleToggleNegativeStock = async () => {
        const newValue = !config.allow_negative_stock;
        
        if (newValue && !window.confirm("¡ADVERTENCIA CRÍTICA!\n\nAl activar el 'Modo Conciliación', el sistema permitirá que el stock baje a valores NEGATIVOS.\n\n¿Está seguro de activar esta función para la carga inicial de datos?")) {
            return;
        }

        showLoading("Actualizando Modo Operativo...", "Reconfigurando validadores de inventario.");
        try {
            await api.put('/config/', { allow_negative_stock: newValue });
            setConfig({ ...config, allow_negative_stock: newValue });
            showNotification(
                newValue ? "Modo Conciliación ACTIVADO (Stock Negativo permitido)" : "Modo Operación ACTIVADO (Validación de Stock estricta)",
                newValue ? "warning" : "success"
            );
        } catch (error) {
            console.error("Failed to update config", error);
            showNotification("Error al actualizar la configuración", "error");
        } finally {
            hideLoading();
        }
    };

    const handlePreview = async () => {
        const lines = rawData.split('\n').filter(l => l.trim());
        const adjustments = lines.map(line => {
            const parts = line.split('\t');
            if (parts.length < 3) return null;
            return {
                sku: parts[0].trim(),
                brand: parts[1].trim(),
                quantity: parseFloat(parts[2].trim())
            };
        }).filter(a => a !== null);

        if (adjustments.length === 0) {
            showNotification("Formato inválido. Use: SKU [Tab] MARCA [Tab] CANTIDAD", "warning");
            return;
        }

        showLoading("Procesando Sinceramiento...", "Analizando deltas de stock e impacto financiero.");
        try {
            const res = await api.post('/inventory/physical-stocktake', adjustments);
            setResults(res.data);
            showNotification("Análisis de stock completado", "success");
        } catch (error) {
            console.error("Failed to process stocktake", error);
            showNotification("Error al procesar el sinceramiento", "error");
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
        <div style={{ padding: '2.5rem', maxWidth: '1400px', margin: '0 auto', backgroundColor: COLORS.bg, minHeight: '100vh' }}>
            {/* Premium Header */}
            <header style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ color: 'white', fontSize: '2.5rem', fontWeight: '900', margin: 0, letterSpacing: '-0.03em' }}>
                        Centro de <span style={{ color: COLORS.primary }}>Conciliación</span>
                    </h1>
                    <p style={{ color: '#64748b', fontSize: '1rem', marginTop: '0.5rem' }}>Herramientas industriales de sinceramiento y migración 2026.</p>
                </div>
                <div style={{ 
                    background: 'rgba(30, 41, 59, 0.5)', padding: '0.75rem 1.5rem', 
                    borderRadius: '1rem', border: `1px solid ${COLORS.border}`, textAlign: 'right'
                }}>
                    <div style={{ color: COLORS.primary, fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Módulo Logístico</div>
                    <div style={{ color: 'white', fontSize: '1.1rem', fontWeight: '700' }}>{new Date().toLocaleDateString()}</div>
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                {/* Master Toggle Card */}
                <div style={{ 
                    ...cardStyle, 
                    borderLeft: `4px solid ${config.allow_negative_stock ? COLORS.warning : COLORS.success}`,
                    backgroundColor: config.allow_negative_stock ? 'rgba(245, 158, 11, 0.05)' : COLORS.card
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <h2 style={{ color: 'white', fontSize: '1.25rem', fontWeight: '900', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                                {config.allow_negative_stock ? '🟠 Modo Conciliación' : '🟢 Modo Estricto'}
                            </h2>
                            <p style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: '1.5', maxWidth: '300px' }}>
                                Determina si el ERP permite vender sin stock físico para regularizar facturas históricas.
                            </p>
                        </div>
                        <button 
                            onClick={handleToggleNegativeStock}
                            style={{
                                padding: '0.75rem 1.5rem',
                                borderRadius: '1rem',
                                border: 'none',
                                background: config.allow_negative_stock ? COLORS.warning : COLORS.primary,
                                color: 'white',
                                fontWeight: '900',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                textTransform: 'uppercase',
                                letterSpacing: '0.1em',
                                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                            }}
                        >
                            {config.allow_negative_stock ? 'Desactivar' : 'Activar'}
                        </button>
                    </div>
                </div>

                {/* Info Card */}
                <div style={{ ...cardStyle, background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)' }}>
                    <h3 style={{ color: COLORS.success, fontWeight: '900', textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '0.15em', marginBottom: '1.5rem' }}>
                        🛡️ Protocolo de Sinceramiento
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {[
                            { num: '01', text: 'Active el Modo Conciliación e inyecte facturas históricas.' },
                            { num: '02', text: 'Use el Motor Masivo para igualar stock del ERP al físico.' }
                        ].map(step => (
                            <div key={step.num} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <span style={{ color: COLORS.success, fontWeight: '900', fontSize: '1rem' }}>{step.num}.</span>
                                <p style={{ color: '#cbd5e1', fontSize: '0.85rem', margin: 0 }}>{step.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Industrial Stocktake Engine */}
            <div style={{ ...cardStyle, borderTop: `4px solid ${COLORS.primary}` }}>
                <div style={{ marginBottom: '2rem' }}>
                    <h2 style={{ color: 'white', fontSize: '1.5rem', fontWeight: '900', textTransform: 'uppercase' }}>🚀 Motor de Sinceramiento Masivo</h2>
                    <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Copie columnas desde Excel (SKU | Marca | Cantidad Física)</p>
                </div>

                {!results ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <textarea
                            style={{
                                width: '100%',
                                height: '200px',
                                backgroundColor: 'rgba(15, 23, 42, 0.5)',
                                border: `2px dashed ${COLORS.border}`,
                                borderRadius: '1.5rem',
                                padding: '1.5rem',
                                color: 'white',
                                fontFamily: 'monospace',
                                fontSize: '0.85rem',
                                outline: 'none',
                                resize: 'none'
                            }}
                            placeholder="WA6004	WIX	50\nPH3593A	FRAM	120"
                            value={rawData}
                            onChange={(e) => setRawData(e.target.value)}
                        />
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button 
                                onClick={handlePreview}
                                disabled={!rawData.trim()}
                                style={{
                                    padding: '1rem 3rem',
                                    borderRadius: '1.25rem',
                                    border: 'none',
                                    background: COLORS.primary,
                                    color: 'white',
                                    fontWeight: '900',
                                    fontSize: '0.9rem',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.15em',
                                    cursor: 'pointer',
                                    opacity: !rawData.trim() ? 0.3 : 1,
                                    boxShadow: `0 20px 30px -10px ${COLORS.primary}44`
                                }}
                            >
                                Ejecutar Análisis
                            </button>
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        {/* Summary Bar */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
                            {[
                                { label: 'Ajustados', value: results.summary.adjusted, color: COLORS.success },
                                { label: 'Sin Cambios', value: results.summary.equals, color: COLORS.primary },
                                { label: 'Fallidos', value: results.summary.failed, color: COLORS.danger },
                                { label: 'Impacto Fin.', value: `S/ ${results.summary.financial_impact.toLocaleString()}`, color: 'white' }
                            ].map((stat, idx) => (
                                <div key={idx} style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)', padding: '1.25rem', borderRadius: '1.25rem', border: `1px solid ${COLORS.border}` }}>
                                    <span style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: '900', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>{stat.label}</span>
                                    <span style={{ color: stat.color, fontSize: '1.5rem', fontWeight: '900' }}>{stat.value}</span>
                                </div>
                            ))}
                        </div>

                        {/* Results Table */}
                        <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)', borderRadius: '1.5rem', overflow: 'hidden', border: `1px solid ${COLORS.border}` }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', color: '#cbd5e1' }}>
                                <thead style={{ backgroundColor: 'rgba(255,255,255,0.02)', textTransform: 'uppercase', color: '#64748b' }}>
                                    <tr>
                                        <th style={{ padding: '1.25rem', textAlign: 'left' }}>Producto</th>
                                        <th style={{ padding: '1.25rem', textAlign: 'center' }}>ERP</th>
                                        <th style={{ padding: '1.25rem', textAlign: 'center' }}>Físico</th>
                                        <th style={{ padding: '1.25rem', textAlign: 'center' }}>Diferencia</th>
                                        <th style={{ padding: '1.25rem', textAlign: 'right' }}>Impacto</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {results.results.map((r, i) => (
                                        <tr key={i} style={{ borderTop: `1px solid ${COLORS.border}` }}>
                                            <td style={{ padding: '1.25rem' }}>
                                                <div style={{ fontWeight: '900', color: 'white' }}>{r.sku}</div>
                                                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{r.brand}</div>
                                            </td>
                                            <td style={{ padding: '1.25rem', textAlign: 'center', fontFamily: 'monospace' }}>{r.system}</td>
                                            <td style={{ padding: '1.25rem', textAlign: 'center', fontFamily: 'monospace', color: 'white', fontWeight: 'bold' }}>{r.physical}</td>
                                            <td style={{ 
                                                padding: '1.25rem', textAlign: 'center', fontWeight: '900',
                                                color: r.delta > 0 ? COLORS.success : r.delta < 0 ? COLORS.danger : '#475569'
                                            }}>
                                                {r.delta > 0 ? `+${r.delta}` : r.delta}
                                            </td>
                                            <td style={{ padding: '1.25rem', textAlign: 'right', fontWeight: 'bold' }}>S/ {r.impact || 0}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                            <button 
                                onClick={() => { setResults(null); setRawData(''); }}
                                style={{ background: 'transparent', border: 'none', color: '#64748b', fontWeight: 'bold', cursor: 'pointer' }}
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleCommit}
                                style={{
                                    padding: '1rem 3rem',
                                    borderRadius: '1.25rem',
                                    border: 'none',
                                    background: COLORS.success,
                                    color: 'white',
                                    fontWeight: '900',
                                    cursor: 'pointer'
                                }}
                            >
                                Finalizar Sinceramiento
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReconciliationPage;
