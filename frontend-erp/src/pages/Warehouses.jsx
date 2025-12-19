import React, { useState, useEffect } from 'react';
import { inventoryService } from '../services/api';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Table from '../components/common/Table';
import Modal from '../components/Modal';
import { useNotification } from '../hooks/useNotification';
import { Trash2, Edit, Plus } from 'lucide-react';

const Warehouses = () => {
    const { showNotification } = useNotification();
    const [warehouses, setWarehouses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingWarehouse, setEditingWarehouse] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        address: '',
        is_main: false,
        is_active: true
    });

    useEffect(() => {
        loadWarehouses();
    }, []);

    const loadWarehouses = async () => {
        try {
            setLoading(true);
            const res = await inventoryService.getWarehouses();
            setWarehouses(res.data);
        } catch (error) {
            console.error("Error loading warehouses", error);
            showNotification('Error al cargar almacenes', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (warehouse = null) => {
        if (warehouse) {
            setEditingWarehouse(warehouse);
            setFormData({
                name: warehouse.name,
                code: warehouse.code,
                address: warehouse.address,
                is_main: warehouse.is_main,
                is_active: warehouse.is_active
            });
        } else {
            setEditingWarehouse(null);
            setFormData({
                name: '',
                code: '',
                address: '',
                is_main: false,
                is_active: true
            });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingWarehouse(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingWarehouse) {
                await inventoryService.updateWarehouse(editingWarehouse.code, formData);
                showNotification('Almacén actualizado correctamente', 'success');
            } else {
                await inventoryService.createWarehouse(formData);
                showNotification('Almacén creado correctamente', 'success');
            }
            handleCloseModal();
            loadWarehouses();
        } catch (error) {
            console.error("Error saving warehouse", error);
            const msg = error.response?.data?.detail || 'Error al guardar almacén';
            showNotification(msg, 'error');
        }
    };

    const handleDelete = async (code) => {
        if (!window.confirm('¿Está seguro de eliminar este almacén?')) return;

        try {
            await inventoryService.deleteWarehouse(code);
            showNotification('Almacén eliminado correctamente', 'success');
            loadWarehouses();
        } catch (error) {
            console.error("Error deleting warehouse", error);
            const msg = error.response?.data?.detail || 'Error al eliminar almacén';
            showNotification(msg, 'error');
        }
    };

    const columns = [
        { label: 'CÓDIGO', key: 'code' },
        { label: 'NOMBRE', key: 'name' },
        { label: 'DIRECCIÓN', key: 'address' },
        {
            label: 'PRINCIPAL',
            key: 'is_main',
            align: 'center',
            render: (val) => val ? (
                <span style={{
                    backgroundColor: '#1d4ed833', color: '#60a5fa',
                    padding: '0.25rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem', border: '1px solid #3b82f6'
                }}>
                    Es Principal
                </span>
            ) : null
        },
        {
            label: 'ESTADO',
            key: 'is_active',
            align: 'center',
            render: (val) => (
                <span style={{
                    backgroundColor: val ? '#065f4633' : '#991b1b33',
                    color: val ? '#34d399' : '#f87171',
                    padding: '0.25rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem',
                    border: `1px solid ${val ? '#10b981' : '#ef4444'}`
                }}>
                    {val ? 'Activo' : 'Inactivo'}
                </span>
            )
        },
        {
            label: 'ACCIONES',
            key: 'actions',
            align: 'right',
            render: (_, wh) => (
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <button
                        onClick={(e) => { e.stopPropagation(); handleOpenModal(wh); }}
                        style={{ padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #334155', cursor: 'pointer', backgroundColor: '#1e293b' }}
                    >
                        <Edit size={16} color="#94a3b8" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(wh.code); }}
                        style={{ padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #991b1b33', cursor: 'pointer', backgroundColor: '#991b1b33' }}
                    >
                        <Trash2 size={16} color="#ef4444" />
                    </button>
                </div>
            )
        }
    ];

    return (
        <div style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: 'white' }}>Almacenes</h1>
                    <p style={{ color: '#94a3b8' }}>Gestión de ubicaciones de inventario</p>
                </div>
                <Button onClick={() => handleOpenModal()}>
                    <Plus size={20} style={{ marginRight: '0.5rem' }} />
                    Nuevo Almacén
                </Button>
            </div>

            <div style={{
                backgroundColor: '#1e293b',
                borderRadius: '0.5rem',
                border: '1px solid #334155',
                overflow: 'hidden',
                padding: '1rem'
            }}>
                <Table
                    columns={columns}
                    data={warehouses}
                    loading={loading}
                    emptyMessage="No hay almacenes registrados"
                />
            </div>

            <Modal
                isOpen={showModal}
                onClose={handleCloseModal}
                title={editingWarehouse ? 'Editar Almacén' : 'Nuevo Almacén'}
            >
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minWidth: '400px' }}>
                    <Input
                        label="Código (Único)"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                        required
                        disabled={!!editingWarehouse}
                        placeholder="EJ. SL01"
                    />

                    <Input
                        label="Nombre"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        placeholder="Almacén Principal"
                    />

                    <Input
                        label="Dirección"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        required
                        placeholder="Av. Siempre Viva 123"
                    />

                    <div style={{ display: 'flex', gap: '2rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: '#e2e8f0' }}>
                            <input
                                type="checkbox"
                                checked={formData.is_main}
                                onChange={(e) => setFormData({ ...formData, is_main: e.target.checked })}
                            />
                            <span style={{ fontSize: '0.875rem' }}>Es Principal</span>
                        </label>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: '#e2e8f0' }}>
                            <input
                                type="checkbox"
                                checked={formData.is_active}
                                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                            />
                            <span style={{ fontSize: '0.875rem' }}>Activo</span>
                        </label>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem', borderTop: '1px solid #334155', paddingTop: '1rem' }}>
                        <Button variant="secondary" onClick={handleCloseModal} type="button">
                            Cancelar
                        </Button>
                        <Button variant="primary" type="submit">
                            Guardar
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Warehouses;
