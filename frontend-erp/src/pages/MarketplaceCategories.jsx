import React, { useState, useEffect } from 'react';
import CrudPageTemplate from '../components/common/Crud/CrudPageTemplate';
import CrudToolbar from '../components/common/Crud/CrudToolbar';
import Table from '../components/common/Table';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import marketplaceService from '../services/marketplace.service';

export default function MarketplaceCategories() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        parent_id: '',
        description: ''
    });

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const data = await marketplaceService.getCategories({ limit: 100 });
            setCategories(data.items || []);
        } catch (error) {
            console.error('Error fetching categories:', error);
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
            if (selectedCategory) {
                await marketplaceService.updateCategory(selectedCategory._id, formData);
            } else {
                await marketplaceService.createCategory(formData);
            }
            setIsModalOpen(false);
            fetchCategories();
        } catch (error) {
            console.error('Error saving category:', error);
            alert('Error al guardar: ' + (error.response?.data?.detail || error.message));
        } finally {
            setIsSubmitting(false);
        }
    };

    const openEditModal = (category) => {
        setSelectedCategory(category);
        setFormData({
            code: category.code || '',
            name: category.name || '',
            parent_id: category.parent_id || '',
            description: category.description || ''
        });
        setIsModalOpen(true);
    };

    const openCreateModal = () => {
        setSelectedCategory(null);
        setFormData({ code: '', name: '', parent_id: '', description: '' });
        setIsModalOpen(true);
    };

    const handleDelete = async (ids) => {
        if (window.confirm(`¿Estás seguro de ARCHIVAR las ${ids.length} categorías seleccionadas?`)) {
            for (const id of ids) {
                try {
                    await marketplaceService.deleteCategory(id);
                } catch (err) {
                    console.error('Error archiving category:', err);
                }
            }
            setSelectedIds([]);
            fetchCategories();
        }
    };

    const filteredCategories = categories.filter(c => 
        (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.code || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const columns = [
        { label: 'Cód Interno', key: 'code', render: (val, row) => <div className="font-mono text-sm text-brand-primary">{row.code}</div> },
        { label: 'Categoría (MDM)', key: 'name', sortable: true, render: (val, row) => (
            <div className="font-bold text-white">
                {row.parent_name ? <span className="text-gray-500 font-normal mr-2">{row.parent_name} {'>'}</span> : null}
                {row.name}
            </div>
        )},
        { label: 'Descripción', key: 'description', render: (val, row) => <div className="text-sm text-gray-400">{row.description || '-'}</div> },
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
            + Nueva Categoría
        </Button>
    );

    return (
        <CrudPageTemplate
            title="Maestro de Categorías B2B"
            subtitle="Clasificación de productos exclusivos de terceros (MDM)"
            headerActions={headerActions}
        >
            <CrudToolbar
                selectedIds={selectedIds}
                onClearSelection={() => setSelectedIds([])}
                totalItems={filteredCategories.length}
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                searchPlaceholder="🔍 Buscar por código o nombre..."
                bulkActions={[
                    {
                        label: 'Archivar',
                        icon: '📁',
                        variant: 'warning',
                        onClick: handleDelete
                    }
                ]}
            />

            <Table
                columns={columns}
                data={filteredCategories}
                loading={loading}
                emptyMessage="No se encontraron categorías activas"
                enableSelection={true}
                selectedKeys={selectedIds}
                onSelectionChange={setSelectedIds}
                keyField="_id"
            />

            {isModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <div style={{ backgroundColor: '#0f172a', borderRadius: '0.75rem', width: '100%', maxWidth: '500px', padding: '1.5rem', border: '1px solid #334155' }}>
                        <h2 style={{ color: 'white', marginBottom: '1.5rem' }}>{selectedCategory ? '📝 Editar Categoría' : '🚀 Nueva Categoría'}</h2>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ color: 'white', fontSize: '0.875rem' }}>Categoría Padre (Jerarquía)</label>
                                <select 
                                    name="parent_id" 
                                    value={formData.parent_id} 
                                    onChange={handleInputChange}
                                    style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #475569', color: 'white', padding: '0.5rem', borderRadius: '0.375rem' }}
                                >
                                    <option value="">-- Sin categoría padre (Es Principal) --</option>
                                    {categories.filter(c => c._id !== selectedCategory?._id).map(c => (
                                        <option key={c._id} value={c._id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            
                            <Input label="Código Interno (Dejar vacío para auto-generar)" name="code" value={formData.code} onChange={handleInputChange} />
                            <Input label="Nombre de la Categoría *" name="name" value={formData.name} onChange={handleInputChange} required />
                            <Input label="Descripción" name="description" value={formData.description} onChange={handleInputChange} />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                            <Button onClick={handleSave} disabled={isSubmitting}>{isSubmitting ? 'Guardando...' : 'Guardar Categoría'}</Button>
                        </div>
                    </div>
                </div>
            )}
        </CrudPageTemplate>
    );
}
