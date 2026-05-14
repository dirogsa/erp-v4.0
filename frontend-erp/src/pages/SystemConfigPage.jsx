import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Button from '../components/common/Button';
import LoadingScreen from '../components/common/LoadingScreen';
import { 
    ShieldCheck, Settings, Coins, CreditCard, 
    Zap, Save, Info, CheckCircle, AlertTriangle 
} from 'lucide-react';

const SystemConfigPage = () => {
    const [config, setConfig] = useState({
        instance_name: '',
        reporting_currency: 'PEN',
        decimal_precision: 2,
        timezone: 'America/Lima',
        allow_negative_stock: false,
        loyalty: {
            points_per_currency_unit: 1.0,
            is_active: true
        },
        sales_policy: {
            cash_discount_pct: 0.0,
            credit_30_days_pct: 3.0,
            credit_60_days_pct: 5.0,
            credit_90_days_pct: 8.0,
            min_margin_guard_pct: 12.0
        }
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);
    const [activeTab, setActiveTab] = useState('core');

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const response = await api.get('/config/');
            // Ensure nested objects exist to avoid crashes
            const data = response.data;
            if (!data.loyalty) data.loyalty = { points_per_currency_unit: 1, is_active: true };
            if (!data.sales_policy) data.sales_policy = { cash_discount_pct: 0, credit_30_days_pct: 3, credit_60_days_pct: 5, credit_90_days_pct: 8, min_margin_guard_pct: 12 };
            
            setConfig(data);
        } catch (error) {
            console.error('Error fetching config:', error);
            setMessage({ type: 'error', text: 'Error al cargar el Centro de Soberanía.' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            await api.put('/config/', config);
            setMessage({ type: 'success', text: 'Soberanía de Datos actualizada correctamente.' });
            setTimeout(() => setMessage(null), 5000);
        } catch (error) {
            setMessage({ type: 'error', text: 'Error al guardar los cambios en el núcleo del sistema.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <LoadingScreen message="Inicializando Centro de Soberanía..." />;

    return (
        <div className="sovereignty-hub-container">
            {/* High-Fidelity Header */}
            <header className="hub-header">
                <div className="hub-header-main">
                    <div className="hub-icon-wrapper">
                        <ShieldCheck size={32} color="#60a5fa" />
                    </div>
                    <div>
                        <h1>Centro de Soberanía y Gobernanza</h1>
                        <p>Control maestro de reglas de negocio, fidelización y políticas comerciales del ecosistema.</p>
                    </div>
                </div>
                
                <div className="hub-tabs">
                    <button 
                        className={`hub-tab ${activeTab === 'core' ? 'active' : ''}`}
                        onClick={() => setActiveTab('core')}
                    >
                        <Settings size={18} /> Núcleo ERP
                    </button>
                    <button 
                        className={`hub-tab ${activeTab === 'commercial' ? 'active' : ''}`}
                        onClick={() => setActiveTab('commercial')}
                    >
                        <CreditCard size={18} /> Soberanía Comercial
                    </button>
                    <button 
                        className={`hub-tab ${activeTab === 'loyalty' ? 'active' : ''}`}
                        onClick={() => setActiveTab('loyalty')}
                    >
                        <Coins size={18} /> Fidelización
                    </button>
                </div>
            </header>

            {message && (
                <div className={`hub-message-banner ${message.type}`}>
                    {message.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                    {message.text}
                </div>
            )}

            <main className="hub-content">
                {activeTab === 'core' && (
                    <div className="hub-grid">
                        <section className="hub-card">
                            <div className="hub-card-header">
                                <h3>Identidad e Instancia</h3>
                                <Info size={16} color="#64748b" />
                            </div>
                            <div className="hub-card-body">
                                <div className="hub-field">
                                    <label>Nombre de la Instancia</label>
                                    <input 
                                        type="text" 
                                        value={config.instance_name}
                                        onChange={(e) => setConfig({...config, instance_name: e.target.value})}
                                    />
                                    <span className="hub-hint">Aparecerá en el título del navegador y reportes oficiales.</span>
                                </div>
                                <div className="hub-field">
                                    <label>Zona Horaria</label>
                                    <select value={config.timezone} onChange={(e) => setConfig({...config, timezone: e.target.value})}>
                                        <option value="America/Lima">Lima, Perú (GMT-5)</option>
                                        <option value="UTC">Universal Time (UTC)</option>
                                    </select>
                                </div>
                            </div>
                        </section>

                        <section className="hub-card">
                            <div className="hub-card-header">
                                <h3>Parámetros de Operación</h3>
                                <Zap size={16} color="#64748b" />
                            </div>
                            <div className="hub-card-body">
                                <div className="hub-field">
                                    <label>Precisión Decimal</label>
                                    <select 
                                        value={config.decimal_precision}
                                        onChange={(e) => setConfig({...config, decimal_precision: parseInt(e.target.value)})}
                                    >
                                        <option value={2}>2 Decimales (Estándar)</option>
                                        <option value={3}>3 Decimales (Técnico)</option>
                                        <option value={4}>4 Decimales (Importación)</option>
                                    </select>
                                </div>
                                <div className="hub-field-toggle">
                                    <div className="toggle-text">
                                        <label>Permitir Stock Negativo</label>
                                        <span className="hub-hint">Usar solo durante migraciones o ajustes de inventario.</span>
                                    </div>
                                    <input 
                                        type="checkbox" 
                                        checked={config.allow_negative_stock}
                                        onChange={(e) => setConfig({...config, allow_negative_stock: e.target.checked})}
                                    />
                                </div>
                            </div>
                        </section>
                    </div>
                )}

                {activeTab === 'commercial' && (
                    <div className="hub-grid">
                        <section className="hub-card full-width">
                            <div className="hub-card-header">
                                <h3>Políticas de Recargo por Crédito</h3>
                                <span className="hub-badge">Estrategia Financiera</span>
                            </div>
                            <div className="hub-card-body">
                                <div className="policy-grid">
                                    <div className="hub-field">
                                        <label>Descuento Pago Contado (%)</label>
                                        <input 
                                            type="number" 
                                            value={config.sales_policy.cash_discount_pct}
                                            onChange={(e) => setConfig({
                                                ...config, 
                                                sales_policy: {...config.sales_policy, cash_discount_pct: parseFloat(e.target.value)}
                                            })}
                                        />
                                    </div>
                                    <div className="hub-field">
                                        <label>Recargo Crédito 30 Días (%)</label>
                                        <input 
                                            type="number" 
                                            value={config.sales_policy.credit_30_days_pct}
                                            onChange={(e) => setConfig({
                                                ...config, 
                                                sales_policy: {...config.sales_policy, credit_30_days_pct: parseFloat(e.target.value)}
                                            })}
                                        />
                                    </div>
                                    <div className="hub-field">
                                        <label>Recargo Crédito 60 Días (%)</label>
                                        <input 
                                            type="number" 
                                            value={config.sales_policy.credit_60_days_pct}
                                            onChange={(e) => setConfig({
                                                ...config, 
                                                sales_policy: {...config.sales_policy, credit_60_days_pct: parseFloat(e.target.value)}
                                            })}
                                        />
                                    </div>
                                    <div className="hub-field">
                                        <label>Recargo Crédito 90 Días (%)</label>
                                        <input 
                                            type="number" 
                                            value={config.sales_policy.credit_90_days_pct}
                                            onChange={(e) => setConfig({
                                                ...config, 
                                                sales_policy: {...config.sales_policy, credit_90_days_pct: parseFloat(e.target.value)}
                                            })}
                                        />
                                    </div>
                                </div>
                                
                                <div className="hub-divider" />

                                <div className="hub-section-subtitle">
                                    <Zap size={16} /> Estrategia de Volumen (E-Commerce)
                                </div>

                                <div className="policy-grid">
                                    <div className="hub-field">
                                        <label>Dscto. x 3 Unidades (%)</label>
                                        <input 
                                            type="number" 
                                            value={config.sales_policy.vol_3_discount_pct}
                                            onChange={(e) => setConfig({
                                                ...config, 
                                                sales_policy: {...config.sales_policy, vol_3_discount_pct: parseFloat(e.target.value)}
                                            })}
                                        />
                                    </div>
                                    <div className="hub-field">
                                        <label>Dscto. x 6 Unidades (%)</label>
                                        <input 
                                            type="number" 
                                            value={config.sales_policy.vol_6_discount_pct}
                                            onChange={(e) => setConfig({
                                                ...config, 
                                                sales_policy: {...config.sales_policy, vol_6_discount_pct: parseFloat(e.target.value)}
                                            })}
                                        />
                                    </div>
                                    <div className="hub-field">
                                        <label>Dscto. x 12 Unidades (%)</label>
                                        <input 
                                            type="number" 
                                            value={config.sales_policy.vol_12_discount_pct}
                                            onChange={(e) => setConfig({
                                                ...config, 
                                                sales_policy: {...config.sales_policy, vol_12_discount_pct: parseFloat(e.target.value)}
                                            })}
                                        />
                                    </div>
                                    <div className="hub-field" /> 
                                </div>
                                
                                <div className="hub-divider" />
                                
                                <div className="hub-field">
                                    <label>Margen de Seguridad (Stop-Loss %)</label>
                                    <input 
                                        type="number" 
                                        style={{ maxWidth: '200px' }}
                                        value={config.sales_policy.min_margin_guard_pct}
                                        onChange={(e) => setConfig({
                                            ...config, 
                                            sales_policy: {...config.sales_policy, min_margin_guard_pct: parseFloat(e.target.value)}
                                        })}
                                    />
                                    <span className="hub-hint">El sistema bloqueará ventas cuyo margen sea inferior a este porcentaje.</span>
                                </div>
                            </div>
                        </section>
                    </div>
                )}

                {activeTab === 'loyalty' && (
                    <div className="hub-grid">
                        <section className="hub-card">
                            <div className="hub-card-header">
                                <h3>Reglas de Fidelización</h3>
                                <Coins size={20} color="#f59e0b" />
                            </div>
                            <div className="hub-card-body">
                                <div className="hub-field">
                                    <label>Puntos por Unidad de Moneda (S/ o $)</label>
                                    <input 
                                        type="number" 
                                        value={config.loyalty.points_per_currency_unit}
                                        onChange={(e) => setConfig({
                                            ...config, 
                                            loyalty: {...config.loyalty, points_per_currency_unit: parseFloat(e.target.value)}
                                        })}
                                    />
                                    <span className="hub-hint">Ejemplo: 1.0 significa que S/ 100 de venta otorgan 100 puntos.</span>
                                </div>
                                <div className="hub-field-toggle">
                                    <div className="toggle-text">
                                        <label>Programa de Lealtad Activo</label>
                                        <span className="hub-hint">Si se desactiva, no se calcularán puntos en las nuevas facturas.</span>
                                    </div>
                                    <input 
                                        type="checkbox" 
                                        checked={config.loyalty.is_active}
                                        onChange={(e) => setConfig({
                                            ...config, 
                                            loyalty: {...config.loyalty, is_active: e.target.checked}
                                        })}
                                    />
                                </div>

                                <div className="hub-field-toggle" style={{ marginTop: '15px' }}>
                                    <div className="toggle-text">
                                        <label>Solo Acumulación Web</label>
                                        <span className="hub-hint">Si está activo, las ventas físicas (ERP) no otorgarán puntos al cliente.</span>
                                    </div>
                                    <input 
                                        type="checkbox" 
                                        checked={config.loyalty.only_web_accumulation}
                                        onChange={(e) => setConfig({
                                            ...config, 
                                            loyalty: {...config.loyalty, only_web_accumulation: e.target.checked}
                                        })}
                                    />
                                </div>
                            </div>
                        </section>
                    </div>
                )}
            </main>

            <footer className="hub-footer">
                <Button 
                    variant="primary" 
                    size="large" 
                    onClick={handleSave}
                    disabled={saving}
                    style={{ background: '#3b82f6', minWidth: '250px' }}
                >
                    <Save size={18} style={{ marginRight: '8px' }} />
                    {saving ? 'Aplicando Cambios...' : 'Guardar Soberanía Global'}
                </Button>
            </footer>

            <style>{`
                .sovereignty-hub-container { padding: 40px; max-width: 1200px; margin: 0 auto; min-height: 80vh; animation: fadeIn 0.4s ease-out; }
                
                .hub-header { margin-bottom: 40px; }
                .hub-header-main { display: flex; align-items: center; gap: 20px; margin-bottom: 30px; }
                .hub-icon-wrapper { background: rgba(59, 130, 246, 0.1); padding: 15px; border-radius: 12px; border: 1px solid rgba(59, 130, 246, 0.2); }
                .hub-header h1 { color: white; margin: 0; font-size: 2rem; font-weight: 800; letter-spacing: -0.02em; }
                .hub-header p { color: #64748b; margin: 5px 0 0 0; font-size: 1.1rem; }
                
                .hub-tabs { display: flex; gap: 10px; border-bottom: 1px solid #1e293b; padding-bottom: 1px; }
                .hub-tab { background: transparent; border: none; padding: 12px 24px; color: #64748b; cursor: pointer; display: flex; align-items: center; gap: 8px; font-weight: 600; border-radius: 10px 10px 0 0; transition: all 0.2s; position: relative; }
                .hub-tab:hover { color: #94a3b8; background: rgba(255,255,255,0.03); }
                .hub-tab.active { color: #3b82f6; background: rgba(59, 130, 246, 0.05); }
                .hub-tab.active::after { content: ''; position: absolute; bottom: -1px; left: 0; right: 0; height: 2px; background: #3b82f6; }
                
                .hub-message-banner { display: flex; align-items: center; gap: 12px; padding: 15px 25px; border-radius: 12px; margin-bottom: 30px; font-weight: 600; animation: slideDown 0.3s ease; }
                .hub-message-banner.success { background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); color: #10b981; }
                .hub-message-banner.error { background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); color: #ef4444; }
                
                .hub-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
                .hub-card { background: #0f172a; border: 1px solid #1e293b; border-radius: 20px; padding: 30px; }
                .hub-card.full-width { grid-column: 1 / -1; }
                .hub-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
                .hub-card-header h3 { margin: 0; color: #f1f5f9; font-size: 1.1rem; font-weight: 700; }
                
                .hub-field { display: flex; flexDirection: column; gap: 8px; margin-bottom: 24px; }
                .hub-field label { font-size: 0.85rem; font-weight: 600; color: #94a3b8; }
                .hub-field input, .hub-field select { background: #1e293b; border: 1px solid #334155; padding: 14px; border-radius: 12px; color: white; outline: none; font-size: 1rem; transition: border-color 0.2s; }
                .hub-field input:focus { border-color: #3b82f6; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); }
                .hub-hint { font-size: 0.75rem; color: #475569; margin-top: 4px; }
                
                .hub-section-subtitle { display: flex; align-items: center; gap: 10px; color: #60a5fa; font-weight: 700; font-size: 0.9rem; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 0.05em; }

                .hub-field-toggle { display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.02); padding: 20px; border-radius: 16px; border: 1px solid #1e293b; }
                .toggle-text { display: flex; flex-direction: column; gap: 4px; }
                .toggle-text label { font-weight: 700; color: #e2e8f0; font-size: 0.95rem; }
                
                .policy-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
                .hub-divider { height: 1px; background: #1e293b; margin: 30px 0; }
                .hub-badge { background: #3b82f622; color: #60a5fa; padding: 4px 10px; border-radius: 6px; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; }
                
                .hub-footer { margin-top: 50px; padding-top: 40px; border-top: 1px solid #1e293b; display: flex; justify-content: flex-end; }
                
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
                
                @media (max-width: 900px) { .hub-grid, .policy-grid { grid-template-columns: 1fr; } }
            `}</style>
        </div>
    );
};

export default SystemConfigPage;
