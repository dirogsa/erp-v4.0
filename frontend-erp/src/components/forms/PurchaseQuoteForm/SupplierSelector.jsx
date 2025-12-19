import React, { useEffect, useState } from 'react';
import Input from '../../common/Input';
import Button from '../../common/Button';
import Select from '../../common/Select'; // Assuming we have a Select component
import { useSuppliers } from '../../../hooks/useSuppliers';
import { useNotification } from '../../../hooks/useNotification';

const SupplierSelector = ({
    value,
    onChange,
    readOnly = false,
    required = false
}) => {
    const { suppliers, loading } = useSuppliers();
    const { showNotification } = useNotification();

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
                email: selectedSupplier.email || '',
                phone: selectedSupplier.phone || '',
                address: selectedSupplier.address || ''
            });
        } else {
            // Allow custom input or clear
            onChange({
                ...value,
                name: selectedName
            });
        }
    };

    return (
        <div style={{
            padding: '1.5rem',
            backgroundColor: '#1e293b',
            borderRadius: '0.5rem',
            marginBottom: '1.5rem'
        }}>
            <h3 style={{ marginBottom: '1rem', color: '#e2e8f0', fontSize: '1.1rem' }}>
                Datos del Proveedor
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <Select
                    label="Proveedor"
                    value={value?.name || ''}
                    onChange={handleSupplierSelect}
                    options={supplierOptions}
                    disabled={readOnly || loading}
                    required={required}
                    placeholder="Seleccione un proveedor"
                />

                <Input
                    label="Email"
                    value={value?.email || ''}
                    onChange={(e) => onChange({ ...value, email: e.target.value })}
                    disabled={readOnly}
                />
            </div>
        </div>
    );
};

export default SupplierSelector;
