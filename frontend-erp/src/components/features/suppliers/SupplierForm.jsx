import React, { useState } from 'react';
import Input from '../../common/Input';
import Button from '../../common/Button';
import { useNotification } from '../../../hooks/useNotification';

const SupplierForm = ({
    initialData = null,
    onSubmit,
    onCancel,
    loading = false
}) => {
    const { showNotification } = useNotification();
    const isEditMode = !!initialData;

    const [formData, setFormData] = useState({
        name: '',
        ruc: '',
        email: '',
        phone: '',
        address: '',
        contact_person: '',
        sunat_state: 'ACTIVO',
        sunat_condition: 'HABIDO',
        is_retention_agent: false,
        is_perception_agent: false,
        main_activity: '',
        ...initialData
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.name || !formData.ruc) {
            showNotification('Razón Social y RUC son obligatorios', 'error');
            return;
        }
        onSubmit(formData);
    };

    const [magicText, setMagicText] = useState('');
    const [showMagicBox, setShowMagicBox] = useState(false);

    const handleMagicPaste = () => {
        if (!magicText.trim()) return;

        const data = { ...formData };
        const lines = magicText.split('\n').map(l => l.trim());

        // 1. Extraer RUC y Razón Social
        const rucLineIdx = lines.findIndex(l => l.includes('Número de RUC:'));
        if (rucLineIdx !== -1) {
            const nextLine = lines[rucLineIdx + 1];
            const match = nextLine.match(/(\d{11})\s*-\s*(.*)/);
            if (match) {
                data.ruc = match[1];
                data.name = match[2].trim();
            }
        }

        // 2. Estado y Condición
        const stateIdx = lines.findIndex(l => l.includes('Estado del Contribuyente:'));
        if (stateIdx !== -1) data.sunat_state = lines[stateIdx + 1].replace(/\s+/g, ' ');

        const conditionIdx = lines.findIndex(l => l.includes('Condición del Contribuyente:'));
        if (conditionIdx !== -1) data.sunat_condition = lines[conditionIdx + 1].replace(/\s+/g, ' ');

        // 3. Domicilio Fiscal
        const addressIdx = lines.findIndex(l => l.includes('Domicilio Fiscal:'));
        if (addressIdx !== -1) data.address = lines[addressIdx + 1].replace(/\s+/g, ' ');

        // 4. Actividad Económica
        const activityIdx = lines.findIndex(l => l.includes('Actividad(es) Económica(s):'));
        if (activityIdx !== -1) {
            const mainActivity = lines.find((l, i) => i > activityIdx && l.includes('Principal -'));
            if (mainActivity) data.main_activity = mainActivity;
        }

        // 5. Padrones (Retención/Percepción)
        const padronesIdx = lines.findIndex(l => l.includes('Padrones:'));
        if (padronesIdx !== -1) {
            const padronesText = lines.slice(padronesIdx + 1, padronesIdx + 5).join(' ').toUpperCase();
            data.is_retention_agent = padronesText.includes('AGENTE DE RETENCION');
            data.is_perception_agent = padronesText.includes('AGENTE DE PERCEPCION');
        }

        setFormData(data);
        setShowMagicBox(false);
        setMagicText('');
        showNotification('Datos de SUNAT inyectados correctamente', 'success');
    };

    return (
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', background: '#0f172a' }}>
            {/* --- SUNAT MAGIC INGESTOR --- */}
            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(59, 130, 246, 0.1)', padding: '1rem', borderRadius: '12px', border: '1px dashed #3b82f6' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ fontSize: '2rem' }}>✨</div>
                    <div>
                        <h3 style={{ margin: 0, color: '#3b82f6', fontSize: '1rem' }}>SUNAT Magic Ingestor</h3>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>Autocompleta pegando el texto de consulta RUC</p>
                    </div>
                </div>
                <Button 
                    type="button" 
                    variant={showMagicBox ? "secondary" : "success"}
                    onClick={() => setShowMagicBox(!showMagicBox)}
                >
                    {showMagicBox ? 'Cancelar' : 'Pegar de SUNAT'}
                </Button>
            </div>

            {showMagicBox && (
                <div style={{ marginBottom: '2rem' }}>
                    <textarea
                        value={magicText}
                        onChange={(e) => setMagicText(e.target.value)}
                        placeholder="Pegue aquí el contenido copiado del portal de SUNAT..."
                        style={{
                            width: '100%',
                            height: '120px',
                            backgroundColor: '#0f172a',
                            color: '#e2e8f0',
                            border: '1px solid #3b82f6',
                            borderRadius: '8px',
                            padding: '1rem',
                            fontSize: '0.85rem',
                            fontFamily: 'monospace',
                            outline: 'none',
                            resize: 'none'
                        }}
                    />
                    <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'flex-end' }}>
                        <Button type="button" variant="success" onClick={handleMagicPaste}>
                            ✨ Inyectar Datos Fiscales
                        </Button>
                    </div>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                {/* Sección General */}
                <div style={{ display: 'grid', gap: '1rem', gridColumn: 'span 2' }}>
                    <h3 style={{ color: '#3b82f6', fontSize: '0.9rem', marginBottom: '0.5rem', borderBottom: '1px solid #1e293b', paddingBottom: '0.5rem' }}>
                        📍 Información Principal
                    </h3>
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                    <Input
                        label="Razón Social *"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ej: DISTRIBUIDORA INDUSTRIAL SAC"
                        required
                    />
                </div>

                <Input
                    label="RUC *"
                    value={formData.ruc}
                    onChange={(e) => setFormData({ ...formData, ruc: e.target.value })}
                    placeholder="20123456789"
                    required
                    maxLength={11}
                />

                <Input
                    label="Email de Ventas"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="ventas@proveedor.com"
                />

                <Input
                    label="Persona de Contacto"
                    value={formData.contact_person}
                    onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                    placeholder="Ej: Ing. Jorge Pérez"
                />

                <Input
                    label="Teléfono Directo"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+51 999 999 999"
                />

                <div style={{ gridColumn: 'span 2' }}>
                    <Input
                        label="Dirección Fiscal"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="Av. Industrial 456, Callao"
                    />
                </div>

                {/* Sección Fiscal */}
                <div style={{ display: 'grid', gap: '1rem', gridColumn: 'span 2', marginTop: '1rem' }}>
                    <h3 style={{ color: '#10b981', fontSize: '0.9rem', marginBottom: '0.5rem', borderBottom: '1px solid #1e293b', paddingBottom: '0.5rem' }}>
                        🛡️ Escudo de Protección Fiscal (SUNAT)
                    </h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 'bold' }}>Estado del RUC</label>
                    <select 
                        value={formData.sunat_state}
                        onChange={(e) => setFormData({ ...formData, sunat_state: e.target.value })}
                        style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '0.5rem', color: 'white', padding: '0.65rem' }}
                    >
                        <option value="ACTIVO">ACTIVO</option>
                        <option value="BAJA DE OFICIO">BAJA DE OFICIO</option>
                        <option value="SUSPENSION TEMPORAL">SUSPENSIÓN TEMPORAL</option>
                    </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 'bold' }}>Condición de Domicilio</label>
                    <select 
                        value={formData.sunat_condition}
                        onChange={(e) => setFormData({ ...formData, sunat_condition: e.target.value })}
                        style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '0.5rem', color: 'white', padding: '0.65rem' }}
                    >
                        <option value="HABIDO">HABIDO</option>
                        <option value="NO HABIDO">NO HABIDO</option>
                        <option value="NO HALLADO">NO HALLADO</option>
                    </select>
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                    <Input
                        label="Actividad Económica (CIIU)"
                        value={formData.main_activity}
                        onChange={(e) => setFormData({ ...formData, main_activity: e.target.value })}
                        placeholder="Venta de maquinaria y equipo"
                    />
                </div>

                <div style={{ display: 'flex', gap: '2rem', gridColumn: 'span 2', padding: '1rem', background: '#1e293b', borderRadius: '0.75rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'white', cursor: 'pointer', fontSize: '0.85rem' }}>
                        <input 
                            type="checkbox" 
                            checked={formData.is_retention_agent}
                            onChange={(e) => setFormData({ ...formData, is_retention_agent: e.target.checked })}
                            style={{ width: '1.2rem', height: '1.2rem' }}
                        />
                        Agente de Retención
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'white', cursor: 'pointer', fontSize: '0.85rem' }}>
                        <input 
                            type="checkbox" 
                            checked={formData.is_perception_agent}
                            onChange={(e) => setFormData({ ...formData, is_perception_agent: e.target.checked })}
                            style={{ width: '1.2rem', height: '1.2rem' }}
                        />
                        Agente de Percepción
                    </label>
                </div>
            </div>

            <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '1rem',
                marginTop: '2.5rem',
                borderTop: '1px solid #334155',
                paddingTop: '1.5rem'
            }}>
                <Button
                    variant="secondary"
                    onClick={onCancel}
                    disabled={loading}
                >
                    Cancelar
                </Button>
                <Button
                    type="submit"
                    variant="primary"
                    disabled={loading}
                >
                    {loading ? 'Procesando...' : (isEditMode ? '💾 Actualizar Directorio' : '🚀 Registrar Proveedor')}
                </Button>
            </div>
        </form>
    );
};

export default SupplierForm;
