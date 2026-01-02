import React, { useState, useEffect } from 'react';
import { authService } from '../services/api';
import { useNotification } from '../hooks/useNotification';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

const B2BManagement = () => {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const { showNotification } = useNotification();
    const [processingId, setProcessingId] = useState(null);

    // Modal states
    const [editModalApp, setEditModalApp] = useState(null);
    const [approveModalApp, setApproveModalApp] = useState(null);

    // Form states for credentials
    const [targetUser, setTargetUser] = useState('');
    const [targetPass, setTargetPass] = useState('');
    const [classification, setClassification] = useState('STANDARD');

    const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'approved', 'rejected', 'all'

    const fetchApplications = async () => {
        setLoading(true);
        try {
            const response = await authService.getB2BApplications();
            // Sort by date latest first
            const sorted = response.data.sort((a, b) =>
                new Date(b.submitted_at || b.created_at) - new Date(a.submitted_at || a.created_at)
            );
            setApplications(sorted);
        } catch (error) {
            console.error("Error fetching B2B applications", error);
            showNotification('Error al cargar las solicitudes B2B', 'error');
        } finally {
            setLoading(false);
        }
    };

    const filteredApplications = applications.filter(app => {
        if (activeTab === 'all') return true;
        return (app.status || 'pending') === activeTab;
    });

    const stats = {
        total: applications.length,
        pending: applications.filter(a => (a.status || 'pending') === 'pending').length,
        approved: applications.filter(a => a.status === 'approved').length,
        rejected: applications.filter(a => a.status === 'rejected').length
    };

    useEffect(() => {
        fetchApplications();
    }, []);

    // ... (rest of the handle functions remain same)
    const handleUpdateApplication = async (e) => {
        e.preventDefault();
        try {
            await authService.updateB2BApplication(editModalApp._id || editModalApp.id, editModalApp);
            showNotification('Solicitud actualizada correctamente', 'success');
            setEditModalApp(null);
            fetchApplications();
        } catch (error) {
            showNotification('Error al actualizar la solicitud', 'error');
        }
    };

    const handleApproveFinal = async (e) => {
        e.preventDefault();
        const notes = window.prompt("Notas finales (opcional):") || "";

        setProcessingId(approveModalApp._id || approveModalApp.id);
        try {
            await authService.processB2BApplication(
                approveModalApp._id || approveModalApp.id,
                'approved',
                notes,
                targetUser,
                targetPass,
                classification
            );
            showNotification('Cuenta B2B creada y activada con éxito', 'success');
            setApproveModalApp(null);
            setTargetUser('');
            setTargetPass('');
            setClassification('STANDARD');
            fetchApplications();
        } catch (error) {
            showNotification('Error al crear la cuenta B2B', 'error');
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (appId) => {
        const notes = window.prompt("Motivo del rechazo:");
        if (notes === null) return;

        setProcessingId(appId);
        try {
            await authService.processB2BApplication(appId, 'rejected', notes);
            showNotification('Solicitud rechazada', 'success');
            fetchApplications();
        } catch (error) {
            showNotification('Error al procesar el rechazo', 'error');
        } finally {
            setProcessingId(null);
        }
    };

    const handleResetPassword = async (app) => {
        const newPass = window.prompt(`Ingresa la nueva contraseña temporal para ${app.company_name}:`);
        if (!newPass) return;

        setProcessingId(app.id || app._id);
        try {
            // We use linked_username if available, else fallback to email
            const identifier = app.linked_username || app.email;
            await authService.resetUserPassword(identifier, null, newPass);
            showNotification(`Contraseña restablecida con éxito para ${identifier}`, 'success');
        } catch (error) {
            console.error(error);
            showNotification('Error al restablecer contraseña. ¿Existe el usuario?', 'error');
        } finally {
            setProcessingId(null);
        }
    };

    const handleDeleteApplication = async (app) => {
        if (!window.confirm(`¿Estás seguro de que deseas eliminar permanentemente la solicitud de ${app.company_name}? Esta acción no se puede deshacer.`)) {
            return;
        }

        setProcessingId(app.id || app._id);
        try {
            await authService.deleteB2BApplication(app.id || app._id);
            showNotification('Solicitud eliminada correctamente', 'success');
            fetchApplications();
        } catch (error) {
            console.error(error);
            showNotification('Error al eliminar la solicitud', 'error');
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) return <div className="loading">Cargando solicitudes...</div>;

    return (
        <div className="page-container">
            <header className="page-header" style={{ marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '0.5rem' }}>Gestión de Socios B2B</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Revisa, contacta y activa cuentas empresariales verificadas</p>
                </div>
            </header>

            {/* KPI Cards - Modified for No-Tailwind environment */}
            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '1rem',
                marginBottom: '2rem'
            }}>
                <div className="card" style={{ flex: '1', minWidth: '150px', padding: '1.25rem', textAlign: 'center', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>RECIBIDAS</span>
                    <span style={{ fontSize: '2rem', fontWeight: '900', color: 'var(--text-color)' }}>{stats.total}</span>
                </div>

                <div
                    className="card"
                    style={{
                        flex: '1',
                        minWidth: '150px',
                        padding: '1.25rem',
                        textAlign: 'center',
                        margin: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        borderBottom: activeTab === 'pending' ? '4px solid #f59e0b' : '4px solid #78350f44',
                        backgroundColor: activeTab === 'pending' ? 'rgba(245, 158, 11, 0.1)' : 'var(--glass-bg)'
                    }}
                    onClick={() => setActiveTab('pending')}
                >
                    <span style={{ fontSize: '0.7rem', fontWeight: '800', color: activeTab === 'pending' ? '#fbbf24' : 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>PENDIENTES</span>
                    <span style={{ fontSize: '2rem', fontWeight: '900', color: activeTab === 'pending' ? '#fbbf24' : 'var(--text-color)' }}>{stats.pending}</span>
                </div>

                <div
                    className="card"
                    style={{
                        flex: '1',
                        minWidth: '150px',
                        padding: '1.25rem',
                        textAlign: 'center',
                        margin: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        borderBottom: activeTab === 'approved' ? '4px solid #10b981' : '4px solid #064e3b44',
                        backgroundColor: activeTab === 'approved' ? 'rgba(16, 185, 129, 0.1)' : 'var(--glass-bg)'
                    }}
                    onClick={() => setActiveTab('approved')}
                >
                    <span style={{ fontSize: '0.7rem', fontWeight: '800', color: activeTab === 'approved' ? '#34d399' : 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>APROBADAS</span>
                    <span style={{ fontSize: '2rem', fontWeight: '900', color: activeTab === 'approved' ? '#34d399' : 'var(--text-color)' }}>{stats.approved}</span>
                </div>

                <div
                    className="card"
                    style={{
                        flex: '1',
                        minWidth: '150px',
                        padding: '1.25rem',
                        textAlign: 'center',
                        margin: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        borderBottom: activeTab === 'rejected' ? '4px solid #f43f5e' : '4px solid #88133744',
                        backgroundColor: activeTab === 'rejected' ? 'rgba(244, 63, 94, 0.1)' : 'var(--glass-bg)'
                    }}
                    onClick={() => setActiveTab('rejected')}
                >
                    <span style={{ fontSize: '0.7rem', fontWeight: '800', color: activeTab === 'rejected' ? '#fb7185' : 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>RECHAZADAS</span>
                    <span style={{ fontSize: '2rem', fontWeight: '900', color: activeTab === 'rejected' ? '#fb7185' : 'var(--text-color)' }}>{stats.rejected}</span>
                </div>
            </div>

            {/* Tabs Navigation using CSS class from index.css */}
            <div className="tabs" style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
                {[
                    { id: 'pending', label: '⏳ Pendientes' },
                    { id: 'approved', label: '✅ Aprobados' },
                    { id: 'rejected', label: '❌ Rechazados' },
                    { id: 'all', label: '📋 Todos' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        className={activeTab === tab.id ? 'active' : ''}
                        style={{
                            padding: '0.75rem 1.5rem',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            color: activeTab === tab.id ? 'var(--primary-color)' : 'var(--text-secondary)',
                            borderBottom: activeTab === tab.id ? '2px solid var(--primary-color)' : 'none',
                            backgroundColor: 'transparent'
                        }}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table className="data-table">

                    <thead>
                        <tr>
                            <th>RUC / Empresa</th>
                            <th>Contacto / Email</th>
                            <th>Teléfono / Dirección</th>
                            <th>Fecha</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredApplications.length === 0 ? (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                                    No hay solicitudes en esta categoría.
                                </td>
                            </tr>
                        ) : (
                            filteredApplications.map((app) => (

                                <tr key={app.id || app._id}>
                                    <td>
                                        <div className="font-mono text-xs text-slate-400">{app.ruc}</div>
                                        <div className="font-bold">{app.company_name}</div>
                                    </td>
                                    <td>
                                        <div className="font-medium text-sm">{app.contact_person}</div>
                                        <div className="text-xs text-primary-600">{app.email}</div>
                                    </td>
                                    <td>
                                        <div className="text-sm">{app.phone}</div>
                                        <div className="text-xs text-slate-400">{app.address}</div>
                                    </td>
                                    <td>{new Date(app.submitted_at || app.created_at).toLocaleDateString()}</td>
                                    <td>
                                        <span className={`status-badge ${(app.status || 'pending').toLowerCase()}`}>
                                            {app.status === 'pending' ? 'Pendiente' :
                                                app.status === 'approved' ? 'Aprobado' : 'Rechazado'}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                                                <button
                                                    className="btn btn-sm"
                                                    style={{ backgroundColor: '#f1f5f9', color: '#475569' }}
                                                    onClick={() => setEditModalApp({ ...app })}
                                                >
                                                    Editar/Ver
                                                </button>

                                                {app.status !== 'approved' && (
                                                    <button
                                                        className="btn btn-primary btn-sm"
                                                        onClick={() => setApproveModalApp(app)}
                                                        disabled={processingId === (app.id || app._id)}
                                                    >
                                                        Activar B2B
                                                    </button>
                                                )}

                                                {app.status === 'pending' && (
                                                    <button
                                                        className="btn btn-danger btn-sm"
                                                        onClick={() => handleReject(app.id || app._id)}
                                                        disabled={processingId === (app.id || app._id)}
                                                    >
                                                        Rechazar
                                                    </button>
                                                )}
                                                <button
                                                    className="btn btn-sm"
                                                    style={{ backgroundColor: '#fff1f2', color: '#e11d48', border: '1px solid #ffe4e6' }}
                                                    onClick={() => handleDeleteApplication(app)}
                                                    disabled={processingId === (app.id || app._id)}
                                                >
                                                    🗑️ Eliminar
                                                </button>
                                            </div>
                                            {app.status === 'approved' && (

                                                <button
                                                    className="btn btn-sm"
                                                    style={{ backgroundColor: '#fff7ed', color: '#c2410c', border: '1px solid #ffedd5' }}
                                                    onClick={() => handleResetPassword(app)}
                                                    disabled={processingId === (app.id || app._id)}
                                                >
                                                    🔑 Reset Contraseña
                                                </button>
                                            )}
                                            {app.status !== 'pending' && (
                                                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                                                    Procesado por: {app.processed_by || 'Sistema'}
                                                    {app.linked_username && <span> ({app.linked_username})</span>}
                                                </div>
                                            )}
                                        </div>
                                    </td>

                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal Editar Aplicación */}
            {editModalApp && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '600px' }}>
                        <h3>Revisar y Editar Solicitud</h3>
                        <p className="subtitle">Ajusta los datos después de contactar a la empresa si es necesario.</p>

                        <form onSubmit={handleUpdateApplication} className="grid grid-cols-2 gap-4 mt-4">
                            <Input label="RUC" value={editModalApp.ruc} onChange={e => setEditModalApp({ ...editModalApp, ruc: e.target.value })} />
                            <Input label="Empresa" value={editModalApp.company_name} onChange={e => setEditModalApp({ ...editModalApp, company_name: e.target.value })} />
                            <Input label="Persona Contacto" value={editModalApp.contact_person} onChange={e => setEditModalApp({ ...editModalApp, contact_person: e.target.value })} />
                            <Input label="Email de Negocio" value={editModalApp.email} onChange={e => setEditModalApp({ ...editModalApp, email: e.target.value })} />
                            <Input label="Teléfono" value={editModalApp.phone} onChange={e => setEditModalApp({ ...editModalApp, phone: e.target.value })} />
                            <div className="col-span-2">
                                <Input label="Dirección" value={editModalApp.address} onChange={e => setEditModalApp({ ...editModalApp, address: e.target.value })} />
                            </div>

                            <div className="col-span-2 flex justify-end gap-3 mt-4">
                                <Button type="button" variant="secondary" onClick={() => setEditModalApp(null)}>Cancelar</Button>
                                <Button type="submit" variant="primary">Guardar Cambios</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Aprobar y Crear Usuario */}
            {approveModalApp && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '450px' }}>
                        <h3>Activar Cuenta B2B</h3>
                        <p className="subtitle">Asigna las credenciales finales para <strong>{approveModalApp.company_name}</strong>.</p>

                        <form onSubmit={handleApproveFinal} className="flex flex-col gap-4 mt-4">
                            <div className="p-4 bg-primary-50 rounded-2xl text-xs text-primary-700 leading-relaxed mb-2">
                                ℹ️ Al aprobar, se creará un usuario con rol B2B. El cliente usará estos datos para ingresar.
                            </div>

                            <Input
                                label="Nombre de Usuario (Login)"
                                placeholder="ej: ruc_empresa"
                                value={targetUser}
                                onChange={e => setTargetUser(e.target.value)}
                                required
                            />
                            <Input
                                label="Contraseña Temporal"
                                type="text"
                                placeholder="ej: Dirogsa2025*"
                                value={targetPass}
                                onChange={e => setTargetPass(e.target.value)}
                                required
                            />

                            <div className="form-group mb-4">
                                <label className="block text-sm font-bold text-slate-700 mb-2">Clasificación Inicial</label>
                                <select
                                    className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500"
                                    value={classification}
                                    onChange={e => setClassification(e.target.value)}
                                >
                                    <option value="STANDARD">STANDARD</option>
                                    <option value="BRONCE">BRONCE</option>
                                    <option value="PLATA">PLATA</option>
                                    <option value="ORO">ORO</option>
                                    <option value="DIAMANTE">DIAMANTE</option>
                                </select>
                                <p className="text-[10px] text-slate-400 mt-1">Define qué reglas de descuento se aplicarán de inmediato.</p>
                            </div>

                            <div className="flex justify-end gap-3 mt-4">
                                <Button type="button" variant="secondary" onClick={() => { setApproveModalApp(null); setTargetUser(''); setTargetPass(''); }}>Cancelar</Button>
                                <Button type="submit" variant="primary">Aprobar y Crear Cuenta</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default B2BManagement;
