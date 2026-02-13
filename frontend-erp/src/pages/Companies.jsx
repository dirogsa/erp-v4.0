import React, { useState } from 'react';
import { useCompany } from '../context/CompanyContext';
import { companyService, staffService } from '../services/api';
import { useNotification } from '../hooks/useNotification';
import { useQuery } from '@tanstack/react-query';
import Button from '../components/common/Button';
import Table from '../components/common/Table';

const Companies = () => {
    const { companies, activeCompany, switchCompany, refreshCompanies } = useCompany();
    const { showNotification } = useNotification();
    const [loading, setLoading] = useState(false);

    // Simple state for create/edit modal (in-line for now)
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCompany, setEditingCompany] = useState(null);
    const [formData, setFormData] = useState({
        name: '', ruc: '', address: '', phone: '', email: '',
        bank_name: '', account_soles: '', account_dollars: '',
        departments: []
    });

    const { data: staff = [] } = useQuery({
        queryKey: ['staff', 'active'],
        queryFn: () => staffService.getStaff({ active_only: true }).then(res => res.data),
        enabled: isModalOpen
    });

    const handleOpenModal = (company = null) => {
        setEditingCompany(company);
        setFormData(company || {
            name: '', ruc: '', address: '', phone: '', email: '',
            bank_name: '', account_soles: '', account_dollars: '',
            departments: []
        });
        setIsModalOpen(true);
    };

    const handleDeptChange = (index, field, value) => {
        const newDepts = [...(formData.departments || [])];
        newDepts[index][field] = value;
        setFormData({ ...formData, departments: newDepts });
    };

    const addDept = () => {
        setFormData({
            ...formData,
            departments: [...(formData.departments || []), { name: '', staff_id: '' }]
        });
    };

    const removeDept = (index) => {
        const newDepts = formData.departments.filter((_, i) => i !== index);
        setFormData({ ...formData, departments: newDepts });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (editingCompany) {
                await companyService.updateCompany(editingCompany._id, formData);
                showNotification('Empresa actualizada', 'success');
            } else {
                await companyService.createCompany(formData);
                showNotification('Empresa creada', 'success');
            }
            await refreshCompanies();
            setIsModalOpen(false);
        } catch (error) {
            showNotification(error.response?.data?.detail || 'Error al guardar empresa', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Eliminar esta empresa?')) return;
        try {
            await companyService.deleteCompany(id);
            showNotification('Empresa eliminada', 'success');
            refreshCompanies();
        } catch (error) {
            showNotification('Error al eliminar', 'error');
        }
    };

    const columns = [
        {
            label: 'Estado Local',
            key: 'is_active_local',
            render: (_, row) => row.is_active_local ? (
                <span style={{ color: '#3b82f6', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    <span style={{ fontSize: '1.2rem' }}>🏠</span> ACTIVA LOCAL
                </span>
            ) : (
                <Button size="small" variant="secondary" onClick={() => switchCompany(row._id, 'local')}>Activar Local</Button>
            )
        },
        {
            label: 'Estado Web',
            key: 'is_active_web',
            render: (_, row) => row.is_active_web ? (
                <span style={{ color: '#10b981', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    <span style={{ fontSize: '1.2rem' }}>🌐</span> ACTIVA WEB
                </span>
            ) : (
                <Button size="small" variant="secondary" onClick={() => switchCompany(row._id, 'web')}>Activar Web</Button>
            )
        },
        { label: 'Razón Social', key: 'name' },
        { label: 'RUC', key: 'ruc' },
        { label: 'Dirección', key: 'address' },
        {
            label: 'Acciones',
            key: 'actions',
            render: (_, row) => (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button size="small" variant="info" onClick={() => handleOpenModal(row)}>Editar</Button>
                    <Button size="small" variant="danger" onClick={() => handleDelete(row._id)}>✕</Button>
                </div>
            )
        }
    ];

    return (
        <div className="p-4">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h1>Gestión de Empresas</h1>
                <Button onClick={() => handleOpenModal()}>Nueva Empresa</Button>
            </div>

            <Table
                columns={columns}
                data={companies}
                emptyMessage="No hay empresas registradas"
            />

            {/* Simple Modal */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '600px' }}>
                        <h2>{editingCompany ? 'Editar Empresa' : 'Nueva Empresa'}</h2>
                        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr 1fr' }}>
                            <div style={{ gridColumn: 'span 2' }}>
                                <label>Razón Social *</label>
                                <input className="input-field" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div>
                                <label>RUC *</label>
                                <input className="input-field" required value={formData.ruc} onChange={e => setFormData({ ...formData, ruc: e.target.value })} />
                            </div>
                            <div>
                                <label>Teléfono</label>
                                <input className="input-field" value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                            </div>
                            <div>
                                <label>Dirección</label>
                                <input className="input-field" value={formData.address || ''} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                            </div>
                            <div>
                                <label>Correo Electrónico (Cobranzas)</label>
                                <input className="input-field" type="email" value={formData.email || ''} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                            </div>

                            {/* Bank Info */}
                            <div style={{ gridColumn: 'span 2', marginTop: '1rem', borderTop: '1px solid #ccc', paddingTop: '0.5rem' }}><strong>Datos Bancarios</strong></div>
                            <div>
                                <label>Nombre Banco</label>
                                <input className="input-field" value={formData.bank_name || ''} onChange={e => setFormData({ ...formData, bank_name: e.target.value })} />
                            </div>
                            <div></div>
                            <div>
                                <label>Cuenta Soles</label>
                                <input className="input-field" value={formData.account_soles || ''} onChange={e => setFormData({ ...formData, account_soles: e.target.value })} />
                            </div>
                            <div>
                                <label>Cuenta Dólares</label>
                                <input className="input-field" value={formData.account_dollars || ''} onChange={e => setFormData({ ...formData, account_dollars: e.target.value })} />
                            </div>

                            {/* Departments Info */}
                            <div style={{ gridColumn: 'span 2', marginTop: '1.5rem', borderTop: '1px solid #ccc', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <strong>Estructura Organizacional (Áreas/Encargados)</strong>
                                <Button type="button" size="small" onClick={addDept}>+ Añadir Área</Button>
                            </div>

                            <div style={{ gridColumn: 'span 2' }}>
                                {(formData.departments || []).map((dept, index) => (
                                    <div key={index} style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1.2fr 1.8fr auto',
                                        gap: '0.75rem',
                                        marginBottom: '0.75rem',
                                        padding: '1rem',
                                        backgroundColor: '#1e293b',
                                        border: '1px solid #334155',
                                        borderRadius: '0.75rem',
                                        alignItems: 'end'
                                    }}>
                                        <div>
                                            <label style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.3rem', display: 'block' }}>Área (ej: Cobranzas)</label>
                                            <input
                                                className="input-field"
                                                value={dept.name}
                                                onChange={e => handleDeptChange(index, 'name', e.target.value)}
                                                placeholder="Nombre del Área"
                                                required
                                                style={{ backgroundColor: '#0f172a' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.3rem', display: 'block' }}>Seleccionar Encargado (De RRHH)</label>
                                            <select
                                                value={dept.staff_id || ''}
                                                onChange={e => handleDeptChange(index, 'staff_id', e.target.value)}
                                                required
                                                style={{
                                                    width: '100%',
                                                    padding: '0.625rem',
                                                    backgroundColor: '#0f172a',
                                                    border: '1px solid #334155',
                                                    borderRadius: '0.375rem',
                                                    color: 'white',
                                                    outline: 'none'
                                                }}
                                            >
                                                <option value="">-- Seleccionar Colaborador --</option>
                                                {staff.map(s => (
                                                    <option key={s._id} value={s._id}>
                                                        {s.full_name} ({s.position})
                                                    </option>
                                                ))}
                                            </select>
                                            {dept.staff_id && (
                                                <div style={{ fontSize: '0.65rem', color: '#10b981', marginTop: '0.25rem' }}>
                                                    📧 {staff.find(s => s._id === dept.staff_id)?.email || 'Sin correo registrado'}
                                                </div>
                                            )}
                                        </div>
                                        <Button variant="danger" size="small" type="button" onClick={() => removeDept(index)} style={{ marginBottom: '2px' }}>✕</Button>
                                    </div>
                                ))}
                                {(!formData.departments || formData.departments.length === 0) && (
                                    <p style={{ fontSize: '0.85rem', color: '#64748b', textAlign: 'center', fontStyle: 'italic' }}>
                                        No hay áreas configuradas. Los reportes usarán los datos generales.
                                    </p>
                                )}
                            </div>

                            <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                                <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                                <Button type="submit" disabled={loading}>{loading ? 'Guardando...' : 'Guardar'}</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Companies;
