import React, { useState, useEffect } from 'react';
import Input from '../../common/Input';
import Button from '../../common/Button';
import { useNotification } from '../../../hooks/useNotification';

const CustomerForm = ({
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
        classification: 'STANDARD',
        custom_discount_percent: 0,
        branches: [],
        status_credit: false,
        credit_manual_block: false,
        credit_limit: 0,
        allowed_terms: [0],
        risk_score: 'C',
        internal_notes: '',
        digital_dossier: [],
        contacts: [],
        assigned_price_list: null,
        ...initialData
    });

    const branches = formData.branches || [];
    const contacts = formData.contacts || [];

    // Reset form when initialData ID changes (crucial for React modal reuse)
    useEffect(() => {
        const resetData = initialData ? {
            name: '',
            ruc: '',
            email: '',
            phone: '',
            address: '',
            classification: 'STANDARD',
            custom_discount_percent: 0,
            branches: [],
            status_credit: false,
            credit_manual_block: false,
            credit_limit: 0,
            allowed_terms: [0],
            risk_score: 'C',
            internal_notes: '',
            digital_dossier: [],
            contacts: [],
            assigned_price_list: null,
            ...initialData
        } : {
            name: '',
            ruc: '',
            email: '',
            phone: '',
            address: '',
            classification: 'STANDARD',
            custom_discount_percent: 0,
            branches: [],
            status_credit: false,
            credit_manual_block: false,
            credit_limit: 0,
            allowed_terms: [0],
            risk_score: 'C',
            internal_notes: '',
            digital_dossier: [],
            contacts: [],
            assigned_price_list: null
        };
        setFormData(resetData);
    }, [initialData?._id]);

    const [newBranch, setNewBranch] = useState({
        branch_name: '',
        address: '',
        contact_person: '',
        phone: '',
        is_main: false,
        is_active: true
    });

    const [newContact, setNewContact] = useState({
        name: '',
        phone: '',
        email: '',
        position: '',
        is_active: true
    });

    const handleAddContact = () => {
        if (!newContact.name) {
            showNotification('El nombre del contacto es obligatorio', 'warning');
            return;
        }

        setFormData(prev => ({
            ...prev,
            contacts: [...(prev.contacts || []), { ...newContact }]
        }));

        setNewContact({
            name: '',
            phone: '',
            email: '',
            position: '',
            is_active: true
        });
    };

    const handleRemoveContact = (index) => {
        setFormData(prev => ({
            ...prev,
            contacts: (prev.contacts || []).filter((_, i) => i !== index)
        }));
    };

    const handleAddBranch = () => {
        if (!newBranch.branch_name || !newBranch.address) {
            showNotification('Nombre y dirección de sucursal son obligatorios', 'warning');
            return;
        }

        const branch = { ...newBranch };

        setFormData(prev => {
            const currentBranches = prev.branches || [];
            // Si es la primera sucursal, marcarla como principal
            if (currentBranches.length === 0) {
                branch.is_main = true;
            }
            return {
                ...prev,
                branches: [...currentBranches, branch]
            };
        });

        setNewBranch({
            branch_name: '',
            address: '',
            contact_person: '',
            phone: '',
            is_main: false,
            is_active: true
        });
    };

    const handleRemoveBranch = (index) => {
        setFormData(prev => ({
            ...prev,
            branches: (prev.branches || []).filter((_, i) => i !== index)
        }));
    };

    const handleToggleMainBranch = (index) => {
        setFormData(prev => ({
            ...prev,
            branches: (prev.branches || []).map((b, i) => ({
                ...b,
                is_main: i === index
            }))
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.name || !formData.ruc) {
            showNotification('Razón Social y RUC son obligatorios', 'error');
            return;
        }
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} style={{ padding: '1rem' }}>
            <div style={{ display: 'grid', gap: '1rem' }}>
                <Input
                    label="Razón Social *"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej: Empresa SAC"
                    required
                />
                <Input
                    label="RUC *"
                    value={formData.ruc}
                    onChange={(e) => setFormData({ ...formData, ruc: e.target.value })}
                    placeholder="Ej: 20123456789"
                    required
                    maxLength={11}
                />
                <Input
                    label="Email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="contacto@empresa.com"
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <Input
                        label="Teléfono"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+51 999 999 999"
                    />
                    <Input
                        label="Dirección Principal"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="Av. Principal 123"
                    />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                        <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Clasificación de Cliente (Tier)</label>
                        <select
                            value={formData.classification}
                            onChange={(e) => setFormData({ ...formData, classification: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '0.625rem',
                                backgroundColor: '#1e293b',
                                border: '1px solid #334155',
                                borderRadius: '0.375rem',
                                color: 'white',
                                outline: 'none'
                            }}
                        >
                            <option value="STANDARD">STANDARD (General)</option>
                            <option value="BRONCE">BRONCE (Lista Bronce)</option>
                            <option value="PLATA">PLATA (Lista Plata)</option>
                            <option value="ORO">ORO (Lista Oro)</option>
                            <option value="DIAMANTE">DIAMANTE (Lista Diamante)</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label style={{ display: 'block', color: '#3b82f6', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>Manual: Lista de Precios Asignada</label>
                        <select
                            value={formData.assigned_price_list || ''}
                            onChange={(e) => setFormData({ ...formData, assigned_price_list: e.target.value || null })}
                            style={{
                                width: '100%',
                                padding: '0.625rem',
                                backgroundColor: '#1e293b',
                                border: '1px solid #3b82f6',
                                borderRadius: '0.375rem',
                                color: 'white',
                                outline: 'none'
                            }}
                        >
                            <option value="">Automático por Tier (Recomendado)</option>
                            <option value="General">Lista General (Público)</option>
                            <option value="Lista Bronce">Lista Bronce</option>
                            <option value="Lista Plata">Lista Plata</option>
                            <option value="Lista Oro">Lista Oro</option>
                            <option value="Lista Diamante">Lista Diamante</option>
                        </select>
                        <p style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.25rem' }}>* Sobreescribe el precio automático del Tier.</p>
                    </div>
                </div>

                {/* --- GESTIÓN DE RIESGOS Y CRÉDITO (CONTROL INTERNO) --- */}
                <div style={{ marginTop: '1rem', padding: '1.5rem', background: '#1e293b', borderRadius: '8px', border: '1px solid #3b82f6' }}>
                    <h4 style={{ marginBottom: '1rem', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        🛡️ Gestión de Riesgos y Crédito
                    </h4>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem', marginBottom: '1rem' }}>
                        <div className="form-group" style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#e2e8f0', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={formData.status_credit}
                                    onChange={(e) => setFormData({ ...formData, status_credit: e.target.checked })}
                                    style={{ width: '1.2rem', height: '1.2rem' }}
                                />
                                <span style={{ fontWeight: '600' }}>Habilitar Crédito</span>
                            </label>

                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                color: formData.credit_manual_block ? '#ef4444' : '#94a3b8',
                                cursor: 'pointer',
                                background: formData.credit_manual_block ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                                padding: '0.5rem',
                                borderRadius: '8px',
                                border: formData.credit_manual_block ? '1px solid #ef4444' : '1px solid transparent'
                            }}>
                                <input
                                    type="checkbox"
                                    checked={formData.credit_manual_block}
                                    onChange={(e) => setFormData({ ...formData, credit_manual_block: e.target.checked })}
                                    style={{ width: '1.2rem', height: '1.2rem' }}
                                />
                                <span style={{ fontWeight: '700' }}>🚩 BLOQUEO MANUAL</span>
                            </label>
                        </div>
                        <Input
                            label="Límite de Crédito (S/)"
                            type="number"
                            value={formData.credit_limit}
                            onChange={(e) => setFormData({ ...formData, credit_limit: parseFloat(e.target.value) || 0 })}
                            disabled={!formData.status_credit}
                        />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Plazos Permitidos</label>
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            {[0, 30, 60, 90, 180].map(days => (
                                <label key={days} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'white', cursor: 'pointer', fontSize: '0.9rem' }}>
                                    <input
                                        type="checkbox"
                                        checked={formData.allowed_terms.includes(days)}
                                        onChange={(e) => {
                                            const newTerms = e.target.checked
                                                ? [...formData.allowed_terms, days]
                                                : formData.allowed_terms.filter(d => d !== days);
                                            setFormData({ ...formData, allowed_terms: newTerms });
                                        }}
                                        disabled={!formData.status_credit && days !== 0}
                                    />
                                    {days === 0 ? 'Contado' : `${days} días`}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                        <div className="form-group">
                            <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Perfil de Riesgo</label>
                            <select
                                value={formData.risk_score}
                                onChange={(e) => setFormData({ ...formData, risk_score: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '0.625rem',
                                    backgroundColor: '#0f172a',
                                    border: '1px solid #334155',
                                    borderRadius: '0.375rem',
                                    color: 'white'
                                }}
                            >
                                <option value="A">RIESGO A (Excelente Solvencia)</option>
                                <option value="B">RIESGO B (Solvencia Estándar)</option>
                                <option value="C">RIESGO C (Evaluación Pendiente)</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Notas Internas (No visibles al cliente)</label>
                            <textarea
                                value={formData.internal_notes}
                                onChange={(e) => setFormData({ ...formData, internal_notes: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '0.625rem',
                                    backgroundColor: '#0f172a',
                                    border: '1px solid #334155',
                                    borderRadius: '0.375rem',
                                    color: 'white',
                                    minHeight: '80px',
                                    outline: 'none'
                                }}
                                placeholder="Historial de pagos, referencias bancarias, etc."
                            />
                        </div>
                    </div>

                    {/* Expediente Digital DMS */}
                    <div style={{ borderTop: '1px solid #334155', paddingTop: '1rem' }}>
                        <h5 style={{ color: '#94a3b8', marginBottom: '0.5rem' }}>📂 Expediente Digital (DMS)</h5>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {formData.digital_dossier && formData.digital_dossier.length > 0 ? (
                                formData.digital_dossier.map((doc, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', background: '#0f172a', padding: '0.5rem', borderRadius: '4px' }}>
                                        <span style={{ color: 'white' }}>{doc.name}</span>
                                        <a href={doc.url} target="_blank" rel="noreferrer" style={{ color: '#3b82f6', fontSize: '0.8rem' }}>Ver Archivo</a>
                                    </div>
                                ))
                            ) : (
                                <p style={{ color: '#64748b', fontSize: '0.85rem' }}>No hay documentos adjuntos.</p>
                            )}
                            <Button variant="secondary" size="small" type="button" onClick={() => showNotification('Función de carga disponible en próxima fase', 'info')}>
                                + Adjuntar Documento
                            </Button>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    {/* Sección de Sucursales */}
                    <div style={{ padding: '1rem', background: '#1e293b', borderRadius: '8px' }}>
                        <h4 style={{ marginBottom: '1rem', color: '#e2e8f0' }}>🏢 Sucursales</h4>

                        {/* Lista de sucursales */}
                        <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '1rem' }}>
                            {branches.length > 0 ? branches.map((branch, index) => (
                                <div key={index} style={{
                                    padding: '0.75rem',
                                    background: '#0f172a',
                                    borderRadius: '6px',
                                    marginBottom: '0.5rem',
                                    border: branch.is_main ? '2px solid #3b82f6' : '1px solid #334155'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                        <div style={{ flex: 1 }}>
                                            <strong style={{ color: 'white', fontSize: '0.85rem' }}>{branch.branch_name}</strong>
                                            {branch.is_main && <span style={{ color: '#3b82f6', fontSize: '0.75rem', marginLeft: '0.5rem' }}>(Principal)</span>}
                                            <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0.2rem 0' }}>{branch.address}</p>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                                            {!branch.is_main && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleMainBranch(index)}
                                                    style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: '0.75rem' }}
                                                >⭐</button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveBranch(index)}
                                                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.75rem' }}
                                            >🗑️</button>
                                        </div>
                                    </div>
                                </div>
                            )) : <p style={{ color: '#64748b', fontSize: '0.85rem', textAlign: 'center' }}>Sin sucursales</p>}
                        </div>

                        {/* Agregar sucursal resumido */}
                        <div style={{ display: 'grid', gap: '0.5rem', padding: '0.75rem', background: '#0f172a', borderRadius: '6px' }}>
                            <input
                                placeholder="Nombre sucursal *"
                                value={newBranch.branch_name}
                                onChange={e => setNewBranch({ ...newBranch, branch_name: e.target.value })}
                                style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid #334155', backgroundColor: '#1e293b', color: 'white', fontSize: '0.8rem' }}
                            />
                            <input
                                placeholder="Dirección *"
                                value={newBranch.address}
                                onChange={e => setNewBranch({ ...newBranch, address: e.target.value })}
                                style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid #334155', backgroundColor: '#1e293b', color: 'white', fontSize: '0.8rem' }}
                            />
                            <Button onClick={handleAddBranch} variant="secondary" size="small" type="button">+ Agregar</Button>
                        </div>
                    </div>

                    {/* Sección de Trabajadores / Contactos */}
                    <div style={{ padding: '1rem', background: '#1e293b', borderRadius: '8px' }}>
                        <h4 style={{ marginBottom: '1rem', color: '#e2e8f0' }}>👥 Trabajadores (Contactos)</h4>

                        {/* Lista de contactos */}
                        <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '1rem' }}>
                            {contacts.length > 0 ? contacts.map((contact, index) => (
                                <div key={index} style={{
                                    padding: '0.75rem',
                                    background: '#0f172a',
                                    borderRadius: '6px',
                                    marginBottom: '0.5rem',
                                    border: '1px solid #334155'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                        <div style={{ flex: 1 }}>
                                            <strong style={{ color: 'white', fontSize: '0.85rem' }}>{contact.name}</strong>
                                            <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0.2rem 0' }}>{contact.phone || 'Sin teléfono'}</p>
                                            {contact.position && <p style={{ fontSize: '0.7rem', color: '#3b82f6', margin: 0 }}>{contact.position}</p>}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveContact(index)}
                                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.75rem' }}
                                        >🗑️</button>
                                    </div>
                                </div>
                            )) : <p style={{ color: '#64748b', fontSize: '0.85rem', textAlign: 'center' }}>Sin contactos registrados</p>}
                        </div>

                        {/* Agregar contacto resumido */}
                        <div style={{ display: 'grid', gap: '0.5rem', padding: '0.75rem', background: '#0f172a', borderRadius: '6px' }}>
                            <input
                                placeholder="Nombre trabajador *"
                                value={newContact.name}
                                onChange={e => setNewContact({ ...newContact, name: e.target.value })}
                                style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid #334155', backgroundColor: '#1e293b', color: 'white', fontSize: '0.8rem' }}
                            />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                                <input
                                    placeholder="Teléfono"
                                    value={newContact.phone}
                                    onChange={e => setNewContact({ ...newContact, phone: e.target.value })}
                                    style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid #334155', backgroundColor: '#1e293b', color: 'white', fontSize: '0.8rem' }}
                                />
                                <input
                                    placeholder="Cargo"
                                    value={newContact.position}
                                    onChange={e => setNewContact({ ...newContact, position: e.target.value })}
                                    style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid #334155', backgroundColor: '#1e293b', color: 'white', fontSize: '0.8rem' }}
                                />
                            </div>
                            <Button onClick={handleAddContact} variant="secondary" size="small" type="button">+ Agregar Trabajador</Button>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '1rem',
                marginTop: '2rem'
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
                    {loading ? 'Guardando...' : (isEditMode ? 'Actualizar Cliente' : 'Guardar Cliente')}
                </Button>
            </div>
        </form>
    );
};

export default CustomerForm;
