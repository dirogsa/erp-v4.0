import React, { useState } from 'react';
import Button from '../components/common/Button';
import Table from '../components/common/Table';
import SupplierForm from '../components/features/suppliers/SupplierForm';
import { useSuppliers } from '../hooks/useSuppliers';

const Suppliers = () => {
    const {
        suppliers,
        loading,
        createSupplier,
        updateSupplier,
        deleteSupplier
    } = useSuppliers();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [isViewMode, setIsViewMode] = useState(false);

    const handleCreate = async (data) => {
        try {
            await createSupplier(data);
            setIsModalOpen(false);
        } catch (error) { }
    };

    const handleUpdate = async (data) => {
        try {
            await updateSupplier(data._id, data);
            setIsModalOpen(false);
        } catch (error) { }
    };

    const columns = [
        { label: 'Razón Social', key: 'name' },
        { label: 'RUC', key: 'ruc' },
        { label: 'Teléfono', key: 'phone' },
        { label: 'Contacto', key: 'contact_person' },
        {
            label: 'Acciones',
            key: 'actions',
            align: 'center',
            render: (_, supplier) => (
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                    <Button
                        size="small"
                        variant="secondary"
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSupplier(supplier);
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
                            setSelectedSupplier(supplier);
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
                            if (window.confirm('¿Estás seguro de eliminar este proveedor?')) {
                                deleteSupplier(supplier._id);
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
                    <h1 style={{ color: 'white', marginBottom: '0.5rem' }}>Gestión de Proveedores</h1>
                    <p style={{ color: '#94a3b8' }}>Administración de proveedores y contactos</p>
                </div>
                <Button onClick={() => {
                    setSelectedSupplier(null);
                    setIsViewMode(false);
                    setIsModalOpen(true);
                }}>
                    + Nuevo Proveedor
                </Button>
            </div>

            <Table
                columns={columns}
                data={suppliers}
                loading={loading}
                emptyMessage="No hay proveedores registrados"
            />

            {isModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000,
                    display: 'flex', justifyContent: 'center', alignItems: 'center'
                }}>
                    <div style={{ backgroundColor: '#0f172a', borderRadius: '0.5rem', width: '100%', maxWidth: '600px' }}>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ color: 'white', margin: 0 }}>
                                {isViewMode ? 'Detalle del Proveedor' : (selectedSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor')}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                        </div>

                        {isViewMode ? (
                            <div style={{ padding: '1.5rem' }}>
                                <p><strong>Razón Social:</strong> {selectedSupplier.name}</p>
                                <p><strong>RUC:</strong> {selectedSupplier.ruc}</p>
                                <p><strong>Email:</strong> {selectedSupplier.email}</p>
                                <p><strong>Teléfono:</strong> {selectedSupplier.phone}</p>
                                <p><strong>Dirección:</strong> {selectedSupplier.address}</p>
                                <p><strong>Contacto:</strong> {selectedSupplier.contact_person}</p>
                            </div>
                        ) : (
                            <SupplierForm
                                initialData={selectedSupplier}
                                onSubmit={selectedSupplier ? handleUpdate : handleCreate}
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

export default Suppliers;
