import React, { useState, useEffect } from 'react';
import Input from '../../common/Input';
import Button from '../../common/Button';
import { useNotification } from '../../../hooks/useNotification';

const StaffForm = ({
    initialData = null,
    onSubmit,
    onCancel,
    loading = false
}) => {
    const { showNotification } = useNotification();
    const isEditMode = !!initialData;

    const [formData, setFormData] = useState({
        full_name: '',
        document_id: '',
        email: '',
        phone: '',
        position: '',
        department: '', // No default
        is_active: true,
        commission_pct: 0,
        notes: '',
        ...initialData
    });

    useEffect(() => {
        if (initialData) {
            setFormData({ ...formData, ...initialData });
        }
    }, [initialData]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.full_name || !formData.department) {
            showNotification('El nombre y el área son obligatorios', 'error');
            return;
        }

        // Clean data for backend (avoid empty strings in optional fields)
        const cleanedData = {
            ...formData,
            document_id: formData.document_id?.trim() || null,
            position: formData.position?.trim() || null,
            email: formData.email?.trim() || null,
            phone: formData.phone?.trim() || null,
            notes: formData.notes?.trim() || null,
            commission_pct: parseFloat(formData.commission_pct) || 0
        };

        onSubmit(cleanedData);
    };

    const departments = [
        { value: 'VENTAS', label: 'Ventas / Comercial' },
        { value: 'ALMACEN', label: 'Almacén / Logística' },
        { value: 'FINANZAS', label: 'Finanzas / Cobranzas' },
        { value: 'CONTABILIDAD', label: 'Contabilidad' },
        { value: 'ADMINISTRACION', label: 'Administración' },
        { value: 'DESPACHO', label: 'Despacho / Transporte' }
    ];

    return (
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem', padding: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem' }}>
                <Input
                    label="Nombre Completo *"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="Ej: Juan Pérez"
                    required
                />
                <Input
                    label="DNI / Documento"
                    value={formData.document_id || ''}
                    onChange={(e) => setFormData({ ...formData, document_id: e.target.value })}
                    placeholder="Número de identidad (Opcional)"
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <Input
                    label="Correo Electrónico"
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="correo@ejemplo.com"
                />
                <Input
                    label="Teléfono"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+51 ..."
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '1rem' }}>
                <div className="form-group">
                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Área / Departamento *</label>
                    <select
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        required
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
                        <option value="">-- Seleccionar Área --</option>
                        {departments.map(dept => (
                            <option key={dept.value} value={dept.value}>{dept.label}</option>
                        ))}
                    </select>
                </div>
                <Input
                    label="Cargo / Título"
                    value={formData.position || ''}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    placeholder="Ej: Vendedor Senior (Opcional)"
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', alignItems: 'center' }}>
                <Input
                    label="% Comisión (Si aplica)"
                    type="number"
                    step="0.01"
                    value={formData.commission_pct}
                    onChange={(e) => setFormData({ ...formData, commission_pct: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white', cursor: 'pointer', marginTop: '1.2rem' }}>
                    <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    />
                    Colaborador Activo
                </label>
            </div>

            <div className="form-group">
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Notas / Observaciones</label>
                <textarea
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    style={{
                        width: '100%',
                        padding: '0.625rem',
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '0.375rem',
                        color: 'white',
                        minHeight: '80px',
                        outline: 'none'
                    }}
                    placeholder="Información adicional..."
                />
            </div>

            <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '1rem',
                marginTop: '1rem'
            }}>
                <Button variant="secondary" onClick={onCancel} disabled={loading}>
                    Cancelar
                </Button>
                <Button type="submit" variant="primary" disabled={loading}>
                    {loading ? 'Guardando...' : (isEditMode ? 'Actualizar' : 'Guardar')}
                </Button>
            </div>
        </form>
    );
};

export default StaffForm;
