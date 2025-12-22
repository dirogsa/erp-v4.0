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

    const fetchApplications = async () => {
        setLoading(true);
        try {
            const response = await authService.getB2BApplications();
            setApplications(response.data);
        } catch (error) {
            console.error("Error fetching B2B applications", error);
            showNotification('Error al cargar las solicitudes B2B', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchApplications();
    }, []);

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
                targetPass
            );
            showNotification('Cuenta B2B creada y activada con éxito', 'success');
            setApproveModalApp(null);
            setTargetUser('');
            setTargetPass('');
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

    if (loading) return <div className="loading">Cargando solicitudes...</div>;

    return (
        <div className="page-container">
            <header className="page-header">
                <h2>Gestión de Socios B2B</h2>
                <p className="subtitle">Revisa, contacta y activa cuentas empresariales verificadas</p>
            </header>

            <div className="card">
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
                        {applications.length === 0 ? (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                                    No hay solicitudes registradas.
                                </td>
                            </tr>
                        ) : (
                            applications.map((app) => (
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
                                            </div>
                                            {app.status !== 'pending' && (
                                                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                                                    Procesado por: {app.processed_by || 'Sistema'}
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
