import React, { useState } from 'react';
import Button from '../components/common/Button';
import Table from '../components/common/Table';
import Input from '../components/common/Input';
import CustomerForm from '../components/features/customers/CustomerForm';
import { useCustomers } from '../hooks/useCustomers';
import { marketingService } from '../services/api';

const Customers = () => {
    const {
        customers,
        loading,
        createCustomer,
        updateCustomer,
        deleteCustomer,
        fetchCustomers
    } = useCustomers();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [isViewMode, setIsViewMode] = useState(false);
    const [converting, setConverting] = useState(false);
    const [pointsToConvert, setPointsToConvert] = useState(0);

    const handleCreate = async (data) => {
        try {
            await createCustomer(data);
            setIsModalOpen(false);
        } catch (error) { }
    };

    const handleUpdate = async (data) => {
        try {
            await updateCustomer(data._id, data);
            setIsModalOpen(false);
        } catch (error) { }
    };

    const columns = [
        { label: 'Razón Social', key: 'name' },
        { label: 'RUC', key: 'ruc' },
        { label: 'Teléfono', key: 'phone' },
        {
            label: 'Puntos Web',
            key: 'loyalty_points',
            align: 'center',
            render: (val) => <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>{val || 0}</span>
        },
        {
            label: 'Puntos Local (Interno)',
            key: 'internal_points_local',
            align: 'center',
            render: (val) => <span style={{ color: '#94a3b8' }}>{val || 0}</span>
        },
        {
            label: 'Sucursales',
            key: 'branches',
            align: 'center',
            render: (val) => val?.length || 0
        },
        {
            label: 'Acciones',
            key: 'actions',
            align: 'center',
            render: (_, customer) => (
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                    <Button
                        size="small"
                        variant="secondary"
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCustomer(customer);
                            setIsViewMode(true);
                            setIsModalOpen(true);
                        }}
                    >
                        Ver
                    </Button>
                    <Button
                        size="small"
                        variant="warning"
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCustomer(customer);
                            setIsViewMode(false);
                            setIsModalOpen(true);
                        }}
                    >
                        Editar
                    </Button>
                    <Button
                        size="small"
                        variant="danger"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm('¿Estás seguro de eliminar este cliente?')) {
                                deleteCustomer(customer._id);
                            }
                        }}
                    >
                        ✕
                    </Button>
                </div>
            )
        }
    ];

    return (
        <div style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ color: 'white', marginBottom: '0.5rem' }}>Gestión de Clientes</h1>
                    <p style={{ color: '#94a3b8' }}>Administración de clientes y sucursales</p>
                </div>
                <Button onClick={() => {
                    setSelectedCustomer(null);
                    setIsViewMode(false);
                    setIsModalOpen(true);
                }}>
                    + Nuevo Cliente
                </Button>
            </div>

            <Table
                columns={columns}
                data={customers}
                loading={loading}
                emptyMessage="No hay clientes registrados"
            />

            {isModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000,
                    display: 'flex', justifyContent: 'center', alignItems: 'center'
                }}>
                    <div style={{ backgroundColor: '#0f172a', borderRadius: '0.5rem', width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ color: 'white', margin: 0 }}>
                                {isViewMode ? 'Detalle del Cliente' : (selectedCustomer ? 'Editar Cliente' : 'Nuevo Cliente')}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                        </div>

                        {isViewMode ? (
                            <div style={{ padding: '1.5rem' }}>
                                <p><strong>Razón Social:</strong> {selectedCustomer.name}</p>
                                <p><strong>RUC:</strong> {selectedCustomer.ruc}</p>
                                <p><strong>Email:</strong> {selectedCustomer.email}</p>
                                <p><strong>Teléfono:</strong> {selectedCustomer.phone}</p>
                                <p><strong>Dirección Principal:</strong> {selectedCustomer.address}</p>
                                <p><strong>Clasificación:</strong> <span style={{
                                    background: selectedCustomer.classification === 'ORO' ? '#fef3c7' : '#f1f5f9',
                                    color: selectedCustomer.classification === 'ORO' ? '#92400e' : '#475569',
                                    padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold'
                                }}>{selectedCustomer.classification || 'STANDARD'}</span></p>

                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: '1rem',
                                    marginTop: '1.5rem',
                                    padding: '1rem',
                                    background: '#1e293b',
                                    borderRadius: '8px',
                                    border: '1px solid #334155'
                                }}>
                                    <div>
                                        <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Puntos Web (Visibles al Cliente)</p>
                                        <p style={{ color: '#3b82f6', fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>{selectedCustomer.loyalty_points || 0}</p>
                                    </div>
                                    <div>
                                        <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Puntos Local (Internos)</p>
                                        <p style={{ color: '#a855f7', fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>{selectedCustomer.internal_points_local || 0}</p>
                                    </div>
                                </div>

                                {selectedCustomer.linked_user_id && selectedCustomer.internal_points_local > 0 && (
                                    <div style={{ marginTop: '1rem', padding: '1rem', background: '#0f172a', borderRadius: '8px', border: '1px border-dashed #334155' }}>
                                        <h4 style={{ color: '#e2e8f0', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Convertir Puntos Locales a Web</h4>
                                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                                            <div style={{ flex: 1 }}>
                                                <Input
                                                    label="Cantidad a convertir"
                                                    type="number"
                                                    value={pointsToConvert}
                                                    onChange={(e) => setPointsToConvert(parseInt(e.target.value) || 0)}
                                                    max={selectedCustomer.internal_points_local}
                                                />
                                            </div>
                                            <Button
                                                variant="success"
                                                size="small"
                                                onClick={async () => {
                                                    if (pointsToConvert <= 0 || pointsToConvert > selectedCustomer.internal_points_local) {
                                                        showNotification("Cantidad inválida", "warning");
                                                        return;
                                                    }
                                                    setConverting(true);
                                                    try {
                                                        await marketingService.convertPoints({
                                                            user_id: selectedCustomer.linked_user_id,
                                                            points_to_convert: pointsToConvert
                                                        });
                                                        showNotification("Puntos convertidos con éxito", "success");
                                                        setPointsToConvert(0);
                                                        await fetchCustomers();
                                                        setIsModalOpen(false);
                                                    } catch (error) {
                                                        showNotification("Error al convertir puntos", "error");
                                                    } finally {
                                                        setConverting(false);
                                                    }
                                                }}
                                                loading={converting}
                                            >
                                                Convertir
                                            </Button>
                                        </div>
                                        <p style={{ color: '#64748b', fontSize: '0.7rem', marginTop: '0.5rem' }}>
                                            * Esta acción es irreversible. Se aplicará la tasa de conversión definida en Marketing.
                                        </p>
                                    </div>
                                )}

                                {selectedCustomer.branches && selectedCustomer.branches.length > 0 && (
                                    <div style={{ marginTop: '1.5rem' }}>
                                        <h4 style={{ color: '#e2e8f0', marginBottom: '0.5rem' }}>Sucursales:</h4>
                                        {selectedCustomer.branches.map((branch, index) => (
                                            <div key={index} style={{
                                                padding: '0.75rem',
                                                background: '#1e293b',
                                                borderRadius: '6px',
                                                marginBottom: '0.5rem',
                                                border: branch.is_main ? '2px solid #3b82f6' : 'none'
                                            }}>
                                                <strong style={{ color: 'white' }}>{branch.branch_name}</strong>
                                                {branch.is_main && <span style={{ color: '#3b82f6', marginLeft: '0.5rem' }}>(Principal)</span>}
                                                <p style={{ fontSize: '0.875rem', color: '#94a3b8', margin: '0.25rem 0' }}>{branch.address}</p>
                                                {branch.contact_person && <p style={{ fontSize: '0.875rem', color: '#94a3b8', margin: 0 }}>Contacto: {branch.contact_person} {branch.phone && `- ${branch.phone}`}</p>}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <CustomerForm
                                initialData={selectedCustomer}
                                onSubmit={selectedCustomer ? handleUpdate : handleCreate}
                                onCancel={() => setIsModalOpen(false)}
                                loading={loading}
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Customers;
