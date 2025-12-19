import React, { useState } from 'react';
import Input from '../../common/Input';
import Button from '../../common/Button';
import { useNotification } from '../../../hooks/useNotification';
import { useCompany } from '../../../context/CompanyContext';

const DispatchModal = ({
    invoice,
    onClose,
    onSubmit,
    visible,
    loading
}) => {
    const { showNotification } = useNotification();
    const { activeCompany } = useCompany();
    const [carrier, setCarrier] = useState('');
    const [plate, setPlate] = useState('');
    const [sunatNumber, setSunatNumber] = useState('');

    if (!visible || !invoice) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!carrier) {
            showNotification('El transportista es obligatorio', 'error');
            return;
        }
        onSubmit({
            carrier,
            plate,
            sunat_number: sunatNumber,
            issuer_info: activeCompany // Snapshot
        });
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            padding: '2rem'
        }}>
            <div style={{
                backgroundColor: '#0f172a',
                borderRadius: '0.5rem',
                width: '100%',
                maxWidth: '500px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}>
                <div style={{
                    padding: '1.5rem',
                    borderBottom: '1px solid #334155',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <h2 style={{ color: 'white', margin: 0 }}>
                        Generar Guía de Remisión
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#94a3b8',
                            fontSize: '1.5rem',
                            cursor: 'pointer'
                        }}
                    >
                        ×
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <p style={{ color: '#94a3b8', marginBottom: '0.5rem' }}>Factura: <span style={{ color: 'white' }}>{invoice.invoice_number}</span></p>
                        <p style={{ color: '#94a3b8', marginBottom: '0.5rem' }}>Cliente: <span style={{ color: 'white' }}>{invoice.customer_name}</span></p>
                        <p style={{ color: '#94a3b8' }}>Dirección: <span style={{ color: 'white' }}>{invoice.delivery_address}</span></p>
                    </div>

                    <Input
                        label="Guía SUNAT (Opcional)"
                        value={sunatNumber}
                        onChange={(e) => setSunatNumber(e.target.value)}
                        placeholder="T001-000001"
                    />

                    <Input
                        label="Transportista"
                        value={carrier}
                        onChange={(e) => setCarrier(e.target.value)}
                        placeholder="Nombre del transportista"
                        required
                    />

                    <Input
                        label="Placa del Vehículo"
                        value={plate}
                        onChange={(e) => setPlate(e.target.value)}
                        placeholder="ABC-123"
                    />

                    <div style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: '1rem',
                        marginTop: '2rem'
                    }}>
                        <Button
                            variant="secondary"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={loading}
                        >
                            {loading ? 'Generando...' : 'Generar Guía'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DispatchModal;
