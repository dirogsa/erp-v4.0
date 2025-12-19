import React, { useState } from 'react';
import Table from '../../common/Table';
import Button from '../../common/Button';
import Input from '../../common/Input';
import Select from '../../common/Select';
import Badge from '../../common/Badge';
import { useLosses } from '../../../hooks/useLosses';
import { useProducts } from '../../../hooks/useProducts';
import { formatCurrency, formatDate } from '../../../utils/formatters';

const AdjustmentsSection = () => {
    const { losses, summary, createLoss, loading } = useLosses();
    const { products, refetch: refetchProducts } = useProducts();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [formData, setFormData] = useState({
        sku: '',
        quantity: 1,
        movement_type: 'OUT', // 'IN' or 'OUT'
        reason: 'LOSS_DAMAGED', // Specific reason
        notes: '',
        responsible: ''
    });

    const movementTypes = [
        { value: 'IN', label: 'Ingreso (Aumentar Stock)' },
        { value: 'OUT', label: 'Salida (Disminuir Stock)' }
    ];

    const reasonTypes = {
        'IN': [
            { value: 'ADJUSTMENT_FOUND', label: 'Hallazgo de Inventario' },
            { value: 'ADJUSTMENT_RETURN', label: 'Devolución de Cliente' },
            { value: 'ADJUSTMENT_OTHER_IN', label: 'Otro Ingreso' }
        ],
        'OUT': [
            { value: 'LOSS_DAMAGED', label: 'Deteriorado/Roto' },
            { value: 'LOSS_DEFECTIVE', label: 'Defecto de Fábrica' },
            { value: 'LOSS_HUMIDITY', label: 'Dañado por Humedad' },
            { value: 'LOSS_EXPIRED', label: 'Vencido/Caducado' },
            { value: 'LOSS_THEFT', label: 'Robo' },
            { value: 'LOSS_OTHER', label: 'Otro / Pérdida' }
        ]
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // If IN, we might need to handle it differently in the hook
            // For now, we pass the movement type and let the hook decide
            await createLoss({
                ...formData,
                quantity: parseInt(formData.quantity),
                loss_type: formData.reason, // Backend expects loss_type
                is_entry: formData.movement_type === 'IN'
            });
            setIsModalOpen(false);
            setFormData({
                sku: '',
                quantity: 1,
                movement_type: 'OUT',
                reason: 'LOSS_DAMAGED',
                notes: '',
                responsible: ''
            });
            refetchProducts(); // Refresh stock
        } catch (error) {
            // Error handled by hook
        }
    };

    const getProductName = (sku) => {
        const product = products.find(p => p.sku === sku);
        return product ? product.name : sku;
    };

    const columns = [
        { label: 'Fecha', key: 'date', render: (val) => formatDate(val) },
        {
            label: 'Producto',
            key: 'product_sku',
            render: (val) => (
                <div>
                    <div style={{ fontWeight: 'bold' }}>{getProductName(val)}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{val}</div>
                </div>
            )
        },
        {
            label: 'Tipo',
            key: 'movement_type', // This might need adjustment based on backend response
            render: (val, row) => {
                // If backend doesn't return movement_type, infer from loss_type
                const isEntry = row.loss_type?.startsWith('ADJUSTMENT');
                const typeLabel = isEntry ? 'Ingreso' : 'Salida';
                const status = isEntry ? 'SUCCESS' : 'ERROR';
                return <Badge status={status}>{typeLabel}</Badge>;
            }
        },
        {
            label: 'Razón',
            key: 'loss_type',
            render: (val) => {
                const allReasons = [...reasonTypes.IN, ...reasonTypes.OUT];
                const type = allReasons.find(t => t.value === val);
                return type ? type.label : val;
            }
        },
        { label: 'Cant.', key: 'quantity', align: 'center', render: (val) => <strong>{val}</strong> },
        { label: 'Responsable', key: 'responsible' },
        { label: 'Notas', key: 'notes' }
    ];

    return (
        <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ textAlign: 'center', padding: '1.5rem', backgroundColor: '#1e293b', borderRadius: '0.5rem' }}>
                    <h3 style={{ fontSize: '2rem', color: '#3b82f6', margin: 0 }}>{summary.total_movements}</h3>
                    <p style={{ color: '#94a3b8', margin: 0 }}>Movimientos Registrados</p>
                </div>
                {/* 
                <div style={{ textAlign: 'center', padding: '1.5rem', backgroundColor: '#1e293b', borderRadius: '0.5rem' }}>
                    <h3 style={{ fontSize: '2rem', color: '#ef4444', margin: 0 }}>{summary.total_quantity}</h3>
                    <p style={{ color: '#94a3b8', margin: 0 }}>Unidades Perdidas</p>
                </div>
                */}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                <Button onClick={() => setIsModalOpen(true)} variant="primary">+ Registrar Ingreso / Salida</Button>
            </div>

            <Table
                columns={columns}
                data={losses}
                emptyMessage="No hay ajustes registrados"
            />

            {isModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000,
                    display: 'flex', justifyContent: 'center', alignItems: 'center'
                }}>
                    <div style={{ backgroundColor: '#0f172a', padding: '2rem', borderRadius: '0.5rem', width: '100%', maxWidth: '500px' }}>
                        <h2 style={{ color: 'white', marginBottom: '1.5rem' }}>Registrar Ingreso / Salida</h2>
                        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
                            <Select
                                label="Producto"
                                value={formData.sku}
                                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                options={products.map(p => ({ value: p.sku, label: `${p.name} (Stock: ${p.stock_current})` }))}
                                required
                            />

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <Select
                                    label="Tipo de Movimiento"
                                    value={formData.movement_type}
                                    onChange={(e) => {
                                        const newType = e.target.value;
                                        setFormData({
                                            ...formData,
                                            movement_type: newType,
                                            reason: reasonTypes[newType][0].value
                                        });
                                    }}
                                    options={movementTypes}
                                    required
                                />
                                <Input
                                    label="Cantidad"
                                    type="number"
                                    value={formData.quantity}
                                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                    min="1"
                                    required
                                />
                            </div>

                            <Select
                                label="Razón / Motivo"
                                value={formData.reason}
                                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                options={reasonTypes[formData.movement_type]}
                                required
                            />

                            <Input
                                label="Responsable"
                                value={formData.responsible}
                                onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
                                placeholder="Nombre de quien reporta"
                                required
                            />

                            <Input
                                label="Notas / Descripción"
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="Describa la causa..."
                                required
                            />

                            <div style={{
                                background: formData.movement_type === 'IN' ? '#ecfdf5' : '#fffbeb',
                                padding: '0.75rem',
                                borderRadius: '0.5rem',
                                fontSize: '0.9rem',
                                color: formData.movement_type === 'IN' ? '#047857' : '#92400e',
                                border: `1px solid ${formData.movement_type === 'IN' ? '#6ee7b7' : '#fcd34d'}`
                            }}>
                                {formData.movement_type === 'IN'
                                    ? 'ℹ️ Esta acción AUMENTARÁ el stock inmediatamente.'
                                    : '⚠️ Esta acción REDUCIRÁ el stock inmediatamente.'
                                }
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                                <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                                <Button
                                    type="submit"
                                    variant={formData.movement_type === 'IN' ? 'success' : 'danger'}
                                    disabled={loading}
                                >
                                    {formData.movement_type === 'IN' ? 'Registrar Ingreso' : 'Registrar Salida'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdjustmentsSection;
