import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Button from '../components/common/Button';
import LoadingScreen from '../components/common/LoadingScreen';

const SystemConfigPage = () => {
    const [config, setConfig] = useState({
        instance_name: '',
        reporting_currency: 'PEN',
        decimal_precision: 2,
        timezone: 'America/Lima'
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const response = await api.get('/config/');
            setConfig(response.data);
        } catch (error) {
            console.error('Error fetching config:', error);
            setMessage({ type: 'error', text: 'Error al cargar la configuración maestra' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            await api.put('/config/', config);
            setMessage({ type: 'success', text: 'Configuración global actualizada correctamente' });
        } catch (error) {
            setMessage({ type: 'error', text: 'Error al guardar la configuración' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <LoadingScreen message="Cargando configuración maestra..." />;

    return (
        <div className="system-config-container">
            <header className="config-header">
                <div className="header-title">
                    <h1>Configuración Global del Ecosistema</h1>
                    <span className="badge">Gobernanza Corporativa</span>
                </div>
                <p className="header-subtitle">Administra los parámetros maestros que rigen todo el ecosistema de software.</p>
            </header>

            {message && (
                <div className={`status-banner ${message.type}`}>
                    {message.type === 'success' ? '✅' : '❌'} {message.text}
                </div>
            )}

            <div className="config-grid">
                {/* CARD: IDENTIDAD DEL SISTEMA */}
                <section className="config-card">
                    <div className="card-header">
                        <span className="card-icon">🖥️</span>
                        <h3>Identidad del Ecosistema</h3>
                    </div>
                    <div className="card-body">
                        <div className="input-group">
                            <label>Nombre de la Instancia ERP</label>
                            <input 
                                type="text" 
                                value={config.instance_name}
                                placeholder="Ej: Dirogsa Cloud ERP"
                                onChange={(e) => setConfig({...config, instance_name: e.target.value})}
                            />
                            <p className="field-hint">Este nombre identifica a tu plataforma interna (aparecerá en la pestaña y cabeceras).</p>
                        </div>
                    </div>
                </section>

                {/* CARD: FINANZAS */}
                <section className="config-card">
                    <div className="card-header">
                        <span className="card-icon">💰</span>
                        <h3>Arquitectura Financiera del Holding</h3>
                    </div>
                    <div className="card-body">
                        <div className="input-group">
                            <label>Moneda de Reporte del Grupo (Consolidación)</label>
                            <select 
                                value={config.reporting_currency}
                                onChange={(e) => setConfig({...config, reporting_currency: e.target.value})}
                            >
                                <option value="PEN">Soles (PEN) - Perú</option>
                                <option value="USD">Dólares (USD) - Internacional</option>
                            </select>
                            <div className="alert-box warning">
                                <strong>⚠️ Moneda de Consolidación:</strong> Esta es la moneda en la que el dueño ve los balances sumados de todas las empresas.
                            </div>
                        </div>
                    </div>
                </section>

                {/* CARD: ESTÁNDARES */}
                <section className="config-card">
                    <div className="card-header">
                        <span className="card-icon">⚙️</span>
                        <h3>Estándares de Operación</h3>
                    </div>
                    <div className="card-body">
                        <div className="input-group">
                            <label>Precisión Decimal (Precios)</label>
                            <select 
                                value={config.decimal_precision}
                                onChange={(e) => setConfig({...config, decimal_precision: parseInt(e.target.value)})}
                            >
                                <option value={2}>2 Decimales (Estándar: 0.00)</option>
                                <option value={3}>3 Decimales (Rigor: 0.000)</option>
                                <option value={4}>4 Decimales (Importaciones: 0.0000)</option>
                            </select>
                            <p className="field-hint">Afecta cómo se muestran y calculan los precios unitarios en todo el sistema.</p>
                        </div>
                        <div className="input-group">
                            <label>Zona Horaria Maestro</label>
                            <select 
                                value={config.timezone}
                                onChange={(e) => setConfig({...config, timezone: e.target.value})}
                            >
                                <option value="America/Lima">Lima, Perú (GMT-5)</option>
                                <option value="America/Santiago">Santiago, Chile (GMT-4)</option>
                                <option value="America/Bogota">Bogotá, Colombia (GMT-5)</option>
                                <option value="UTC">Universal Time (UTC)</option>
                            </select>
                            <p className="field-hint">Sincroniza la hora de todas las facturas y logs de auditoría.</p>
                        </div>
                    </div>
                </section>
            </div>

            <footer className="config-footer">
                <Button 
                    variant="primary" 
                    size="large" 
                    onClick={handleSave}
                    disabled={saving}
                >
                    {saving ? 'Guardando Cambios...' : '💾 Guardar Configuración Maestra'}
                </Button>
            </footer>

            <style dangerouslySetInnerHTML={{ __html: `
                .system-config-container { padding: 40px; max-width: 1000px; margin: 0 auto; color: #e2e8f0; }
                .config-header { margin-bottom: 40px; border-left: 4px solid #3b82f6; padding-left: 20px; }
                .header-title { display: flex; align-items: center; gap: 15px; }
                .header-title h1 { font-size: 2.2rem; font-weight: 800; margin: 0; background: linear-gradient(to right, #fff, #94a3b8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
                .badge { background: rgba(59, 130, 246, 0.2); color: #60a5fa; padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; border: 1px solid rgba(59, 130, 246, 0.3); }
                .header-subtitle { color: #94a3b8; font-size: 1.1rem; margin-top: 10px; }
                
                .config-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 20px; }
                .config-card { background: #0f172a; border-radius: 16px; border: 1px solid #1e293b; padding: 25px; transition: transform 0.2s, border-color 0.2s; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
                .config-card:hover { border-color: #3b82f650; transform: translateY(-2px); }
                
                .card-header { display: flex; align-items: center; gap: 12px; margin-bottom: 25px; }
                .card-icon { font-size: 1.5rem; }
                .card-header h3 { margin: 0; font-size: 1.1rem; font-weight: 700; color: #f1f5f9; }
                
                .input-group { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; }
                .input-group label { font-size: 0.85rem; font-weight: 600; color: #94a3b8; }
                .input-group input, .input-group select { background: #1e293b; border: 1px solid #334155; padding: 12px; border-radius: 10px; color: white; font-size: 0.95rem; outline: none; transition: border-color 0.2s; }
                .input-group input:focus, .input-group select:focus { border-color: #3b82f6; }
                
                .field-hint { font-size: 0.75rem; color: #64748b; margin: 5px 0 0 0; }
                .alert-box { padding: 12px; border-radius: 10px; font-size: 0.8rem; margin-top: 10px; }
                .alert-box.warning { background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.2); color: #f59e0b; }
                
                .status-banner { padding: 15px; border-radius: 12px; margin-bottom: 30px; font-weight: 600; text-align: center; animation: slideIn 0.3s ease; }
                .status-banner.success { background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); color: #10b981; }
                .status-banner.error { background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); color: #ef4444; }
                
                .config-footer { margin-top: 50px; display: flex; justify-content: flex-end; padding-top: 30px; border-top: 1px solid #1e293b; }
                
                @keyframes slideIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
                
                @media (max-width: 768px) { .config-grid { grid-template-columns: 1fr; } }
            `}} />
        </div>
    );
};

export default SystemConfigPage;
