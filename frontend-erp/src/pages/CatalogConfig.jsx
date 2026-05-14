import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { categoryService, inventoryService } from '../services/api';
import Layout from '../components/Layout';
import Button from '../components/common/Button';
import Select from '../components/common/Select';
import Input from '../components/common/Input';
import { BookOpen, Settings, Clock, Filter, CheckCircle } from 'lucide-react';

const CatalogConfig = () => {
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(true);

    const [config, setConfig] = useState({
        title: 'CATÁLOGO DE PRODUCTOS',
        show_new_arrivals: true,
        selected_categories: [],
        selected_brands: [],
        show_stock_only: false,
        watermark: ''
    });

    useEffect(() => {
        fetchMetadata();
    }, []);

    const fetchMetadata = async () => {
        try {
            const { productBrandService } = await import('../services/api');
            const [catRes, brandRes] = await Promise.all([
                categoryService.getCategories(),
                productBrandService.getBrands()
            ]);
            setCategories(catRes.data || []);
            setBrands(brandRes.data || []);
        } catch (err) {
            console.error("Error fetching metadata", err);
        } finally {
            setLoading(false);
        }
    };

    const toggleSelection = (field, value) => {
        setConfig(prev => {
            const current = prev[field] || [];
            if (current.includes(value)) {
                return { ...prev, [field]: current.filter(v => v !== value) };
            } else {
                return { ...prev, [field]: [...current, value] };
            }
        });
    };

    const handleGenerate = () => {
        const queryParams = new URLSearchParams({
            title: config.title,
            new: config.show_new_arrivals,
            cats: config.selected_categories.join(','),
            brands: config.selected_brands.join(','),
            stock: config.show_stock_only,
            watermark: config.watermark
        }).toString();

        navigate(`/catalog/view?${queryParams}`);
    };

    const sectionStyle = {
        background: '#1e293b',
        padding: '1.5rem',
        borderRadius: '1rem',
        border: '1px solid #334155',
        marginBottom: '1.5rem'
    };

    const itemButtonStyle = (isSelected) => ({
        padding: '0.5rem 1rem',
        borderRadius: '2rem',
        border: `1px solid ${isSelected ? '#3b82f6' : '#334155'}`,
        background: isSelected ? '#3b82f633' : '#0f172a',
        color: isSelected ? '#60a5fa' : '#94a3b8',
        cursor: 'pointer',
        fontSize: '0.85rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        transition: 'all 0.2s'
    });

    return (
        <Layout>
            <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                    <div style={{ background: '#3b82f6', padding: '0.75rem', borderRadius: '0.75rem', display: 'flex' }}>
                        <BookOpen color="white" size={32} />
                    </div>
                    <div>
                        <h1 style={{ color: 'white', margin: 0, fontSize: '1.8rem' }}>Configurador de Catálogo</h1>
                        <p style={{ color: '#94a3b8', margin: 0 }}>Personaliza tu catálogo profesional antes de imprimirlo.</p>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {/* 1. Título y Portada */}
                        <div style={sectionStyle}>
                            <h3 style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: 0 }}>
                                <Settings size={18} color="#3b82f6" /> Portada y Título
                            </h3>
                            <Input
                                label="Título del Catálogo"
                                value={config.title}
                                onChange={(e) => setConfig({ ...config, title: e.target.value })}
                                placeholder="Ej: Catálogo General 2024"
                            />
                            <div style={{ marginTop: '1rem' }}>
                                <Input
                                    label="Marca de Agua / Destinatario (Opcional)"
                                    value={config.watermark}
                                    onChange={(e) => setConfig({ ...config, watermark: e.target.value })}
                                    placeholder="Ej: Solo para Distribuidor X"
                                />
                            </div>
                        </div>

                        {/* 2. Filtros de Contenido */}
                        <div style={sectionStyle}>
                            <h3 style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: 0 }}>
                                <Filter size={18} color="#3b82f6" /> Filtros de Contenido
                            </h3>

                            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Categorías (Vacío = Todas)</p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
                                {categories.map(cat => (
                                    <button
                                        key={cat._id}
                                        style={itemButtonStyle(config.selected_categories.includes(cat._id))}
                                        onClick={() => toggleSelection('selected_categories', cat._id)}
                                    >
                                        {config.selected_categories.includes(cat._id) && <CheckCircle size={14} />}
                                        {cat.name}
                                    </button>
                                ))}
                            </div>

                            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Marcas (Vacío = Todas)</p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {brands.map(brand => (
                                    <button
                                        key={brand}
                                        style={itemButtonStyle(config.selected_brands.includes(brand))}
                                        onClick={() => toggleSelection('selected_brands', brand)}
                                    >
                                        {config.selected_brands.includes(brand) && <CheckCircle size={14} />}
                                        {brand}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {/* 3. Secciones Especiales */}
                        <div style={{ ...sectionStyle, background: '#1e293b', border: '2px solid #3b82f6' }}>
                            <h3 style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: 0 }}>
                                <Clock size={18} color="#3b82f6" /> Secciones VIP
                            </h3>

                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#e2e8f0', cursor: 'pointer', marginBottom: '1rem' }}>
                                <input
                                    type="checkbox"
                                    checked={config.show_new_arrivals}
                                    onChange={(e) => setConfig({ ...config, show_new_arrivals: e.target.checked })}
                                />
                                <span>Incluir Sección de "Novedades"</span>
                            </label>

                            <div style={{ marginTop: '1.5rem', borderTop: '1px solid #334155', paddingTop: '1rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#e2e8f0', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={config.show_stock_only}
                                        onChange={(e) => setConfig({ ...config, show_stock_only: e.target.checked })}
                                    />
                                    <span>Solo productos con stock</span>
                                </label>
                            </div>
                        </div>

                        <Button
                            variant="primary"
                            size="lg"
                            fullWidth
                            onClick={handleGenerate}
                            style={{ height: '4rem', fontSize: '1.2rem', marginTop: '1rem' }}
                        >
                            📖 Ver Catálogo
                        </Button>
                        <p style={{ color: '#64748b', fontSize: '0.8rem', textAlign: 'center', marginTop: '1rem' }}>
                            Nota: El catálogo se abrirá en una vista optimizada para impresión A4.
                        </p>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default CatalogConfig;
