import React, { useState } from 'react';
import Input from '../../common/Input';
import Button from '../../common/Button';
import { useNotification } from '../../../hooks/useNotification';

const ReceptionModal = ({
    invoice,
    onClose,
    onSubmit,
    visible,
    loading
}) => {
    const { showNotification } = useNotification();
    const [notes, setNotes] = useState('');
    const [sunatNumber, setSunatNumber] = useState('');
    const [createdBy, setCreatedBy] = useState('');

    if (!visible || !invoice) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({ notes, created_by: createdBy });
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
                        Confirmar Recepción
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
                        <p style={{ color: '#94a3b8', marginBottom: '0.5rem' }}>Proveedor: <span style={{ color: 'white' }}>{invoice.supplier_name}</span></p>
                        <p style={{ color: '#10b981', fontWeight: 'bold' }}>
                            Se actualizará el stock de {invoice.items?.length || 0} productos.
                        </p>
                    </div>

                    <Input
                        label="Guía Remitente (SUNAT) (Opcional)"
                        value={sunatNumber}
                        onChange={(e) => setSunatNumber(e.target.value)}
                        placeholder="T001-000001"
                    />

                    <Input
                        label="Confirmado por"
                        value={createdBy}
                        onChange={(e) => setCreatedBy(e.target.value)}
                        placeholder="Nombre del responsable"
                        required
                    />

                    <Input
                        label="Notas de Recepción"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Observaciones opcionales..."
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
                            {loading ? 'Procesando...' : 'Confirmar Recepción'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReceptionModal;
