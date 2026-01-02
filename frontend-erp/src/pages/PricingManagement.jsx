import React, { useState, useEffect } from 'react';
import { pricingService, categoryService, brandService } from '../services/api';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Modal from '../components/Modal';
import Table from '../components/common/Table';
import { useNotification } from '../hooks/useNotification';

const TIERS = [
    { value: 'STANDARD', label: 'STANDARD' },
    { value: 'BRONCE', label: 'BRONCE' },
    { value: 'PLATA', label: 'PLATA' },
    { value: 'ORO', label: 'ORO' },
    { value: 'DIAMANTE', label: 'DIAMANTE' }
];

const PricingManagement = () => {
    const { showNotification } = useNotification();
    const [rules, setRules] = useState([]);
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingRule, setEditingRule] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        tier: 'BRONCE',
        category_id: '',
        brand: '',
        discount_percentage: 0,
        is_active: true
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [rulesRes, catsRes, brandsRes] = await Promise.all([
                pricingService.getRules(),
                categoryService.getCategories(),
                brandService.getBrands()
            ]);
            setRules(rulesRes.data);
            setCategories(catsRes.data);
            setBrands(brandsRes.data);
        } catch (error) {
            showNotification('Error cargando datos de precios', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (rule) => {
        setEditingRule(rule);
        setFormData({
            name: rule.name,
            tier: rule.tier,
            category_id: rule.category_id || '',
            brand: rule.brand || '',
            discount_percentage: rule.discount_percentage,
            is_active: rule.is_active
        });
        setModalVisible(true);
    };

    const handleCreate = () => {
        setEditingRule(null);
        setFormData({
            name: '',
            tier: 'BRONCE',
            category_id: '',
            brand: '',
            discount_percentage: 0,
            is_active: true
        });
        setModalVisible(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Seguro que deseas eliminar esta regla de precio?')) return;
        try {
            await pricingService.deleteRule(id);
            showNotification('Regla eliminada', 'success');
            loadData();
        } catch (error) {
            showNotification('Error al eliminar', 'error');
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const dataToSave = {
                ...formData,
                category_id: formData.category_id || null,
                brand: formData.brand || null,
                discount_percentage: parseFloat(formData.discount_percentage)
            };

            if (editingRule) {
                await pricingService.updateRule(editingRule.id, dataToSave);
                showNotification('Regla actualizada', 'success');
            } else {
                await pricingService.createRule(dataToSave);
                showNotification('Regla creada', 'success');
            }
            setModalVisible(false);
            loadData();
        } catch (error) {
            showNotification('Error al guardar la regla', 'error');
        }
    };

    const columns = [
        { label: 'Nombre de la Regla', key: 'name' },
        {
            label: 'Nivel/Socio',
            key: 'tier',
            render: (val) => (
                <span style={{
                    background: val === 'ORO' ? '#fef3c7' : val === 'DIAMANTE' ? '#ede9fe' : '#f1f5f9',
                    color: val === 'ORO' ? '#92400e' : val === 'DIAMANTE' ? '#5b21b6' : '#475569',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '0.25rem',
                    fontSize: '0.75rem',
                    fontWeight: 'bold'
                }}>
                    {val}
                </span>
            )
        },
        {
            label: 'Aplica a',
            key: 'target',
            render: (_, row) => {
                if (row.brand && row.category_id) {
                    const cat = categories.find(c => c._id === row.category_id);
                    return `Marca: ${row.brand} + Cat: ${cat?.name || row.category_id}`;
                }
                if (row.brand) return `Marca: ${row.brand}`;
                if (row.category_id) {
                    const cat = categories.find(c => c._id === row.category_id);
                    return `Categoría: ${cat?.name || row.category_id}`;
                }
                return 'Global (Todo el catálogo)';
            }
        },
        {
            label: 'Descuento',
            key: 'discount_percentage',
            align: 'right',
            render: (val) => <span style={{ color: '#10b981', fontWeight: 'bold' }}>-{val}%</span>
        },
        {
            label: 'Estado',
            key: 'is_active',
            align: 'center',
            render: (val) => (
                <span style={{ color: val ? '#10b981' : '#ef4444' }}>
                    {val ? 'Activo' : 'Inactivo'}
                </span>
            )
        },
        {
            label: 'Acciones',
            key: 'actions',
            align: 'center',
            render: (_, row) => (
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                    <Button size="small" variant="secondary" onClick={() => handleEdit(row)}>Editar</Button>
                    <Button size="small" variant="danger" onClick={() => handleDelete(row.id)}>✕</Button>
                </div>
            )
        }
    ];

    return (
        <div style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ color: 'white', fontSize: '2rem', marginBottom: '0.5rem' }}>Administración de Precios B2B</h1>
                    <p style={{ color: '#94a3b8' }}>Define reglas de descuento automáticas para tus socios por nivel (Oro, Plata, etc)</p>
                </div>
                <Button onClick={handleCreate}>+ Nueva Regla</Button>
            </div>

            <Table
                columns={columns}
                data={rules}
                loading={loading}
                emptyMessage="No hay reglas de precio configuradas."
            />

            <Modal
                isOpen={modalVisible}
                onClose={() => setModalVisible(false)}
                title={editingRule ? "Editar Regla de Precio" : "Nueva Regla de Precio"}
            >
                <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minWidth: '450px' }}>
                    <Input
                        label="Nombre descriptivo"
                        placeholder="Ej: Descuento Oro para marca WIX"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                    />

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <Select
                            label="Nivel de Socio"
                            options={TIERS}
                            value={formData.tier}
                            onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
                            required
                        />
                        <Input
                            label="% Descuento"
                            type="number"
                            step="0.01"
                            value={formData.discount_percentage}
                            onChange={(e) => setFormData({ ...formData, discount_percentage: e.target.value })}
                            required
                        />
                    </div>

                    <div style={{ borderTop: '1px solid #334155', paddingTop: '1rem' }}>
                        <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1rem' }}>
                            Aplica esta regla a una marca o categoría específica (opcional):
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <Select
                                label="Marca (Vehículo)"
                                options={[
                                    { value: '', label: '-- Todas las marcas --' },
                                    ...brands.map(b => ({ value: b.name, label: b.name }))
                                ]}
                                value={formData.brand}
                                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                            />
                            <Select
                                label="Categoría de Producto"
                                options={[
                                    { value: '', label: '-- Todas las categorías --' },
                                    ...categories.map(c => ({ value: c._id, label: c.name }))
                                ]}
                                value={formData.category_id}
                                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', itemsCenter: 'center', gap: '0.5rem', color: 'white' }}>
                        <input
                            type="checkbox"
                            id="is_active"
                            checked={formData.is_active}
                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        />
                        <label htmlFor="is_active">Regla activa</label>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem', borderTop: '1px solid #334155', paddingTop: '1rem' }}>
                        <Button type="button" variant="secondary" onClick={() => setModalVisible(false)}>Cancelar</Button>
                        <Button type="submit" variant="primary">Guardar Regla</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default PricingManagement;
