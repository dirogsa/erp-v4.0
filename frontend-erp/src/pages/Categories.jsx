import React, { useState, useEffect } from 'react';
import { categoryService } from '../services/api';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/Modal';
import { useNotification } from '../hooks/useNotification';
import Layout from '../components/Layout';
import { 
    Package, Droplet, Zap, Filter, Battery, Truck, 
    Layers, ChevronRight, Trash2, Edit3, Rocket, ClipboardList, Sparkles
} from 'lucide-react';

const ICON_LIST = [
    { name: 'Package', icon: Package },
    { name: 'Droplet', icon: Droplet },
    { name: 'Zap', icon: Zap },
    { name: 'Filter', icon: Filter },
    { name: 'Battery', icon: Battery },
    { name: 'Truck', icon: Truck },
    { name: 'Layers', icon: Layers }
];

const COLOR_MAP = {
    'rojo': '#ef4444',
    'azul': '#3b82f6',
    'naranja': '#f59e0b',
    'amarillo': '#eab308',
    'verde': '#10b981',
    'indigo': '#6366f1',
    'purpura': '#8b5cf6',
    'gris': '#64748b'
};

const Categories = () => {
    const { showNotification } = useNotification();
    const [categories, setCategories] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [bulkModalVisible, setBulkModalVisible] = useState(false);
    const [bulkText, setBulkText] = useState('');
    const [editingCategory, setEditingCategory] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        parent_id: '',
        icon: 'Package',
        color: '#6366f1',
        import_aliases: [],
        attributes_schema: []
    });

    useEffect(() => { loadCategories(); }, []);

    const loadCategories = async () => {
        try {
            const res = await categoryService.getCategories();
            setCategories(res.data);
        } catch (error) {
            showNotification('Error cargando catálogo', 'error');
        }
    };

    const handleEdit = (category) => {
        setEditingCategory(category);
        setFormData({
            name: category.name,
            parent_id: category.parent_id || '',
            icon: category.icon || 'Package',
            color: category.color || '#6366f1',
            import_aliases: category.import_aliases || [],
            attributes_schema: category.attributes_schema || []
        });
        setModalVisible(true);
    };

    const handleCreate = () => {
        setEditingCategory(null);
        setFormData({
            name: '', parent_id: '', icon: 'Package', color: '#6366f1',
            import_aliases: [], attributes_schema: []
        });
        setModalVisible(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const data = { ...formData };
            if (!data.parent_id) delete data.parent_id;

            if (editingCategory) await categoryService.updateCategory(editingCategory._id, data);
            else await categoryService.createCategory(data);
            
            showNotification('Guardado correctamente', 'success');
            setModalVisible(false);
            loadCategories();
        } catch (error) {
            showNotification('Error al guardar', 'error');
        }
    };

    const parseBulkText = () => {
        const sections = bulkText.split(/\d+\.\s*Categoría:/gi).filter(s => s.trim());
        const results = sections.map(section => {
            const lines = section.split('\n').map(l => l.trim()).filter(l => l);
            const category = {
                name: lines[0]?.split('(')[0]?.trim() || 'Nueva Categoría',
                icon: 'Package',
                color: '#6366f1',
                import_aliases: [],
                attributes_schema: []
            };

            lines.forEach(line => {
                if (line.toLowerCase().includes('icono:')) {
                    const iconPart = line.split('|')[0].split(':')[1]?.trim();
                    const colorPart = line.split('|')[1]?.split(':')[1]?.trim();
                    if (iconPart) category.icon = ICON_LIST.find(i => i.name.toLowerCase() === iconPart.toLowerCase())?.name || 'Package';
                    if (colorPart) {
                        const hexMatch = colorPart.match(/#[a-fA-F0-9]{6}/);
                        if (hexMatch) category.color = hexMatch[0];
                        else {
                            const colorKey = colorPart.toLowerCase().split('(')[0].trim();
                            if (COLOR_MAP[colorKey]) category.color = COLOR_MAP[colorKey];
                        }
                    }
                }
                if (line.toLowerCase().startsWith('aliases:')) {
                    category.import_aliases = line.split(':')[1]?.split(',').map(s => s.trim()) || [];
                }
                if (line.toLowerCase().startsWith('etiqueta:')) {
                    const parts = line.split('|');
                    const label = parts[0].split(':')[1]?.trim();
                    const unit = parts[1]?.split(':')[1]?.trim() || '';
                    const mappings = parts[2]?.split(':')[1]?.split(',').map(s => s.trim()) || [];
                    if (label) {
                        category.attributes_schema.push({
                            label,
                            unit,
                            import_mapping: mappings,
                            type: 'text',
                            key: label.toLowerCase().replace(/\s+/g, '_').normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                        });
                    }
                }
            });
            return category;
        });
        return results;
    };

    const handleBulkImport = async () => {
        const parsed = parseBulkText();
        if (parsed.length === 0) return showNotification('No se detectaron categorías', 'error');
        
        try {
            for (const cat of parsed) {
                await categoryService.createCategory(cat);
            }
            showNotification(`${parsed.length} categorías creadas`, 'success');
            setBulkModalVisible(false);
            setBulkText('');
            loadCategories();
        } catch (error) {
            showNotification('Error en la importación masiva', 'error');
        }
    };

    const addAttribute = () => {
        setFormData(prev => ({
            ...prev,
            attributes_schema: [...prev.attributes_schema, { label: '', unit: '', import_mapping: [], type: 'text', key: '' }]
        }));
    };

    const updateAttribute = (index, field, value) => {
        const newAttrs = [...formData.attributes_schema];
        newAttrs[index] = { ...newAttrs[index], [field]: value };
        if (field === 'label') {
            newAttrs[index].key = value.toLowerCase().replace(/\s+/g, '_').normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        }
        setFormData({ ...formData, attributes_schema: newAttrs });
    };

    return (
        <Layout>
            <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: 0, fontSize: '1.75rem' }}>
                        <Layers color="#6366f1" size={32} /> Catálogo Maestro
                    </h1>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button 
                            onClick={() => setBulkModalVisible(true)}
                            style={{ 
                                background: 'rgba(99, 102, 241, 0.1)', 
                                border: '1px solid rgba(99, 102, 241, 0.3)', 
                                color: '#a5b4fc',
                                padding: '0.75rem 1.5rem',
                                borderRadius: '0.75rem',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            <Sparkles size={18} /> Importación Inteligente
                        </button>
                        <Button onClick={handleCreate} style={{ padding: '0.75rem 1.5rem', fontWeight: 'bold' }}>
                            + Nueva Categoría
                        </Button>
                    </div>
                </div>

                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
                    gap: '1.5rem' 
                }}>
                    {categories.filter(c => !c.parent_id).map(cat => (
                        <CategoryCard 
                            key={cat._id} 
                            category={cat} 
                            allCategories={categories}
                            onEdit={handleEdit}
                            onDelete={async (id) => {
                                if (window.confirm('¿Eliminar categoría y su estructura técnica?')) {
                                    try {
                                        await categoryService.deleteCategory(id);
                                        loadCategories();
                                    } catch (e) { showNotification('Error al eliminar', 'error'); }
                                }
                            }}
                        />
                    ))}
                </div>

                {/* Modal de Importación Masiva */}
                <Modal
                    isOpen={bulkModalVisible}
                    onClose={() => setBulkModalVisible(false)}
                    title="Asistente de Importación Inteligente"
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            Pega aquí la definición de tus categorías. El sistema detectará automáticamente los nombres, iconos, colores y atributos técnicos.
                        </p>
                        <textarea 
                            style={{ 
                                width: '100%', 
                                height: '300px', 
                                background: 'rgba(0,0,0,0.2)', 
                                border: '1px solid var(--border-color)', 
                                borderRadius: '0.75rem', 
                                padding: '1rem', 
                                color: 'white', 
                                fontSize: '0.85rem',
                                fontFamily: 'monospace',
                                outline: 'none'
                            }}
                            placeholder="Ejemplo:
1. Categoría: FILTRO DE ACEITE
Icono: Droplet | Color: Rojo
Aliases: OIL FILTER, LUBE FILTER
Etiqueta: Altura | Unidad: mm | Mapping: H, Height"
                            value={bulkText}
                            onChange={(e) => setBulkText(e.target.value)}
                        />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                            <button type="button" onClick={() => setBulkModalVisible(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>Cancelar</button>
                            <Button onClick={handleBulkImport} style={{ padding: '0.75rem 2rem' }}>
                                <Rocket size={18} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} /> Procesar e Importar
                            </Button>
                        </div>
                    </div>
                </Modal>

                <Modal
                    isOpen={modalVisible}
                    onClose={() => setModalVisible(false)}
                    title={editingCategory ? "Configuración Técnica" : "Nueva Estructura Maestro"}
                >
                    <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <Input
                                label="Nombre del Tipo"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Categoría Padre</label>
                                <select 
                                    style={{ margin: 0 }}
                                    value={formData.parent_id}
                                    onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                                >
                                    <option value="">(Ninguna / Raíz)</option>
                                    {categories.filter(c => c._id !== editingCategory?._id).map(c => (
                                        <option key={c._id} value={c._id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {ICON_LIST.map(item => (
                                    <button
                                        key={item.name}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, icon: item.name })}
                                        style={{ 
                                            padding: '0.5rem', 
                                            borderRadius: '0.5rem', 
                                            border: '1px solid var(--border-color)',
                                            background: formData.icon === item.name ? 'var(--primary-color)' : 'transparent',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <item.icon size={16} color="white" />
                                    </button>
                                ))}
                            </div>
                            <input 
                                type="color" 
                                value={formData.color}
                                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                style={{ width: '40px', height: '30px', padding: 0, border: 'none', background: 'none', cursor: 'pointer', marginBottom: 0 }}
                            />
                        </div>

                        <div>
                            <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>Aliases de Importación</label>
                            <input 
                                style={{ fontSize: '0.85rem', marginBottom: 0 }}
                                placeholder="OIL FILTER, LUBE FILTER, FILTRO ACEITE..."
                                value={(formData.import_aliases || []).join(', ')}
                                onChange={(e) => setFormData({ ...formData, import_aliases: e.target.value.split(',').map(s => s.trim()) })}
                            />
                        </div>

                        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h3 style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase', margin: 0 }}>Estructura Técnica (Atributos)</h3>
                                <button type="button" onClick={addAttribute} style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer' }}>+ Añadir Atributo</button>
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '250px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                                {formData.attributes_schema.map((attr, index) => (
                                    <div key={index} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
                                        <input 
                                            style={{ flex: 2, margin: 0, fontSize: '0.85rem', background: 'transparent' }}
                                            placeholder="Etiqueta (Ej: Altura)"
                                            value={attr.label || ''}
                                            onChange={(e) => updateAttribute(index, 'label', e.target.value)}
                                        />
                                        <input 
                                            style={{ flex: 1, margin: 0, fontSize: '0.85rem', background: 'transparent', color: 'var(--primary-color)', fontWeight: 'bold' }}
                                            placeholder="Unid (mm)"
                                            value={attr.unit || ''}
                                            onChange={(e) => updateAttribute(index, 'unit', e.target.value)}
                                        />
                                        <input 
                                            style={{ flex: 2, margin: 0, fontSize: '0.75rem', background: 'transparent', fontStyle: 'italic', color: 'var(--text-secondary)' }}
                                            placeholder="Mappings (H, Height...)"
                                            value={(attr.import_mapping || []).join(', ')}
                                            onChange={(e) => updateAttribute(index, 'import_mapping', e.target.value.split(',').map(s => s.trim()))}
                                        />
                                        <button 
                                            type="button" 
                                            onClick={() => setFormData(prev => ({ ...prev, attributes_schema: prev.attributes_schema.filter((_, i) => i !== index) }))}
                                            style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                                {formData.attributes_schema.length === 0 && (
                                    <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem', fontStyle: 'italic' }}>No hay atributos definidos.</p>
                                )}
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', paddingTop: '1rem' }}>
                            <button type="button" onClick={() => setModalVisible(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>Cancelar</button>
                            <Button type="submit" style={{ padding: '0.75rem 2rem' }}>
                                <Rocket size={18} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} /> Guardar Estructura
                            </Button>
                        </div>
                    </form>
                </Modal>
            </div>
        </Layout>
    );
};

const CategoryCard = ({ category, allCategories, onEdit, onDelete }) => {
    const children = allCategories.filter(c => c.parent_id === category._id);
    const IconComp = ICON_LIST.find(i => i.name === category.icon)?.icon || Package;

    return (
        <div className="card" style={{ 
            position: 'relative', 
            borderTop: `4px solid ${category.color}`,
            marginBottom: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ 
                    padding: '0.75rem', 
                    borderRadius: '0.75rem', 
                    backgroundColor: `${category.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <IconComp size={24} color={category.color} />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => onEdit(category)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }} title="Editar"><Edit3 size={18} /></button>
                    <button onClick={() => onDelete(category._id)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }} title="Eliminar"><Trash2 size={18} /></button>
                </div>
            </div>

            <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold' }}>{category.name}</h3>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginTop: '0.25rem', fontWeight: 'bold', letterSpacing: '0.05em' }}>
                    {(category.import_aliases || []).join(' • ') || 'SIN ALIASES'}
                </div>
            </div>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {(category.attributes_schema || []).map((a, i) => (
                    <span key={i} style={{ 
                        fontSize: '0.65rem', 
                        padding: '0.2rem 0.5rem', 
                        backgroundColor: 'rgba(255,255,255,0.05)', 
                        border: '1px solid var(--border-color)',
                        borderRadius: '0.25rem',
                        color: 'var(--text-secondary)'
                    }}>
                        {a.label} {a.unit && `(${a.unit})`}
                    </span>
                ))}
            </div>

            {children.length > 0 && (
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {children.map(child => (
                            <div key={child._id} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                <ChevronRight size={12} color="var(--primary-color)" /> {child.name}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Categories;
