import React, { useState, useEffect } from 'react';
import Input from '../../common/Input';
import Button from '../../common/Button';
import { useNotification } from '../../../hooks/useNotification';
import { magicIngest } from '../../../utils/fiscalParser';

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
        document_type: 'RUC',
        document_number: '',
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
        price_list_id: null,
        currency_preference: 'PEN',
        seller_id: '',
        payment_method_id: '',
        sunat_state: 'ACTIVO',
        sunat_condition: 'HABIDO',
        is_retention_agent: false,
        is_perception_agent: false,
        main_activity: '',
        country: 'PE',
        sunat_metadata: {},
        ...initialData
    });

    const branches = formData.branches || [];
    const contacts = formData.contacts || [];

    // Reset form when initialData ID changes (crucial for React modal reuse)
    useEffect(() => {
        const resetData = initialData ? {
            name: '',
            document_type: 'RUC',
            document_number: '',
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
            price_list_id: null,
            currency_preference: 'PEN',
            seller_id: '',
            payment_method_id: '',
            sunat_state: 'ACTIVO',
            sunat_condition: 'HABIDO',
            is_retention_agent: false,
            is_perception_agent: false,
            main_activity: '',
            ...initialData
        } : {
            name: '',
            document_type: 'RUC',
            document_number: '',
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
            price_list_id: null,
            currency_preference: 'PEN',
            seller_id: '',
            payment_method_id: '',
            sunat_state: 'ACTIVO',
            sunat_condition: 'HABIDO',
            is_retention_agent: false,
            is_perception_agent: false,
            main_activity: '',
            country: 'PE',
            sunat_metadata: {},
            ...initialData
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

    const onSubmitForm = (e) => {
        e.preventDefault();
        if (!formData.name || !formData.document_number) {
            showNotification('Razón Social y Número de Documento son obligatorios', 'error');
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
            showNotification('No se pudo extraer información reconocida de la fuente.', 'warning');
            return;
        }

        setFormData(prev => ({
            ...prev,
            ...deepData,
            // Mantener campos que no queremos sobrescribir si ya existen y no están en deepData
            name: deepData.name || prev.name,
            document_number: deepData.document_number || prev.document_number,
            address: deepData.address || prev.address
        }));

        setShowMagicBox(false);
        setMagicText('');
        showNotification('Inteligencia Fiscal inyectada correctamente', 'success');
    };

    return (
        <form onSubmit={onSubmitForm} style={{ padding: '1.5rem', color: 'white' }}>
            {/* --- INGESTA MÁGICA SUNAT --- */}
            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(59, 130, 246, 0.1)', padding: '1rem', borderRadius: '12px', border: '1px dashed #3b82f6' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ fontSize: '2rem' }}>✨</div>
                    <div>
                        <h3 style={{ margin: 0, color: '#3b82f6', fontSize: '1rem' }}>SUNAT Magic Ingestor</h3>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>Pega el texto de la consulta RUC para autocompletar</p>
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
                <div style={{ marginBottom: '2rem', animation: 'fadeIn 0.3s ease' }}>
                    <textarea
                        value={magicText}
                        onChange={(e) => setMagicText(e.target.value)}
                        placeholder="Pegue aquí el contenido copiado de la consulta RUC de SUNAT..."
                        style={{
                            width: '100%',
                            height: '150px',
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
                            ✨ Inyectar Inteligencia Fiscal
                        </Button>
                    </div>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr 1fr 1.2fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <Input
                    label="Razón Social"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej: Filtros San Jorge S.A.C."
                    required
                />
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
                        <option value="CL">Chile (CL)</option>
                    </select>
                </div>
                <div className="form-group">
                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Tipo Doc.</label>
                    <select
                        value={formData.document_type}
                        onChange={(e) => setFormData({ ...formData, document_type: e.target.value })}
                        style={{
                            width: '100%',
                            padding: '0.625rem',
                            backgroundColor: '#1e293b',
                            border: '1px solid #334155',
                            borderRadius: '0.375rem',
                            color: 'white',
                            outline: 'none',
                            height: '42px'
                        }}
                    >
                        {formData.country === 'PE' ? (
                            <>
                                <option value="RUC">RUC</option>
                                <option value="DNI">DNI</option>
                                <option value="CE">C.E.</option>
                            </>
                        ) : (
                            <>
                                <option value="TAX_ID">Tax ID / NIT / RFC</option>
                                <option value="PASSPORT">Pasaporte</option>
                                <option value="OTHERS">Otros</option>
                            </>
                        )}
                    </select>
                </div>
                <Input
                    label={formData.country === 'PE' ? (formData.document_type === 'RUC' ? 'RUC' : 'Documento') : 'ID Fiscal'}
                    value={formData.document_number}
                    onChange={(e) => setFormData({ ...formData, document_number: e.target.value })}
                    placeholder={formData.country === 'PE' ? "Ej: 2060..." : "Tax ID Number"}
                    required
                />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <Input
                    label="Email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="contacto@empresa.com"
                />
                <Input
                    label="Teléfono"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+51 999..."
                />
                <Input
                    label="Dirección Principal"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Av. Mexico Nro. 1182..."
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
                        <label style={{ display: 'block', color: '#3b82f6', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>Estrategia: Lista de Precios</label>
                        <select
                            value={formData.price_list_id || ''}
                            onChange={(e) => setFormData({ ...formData, price_list_id: e.target.value || null })}
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
                    </div>
                </div>

                <div style={{ padding: '1.25rem', background: '#0f172a', borderRadius: '12px', border: '1px solid #1e293b', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                    <div className="form-group">
                        <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Moneda de Preferencia</label>
                        <select
                            value={formData.currency_preference}
                            onChange={(e) => setFormData({ ...formData, currency_preference: e.target.value })}
                            style={{ width: '100%', padding: '0.625rem', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '0.375rem', color: 'white' }}
                        >
                            <option value="PEN">Soles (PEN)</option>
                            <option value="USD">Dólares (USD)</option>
                        </select>
                    </div>
                    <Input
                        label="Vendedor Asignado"
                        value={formData.seller_id}
                        onChange={(e) => setFormData({ ...formData, seller_id: e.target.value })}
                        placeholder="Nombre o ID del vendedor"
                    />
                    <div className="form-group">
                        <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Método de Pago Habitual</label>
                        <select
                            value={formData.payment_method_id}
                            onChange={(e) => setFormData({ ...formData, payment_method_id: e.target.value })}
                            style={{ width: '100%', padding: '0.625rem', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '0.375rem', color: 'white' }}
                        >
                            <option value="">No especificado</option>
                            <option value="TRANSFER">Transferencia Bancaria</option>
                            <option value="CASH">Efectivo</option>
                            <option value="CHECK">Cheque</option>
                            <option value="DEPOSIT">Depósito en Cuenta</option>
                        </select>
                    </div>
                </div>

                {/* --- SECCIÓN FISCAL SUNAT --- */}
                <div style={{ marginTop: '1.5rem', padding: '1.25rem', background: '#0f172a', borderRadius: '12px', border: '1px solid #334155' }}>
                    <h4 style={{ color: '#3b82f6', marginBottom: '1rem', fontSize: '0.9rem', borderBottom: '1px solid #1e293b', paddingBottom: '0.5rem' }}>
                        🛡️ Validación Fiscal (SUNAT)
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem' }}>
                        <div className="form-group">
                            <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Estado del Contribuyente</label>
                            <select
                                value={formData.sunat_state}
                                onChange={(e) => setFormData({ ...formData, sunat_state: e.target.value })}
                                style={{ 
                                    width: '100%', 
                                    padding: '0.625rem', 
                                    backgroundColor: '#1e293b', 
                                    border: `1px solid ${formData.sunat_state === 'ACTIVO' ? '#334155' : '#ef4444'}`, 
                                    borderRadius: '0.375rem', 
                                    color: formData.sunat_state === 'ACTIVO' ? 'white' : '#f87171' 
                                }}
                            >
                                <option value="ACTIVO">ACTIVO</option>
                                <option value="BAJA DE OFICIO">BAJA DE OFICIO</option>
                                <option value="BAJA DEFINITIVA">BAJA DEFINITIVA</option>
                                <option value="SUSPENSION TEMPORAL">SUSPENSIÓN TEMPORAL</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Condición</label>
                            <select
                                value={formData.sunat_condition}
                                onChange={(e) => setFormData({ ...formData, sunat_condition: e.target.value })}
                                style={{ 
                                    width: '100%', 
                                    padding: '0.625rem', 
                                    backgroundColor: '#1e293b', 
                                    border: `1px solid ${formData.sunat_condition === 'HABIDO' ? '#334155' : '#f59e0b'}`, 
                                    borderRadius: '0.375rem', 
                                    color: formData.sunat_condition === 'HABIDO' ? 'white' : '#fbbf24' 
                                }}
                            >
                                <option value="HABIDO">HABIDO</option>
                                <option value="NO HABIDO">NO HABIDO</option>
                                <option value="NO HALLADO">NO HALLADO</option>
                                <option value="PENDIENTE">PENDIENTE</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', justifyContent: 'center' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', color: '#e2e8f0', fontSize: '0.85rem' }}>
                                <input 
                                    type="checkbox" 
                                    checked={formData.is_retention_agent}
                                    onChange={(e) => setFormData({ ...formData, is_retention_agent: e.target.checked })}
                                    style={{ width: '1.2rem', height: '1.2rem', accentColor: '#3b82f6' }}
                                />
                                Agente de Retención
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', color: '#e2e8f0', fontSize: '0.85rem' }}>
                                <input 
                                    type="checkbox" 
                                    checked={formData.is_perception_agent}
                                    onChange={(e) => setFormData({ ...formData, is_perception_agent: e.target.checked })}
                                    style={{ width: '1.2rem', height: '1.2rem', accentColor: '#10b981' }}
                                />
                                Agente de Percepción
                            </label>
                        </div>
                    </div>
                    <div style={{ marginTop: '1rem' }}>
                        <Input
                            label="Actividad Económica (CIIU / Descripción)"
                            value={formData.main_activity}
                            onChange={(e) => setFormData({ ...formData, main_activity: e.target.value })}
                            placeholder="Ej: 4530 - VENTA DE PARTES Y PIEZAS..."
                        />
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
