import React, { useState, useEffect } from 'react';
import { categoryService, brandService } from '../../../services/api';
import Input from '../../common/Input';
import Button from '../../common/Button';
import Select from '../../common/Select';
import { useNotification } from '../../../hooks/useNotification';

const ProductForm = ({
    initialData = null,
    onSubmit,
    onCancel,
    loading = false
}) => {
    const { showNotification } = useNotification();
    const isEditMode = !!initialData;

    const [formData, setFormData] = useState({
        sku: '',
        name: '',
        brand: '',
        initial_stock: 0,
        stock_current: 0,
        image_url: '',
        weight_g: 0,
        category_id: '',
        custom_attributes: {},
        features: [],
        specs: [],
        equivalences: [],
        applications: [],
        is_new: false,
        is_active_in_shop: false,
        discount_6_pct: 0,
        discount_12_pct: 0,
        discount_24_pct: 0,
        ...initialData
    });

    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [vehicleBrands, setVehicleBrands] = useState([]);

    useEffect(() => {
        loadCategories();
        loadVehicleBrands();
    }, []);

    // Effect to set selected category object when formData.category_id changes (e.g. edit mode)
    useEffect(() => {
        if (categories.length > 0 && formData.category_id) {
            const cat = categories.find(c => c._id === formData.category_id);
            setSelectedCategory(cat || null);
        }
    }, [categories, formData.category_id]);

    const loadCategories = async () => {
        try {
            const res = await categoryService.getCategories();
            setCategories(res.data);
        } catch (error) {
            console.error("Error loading categories", error);
        }
    };

    const loadVehicleBrands = async () => {
        try {
            const res = await brandService.getBrands();
            setVehicleBrands(res.data);
        } catch (error) {
            console.error("Error loading brands", error);
        }
    };

    const measureTypes = [
        { value: 'mm', label: 'Milímetros (mm)' },
        { value: 'inch', label: 'Pulgadas (inch)' },
        { value: 'thread', label: 'Rosca' },
        { value: 'other', label: 'Otro' }
    ];

    const categoryTemplates = {
        'ACEITE': [
            { label: 'A', measure_type: 'mm', value: '' },
            { label: 'B', measure_type: 'mm', value: '' },
            { label: 'C', measure_type: 'mm', value: '' },
            { label: 'H', measure_type: 'mm', value: '' },
            { label: 'F (Rosca)', measure_type: 'thread', value: '' }
        ],
        'AIRE': [
            { label: 'A (OD)', measure_type: 'mm', value: '' },
            { label: 'B (ID)', measure_type: 'mm', value: '' },
            { label: 'H', measure_type: 'mm', value: '' }
        ],
        'COMBUSTIBLE': [
            { label: 'A', measure_type: 'mm', value: '' },
            { label: 'B', measure_type: 'mm', value: '' },
            { label: 'H', measure_type: 'mm', value: '' },
            { label: 'Rosca Entry', measure_type: 'thread', value: '' },
            { label: 'Rosca Exit', measure_type: 'thread', value: '' }
        ]
    };

    const applyTemplate = (categoryName) => {
        const key = Object.keys(categoryTemplates).find(k => categoryName.toUpperCase().includes(k));
        if (key && (formData.specs || []).length === 0) {
            setFormData(prev => ({ ...prev, specs: categoryTemplates[key] }));
            showNotification(`Plantilla de ${key} aplicada automáticamente`, 'info');
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!formData.sku || !formData.name) {
            showNotification('SKU y Nombre son obligatorios', 'error');
            return;
        }

        // Check for new vehicle brands in applications
        const newBrands = formData.applications
            .map(app => (app.make || '').trim().toUpperCase())
            .filter(make => make && !vehicleBrands.find(b => b.name === make));

        const uniqueNewBrands = [...new Set(newBrands)];

        if (uniqueNewBrands.length > 0) {
            const confirmNew = window.confirm(
                `Estás por registrar las siguientes marcas NUEVAS: ${uniqueNewBrands.join(', ')}.\n\n` +
                `¿Confirmas que los nombres son correctos? (Un error aquí afectará la búsqueda en la tienda)`
            );
            if (!confirmNew) return;
        }

        onSubmit(formData);
    };

    // --- Dynamic List Handlers ---

    const addItem = (field, item) => {
        setFormData(prev => ({
            ...prev,
            [field]: [...(prev[field] || []), item]
        }));
    };

    const removeItem = (field, index) => {
        setFormData(prev => ({
            ...prev,
            [field]: (prev[field] || []).filter((_, i) => i !== index)
        }));
    };

    const updateItem = (field, index, subField, value) => {
        const newItems = [...(formData[field] || [])];
        let finalValue = value;

        // Auto-uppercase for brands/makes
        if (subField === 'make' || subField === 'brand') {
            finalValue = value.toUpperCase();
        }

        newItems[index] = { ...newItems[index], [subField]: finalValue };
        setFormData(prev => ({ ...prev, [field]: newItems }));
    };

    const handleAttributeChange = (key, value) => {
        setFormData(prev => ({
            ...prev,
            custom_attributes: {
                ...prev.custom_attributes,
                [key]: value
            }
        }));
    };

    const toggleFeature = (feature) => {
        setFormData(prev => {
            const features = prev.features || [];
            if (features.includes(feature)) {
                return { ...prev, features: features.filter(f => f !== feature) };
            } else {
                return { ...prev, features: [...features, feature] };
            }
        });
    };

    const sectionStyle = {
        background: '#1e293b',
        padding: '1rem',
        borderRadius: '0.5rem',
        border: '1px solid #334155',
        marginBottom: '1rem'
    };

    const sectionTitleStyle = {
        color: '#e2e8f0',
        fontSize: '1rem',
        fontWeight: '600',
        marginBottom: '1rem',
        borderBottom: '1px solid #334155',
        paddingBottom: '0.5rem'
    };

    const rowStyle = {
        display: 'grid',
        gap: '0.5rem',
        alignItems: 'start',
        marginBottom: '0.5rem',
        padding: '0.5rem',
        background: '#0f172a',
        borderRadius: '0.25rem'
    };

    return (
        <form onSubmit={handleSubmit} style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* --- Información Básica --- */}
            <div style={sectionStyle}>
                <h3 style={sectionTitleStyle}>Información Básica</h3>
                <div style={{ display: 'grid', gap: '1rem' }}>
                    <Input
                        label="SKU"
                        value={formData.sku}
                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                        placeholder="PROD-001"
                        required
                        disabled={isEditMode}
                    />
                    <Input
                        label="Nombre"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                    />

                    <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '1rem',
                        background: formData.is_new ? '#05966933' : '#0f172a',
                        border: `2px solid ${formData.is_new ? '#059669' : '#334155'}`,
                        borderRadius: '0.75rem',
                        cursor: 'pointer',
                        color: formData.is_new ? '#34d399' : '#94a3b8',
                        transition: 'all 0.2s'
                    }}>
                        <input
                            type="checkbox"
                            checked={formData.is_new}
                            onChange={(e) => setFormData({ ...formData, is_new: e.target.checked })}
                            style={{ width: '22px', height: '22px' }}
                        />
                        <div>
                            <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>✨ MARCAR COMO NOVEDAD</div>
                            <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Este producto aparecerá en la sección VIP de NOVEDADES del catálogo.</div>
                        </div>
                    </label>

                    <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '1rem',
                        background: formData.is_active_in_shop ? '#3b82f633' : '#0f172a',
                        border: `2px solid ${formData.is_active_in_shop ? '#3b82f6' : '#334155'}`,
                        borderRadius: '0.75rem',
                        cursor: 'pointer',
                        color: formData.is_active_in_shop ? '#60a5fa' : '#94a3b8',
                        transition: 'all 0.2s',
                        marginTop: '0.5rem'
                    }}>
                        <input
                            type="checkbox"
                            checked={formData.is_active_in_shop}
                            onChange={(e) => setFormData({ ...formData, is_active_in_shop: e.target.checked })}
                            style={{ width: '22px', height: '22px' }}
                        />
                        <div>
                            <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>🛒 VISIBLE EN TIENDA</div>
                            <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Si está activo, este producto aparecerá en la web de ventas online (frontend-shop).</div>
                        </div>
                    </label>

                    <Select
                        label="Tipo de Producto"
                        options={categories.map(c => ({ value: c._id, label: c.name }))}
                        value={formData.category_id}
                        onChange={(e) => {
                            const catId = e.target.value;
                            const cat = categories.find(c => c._id === catId);
                            setFormData(prev => ({ ...prev, category_id: catId }));
                            if (cat) applyTemplate(cat.name);
                        }}
                        placeholder="Seleccionar Tipo (Filtro Aceite, Aire, etc.)"
                    />
                    <Input
                        label="Peso (gramos)"
                        type="number"
                        value={formData.weight_g}
                        onChange={(e) => setFormData({ ...formData, weight_g: parseFloat(e.target.value) || 0 })}
                        placeholder="0"
                    />
                    <Input
                        label="Puntos de Fidelidad"
                        type="number"
                        value={formData.loyalty_points}
                        onChange={(e) => setFormData({ ...formData, loyalty_points: parseInt(e.target.value) || 0 })}
                        placeholder="0"
                    />

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', background: '#0f172a', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #334155' }}>
                        <Input
                            label="% Desc. 6 Unid."
                            type="number"
                            value={formData.discount_6_pct}
                            onChange={(e) => setFormData({ ...formData, discount_6_pct: parseFloat(e.target.value) || 0 })}
                            placeholder="0"
                        />
                        <Input
                            label="% Desc. 12 Unid."
                            type="number"
                            value={formData.discount_12_pct}
                            onChange={(e) => setFormData({ ...formData, discount_12_pct: parseFloat(e.target.value) || 0 })}
                            placeholder="0"
                        />
                        <Input
                            label="% Desc. 24 Unid."
                            type="number"
                            value={formData.discount_24_pct}
                            onChange={(e) => setFormData({ ...formData, discount_24_pct: parseFloat(e.target.value) || 0 })}
                            placeholder="0"
                        />
                    </div>
                    <Input
                        label="Marca del Producto (Fabricante)"
                        value={formData.brand}
                        onChange={(e) => setFormData({ ...formData, brand: e.target.value.toUpperCase() })}
                        placeholder="Ej: BOSCH, TOYOTA, MANN"
                    />
                    <Input
                        label="URL de Imagen"
                        value={formData.image_url}
                        onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                        placeholder="https://ejemplo.com/imagen.jpg"
                    />
                    {formData.image_url && (
                        <div style={{ marginTop: '0.5rem', textAlign: 'center' }}>
                            <img
                                src={formData.image_url}
                                alt="Vista previa"
                                style={{ maxHeight: '150px', borderRadius: '0.5rem', border: '1px solid #334155' }}
                                onError={(e) => { e.target.style.display = 'none'; }}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* --- Atributos Específicos (Dinámicos - 3 Niveles) --- */}
            {selectedCategory && (
                <>
                    {/* SECCIÓN CARACTERÍSTICAS (FLAGS) */}
                    {selectedCategory.features_schema?.length > 0 && (
                        <div style={sectionStyle}>
                            <h3 style={sectionTitleStyle}>Características Especiales</h3>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                                {selectedCategory.features_schema.map((feat) => (
                                    <label key={feat} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        color: '#e2e8f0',
                                        cursor: 'pointer',
                                        background: formData.features?.includes(feat) ? '#3b82f633' : '#0f172a',
                                        padding: '0.5rem 1rem',
                                        borderRadius: '0.5rem',
                                        border: `1px solid ${formData.features?.includes(feat) ? '#3b82f6' : '#334155'}`
                                    }}>
                                        <input
                                            type="checkbox"
                                            checked={formData.features?.includes(feat)}
                                            onChange={() => toggleFeature(feat)}
                                        />
                                        {feat}
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* --- Especificaciones Técnicas --- */}
            <div style={sectionStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #334155', paddingBottom: '0.5rem' }}>
                    <h3 style={{ margin: 0, color: '#e2e8f0', fontSize: '1rem' }}>Especificaciones Técnicas (Medidas)</h3>
                    <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => addItem('specs', { label: '', measure_type: 'mm', value: '' })}
                    >
                        + Agregar
                    </Button>
                </div>

                {(!formData.specs || formData.specs.length === 0) && <p style={{ color: '#64748b', fontStyle: 'italic' }}>Sin especificaciones registradas.</p>}

                {formData.specs?.map((spec, index) => (
                    <div key={index} style={{ ...rowStyle, gridTemplateColumns: '1fr 1fr 1fr auto' }}>
                        <Input
                            placeholder="Etiqueta (Ej: Altura, Diámetro)"
                            value={spec.label}
                            onChange={(e) => updateItem('specs', index, 'label', e.target.value)}
                        />
                        <Select
                            placeholder="Unidad"
                            options={measureTypes}
                            value={spec.measure_type}
                            onChange={(e) => updateItem('specs', index, 'measure_type', e.target.value)}
                        />
                        <Input
                            placeholder="Valor"
                            value={spec.value}
                            onChange={(e) => updateItem('specs', index, 'value', e.target.value)}
                        />
                        <Button
                            type="button"
                            variant="danger"
                            onClick={() => removeItem('specs', index)}
                            style={{ padding: '0.5rem' }}
                        >
                            ✕
                        </Button>
                    </div>
                ))}
            </div>

            {/* --- Equivalencias --- */}
            <div style={sectionStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #334155', paddingBottom: '0.5rem' }}>
                    <h3 style={{ margin: 0, color: '#e2e8f0', fontSize: '1rem' }}>Equivalencias / Cruces</h3>
                    <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => addItem('equivalences', { brand: '', code: '', is_original: false })}
                    >
                        + Agregar
                    </Button>
                </div>

                {(!formData.equivalences || formData.equivalences.length === 0) && <p style={{ color: '#64748b', fontStyle: 'italic' }}>Sin equivalencias registradas.</p>}

                {formData.equivalences?.map((eq, index) => (
                    <div key={index} style={{ ...rowStyle, gridTemplateColumns: '1fr 1fr auto auto' }}>
                        <Input
                            placeholder="Marca"
                            value={eq.brand}
                            onChange={(e) => updateItem('equivalences', index, 'brand', e.target.value)}
                        />
                        <Input
                            placeholder="Código"
                            value={eq.code}
                            onChange={(e) => updateItem('equivalences', index, 'code', e.target.value)}
                        />
                        <label style={{ display: 'flex', alignItems: 'center', color: '#e2e8f0', fontSize: '0.875rem', gap: '0.5rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                            <input
                                type="checkbox"
                                checked={eq.is_original}
                                onChange={(e) => updateItem('equivalences', index, 'is_original', e.target.checked)}
                            />
                            Es OEM
                        </label>
                        <Button
                            type="button"
                            variant="danger"
                            onClick={() => removeItem('equivalences', index)}
                            style={{ padding: '0.5rem' }}
                        >
                            ✕
                        </Button>
                    </div>
                ))}
            </div>

            {/* --- Aplicaciones --- */}
            <div style={sectionStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #334155', paddingBottom: '0.5rem' }}>
                    <h3 style={{ margin: 0, color: '#e2e8f0', fontSize: '1rem' }}>Aplicaciones Vehiculares</h3>
                    <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => addItem('applications', { make: '', model: '', year: '', engine: '', notes: '' })}
                    >
                        + Agregar
                    </Button>
                </div>

                {(!formData.applications || formData.applications.length === 0) && <p style={{ color: '#64748b', fontStyle: 'italic' }}>Sin aplicaciones registradas.</p>}

                {formData.applications?.map((app, index) => (
                    <div key={index} style={{ ...rowStyle, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '0.5rem' }}>
                            <div style={{ position: 'relative' }}>
                                <Input
                                    placeholder="Marca (Ej: TOYOTA)"
                                    value={app.make}
                                    onChange={(e) => updateItem('applications', index, 'make', e.target.value)}
                                    list="vehicle-brands-list"
                                />
                                {app.make && (
                                    <div style={{
                                        position: 'absolute',
                                        right: '10px',
                                        top: '32px',
                                        fontSize: '0.7rem',
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        background: vehicleBrands.find(b => b.name === app.make.toUpperCase()) ? '#059669' : '#f59e0b',
                                        color: 'white',
                                        fontWeight: 'bold',
                                        pointerEvents: 'none'
                                    }}>
                                        {vehicleBrands.find(b => b.name === app.make.toUpperCase()) ? '✓' : 'NUEVA'}
                                    </div>
                                )}
                            </div>
                            <Input
                                placeholder="Modelo (Ej: Corolla)"
                                value={app.model}
                                onChange={(e) => updateItem('applications', index, 'model', e.target.value)}
                            />
                            <Input
                                placeholder="Año (Ej: 2015-2020)"
                                value={app.year}
                                onChange={(e) => updateItem('applications', index, 'year', e.target.value)}
                            />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: '0.5rem' }}>
                            <Input
                                placeholder="Motor (Ej: 1.8L)"
                                value={app.engine}
                                onChange={(e) => updateItem('applications', index, 'engine', e.target.value)}
                            />
                            <Input
                                placeholder="Notas (Opcional)"
                                value={app.notes}
                                onChange={(e) => updateItem('applications', index, 'notes', e.target.value)}
                            />
                            <Button
                                type="button"
                                variant="danger"
                                onClick={() => removeItem('applications', index)}
                                style={{ padding: '0.5rem', height: 'fit-content' }}
                            >
                                ✕
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            {/* DataList for vehicle brands */}
            <datalist id="vehicle-brands-list">
                {vehicleBrands.map(b => (
                    <option key={b.name} value={b.name} />
                ))}
            </datalist>

            {/* --- Stock Helper --- */}
            {!isEditMode && (
                <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '0.75rem', borderRadius: '0.5rem', border: '1px dashed #3b82f6' }}>
                    <p style={{ color: '#94a3b8', fontSize: '0.875rem', margin: 0 }}>
                        💡 Los precios se configuran en la pestaña <strong>"Precios"</strong> después de crear el producto.
                    </p>
                </div>
            )}

            {isEditMode ? (
                <div style={{ background: 'rgba(251, 191, 36, 0.1)', padding: '0.5rem', borderRadius: '0.5rem', border: '1px dashed #f59e0b' }}>
                    <Input
                        label="Ajustar Stock Actual"
                        type="number"
                        value={formData.stock_current}
                        onChange={(e) => setFormData({ ...formData, stock_current: parseInt(e.target.value) })}
                        placeholder="0"
                    />
                    <small style={{ display: 'block', marginTop: '0.25rem', color: '#94a3b8' }}>
                        💡 Se creará un movimiento de ajuste automáticamente.
                    </small>
                </div>
            ) : (
                <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '0.5rem', borderRadius: '0.5rem', border: '1px dashed #3b82f6' }}>
                    <Input
                        label="Stock Inicial (Opcional)"
                        type="number"
                        value={formData.initial_stock}
                        onChange={(e) => setFormData({ ...formData, initial_stock: parseInt(e.target.value) })}
                        placeholder="0"
                    />
                    <small style={{ display: 'block', marginTop: '0.25rem', color: '#94a3b8' }}>
                        💡 Se creará un movimiento de inventario inicial automáticamente.
                    </small>
                </div>
            )}

            <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '1rem',
                marginTop: '1rem',
                paddingTop: '1rem',
                borderTop: '1px solid #334155'
            }}>
                <Button
                    variant="secondary"
                    onClick={onCancel}
                    disabled={loading}
                >
                    Cancelar
                </Button>
                <Button
                    type="submit"
                    variant="primary"
                    disabled={loading}
                >
                    {loading ? 'Guardando...' : (isEditMode ? 'Actualizar Producto' : 'Guardar Producto')}
                </Button>
            </div>
        </form>
    );
};

export default ProductForm;
