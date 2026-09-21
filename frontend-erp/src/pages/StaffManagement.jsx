import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { staffService } from '../services/api';
import { useNotification } from '../hooks/useNotification';
import Button from '../components/common/Button';
import Table from '../components/common/Table';
import StaffForm from '../components/features/admin/StaffForm';
import CrudPageTemplate from '../components/common/Crud/CrudPageTemplate';
import CrudToolbar from '../components/common/Crud/CrudToolbar';
import { UserCog, Users, Filter, Search } from 'lucide-react';

const StaffManagement = () => {
    const queryClient = useQueryClient();
    const { showNotification } = useNotification();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState(null);
    const [search, setSearch] = useState('');
    const [deptFilter, setDeptFilter] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);

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
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <Button variant="info" size="small" onClick={() => handleEdit(row)}>Editar</Button>
                </div>
            )
        }
    ];

    const headerActions = (
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#1e293b', padding: '0.35rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #334155' }}>
                <Filter size={16} color="#94a3b8" />
                <select
                    value={deptFilter}
                    onChange={(e) => setDeptFilter(e.target.value)}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'white',
                        outline: 'none',
                        fontSize: '0.875rem'
                    }}
                >
                    <option value="" style={{ background: '#0f172a' }}>Todas las Áreas</option>
                    <option value="VENTAS" style={{ background: '#0f172a' }}>Ventas</option>
                    <option value="ALMACEN" style={{ background: '#0f172a' }}>Almacén</option>
                    <option value="FINANZAS" style={{ background: '#0f172a' }}>Finanzas</option>
                    <option value="CONTABILIDAD" style={{ background: '#0f172a' }}>Contabilidad</option>
                    <option value="ADMINISTRACION" style={{ background: '#0f172a' }}>Administración</option>
                    <option value="DESPACHO" style={{ background: '#0f172a' }}>Despacho</option>
                </select>
            </div>
            <Button variant="primary" onClick={() => { setEditingStaff(null); setIsModalOpen(true); }}>
                + Nuevo Colaborador
            </Button>
        </div>
    );

    return (
        <CrudPageTemplate
            title="Gestión de Colaboradores"
            subtitle="Maestro centralizado de empleados, vendedores y personal operativo"
            headerActions={headerActions}
        >
            <CrudToolbar
                selectedIds={selectedIds}
                onClearSelection={() => setSelectedIds([])}
                totalItems={staffList.length}
                searchValue={search}
                onSearchChange={setSearch}
                searchPlaceholder="🔍 Buscar colaborador por nombre o documento..."
                bulkActions={[
                    {
                        label: 'Eliminar',
                        icon: '🗑️',
                        variant: 'danger',
                        onClick: async (ids) => {
                            if (window.confirm(`¿Estás seguro de eliminar los ${ids.length} colaboradores seleccionados?`)) {
                                for (const id of ids) {
                                    try {
                                        await deleteMutation.mutateAsync(id);
                                    } catch (err) {}
                                }
                                setSelectedIds([]);
                            }
                        }
                    }
                ]}
            />

            <Table
                columns={columns}
                data={staffList}
                loading={isLoading}
                emptyMessage="No se encontraron colaboradores registrados."
                enableSelection={true}
                selectedKeys={selectedIds}
                onSelectionChange={setSelectedIds}
                keyField="_id"
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
        </CrudPageTemplate>
    );
};

export default StaffManagement;
