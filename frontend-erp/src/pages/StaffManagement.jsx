import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { staffService } from '../services/api';
import { useNotification } from '../hooks/useNotification';
import Button from '../components/common/Button';
import Table from '../components/common/Table';
import StaffForm from '../components/features/admin/StaffForm';
import { UserCog, Users, Filter, Search } from 'lucide-react';

const StaffManagement = () => {
    const queryClient = useQueryClient();
    const { showNotification } = useNotification();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState(null);
    const [search, setSearch] = useState('');
    const [deptFilter, setDeptFilter] = useState('');

    // Queries
    const { data: staffList = [], isLoading } = useQuery({
        queryKey: ['staff', search, deptFilter],
        queryFn: () => staffService.getStaff({ search, department: deptFilter }).then(res => res.data)
    });

    // Mutations
    const createMutation = useMutation({
        mutationFn: (data) => staffService.createStaff(data),
        onSuccess: () => {
            queryClient.invalidateQueries(['staff']);
            showNotification('Colaborador registrado exitosamente', 'success');
            setIsModalOpen(false);
        },
        onError: (error) => {
            const detail = error.response?.data?.detail;
            const message = typeof detail === 'string'
                ? detail
                : (Array.isArray(detail) ? detail.map(d => d.msg).join(', ') : 'Error al registrar colaborador');
            showNotification(message, 'error');
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => staffService.updateStaff(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['staff']);
            showNotification('Información actualizada', 'success');
            setIsModalOpen(false);
        },
        onError: (error) => {
            const detail = error.response?.data?.detail;
            const message = typeof detail === 'string'
                ? detail
                : (Array.isArray(detail) ? detail.map(d => d.msg).join(', ') : 'Error al actualizar');
            showNotification(message, 'error');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => staffService.deleteStaff(id),
        onSuccess: () => {
            queryClient.invalidateQueries(['staff']);
            showNotification('Colaborador eliminado', 'success');
        },
        onError: () => {
            showNotification('Error al eliminar', 'error');
        }
    });

    const handleEdit = (staff) => {
        setEditingStaff(staff);
        setIsModalOpen(true);
    };

    const handleDelete = (id) => {
        if (window.confirm('¿Está seguro de eliminar a este colaborador?')) {
            deleteMutation.mutate(id);
        }
    };

    const columns = [
        {
            label: 'Colaborador',
            key: 'full_name',
            render: (value, row) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: row.is_active ? '#1e293b' : '#334155',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: row.is_active ? '#3b82f6' : '#94a3b8',
                        border: '1px solid #334155'
                    }}>
                        <UserCog size={16} />
                    </div>
                    <div>
                        <div style={{ fontWeight: '600', color: row.is_active ? 'white' : '#94a3b8' }}>{value}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{row.document_id}</div>
                    </div>
                </div>
            )
        },
        {
            label: 'Área',
            key: 'department',
            render: (val) => (
                <span style={{
                    padding: '0.2rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    backgroundColor: '#1e293b',
                    color: '#e2e8f0',
                    border: '1px solid #334155'
                }}>
                    {val}
                </span>
            )
        },
        { label: 'Cargo', key: 'position' },
        {
            label: 'Contacto',
            key: 'contact',
            render: (_, row) => (
                <div style={{ fontSize: '0.85rem' }}>
                    <div style={{ color: '#cbd5e1' }}>{row.email || '-'}</div>
                    <div style={{ color: '#94a3b8' }}>{row.phone || '-'}</div>
                </div>
            )
        },
        {
            label: 'Estado',
            key: 'is_active',
            render: (val) => (
                <span style={{
                    padding: '0.25rem 0.6rem',
                    borderRadius: '20px',
                    fontSize: '0.7rem',
                    fontWeight: 'bold',
                    backgroundColor: val ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: val ? '#10b981' : '#ef4444',
                    border: `1px solid ${val ? '#10b981' : '#ef4444'}`
                }}>
                    {val ? 'ACTIVO' : 'INACTIVO'}
                </span>
            )
        },
        {
            label: 'Acciones',
            key: 'actions',
            render: (_, row) => (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button variant="info" size="small" onClick={() => handleEdit(row)}>Editar</Button>
                    <Button variant="danger" size="small" onClick={() => handleDelete(row._id)}>✕</Button>
                </div>
            )
        }
    ];

    return (
        <div style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Users size={32} color="#3b82f6" />
                        Gestión de Colaboradores
                    </h1>
                    <p style={{ color: '#94a3b8', marginTop: '0.5rem' }}>Maestro centralizado de empleados, vendedores y personal operativo.</p>
                </div>
                <Button variant="primary" onClick={() => { setEditingStaff(null); setIsModalOpen(true); }}>
                    + Nuevo Colaborador
                </Button>
            </div>

            {/* Filters */}
            <div style={{
                backgroundColor: '#1e293b',
                padding: '1.25rem',
                borderRadius: '0.75rem',
                marginBottom: '1.5rem',
                border: '1px solid #334155',
                display: 'flex',
                gap: '1.5rem',
                alignItems: 'center'
            }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <Search style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o documento..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.625rem 0.625rem 0.625rem 2.5rem',
                            backgroundColor: '#0f172a',
                            border: '1px solid #334155',
                            borderRadius: '0.5rem',
                            color: 'white',
                            outline: 'none'
                        }}
                    />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Filter size={18} color="#94a3b8" />
                    <select
                        value={deptFilter}
                        onChange={(e) => setDeptFilter(e.target.value)}
                        style={{
                            padding: '0.625rem',
                            backgroundColor: '#0f172a',
                            border: '1px solid #334155',
                            borderRadius: '0.5rem',
                            color: 'white',
                            outline: 'none',
                            minWidth: '200px'
                        }}
                    >
                        <option value="">Todas las Áreas</option>
                        <option value="VENTAS">Ventas</option>
                        <option value="ALMACEN">Almacén</option>
                        <option value="FINANZAS">Finanzas</option>
                        <option value="CONTABILIDAD">Contabilidad</option>
                        <option value="ADMINISTRACION">Administración</option>
                        <option value="DESPACHO">Despacho</option>
                    </select>
                </div>
            </div>

            <Table
                columns={columns}
                data={staffList}
                loading={isLoading}
                emptyMessage="No se encontraron colaboradores registrados."
            />

            {/* Modal */}
            {isModalOpen && (
                <div className="modal-overlay" style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                    zIndex: 1000
                }}>
                    <div className="modal-content" style={{
                        backgroundColor: '#0f172a',
                        padding: '2rem',
                        borderRadius: '1rem',
                        width: '95%',
                        maxWidth: '700px',
                        border: '1px solid #334155',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                    }}>
                        <h2 style={{ color: 'white', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {editingStaff ? '📝 Editar Colaborador' : '👤 Nuevo Colaborador'}
                        </h2>
                        <StaffForm
                            initialData={editingStaff}
                            loading={createMutation.isLoading || updateMutation.isLoading}
                            onCancel={() => setIsModalOpen(false)}
                            onSubmit={(data) => {
                                if (editingStaff) {
                                    updateMutation.mutate({ id: editingStaff._id, data });
                                } else {
                                    createMutation.mutate(data);
                                }
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffManagement;
