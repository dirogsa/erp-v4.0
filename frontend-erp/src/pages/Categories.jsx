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
        features_schema: [],
        attributes_schema: [] // New field for dynamic attributes
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
            features_schema: category.features_schema || [],
            attributes_schema: category.attributes_schema || []
        });
        setModalVisible(true);
    };

    const handleCreate = () => {
        setEditingCategory(null);
        setFormData({
            name: '',
            description: '',
            features_schema: [],
            attributes_schema: []
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

    // --- Attributes Handlers ---
    const addAttribute = () => {
        setFormData(prev => ({
            ...prev,
            attributes_schema: [...prev.attributes_schema, { key: '', label: '', type: 'text', options: [] }]
        }));
    };

    const updateAttribute = (index, field, value) => {
        const newAttrs = [...formData.attributes_schema];
        newAttrs[index] = { ...newAttrs[index], [field]: value };
        // Auto-generate key from label if key is empty
        if (field === 'label' && !newAttrs[index].key) {
            newAttrs[index].key = value.toLowerCase().replace(/\s+/g, '_');
        }
        setFormData({ ...formData, attributes_schema: newAttrs });
    };

    const updateAttributeOptions = (index, optionsStr) => {
        const newAttrs = [...formData.attributes_schema];
        newAttrs[index].options = optionsStr.split(',').map(s => s.trim());
        setFormData({ ...formData, attributes_schema: newAttrs });
    };

    const removeAttribute = (index) => {
        setFormData(prev => ({
            ...prev,
            attributes_schema: prev.attributes_schema.filter((_, i) => i !== index)
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
                            <strong>Checks:</strong> {cat.features_schema?.join(', ') || 'Ninguno'}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#cbd5e1', marginTop: '0.5rem' }}>
                            <strong>Atributos:</strong> {cat.attributes_schema?.map(a => a.label).join(', ') || 'Ninguno'}
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

                    {/* SECCIÓN ATRIBUTOS DINÁMICOS (Key-Value) */}
                    <div style={{ borderTop: '1px solid #334155', paddingTop: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <div>
                                <h4 style={{ color: '#e2e8f0', margin: 0 }}>Atributos Avanzados (Filtros)</h4>
                                <small style={{ color: '#94a3b8' }}>Define campos como Forma, Material, Color...</small>
                            </div>
                            <Button type="button" size="sm" variant="secondary" onClick={addAttribute}>+ Agregar Atributo</Button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {formData.attributes_schema.map((attr, index) => (
                                <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: '0.5rem', alignItems: 'start', background: '#0f172a', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #334155' }}>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                        <label style={{ fontSize: '0.7rem', color: '#64748b' }}>Etiqueta (Label)</label>
                                        <input
                                            value={attr.label}
                                            placeholder="Ej: Forma"
                                            onChange={(e) => updateAttribute(index, 'label', e.target.value)}
                                            style={{ background: '#1e293b', border: '1px solid #334155', color: 'white', padding: '0.4rem', borderRadius: '0.25rem', fontSize: '0.85rem' }}
                                        />
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                        <label style={{ fontSize: '0.7rem', color: '#64748b' }}>Clave (Key)</label>
                                        <input
                                            value={attr.key}
                                            placeholder="Ej: shape"
                                            onChange={(e) => updateAttribute(index, 'key', e.target.value)}
                                            style={{ background: '#1e293b', border: '1px solid #334155', color: '#94a3b8', padding: '0.4rem', borderRadius: '0.25rem', fontSize: '0.85rem' }}
                                        />
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                        <label style={{ fontSize: '0.7rem', color: '#64748b' }}>Tipo</label>
                                        <select
                                            value={attr.type}
                                            onChange={(e) => updateAttribute(index, 'type', e.target.value)}
                                            style={{ background: '#1e293b', border: '1px solid #334155', color: 'white', padding: '0.4rem', borderRadius: '0.25rem', fontSize: '0.85rem' }}
                                        >
                                            <option value="text">Texto Libre</option>
                                            <option value="number">Número</option>
                                            <option value="select">Selección (Lista)</option>
                                            <option value="boolean">Si/No</option>
                                        </select>
                                    </div>

                                    {attr.type === 'select' ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                            <label style={{ fontSize: '0.7rem', color: '#64748b' }}>Opciones (CSV)</label>
                                            <input
                                                value={attr.options?.join(',')}
                                                placeholder="Redondo, Cuadrado..."
                                                onChange={(e) => updateAttributeOptions(index, e.target.value)}
                                                style={{ background: '#1e293b', border: '1px solid #334155', color: 'white', padding: '0.4rem', borderRadius: '0.25rem', fontSize: '0.85rem' }}
                                            />
                                        </div>
                                    ) : <div></div>}

                                    <button type="button" onClick={() => removeAttribute(index)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', marginTop: '1.5rem' }}>🗑️</button>
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
