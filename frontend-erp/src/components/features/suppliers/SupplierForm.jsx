import React, { useState } from 'react';
import Input from '../../common/Input';
import Button from '../../common/Button';
import { useNotification } from '../../../hooks/useNotification';
import { magicIngest } from '../../../utils/fiscalParser';

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
        country: 'PE',
        document_type: 'RUC',
        sunat_metadata: {},
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

        const deepData = magicIngest(magicText);
        
        if (!deepData) {
            showNotification('No se pudo extraer información reconocida.', 'warning');
            return;
        }

        setFormData(prev => ({
            ...prev,
            ...deepData,
            ruc: deepData.document_number || prev.ruc, // Mapeamos document_number a ruc por compatibilidad
            name: deepData.name || prev.name,
            address: deepData.address || prev.address
        }));

        setShowMagicBox(false);
        setMagicText('');
        showNotification('Inteligencia Fiscal inyectada correctamente', 'success');
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

                <div style={{ gridColumn: 'span 2', display: 'grid', gridTemplateColumns: '1.2fr 0.8fr 1fr 1fr', gap: '1rem' }}>
                    <div style={{ gridColumn: 'span 4' }}>
                        <Input
                            label="Razón Social *"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Ej: DISTRIBUIDORA INDUSTRIAL SAC"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.5rem' }}>País</label>
                        <select
                            value={formData.country}
                            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                            style={{ width: '100%', padding: '0.625rem', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '0.375rem', color: 'white', height: '42px' }}
                        >
                            <option value="PE">Perú (PE)</option>
                            <option value="CO">Colombia (CO)</option>
                            <option value="MX">México (MX)</option>
                            <option value="US">USA (US)</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Tipo Doc.</label>
                        <select
                            value={formData.document_type}
                            onChange={(e) => setFormData({ ...formData, document_type: e.target.value })}
                            style={{ width: '100%', padding: '0.625rem', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '0.375rem', color: 'white', height: '42px' }}
                        >
                            <option value="RUC">RUC</option>
                            <option value="TAX_ID">Tax ID / NIT / RFC</option>
                            <option value="DNI">DNI</option>
                        </select>
                    </div>
                    <Input
                        label={formData.country === 'PE' ? 'RUC *' : 'ID Fiscal *'}
                        value={formData.ruc}
                        onChange={(e) => setFormData({ ...formData, ruc: e.target.value })}
                        placeholder={formData.country === 'PE' ? "20123456789" : "Tax Number"}
                        required
                    />
                    <Input
                        label="Email de Ventas"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="ventas@proveedor.com"
                    />
                </div>

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
