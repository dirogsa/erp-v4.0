import React, { useState, useEffect } from 'react';
import { categoryService } from '../services/api';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/Modal';
import { useNotification } from '../hooks/useNotification';

const Categories = () => {
    const { showNotification } = useNotification();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        features_schema: []
    });

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        setLoading(true);
        try {
            const res = await categoryService.getCategories();
            setCategories(res.data);
        } catch (error) {
            showNotification('Error cargando categorías', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (category) => {
        setEditingCategory(category);
        setFormData({
            name: category.name,
            description: category.description || '',
            features_schema: category.features_schema || []
        });
        setModalVisible(true);
    };

    const handleCreate = () => {
        setEditingCategory(null);
        setFormData({
            name: '',
            description: '',
            features_schema: []
        });
        setModalVisible(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Seguro que deseas eliminar este tipo de producto?')) return;
        try {
            await categoryService.deleteCategory(id);
            showNotification('Categoría eliminada', 'success');
            loadCategories();
        } catch (error) {
            showNotification('Error al eliminar', 'error');
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editingCategory) {
                await categoryService.updateCategory(editingCategory._id, formData);
                showNotification('Categoría actualizada', 'success');
            } else {
                await categoryService.createCategory(formData);
                showNotification('Categoría creada', 'success');
            }
            setModalVisible(false);
            loadCategories();
        } catch (error) {
            showNotification('Error al guardar', 'error');
        }
    };

    // --- Features Handlers ---
    const addFeature = () => {
        setFormData(prev => ({
            ...prev,
            features_schema: [...prev.features_schema, '']
        }));
    };

    const updateFeature = (index, value) => {
        const newFeatures = [...formData.features_schema];
        newFeatures[index] = value;
        setFormData({ ...formData, features_schema: newFeatures });
    };

    const removeFeature = (index) => {
        setFormData(prev => ({
            ...prev,
            features_schema: prev.features_schema.filter((_, i) => i !== index)
        }));
    };

    return (
        <div style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <h1 style={{ color: 'white', fontSize: '2rem' }}>Tipos de Producto</h1>
                <Button onClick={handleCreate}>+ Nuevo Tipo</Button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                {categories.map(cat => (
                    <div key={cat._id} style={{
                        background: '#1e293b',
                        padding: '1.5rem',
                        borderRadius: '0.5rem',
                        border: '1px solid #334155'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <h3 style={{ color: '#f8fafc', margin: '0 0 0.5rem 0' }}>{cat.name}</h3>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <Button size="sm" variant="secondary" onClick={() => handleEdit(cat)}>Editar</Button>
                                <Button size="sm" variant="danger" onClick={() => handleDelete(cat._id)}>✕</Button>
                            </div>
                        </div>
                        <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1rem' }}>
                            {cat.description || 'Sin descripción'}
                        </p>

                        <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
                            <strong>Características (Checks):</strong> {cat.features_schema?.join(', ') || 'Ninguno'}
                        </div>
                    </div>
                ))}
            </div>

            <Modal
                isOpen={modalVisible}
                onClose={() => setModalVisible(false)}
                title={editingCategory ? "Editar Tipo de Producto" : "Nuevo Tipo de Producto"}
            >
                <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minWidth: '450px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <Input
                            label="Nombre"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                        <Input
                            label="Descripción"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    {/* SECCIÓN CARACTERÍSTICAS (FLAGS) */}
                    <div style={{ borderTop: '1px solid #334155', paddingTop: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h4 style={{ color: '#e2e8f0', margin: 0 }}>Características (Checks de Selección)</h4>
                            <Button type="button" size="sm" variant="secondary" onClick={addFeature}>+ Agregar Check</Button>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {formData.features_schema.map((feat, index) => (
                                <div key={index} style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', background: '#0f172a', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #334155' }}>
                                    <input
                                        value={feat}
                                        placeholder="Ej: Metálico"
                                        onChange={(e) => updateFeature(index, e.target.value)}
                                        style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', fontSize: '0.85rem', width: '120px' }}
                                    />
                                    <button type="button" onClick={() => removeFeature(index)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>✕</button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem', borderTop: '1px solid #334155', paddingTop: '1rem' }}>
                        <Button type="button" variant="secondary" onClick={() => setModalVisible(false)}>Cancelar</Button>
                        <Button type="submit" variant="primary">Guardar Tipo</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Categories;
