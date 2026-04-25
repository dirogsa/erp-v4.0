import React, { useState, useEffect } from 'react';
import { pricingService, salesPolicyService } from '../services/api';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { useNotification } from '../hooks/useNotification';

const PricingPolicies = () => {
    const [policies, setPolicies] = useState({
        cash_discount: 0,
        credit_30_days: 0,
        credit_60_days: 0,
        credit_90_days: 0,
        credit_180_days: 0,
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
            showNotification('Error al cargar políticas globales', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await salesPolicyService.updatePolicies(policies);
            showNotification('Políticas globales actualizadas', 'success');
        } catch (error) {
            showNotification('Error al guardar políticas', 'error');
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

    if (loading) return <div style={{ color: '#94a3b8', padding: '2rem' }}>Cargando reglas de negocio...</div>;

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ color: 'white', fontSize: '1.5rem', marginBottom: '0.5rem' }}>Políticas de Venta y Escudos</h2>
                <p style={{ color: '#94a3b8' }}>Define las reglas globales de rentabilidad y recargos financieros para todo el ERP.</p>
            </div>

            <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                
                {/* Columna 1: Rentabilidad */}
                <div style={{
                    background: 'rgba(30, 41, 59, 0.5)',
                    padding: '2rem',
                    borderRadius: '1.5rem',
                    border: '1px solid #334155'
                }}>
                    <h3 style={{ color: '#ef4444', fontSize: '1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        🛡️ Escudo de Rentabilidad
                    </h3>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <Input 
                            label="Margen Mínimo de Seguridad (%)" 
                            type="number"
                            value={policies.min_margin_guard_pct}
                            onChange={e => handleChange('min_margin_guard_pct', e.target.value)}
                        />
                        <p style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                            El sistema bloqueará o alertará si cualquier precio (incluyendo ofertas) cae por debajo de este margen sobre el costo.
                        </p>
                    </div>
                    <div style={{ padding: '1rem', background: '#0f172a', borderRadius: '1rem', border: '1px solid #334155' }}>
                        <Input 
                            label="Descuento Máximo por Contado (%)" 
                            type="number"
                            value={policies.cash_discount}
                            onChange={e => handleChange('cash_discount', e.target.value)}
                        />
                    </div>
                </div>

                {/* Columna 2: Recargos Financieros */}
                <div style={{
                    background: 'rgba(30, 41, 59, 0.5)',
                    padding: '2rem',
                    borderRadius: '1.5rem',
                    border: '1px solid #334155'
                }}>
                    <h3 style={{ color: '#3b82f6', fontSize: '1rem', marginBottom: '1.5rem' }}>💳 Recargos por Plazo de Crédito</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <Input label="30 Días (%)" type="number" value={policies.credit_30_days} onChange={e => handleChange('credit_30_days', e.target.value)} />
                        <Input label="60 Días (%)" type="number" value={policies.credit_60_days} onChange={e => handleChange('credit_60_days', e.target.value)} />
                        <Input label="90 Días (%)" type="number" value={policies.credit_90_days} onChange={e => handleChange('credit_90_days', e.target.value)} />
                        <Input label="180 Días (%)" type="number" value={policies.credit_180_days} onChange={e => handleChange('credit_180_days', e.target.value)} />
                    </div>
                    <p style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '1rem' }}>
                        Estos porcentajes se sumarán automáticamente al precio base cuando el vendedor elija el plazo en la orden de venta.
                    </p>
                </div>

                <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end' }}>
                    <Button type="submit" loading={saving} variant="primary">💾 Guardar Reglas de Negocio</Button>
                </div>
            </form>
        </div>
    );
};

export default PricingPolicies;
