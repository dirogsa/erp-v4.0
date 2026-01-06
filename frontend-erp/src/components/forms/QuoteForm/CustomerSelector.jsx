import React, { useState, useEffect } from 'react';
import Input from '../../common/Input';
import Button from '../../common/Button';
import Select from '../../common/Select';
import { useCustomers } from '../../../hooks/useCustomers';
import { useNotification } from '../../../hooks/useNotification';

const CustomerSelector = ({
    value,
    onChange,
    readOnly = false,
    required = false
}) => {
    const { getCustomerByRuc, customers } = useCustomers();
    const { showNotification } = useNotification();
    const [ruc, setRuc] = useState(value?.ruc || '');
    const [loading, setLoading] = useState(false);

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
                onChange({ ruc, name: '', address: '', branches: [] });
            }
        } catch (error) {
            console.error('Error searching customer:', error);
            // El hook ya muestra notificación de error si falla la API
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

    return (
        <div style={{
            padding: '1.5rem',
            backgroundColor: '#1e293b',
            borderRadius: '0.5rem',
            marginBottom: '1.5rem'
        }}>
            <h3 style={{ marginBottom: '1rem', color: '#e2e8f0', fontSize: '1.1rem' }}>
                Datos del Cliente
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
                    disabled={readOnly} // Permitir edición manual si no se encuentra
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

                <div style={{ gridColumn: 'span 2' }}>
                    <Input
                        label="Dirección de Entrega Final"
                        value={value?.delivery_address || value?.address || ''}
                        onChange={(e) => onChange({ ...value, delivery_address: e.target.value })}
                        disabled={readOnly || (!!value?.delivery_branch_name && value.delivery_branch_name !== 'MAIN')}
                        placeholder="Especifique dirección de envío"
                        required={required}
                    />
                    {value?.delivery_branch_name && (
                        <p style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: '-0.5rem' }}>
                            * Usando dirección vinculada a la sucursal {value.delivery_branch_name}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CustomerSelector;
