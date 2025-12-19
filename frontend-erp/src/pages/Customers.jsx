import React, { useState } from 'react';
import Button from '../components/common/Button';
import Table from '../components/common/Table';
import CustomerForm from '../components/features/customers/CustomerForm';
import { useCustomers } from '../hooks/useCustomers';

const Customers = () => {
    const {
        customers,
        loading,
        createCustomer,
        updateCustomer,
        deleteCustomer
    } = useCustomers();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [isViewMode, setIsViewMode] = useState(false);

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
