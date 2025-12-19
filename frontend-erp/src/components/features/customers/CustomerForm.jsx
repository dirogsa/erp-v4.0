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
        branches: [],
        ...initialData
    });

    const [newBranch, setNewBranch] = useState({
        branch_name: '',
        address: '',
        contact_person: '',
        phone: '',
        is_main: false,
        is_active: true
    });

    const handleAddBranch = () => {
        if (!newBranch.branch_name || !newBranch.address) {
            showNotification('Nombre y dirección de sucursal son obligatorios', 'warning');
            return;
        }

        const branch = { ...newBranch };
        // Si es la primera sucursal, marcarla como principal
        if (formData.branches.length === 0) {
            branch.is_main = true;
        }

        setFormData({
            ...formData,
            branches: [...formData.branches, branch]
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
        const updatedBranches = formData.branches.filter((_, i) => i !== index);
        setFormData({
            ...formData,
            branches: updatedBranches
        });
    };

    const handleToggleMainBranch = (index) => {
        const updatedBranches = formData.branches.map((b, i) => ({
            ...b,
            is_main: i === index
        }));
        setFormData({
            ...formData,
            branches: updatedBranches
        });
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

                {/* Sección de Sucursales */}
                <div style={{ marginTop: '1rem', padding: '1rem', background: '#1e293b', borderRadius: '8px' }}>
                    <h4 style={{ marginBottom: '1rem', color: '#e2e8f0' }}>Sucursales</h4>

                    {/* Lista de sucursales */}
                    {formData.branches.length > 0 && (
                        <div style={{ marginBottom: '1rem' }}>
                            {formData.branches.map((branch, index) => (
                                <div key={index} style={{
                                    padding: '0.75rem',
                                    background: '#0f172a',
                                    borderRadius: '6px',
                                    marginBottom: '0.5rem',
                                    border: branch.is_main ? '2px solid #3b82f6' : '1px solid #334155'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                        <div style={{ flex: 1 }}>
                                            <strong style={{ color: 'white' }}>{branch.branch_name}</strong>
                                            {branch.is_main && <span style={{ color: '#3b82f6', marginLeft: '0.5rem' }}>(Principal)</span>}
                                            <p style={{ fontSize: '0.875rem', color: '#94a3b8', margin: '0.25rem 0' }}>{branch.address}</p>
                                            {branch.contact_person && <p style={{ fontSize: '0.875rem', color: '#94a3b8', margin: 0 }}>Contacto: {branch.contact_person}</p>}
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            {!branch.is_main && (
                                                <Button
                                                    size="small"
                                                    variant="secondary"
                                                    onClick={() => handleToggleMainBranch(index)}
                                                >
                                                    Principal
                                                </Button>
                                            )}
                                            <Button
                                                size="small"
                                                variant="danger"
                                                onClick={() => handleRemoveBranch(index)}
                                            >
                                                Eliminar
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Formulario para agregar sucursal */}
                    <div style={{ display: 'grid', gap: '0.75rem', padding: '1rem', background: '#0f172a', borderRadius: '6px' }}>
                        <h5 style={{ margin: 0, color: '#e2e8f0' }}>Agregar Sucursal</h5>
                        <Input
                            placeholder="Nombre de sucursal *"
                            value={newBranch.branch_name}
                            onChange={e => setNewBranch({ ...newBranch, branch_name: e.target.value })}
                        />
                        <Input
                            placeholder="Dirección *"
                            value={newBranch.address}
                            onChange={e => setNewBranch({ ...newBranch, address: e.target.value })}
                        />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                            <Input
                                placeholder="Persona de contacto"
                                value={newBranch.contact_person}
                                onChange={e => setNewBranch({ ...newBranch, contact_person: e.target.value })}
                            />
                            <Input
                                placeholder="Teléfono"
                                value={newBranch.phone}
                                onChange={e => setNewBranch({ ...newBranch, phone: e.target.value })}
                            />
                        </div>
                        <Button
                            onClick={handleAddBranch}
                            disabled={!newBranch.branch_name || !newBranch.address}
                            variant="secondary"
                            size="small"
                        >
                            + Agregar Sucursal
                        </Button>
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
