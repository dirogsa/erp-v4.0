import React, { useState, useEffect } from 'react';
import Input from '../../common/Input';
import Button from '../../common/Button';
import Select from '../../common/Select';
import { useCustomers } from '../../../hooks/useCustomers';
import { useNotification } from '../../../hooks/useNotification';

const CustomerSelector = ({
    value,
    onChange,
    requestedBy,
    onRequestedByChange,
    readOnly = false,
    required = false
}) => {
    const { getCustomerByRuc } = useCustomers();
    const { showNotification } = useNotification();
    const [ruc, setRuc] = useState(value?.ruc || '');
    const [loading, setLoading] = useState(false);
    const [isManualContact, setIsManualContact] = useState(false);

    // Actualizar RUC local si cambia el valor externo
    useEffect(() => {
        if (value?.ruc && value.ruc !== ruc) {
            setRuc(value.ruc);
        }
    }, [value]);

    const handleRucSearch = async () => {
        if (!ruc || ruc.length !== 11) {
            showNotification('Ingrese un RUC válido de 11 dígitos', 'warning');
            return;
        }

        setLoading(true);
        try {
            const customer = await getCustomerByRuc(ruc);
            if (customer) {
                onChange(customer);
                showNotification('Cliente encontrado', 'success');
            } else {
                showNotification('Cliente no encontrado', 'warning');
                // Limpiar selección pero mantener RUC
                onChange({ ruc, name: '', address: '', branches: [], contacts: [] });
            }
        } catch (error) {
            console.error('Error searching customer:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleBranchChange = (e) => {
        const branchName = e.target.value;
        if (branchName === 'MAIN' || !branchName) {
            onChange({
                ...value,
                delivery_branch_name: '',
                delivery_address: value.address
            });
        } else {
            const branch = value.branches?.find(b => b.branch_name === branchName);
            onChange({
                ...value,
                delivery_branch_name: branchName,
                delivery_address: branch ? branch.address : value.address
            });
        }
    };

    const handleContactSelect = (e) => {
        const contactName = e.target.value;
        if (contactName === 'NEW') {
            setIsManualContact(true);
            onRequestedByChange({ name: '', phone: '' });
        } else if (contactName === 'NONE') {
            setIsManualContact(false);
            onRequestedByChange(null);
        } else {
            const contact = value.contacts?.find(c => c.name === contactName);
            setIsManualContact(false);
            onRequestedByChange(contact ? { name: contact.name, phone: contact.phone } : null);
        }
    };

    return (
        <div style={{
            padding: '1.5rem',
            backgroundColor: '#1e293b',
            borderRadius: '0.5rem',
            marginBottom: '1.5rem',
            border: '1px solid #334155'
        }}>
            <h3 style={{ marginBottom: '1rem', color: '#e2e8f0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                👤 Datos del Cliente
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                        <Input
                            label="RUC"
                            value={ruc}
                            onChange={(e) => setRuc(e.target.value)}
                            placeholder="Ingrese RUC"
                            disabled={readOnly || loading}
                            required={required}
                            maxLength={11}
                        />
                    </div>
                    <div style={{ marginTop: '1.8rem' }}>
                        <Button
                            onClick={handleRucSearch}
                            disabled={readOnly || loading || !ruc}
                            variant="primary"
                            size="medium"
                        >
                            {loading ? '...' : 'Buscar'}
                        </Button>
                    </div>
                </div>

                <Input
                    label="Razón Social"
                    value={value?.name || ''}
                    onChange={(e) => onChange({ ...value, name: e.target.value })}
                    placeholder="Nombre del cliente"
                    disabled={readOnly}
                    required={required}
                />

                <Input
                    label="Dirección Fiscal (SUNAT)"
                    value={value?.address || ''}
                    placeholder="Dirección principal"
                    disabled={true}
                />

                {value?.branches && value.branches.length > 0 ? (
                    <Select
                        label="Punto de Entrega"
                        value={value.delivery_branch_name || 'MAIN'}
                        onChange={handleBranchChange}
                        options={[
                            { value: 'MAIN', label: 'Dirección Fiscal (Principal)' },
                            ...value.branches.map(b => ({
                                value: b.branch_name,
                                label: b.branch_name
                            }))
                        ]}
                        disabled={readOnly}
                    />
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', color: '#64748b', fontSize: '0.8rem', padding: '1rem' }}>
                        ℹ️ Cliente sin sucursales registradas.
                    </div>
                )}
            </div>

            {/* --- SECCIÓN SOLICITADO POR (TRABAJADOR) --- */}
            {value?.name && (
                <div style={{
                    marginTop: '1.5rem',
                    padding: '1rem',
                    background: '#0f172a',
                    borderRadius: '8px',
                    borderLeft: '4px solid #10b981'
                }}>
                    <h4 style={{ color: '#10b981', fontSize: '0.9rem', marginBottom: '1rem' }}>📞 Solicitado por (Contacto):</h4>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '1rem', alignItems: 'end' }}>
                        <div className="form-group">
                            <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.4rem' }}>Seleccionar trabajador</label>
                            <select
                                onChange={handleContactSelect}
                                value={isManualContact ? 'NEW' : (requestedBy?.name || 'NONE')}
                                style={{
                                    width: '100%',
                                    padding: '0.5rem',
                                    background: '#1e293b',
                                    border: '1px solid #334155',
                                    color: 'white',
                                    borderRadius: '4px',
                                    outline: 'none'
                                }}
                                disabled={readOnly}
                            >
                                <option value="NONE">-- Ninguno (Opcional) --</option>
                                {value.contacts?.map((c, i) => (
                                    <option key={i} value={c.name}>{c.name} ({c.position || 'Trabajador'})</option>
                                ))}
                                <option value="NEW">+ Añadir nombre manualmente...</option>
                            </select>
                        </div>

                        <Input
                            label="Nombre"
                            value={requestedBy?.name || ''}
                            onChange={(e) => onRequestedByChange({ ...requestedBy, name: e.target.value })}
                            placeholder="Nombre de quien pide"
                            disabled={!isManualContact || readOnly}
                        />

                        <Input
                            label="Teléfono"
                            value={requestedBy?.phone || ''}
                            onChange={(e) => onRequestedByChange({ ...requestedBy, phone: e.target.value })}
                            placeholder="Número de contacto"
                            disabled={!isManualContact || readOnly}
                        />
                    </div>
                </div>
            )}

            <div style={{ marginTop: '1rem' }}>
                <Input
                    label="Dirección de Entrega Final"
                    value={value?.delivery_address || value?.address || ''}
                    onChange={(e) => onChange({ ...value, delivery_address: e.target.value })}
                    disabled={readOnly || (!!value?.delivery_branch_name && value.delivery_branch_name !== 'MAIN')}
                    placeholder="Especifique dirección de envío"
                    required={required}
                />
            </div>
        </div>
    );
};

export default CustomerSelector;
