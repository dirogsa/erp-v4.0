import React, { useState, useEffect } from 'react';
import { formatDate } from '../../../utils/formatters';
import Badge from '../../common/Badge';
import { auditService } from '../../../services/api';
import { useNotification } from '../../../hooks/useNotification';
import Pagination from '../../common/Table/Pagination';

const AuditLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [pages, setPages] = useState(1);
    const [selectedIds, setSelectedIds] = useState([]);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);
    const [filter, setFilter] = useState({
        module: '',
        user_id: ''
    });

    const { showNotification } = useNotification();

    useEffect(() => {
        fetchLogs();
    }, [filter, page, limit]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params = {
                skip: (page - 1) * limit,
                limit: limit
            };
            if (filter.module) params.module = filter.module;
            if (filter.user_id) params.user_id = filter.user_id;

            const response = await auditService.getLogs(params);
            setLogs(response.data.items);
            setTotal(response.data.total);
            setPages(response.data.pages);
            setSelectedIds([]); // Reset selection on fetch
        } catch (error) {
            console.error('Error fetching logs:', error);
            showNotification('Error al cargar logs', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectRow = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        if (selectedIds.length === logs.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(logs.map(l => l._id));
        }
    };

    const handleDeleteSelected = async () => {
        if (!selectedIds.length) return;
        if (!window.confirm(`¿Estás seguro de eliminar ${selectedIds.length} registros de auditoría?`)) return;

        try {
            await auditService.deleteLogs(selectedIds);
            showNotification(`${selectedIds.length} registros eliminados`, 'success');
            fetchLogs();
        } catch (error) {
            showNotification('Error al eliminar registros', 'error');
        }
    };

    const handleDeleteSingle = async (id) => {
        if (!window.confirm('¿Estás seguro de eliminar este registro?')) return;
        try {
            await auditService.deleteLogs([id]);
            showNotification('Registro eliminado', 'success');
            fetchLogs();
        } catch (error) {
            showNotification('Error al eliminar el registro', 'error');
        }
    };

    const handlePurge = async () => {
        const days = window.prompt('¿Cuántos días de historial deseas CONSERVAR? (Se borrará todo lo anterior)', '30');
        if (days === null) return;

        const daysNum = parseInt(days);
        if (isNaN(daysNum) || daysNum < 0) {
            showNotification('Número de días inválido', 'error');
            return;
        }

        const confirmMsg = daysNum === 0
            ? `¿Estás seguro de ELIMINAR TODOS los registros ${filter.module ? `del módulo ${filter.module}` : 'de la auditoría'}?`
            : `¿Purgar registros anteriores a ${daysNum} días ${filter.module ? `del módulo ${filter.module}` : ''}?`;

        if (!window.confirm(confirmMsg)) return;

        try {
            await auditService.purgeLogs(daysNum, filter.module);
            showNotification('Purga completada exitosamente', 'success');
            fetchLogs();
        } catch (error) {
            showNotification('Error al purgar logs antiguos', 'error');
        }
    };

    const getActionBadge = (action) => {
        switch (action) {
            case 'CREATE': return <Badge variant="success">CREATE</Badge>;
            case 'UPDATE': return <Badge variant="warning">UPDATE</Badge>;
            case 'DELETE': return <Badge variant="danger">DELETE</Badge>;
            case 'LOGIN': return <Badge variant="info">LOGIN</Badge>;
            default: return <Badge>{action}</Badge>;
        }
    };

    const getModuleColor = (module) => {
        switch (module) {
            case 'SALES': return '#06b6d4';
            case 'INVENTORY': return '#f59e0b';
            case 'FINANCE': return '#10b981';
            case 'PURCHASING': return '#8b5cf6';
            case 'AUTH': return '#f43f5e';
            default: return '#94a3b8';
        }
    };

    return (
        <div className="audit-container">
            <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1>🕵️ Registro de Auditoría</h1>
                    <p className="text-secondary">Monitoreo de {total} acciones críticas del sistema</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn" style={{ backgroundColor: '#64748b' }} onClick={handlePurge}>
                        🧹 Purgar Antiguos
                    </button>
                    {selectedIds.length > 0 && (
                        <button className="btn" style={{ backgroundColor: '#ef4444' }} onClick={handleDeleteSelected}>
                            🗑️ Eliminar ({selectedIds.length})
                        </button>
                    )}
                </div>
            </header>

            <div className="card filters-card">
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                        <label>Módulo</label>
                        <select
                            value={filter.module}
                            onChange={(e) => setFilter({ ...filter, module: e.target.value })}
                        >
                            <option value="">Todos los módulos</option>
                            <option value="SALES">Ventas</option>
                            <option value="INVENTORY">Inventario</option>
                            <option value="FINANCE">Finanzas</option>
                            <option value="PURCHASING">Compras</option>
                            <option value="AUTH">Seguridad/Acceso</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="card">
                {loading ? (
                    <p>Cargando registros...</p>
                ) : (
                    <div className="table-responsive">
                        <table>
                            <thead>
                                <tr>
                                    <th style={{ width: '40px' }}>
                                        <input
                                            type="checkbox"
                                            checked={logs.length > 0 && selectedIds.length === logs.length}
                                            onChange={handleSelectAll}
                                        />
                                    </th>
                                    <th>Fecha/Hora</th>
                                    <th>Usuario</th>
                                    <th>Acción</th>
                                    <th>Módulo</th>
                                    <th>Entidad</th>
                                    <th>Descripción</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map(log => (
                                    <tr key={log._id} style={{
                                        backgroundColor: selectedIds.includes(log._id) ? 'rgba(59, 130, 246, 0.1)' : 'transparent'
                                    }}>
                                        <td>
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(log._id)}
                                                onChange={() => handleSelectRow(log._id)}
                                            />
                                        </td>
                                        <td style={{ fontSize: '0.85rem' }}>
                                            {formatDate(log.timestamp, true)}
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{log.username}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>IP: {log.ip_address}</div>
                                        </td>
                                        <td>{getActionBadge(log.action)}</td>
                                        <td>
                                            <span style={{
                                                color: getModuleColor(log.module),
                                                fontWeight: '600',
                                                fontSize: '0.8rem'
                                            }}>
                                                {log.module}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: '500', fontSize: '0.85rem' }}>{log.entity_name || '-'}</div>
                                            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>ID: {log.entity_id || 'N/A'}</div>
                                        </td>
                                        <td style={{ maxWidth: '300px', fontSize: '0.85rem' }}>
                                            {log.description}
                                        </td>
                                        <td>
                                            <button
                                                className="btn-icon"
                                                onClick={() => handleDeleteSingle(log._id)}
                                                style={{ padding: '4px', background: 'none', border: 'none', cursor: 'pointer', opacity: 0.6 }}
                                                onMouseOver={e => e.currentTarget.style.opacity = 1}
                                                onMouseOut={e => e.currentTarget.style.opacity = 0.6}
                                            >
                                                🗑️
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {logs.length === 0 && (
                                    <tr>
                                        <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>
                                            No se encontraron registros de auditoría.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
                <Pagination
                    current={page}
                    total={pages}
                    onChange={setPage}
                    pageSize={limit}
                    onPageSizeChange={(newSize) => {
                        setLimit(newSize);
                        setPage(1);
                    }}
                />
            </div>
        </div>
    );
};

export default AuditLogs;
