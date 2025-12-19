import React, { useState, useEffect } from 'react';
import { authService } from '../services/api';
import { useNotification } from '../hooks/useNotification';

const B2BManagement = () => {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const { showNotification } = useNotification();
    const [processingId, setProcessingId] = useState(null);

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

    const handleProcess = async (appId, status) => {
        const notes = window.prompt(`Notas administrativas para esta solicitud (${status}):`);
        if (notes === null) return; // Cancelled prompt

        setProcessingId(appId);
        try {
            await authService.processB2BApplication(appId, status, notes);
            showNotification(`Solicitud ${status === 'APPROVED' ? 'aprobada' : 'rechazada'} con éxito`, 'success');
            fetchApplications();
        } catch (error) {
            console.error("Error processing application", error);
            showNotification('Error al procesar la solicitud', 'error');
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) return <div className="loading">Cargando solicitudes...</div>;

    return (
        <div className="page-container">
            <header className="page-header">
                <h2>Gestión de Socios B2B</h2>
                <p className="subtitle">Revisa y aprueba solicitudes de empresas desde la tienda online</p>
            </header>

            <div className="card">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>RUC</th>
                            <th>Empresa</th>
                            <th>Contacto</th>
                            <th>Email</th>
                            <th>Fecha</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {applications.length === 0 ? (
                            <tr>
                                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                                    No hay solicitudes pendientes o registradas.
                                </td>
                            </tr>
                        ) : (
                            applications.map((app) => (
                                <tr key={app.id || app._id}>
                                    <td className="font-mono">{app.ruc}</td>
                                    <td><strong>{app.company_name}</strong></td>
                                    <td>{app.contact_person}</td>
                                    <td>{app.email}</td>
                                    <td>{new Date(app.created_at).toLocaleDateString()}</td>
                                    <td>
                                        <span className={`status-badge ${app.status.toLowerCase()}`}>
                                            {app.status === 'PENDING' ? 'Pendiente' :
                                                app.status === 'APPROVED' ? 'Aprobado' : 'Rechazado'}
                                        </span>
                                    </td>
                                    <td>
                                        {app.status === 'PENDING' && (
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button
                                                    className="btn btn-primary btn-sm"
                                                    onClick={() => handleProcess(app.id || app._id, 'APPROVED')}
                                                    disabled={processingId === (app.id || app._id)}
                                                >
                                                    Aprobar
                                                </button>
                                                <button
                                                    className="btn btn-danger btn-sm"
                                                    onClick={() => handleProcess(app.id || app._id, 'REJECTED')}
                                                    disabled={processingId === (app.id || app._id)}
                                                >
                                                    Rechazar
                                                </button>
                                            </div>
                                        )}
                                        {app.status !== 'PENDING' && (
                                            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                                Procesado por: {app.processed_by}
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default B2BManagement;
