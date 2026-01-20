import React, { useState, useEffect } from 'react';
import { salesPolicyService } from '../services/api';
import { useNotification } from '../hooks/useNotification';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

const SalesPolicies = () => {
    const [policies, setPolicies] = useState({
        cash_discount: 0,
        credit_30_days: 0,
        credit_60_days: 0,
        credit_90_days: 0,
        credit_180_days: 0,
        // Relational Engine Fields
        retail_markup_pct: 20,
        vol_6_discount_pct: 3,
        vol_12_discount_pct: 7,
        vol_24_discount_pct: 12,
        // Security Guard
        min_margin_guard_pct: 12
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { showNotification } = useNotification();

    useEffect(() => {
        fetchPolicies();
    }, []);

    const fetchPolicies = async () => {
        try {
            const res = await salesPolicyService.getPolicies();
            setPolicies(res.data);
        } catch (error) {
            showNotification('Error al cargar políticas', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await salesPolicyService.updatePolicies(policies);
            showNotification('Políticas actualizadas correctamente', 'success');
        } catch (error) {
            showNotification('Error al guardar cambios', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (field, value) => {
        setPolicies(prev => ({
            ...prev,
            [field]: parseFloat(value) || 0
        }));
    };

    if (loading) return <div style={{ padding: '2rem', color: 'white' }}>Cargando políticas...</div>;

    return (
        <div style={{ padding: '2rem' }}>
            <header style={{ marginBottom: '2rem' }}>
                <h1 style={{ color: 'white' }}>⚖️ Políticas Comerciales</h1>
                <p style={{ color: '#94a3b8' }}>Define los porcentajes de recargo financiero por plazos de crédito.</p>
            </header>

            <div className="card" style={{ maxWidth: '600px', backgroundColor: '#1e293b', padding: '2rem', borderRadius: '1rem' }}>
                <form onSubmit={handleSave}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ color: '#e2e8f0', display: 'block', marginBottom: '0.5rem' }}>
                            Descuento por Contado (%)
                        </label>
                        <Input
                            type="number"
                            step="0.01"
                            value={policies.cash_discount}
                            onChange={(e) => handleChange('cash_discount', e.target.value)}
                            placeholder="Ej: 0.00"
                        />
                        <small style={{ color: '#64748b' }}>Usar 0 para precio base, o valores negativos para recargos.</small>
                    </div>

                    <div style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: 'rgba(59, 130, 246, 0.05)', borderRadius: '0.75rem', border: '1px solid #3b82f644' }}>
                        <h3 style={{ color: '#3b82f6', fontSize: '1rem', marginTop: 0, marginBottom: '1rem' }}>🤖 Motor Relacional (Precios Automáticos)</h3>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ color: '#e2e8f0', display: 'block', marginBottom: '0.5rem' }}>
                                Margen Minorista Sugerido (%)
                            </label>
                            <Input
                                type="number"
                                step="0.1"
                                value={policies.retail_markup_pct}
                                onChange={(e) => handleChange('retail_markup_pct', e.target.value)}
                            />
                            <small style={{ color: '#94a3b8' }}>Se aplica sobre el Precio Mayorista para calcular el Minorista.</small>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Desc. Vol 6 (%)</label>
                                <Input
                                    type="number"
                                    value={policies.vol_6_discount_pct}
                                    onChange={(e) => handleChange('vol_6_discount_pct', e.target.value)}
                                />
                            </div>
                            <div>
                                <label style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Desc. Vol 12 (%)</label>
                                <Input
                                    type="number"
                                    value={policies.vol_12_discount_pct}
                                    onChange={(e) => handleChange('vol_12_discount_pct', e.target.value)}
                                />
                            </div>
                            <div>
                                <label style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Desc. Vol 24 (%)</label>
                                <Input
                                    type="number"
                                    value={policies.vol_24_discount_pct}
                                    onChange={(e) => handleChange('vol_24_discount_pct', e.target.value)}
                                />
                            </div>
                        </div>
                        <small style={{ color: '#64748b', display: 'block', marginTop: '0.5rem' }}>
                            Estos descuentos se aplican automáticamente en cascada al cambiar el Precio Mayorista.
                        </small>

                        <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '0.5rem', border: '1px solid #ef444455' }}>
                            <label style={{ color: '#f87171', display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                                🛡️ Escudo de Rentabilidad (Margen Mínimo %)
                            </label>
                            <Input
                                type="number"
                                value={policies.min_margin_guard_pct}
                                onChange={(e) => handleChange('min_margin_guard_pct', e.target.value)}
                            />
                            <small style={{ color: '#fca5a5' }}>BLOQUEO: El sistema alertará si cualquier precio cae por debajo de este margen sobre el costo.</small>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                        <div>
                            <label style={{ color: '#e2e8f0', display: 'block', marginBottom: '0.5rem' }}>Recargo 30 días (%)</label>
                            <Input
                                type="number"
                                step="0.01"
                                value={policies.credit_30_days}
                                onChange={(e) => handleChange('credit_30_days', e.target.value)}
                            />
                        </div>
                        <div>
                            <label style={{ color: '#e2e8f0', display: 'block', marginBottom: '0.5rem' }}>Recargo 60 días (%)</label>
                            <Input
                                type="number"
                                step="0.01"
                                value={policies.credit_60_days}
                                onChange={(e) => handleChange('credit_60_days', e.target.value)}
                            />
                        </div>
                        <div>
                            <label style={{ color: '#e2e8f0', display: 'block', marginBottom: '0.5rem' }}>Recargo 90 días (%)</label>
                            <Input
                                type="number"
                                step="0.01"
                                value={policies.credit_90_days}
                                onChange={(e) => handleChange('credit_90_days', e.target.value)}
                            />
                        </div>
                        <div>
                            <label style={{ color: '#e2e8f0', display: 'block', marginBottom: '0.5rem' }}>Recargo 180 días (%)</label>
                            <Input
                                type="number"
                                step="0.01"
                                value={policies.credit_180_days}
                                onChange={(e) => handleChange('credit_180_days', e.target.value)}
                            />
                        </div>
                    </div>

                    <div style={{ borderTop: '1px solid #334155', paddingTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                        <Button type="submit" disabled={saving}>
                            {saving ? 'Guardando...' : '💾 Guardar Políticas'}
                        </Button>
                    </div>
                </form>
            </div>

            <div className="card" style={{ marginTop: '2rem', maxWidth: '600px', backgroundColor: '#0f172a', border: '1px solid #334155', padding: '1.5rem' }}>
                <h3 style={{ color: '#3b82f6', marginBottom: '1rem' }}>💡 Nota del Arquitecto</h3>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.5' }}>
                    Los cambios realizados aquí afectan inmediatamente al motor de precios.
                    Tanto los vendedores en el ERP como los clientes en la Shop verán los precios actualizados
                    según el plazo que seleccionen.
                </p>
            </div>
        </div>
    );
};

export default SalesPolicies;
