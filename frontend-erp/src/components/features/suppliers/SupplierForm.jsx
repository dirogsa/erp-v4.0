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

    return (
        <form onSubmit={handleSubmit} style={{ padding: '1rem' }}>
            <div style={{ display: 'grid', gap: '1rem' }}>
                <Input
                    label="Razón Social *"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej: Proveedor SAC"
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
                    placeholder="ventas@proveedor.com"
                />
                <Input
                    label="Teléfono"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+51 999 999 999"
                />
                <Input
                    label="Dirección"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Av. Industrial 456"
                />
                <Input
                    label="Persona de Contacto"
                    value={formData.contact_person}
                    onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                    placeholder="Juan Pérez"
                />
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
                    {loading ? 'Guardando...' : (isEditMode ? 'Actualizar Proveedor' : 'Guardar Proveedor')}
                </Button>
            </div>
        </form>
    );
};

export default SupplierForm;
