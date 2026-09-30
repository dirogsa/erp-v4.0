import React, { useState, useEffect } from 'react';
import CrudPageTemplate from '../components/common/Crud/CrudPageTemplate';
import CrudToolbar from '../components/common/Crud/CrudToolbar';
import Table from '../components/common/Table';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import marketplaceService from '../services/marketplace.service';

export default function MarketplaceVendors() {
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedVendor, setSelectedVendor] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        contact_name: '',
        phone: '',
        email: '',
        description: ''
    });

    useEffect(() => {
        fetchVendors();
    }, []);

    const fetchVendors = async () => {
        setLoading(true);
        try {
            const data = await marketplaceService.getVendors({ limit: 100 });
            setVendors(data.items || []);
        } catch (error) {
            console.error('Error fetching vendors:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        setIsSubmitting(true);
        try {
            if (selectedVendor) {
                await marketplaceService.updateVendor(selectedVendor._id, formData);
            } else {
                await marketplaceService.createVendor(formData);
            }
            setIsModalOpen(false);
            fetchVendors();
        } catch (error) {
            console.error('Error saving vendor:', error);
            alert('Error al guardar: ' + (error.response?.data?.detail || error.message));
        } finally {
            setIsSubmitting(false);
        }
    };

    const openEditModal = (vendor) => {
        setSelectedVendor(vendor);
        setFormData({
            name: vendor.name || '',
            contact_name: vendor.contact_name || '',
            phone: vendor.phone || '',
            email: vendor.email || '',
            description: vendor.description || ''
        });
        setIsModalOpen(true);
    };

    const openCreateModal = () => {
        setSelectedVendor(null);
        setFormData({ name: '', contact_name: '', phone: '', email: '', description: '' });
        setIsModalOpen(true);
    };

    const handleDelete = async (ids) => {
        if (window.confirm(`¿Estás seguro de eliminar los ${ids.length} terceros seleccionados?`)) {
            for (const id of ids) {
                try {
                    await marketplaceService.deleteVendor(id);
                } catch (err) {
                    console.error('Error deleting vendor:', err);
                }
            }
            setSelectedIds([]);
            fetchVendors();
        }
    };

    const filteredVendors = vendors.filter(v => 
        (v.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (v.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const columns = [
        { label: 'Empresa Tercerizada', key: 'name', sortable: true, render: (val, row) => <div className="font-bold text-white">{row.name}</div> },
        { label: 'Contacto', key: 'contact_name', render: (val, row) => <div className="text-sm text-gray-400">{row.contact_name || 'N/A'}</div> },
        { label: 'Email', key: 'email', render: (val, row) => <div className="text-sm text-gray-400">{row.email || 'N/A'}</div> },
        { label: 'Teléfono', key: 'phone', render: (val, row) => <div className="text-sm text-gray-400">{row.phone || 'N/A'}</div> },
        {
            label: 'Acciones',
            key: 'actions',
            render: (_, row) => (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button variant="secondary" onClick={(e) => { e.stopPropagation(); openEditModal(row); }}>Editar</Button>
                </div>
            )
        }
    ];

    const headerActions = (
        <Button onClick={openCreateModal}>
            + Nuevo Tercero
        </Button>
    );

    return (
        <CrudPageTemplate
            title="Proveedores del Marketplace"
            subtitle="Terceros autorizados para vender en el catálogo extendido"
            headerActions={headerActions}
        >
            <CrudToolbar
                selectedIds={selectedIds}
                onClearSelection={() => setSelectedIds([])}
                totalItems={filteredVendors.length}
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                searchPlaceholder="🔍 Buscar proveedor por nombre o email..."
                bulkActions={[
                    {
                        label: 'Eliminar',
                        icon: '🗑️',
                        variant: 'danger',
                        onClick: handleDelete
                    }
                ]}
            />

            <Table
                columns={columns}
                data={filteredVendors}
                loading={loading}
                emptyMessage="No se encontraron terceros"
                enableSelection={true}
                selectedKeys={selectedIds}
                onSelectionChange={setSelectedIds}
                keyField="_id"
            />

            {isModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <div style={{ backgroundColor: '#0f172a', borderRadius: '0.75rem', width: '100%', maxWidth: '600px', padding: '1.5rem', border: '1px solid #334155' }}>
                        <h2 style={{ color: 'white', marginBottom: '1.5rem' }}>{selectedVendor ? '📝 Editar Tercero' : '🚀 Nuevo Tercero'}</h2>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <Input label="Nombre Comercial" name="name" value={formData.name} onChange={handleInputChange} required />
                            <Input label="Nombre del Contacto" name="contact_name" value={formData.contact_name} onChange={handleInputChange} />
                            <Input label="Email Comercial" name="email" value={formData.email} onChange={handleInputChange} />
                            <Input label="Teléfono (Ej. +51 999 999 999)" name="phone" value={formData.phone} onChange={handleInputChange} />
                            <Input label="Descripción o Notas" name="description" value={formData.description} onChange={handleInputChange} />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                            <Button onClick={handleSave} disabled={isSubmitting}>{isSubmitting ? 'Guardando...' : 'Guardar Tercero'}</Button>
                        </div>
                    </div>
                </div>
            )}
        </CrudPageTemplate>
    );
}
