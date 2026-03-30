import React, { useEffect, useState } from 'react';
import Input from '../../common/Input';
import Select from '../../common/Select';
import { useSuppliers } from '../../../hooks/useSuppliers';

const SupplierSelector = ({
    value,
    onChange,
    readOnly = false,
    required = false
}) => {
    const { suppliers, loading } = useSuppliers();

    // Transform suppliers for Select component
    const supplierOptions = suppliers.map(s => ({
        value: s.name,
        label: s.name,
        data: s
    }));

    const handleSupplierSelect = (e) => {
        const selectedName = e.target.value;
        const selectedSupplier = suppliers.find(s => s.name === selectedName);

        if (selectedSupplier) {
            onChange({
                ...value,
                name: selectedSupplier.name,
                ruc: selectedSupplier.ruc || '',
                email: selectedSupplier.email || '',
                phone: selectedSupplier.phone || '',
                address: selectedSupplier.address || ''
            });
        } else {
            // Allow custom input
            onChange({
                ...value,
                name: selectedName
            });
        }
    };

    return (
        <div style={{
            padding: '1.25rem',
            backgroundColor: '#1e293b',
            borderRadius: '0.5rem',
            marginBottom: '1rem',
            border: '1px solid #334155'
        }}>
            <h3 style={{ marginBottom: '1rem', color: '#e2e8f0', fontSize: '1.1rem' }}>
                🏢 Datos del Proveedor
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <Select
                    label="Nombre Comercial / Razón Social"
                    value={value?.name || ''}
                    onChange={handleSupplierSelect}
                    options={supplierOptions}
                    disabled={readOnly || loading}
                    required={required}
                    placeholder="Busque o seleccione su proveedor..."
                />

                <Input
                    label="RUC / Tax ID"
                    value={value?.ruc || ''}
                    onChange={(e) => onChange({ ...value, ruc: e.target.value })}
                    disabled={readOnly}
                    placeholder="R.U.C. del proveedor"
                />

                <Input
                    label="Email de Contacto"
                    value={value?.email || ''}
                    onChange={(e) => onChange({ ...value, email: e.target.value })}
                    disabled={readOnly}
                    placeholder="proveedor@ejemplo.com"
                />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ 
                    fontSize: '0.85rem', 
                    fontWeight: '600', 
                    color: '#94a3b8', 
                    marginBottom: '0.5rem' 
                }}>Dirección Fiscal</label>
                <input
                    type="text"
                    value={value?.address || ''}
                    onChange={(e) => onChange({ ...value, address: e.target.value })}
                    disabled={readOnly}
                    placeholder="Dirección completa del proveedor..."
                    style={{
                        padding: '0.5rem 0.75rem',
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '0.375rem',
                        color: 'white',
                        fontSize: '0.9rem',
                        outline: 'none'
                    }}
                />
            </div>
        </div>
    );
};

export default SupplierSelector;
