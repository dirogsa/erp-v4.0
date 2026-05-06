import React, { useState } from 'react';
import Button from '../components/common/Button';
import Table from '../components/common/Table';
import Input from '../components/common/Input';
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
    const [searchTerm, setSearchTerm] = useState('');

    const filteredSuppliers = suppliers.filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.ruc.includes(searchTerm)
    );

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
        { label: 'Razón Social', key: 'name', render: (val) => <span style={{ fontWeight: 'bold', color: 'white' }}>{val}</span> },
        { 
            label: 'RUC', 
            key: 'ruc',
            render: (val) => (
                <span style={{ fontFamily: 'monospace', color: '#3b82f6', background: 'rgba(59, 130, 246, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                    {val}
                </span>
            )
        },
        {
            label: 'Estado Fiscal (SUNAT)',
            key: 'sunat_state',
            align: 'center',
            render: (_, row) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                    <span style={{ 
                        fontSize: '0.65rem', 
                        padding: '2px 6px', 
                        borderRadius: '10px', 
                        background: row.sunat_state === 'ACTIVO' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: row.sunat_state === 'ACTIVO' ? '#10b981' : '#ef4444',
                        border: `1px solid ${row.sunat_state === 'ACTIVO' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                        fontWeight: 'bold'
                    }}>
                        {row.sunat_state || 'ACTIVO'}
                    </span>
                    <span style={{ 
                        fontSize: '0.6rem', 
                        padding: '1px 6px', 
                        borderRadius: '10px', 
                        background: row.sunat_condition === 'HABIDO' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                        color: row.sunat_condition === 'HABIDO' ? '#3b82f6' : '#f59e0b',
                        fontWeight: '600'
                    }}>
                        {row.sunat_condition || 'HABIDO'}
                    </span>
                </div>
            )
        },
        { label: 'Contacto', key: 'contact_person', render: (val) => val || '-' },
        { label: 'Teléfono', key: 'phone', render: (val) => val || '-' },
        {
            label: 'Impuestos',
            key: 'tax_status',
            align: 'center',
            render: (_, row) => (
                <div style={{ display: 'flex', gap: '4px' }}>
                    {row.is_retention_agent && <span title="Agente de Retención" style={{ fontSize: '0.7rem', background: '#334155', color: '#eab308', padding: '2px 6px', borderRadius: '4px' }}>RET</span>}
                    {row.is_perception_agent && <span title="Agente de Percepción" style={{ fontSize: '0.7rem', background: '#334155', color: '#ec4899', padding: '2px 6px', borderRadius: '4px' }}>PER</span>}
                    {!row.is_retention_agent && !row.is_perception_agent && <span style={{ color: '#475569', fontSize: '0.7rem' }}>-</span>}
                </div>
            )
        },
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
                            if (window.confirm('¿Estás seguro de eliminar este proveedor del directorio?')) {
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
                    <h1 style={{ color: 'white', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        Directorio de Proveedores
                        <span style={{ fontSize: '0.9rem', background: '#1e293b', color: '#94a3b8', padding: '4px 12px', borderRadius: '20px' }}>
                            {suppliers.length} Registrados
                        </span>
                    </h1>
                    <p style={{ color: '#94a3b8' }}>Maestro centralizado para abastecimiento y logística</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <Input 
                        placeholder="Buscar por RUC o Nombre..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ width: '300px', marginBottom: 0 }}
                    />
                    <Button onClick={() => {
                        setSelectedSupplier(null);
                        setIsViewMode(false);
                        setIsModalOpen(true);
                    }}>
                        + Nuevo Proveedor
                    </Button>
                </div>
            </div>

            <Table
                columns={columns}
                data={filteredSuppliers}
                loading={loading}
                emptyMessage="No se encontraron proveedores en el directorio"
            />

            {isModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1000,
                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                    backdropFilter: 'blur(4px)'
                }}>
                    <div style={{ 
                        backgroundColor: '#0f172a', 
                        borderRadius: '0.75rem', 
                        width: '100%', 
                        maxWidth: isViewMode ? '700px' : '900px',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        border: '1px solid #334155',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                    }}>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1e293b' }}>
                            <h2 style={{ color: 'white', margin: 0, fontSize: '1.25rem' }}>
                                {isViewMode ? '🔍 Ficha del Proveedor' : (selectedSupplier ? '📝 Editar Información' : '🚀 Nuevo Proveedor')}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer', transition: 'color 0.2s' }}>×</button>
                        </div>

                        {isViewMode ? (
                            <div style={{ padding: '2rem', color: '#e2e8f0' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                    <div style={{ gridColumn: 'span 2', background: '#1e293b', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #334155' }}>
                                        <h3 style={{ margin: '0 0 0.5rem 0', color: 'white', fontSize: '1.5rem' }}>{selectedSupplier.name}</h3>
                                        <p style={{ margin: 0, color: '#3b82f6', fontSize: '1.1rem', fontWeight: 'bold', fontFamily: 'monospace' }}>RUC: {selectedSupplier.ruc}</p>
                                    </div>
                                    
                                    <div>
                                        <h4 style={{ color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '1rem' }}>Datos de Contacto</h4>
                                        <p style={{ marginBottom: '0.75rem' }}><strong style={{ color: '#64748b' }}>Contacto:</strong> <br/> {selectedSupplier.contact_person || 'No asignado'}</p>
                                        <p style={{ marginBottom: '0.75rem' }}><strong style={{ color: '#64748b' }}>Email:</strong> <br/> {selectedSupplier.email || 'Sin correo'}</p>
                                        <p style={{ marginBottom: '0.75rem' }}><strong style={{ color: '#64748b' }}>Teléfono:</strong> <br/> {selectedSupplier.phone || 'Sin teléfono'}</p>
                                        <p style={{ marginBottom: 0 }}><strong style={{ color: '#64748b' }}>Dirección:</strong> <br/> {selectedSupplier.address || 'Sin dirección'}</p>
                                    </div>

                                    <div>
                                        <h4 style={{ color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '1rem' }}>Estatus Fiscal (SUNAT)</h4>
                                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                                            <div style={{ flex: 1, padding: '0.75rem', background: selectedSupplier.sunat_state === 'ACTIVO' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', textAlign: 'center' }}>
                                                <p style={{ margin: 0, fontSize: '0.7rem', color: '#94a3b8' }}>ESTADO</p>
                                                <p style={{ margin: 0, fontWeight: 'bold', color: selectedSupplier.sunat_state === 'ACTIVO' ? '#10b981' : '#ef4444' }}>{selectedSupplier.sunat_state}</p>
                                            </div>
                                            <div style={{ flex: 1, padding: '0.75rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', textAlign: 'center' }}>
                                                <p style={{ margin: 0, fontSize: '0.7rem', color: '#94a3b8' }}>CONDICIÓN</p>
                                                <p style={{ margin: 0, fontWeight: 'bold', color: '#3b82f6' }}>{selectedSupplier.sunat_condition}</p>
                                            </div>
                                        </div>
                                        <p style={{ marginBottom: '0.75rem' }}><strong style={{ color: '#64748b' }}>Actividad:</strong> <br/> {selectedSupplier.main_activity || 'No especificada'}</p>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            {selectedSupplier.is_retention_agent && <span style={{ background: '#334155', color: '#eab308', padding: '4px 10px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>Agente de Retención</span>}
                                            {selectedSupplier.is_perception_agent && <span style={{ background: '#334155', color: '#ec4899', padding: '4px 10px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>Agente de Percepción</span>}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                                    <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cerrar Ficha</Button>
                                </div>
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
