import React, { useState } from 'react';
import Input from '../../common/Input';
import Button from '../../common/Button';

const GuideFormModal = ({
    invoice,
    visible,
    onClose,
    onSubmit,
    loading = false
}) => {
    const [formData, setFormData] = useState({
        sunat_number: '',
        vehicle_plate: '',
        driver_name: '',
        notes: ''
    });

    if (!visible || !invoice) return null;

    const handleSubmit = (e) => {
        e.preventDefault();

        onSubmit({
            invoice_number: invoice.invoice_number,
            sunat_number: formData.sunat_number || null,
            vehicle_plate: formData.vehicle_plate || null,
            driver_name: formData.driver_name || null,
            notes: formData.notes || null
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
                    <h2 style={{ color: 'white', margin: 0 }}>Generar Guía de Remisión</h2>
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
                    {/* Info de la factura */}
                    <div style={{
                        backgroundColor: '#1e293b',
                        padding: '1rem',
                        borderRadius: '0.5rem',
                        marginBottom: '1.5rem'
                    }}>
                        <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Factura</div>
                        <div style={{ color: 'white', fontWeight: '500' }}>{invoice.invoice_number}</div>
                        <div style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.5rem' }}>Cliente</div>
                        <div style={{ color: 'white' }}>{invoice.customer_name}</div>
                    </div>

                    {/* Número interno (solo lectura) */}
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                            N° Interno (automático)
                        </label>
                        <div style={{
                            backgroundColor: '#1e293b',
                            padding: '0.75rem',
                            borderRadius: '0.375rem',
                            color: '#64748b',
                            fontSize: '0.875rem'
                        }}>
                            Se asignará al crear (ej: GUIA-0001)
                        </div>
                    </div>

                    {/* N° SUNAT (opcional) */}
                    <div style={{ marginBottom: '1rem' }}>
                        <Input
                            label="N° SUNAT (Opcional)"
                            value={formData.sunat_number}
                            onChange={(e) => setFormData({ ...formData, sunat_number: e.target.value })}
                            placeholder="T001-00000001"
                        />
                        <small style={{ color: '#64748b', fontSize: '0.75rem' }}>
                            Ingresa el número si generaste la guía en SUNAT
                        </small>
                    </div>

                    {/* Transporte */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <Input
                            label="Placa del vehículo"
                            value={formData.vehicle_plate}
                            onChange={(e) => setFormData({ ...formData, vehicle_plate: e.target.value.toUpperCase() })}
                            placeholder="ABC-123"
                        />
                        <Input
                            label="Nombre del chofer"
                            value={formData.driver_name}
                            onChange={(e) => setFormData({ ...formData, driver_name: e.target.value })}
                            placeholder="Juan Pérez"
                        />
                    </div>

                    {/* Notas */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <Input
                            label="Notas"
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Observaciones adicionales..."
                        />
                    </div>

                    {/* Botones */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                        <Button variant="secondary" onClick={onClose} disabled={loading}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Creando...' : 'Crear Guía'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default GuideFormModal;
