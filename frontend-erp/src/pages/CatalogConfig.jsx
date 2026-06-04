import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { categoryService, inventoryService } from '../services/api';
import Layout from '../components/Layout';
import Button from '../components/common/Button';
import Select from '../components/common/Select';
import Input from '../components/common/Input';
import { BookOpen, Settings, Clock, Filter, CheckCircle, FileText, Monitor, Printer } from 'lucide-react';

const CatalogConfig = () => {
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(true);

    const [config, setConfig] = useState({
        title: 'CATÁLOGO DE PRODUCTOS',
        show_new_arrivals: false,
        selected_categories: [],
        selected_brands: [],
        show_stock_only: false,
        watermark: '',
        orientation: 'portrait' // default format
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

    const handleSelectAllBrands = () => {
        setConfig(prev => ({
            ...prev,
            selected_brands: prev.selected_brands.length === brands.length ? [] : brands
        }));
    };

    const handleGenerate = () => {
        const queryParams = new URLSearchParams({
            title: config.title,
            new: config.show_new_arrivals,
            cats: config.selected_categories.join(','),
            brands: config.selected_brands.join(','),
            stock: config.show_stock_only,
            watermark: config.watermark,
            orientation: config.orientation
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

    const segmentedControlStyle = {
        display: 'flex',
        background: '#0f172a',
        padding: '0.25rem',
        borderRadius: '0.5rem',
        border: '1px solid #334155',
        width: '100%'
    };

    const segmentButtonStyle = (isActive) => ({
        flex: 1,
        padding: '0.75rem',
        textAlign: 'center',
        background: isActive ? '#3b82f6' : 'transparent',
        color: isActive ? 'white' : '#94a3b8',
        border: 'none',
        borderRadius: '0.35rem',
        cursor: 'pointer',
        fontSize: '0.9rem',
        fontWeight: isActive ? 'bold' : 'normal',
        transition: 'all 0.3s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem'
    });

    return (
        <Layout>
            <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
                    <div style={{ background: '#3b82f6', padding: '1rem', borderRadius: '1rem', display: 'flex', boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)' }}>
                        <Printer color="white" size={32} />
                    </div>
                    <div>
                        <h1 style={{ color: 'white', margin: 0, fontSize: '2rem', letterSpacing: '-0.5px' }}>Generador de Catálogos PDF</h1>
                        <p style={{ color: '#94a3b8', margin: '0.25rem 0 0 0', fontSize: '1.1rem' }}>Personaliza el formato, inventario y diseño para impresión profesional.</p>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                    {/* COLUMNA IZQUIERDA: Configuración y Formato */}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        
                        <div style={sectionStyle}>
                            <h3 style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: 0, fontSize: '1.2rem' }}>
                                <Settings size={20} color="#3b82f6" /> Motor de Renderizado
                            </h3>
                            <div style={{ marginTop: '1rem' }}>
                                <label style={{ color: '#e2e8f0', fontSize: '0.9rem', marginBottom: '0.5rem', display: 'block' }}>Formato de Página (PDF)</label>
                                <div style={segmentedControlStyle}>
                                    <button 
                                        style={segmentButtonStyle(config.orientation === 'portrait')}
                                        onClick={() => setConfig({...config, orientation: 'portrait'})}
                                    >
                                        <FileText size={18} /> Vertical (A4)
                                    </button>
                                    <button 
                                        style={segmentButtonStyle(config.orientation === 'landscape')}
                                        onClick={() => setConfig({...config, orientation: 'landscape'})}
                                    >
                                        <Monitor size={18} /> Horizontal (Apaisado)
                                    </button>
                                </div>
                                <p style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                                    {config.orientation === 'portrait' ? 'Recomendado para impresoras de oficina y folletos.' : 'Ideal para presentaciones en pantalla y mayor espacio horizontal.'}
                                </p>
                            </div>
                        </div>

                        <div style={sectionStyle}>
                            <h3 style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: 0, fontSize: '1.2rem' }}>
                                <BookOpen size={20} color="#3b82f6" /> Portada y Branding
                            </h3>
                            <Input
                                label="Título del Catálogo"
                                value={config.title}
                                onChange={(e) => setConfig({ ...config, title: e.target.value })}
                                placeholder="Ej: Catálogo General 2024"
                            />
                            <div style={{ marginTop: '1.5rem' }}>
                                <Input
                                    label="Destinatario (Marca de Agua Texto)"
                                    value={config.watermark}
                                    onChange={(e) => setConfig({ ...config, watermark: e.target.value })}
                                    placeholder="Ej: Solo para Distribuidor X"
                                />
                            </div>
                        </div>

                        <div style={{ ...sectionStyle, border: '2px solid #3b82f6', background: 'rgba(59, 130, 246, 0.05)' }}>
                            <h3 style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: 0, fontSize: '1.2rem' }}>
                                <Clock size={20} color="#3b82f6" /> Filtros Especiales
                            </h3>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#e2e8f0', cursor: 'pointer', marginBottom: '1.5rem', marginTop: '1.5rem' }}>
                                <input
                                    type="checkbox"
                                    checked={config.show_new_arrivals}
                                    onChange={(e) => setConfig({ ...config, show_new_arrivals: e.target.checked })}
                                    style={{ width: '18px', height: '18px' }}
                                />
                                <span style={{ fontSize: '1.1rem' }}>Incluir Sección de "Novedades"</span>
                            </label>

                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#e2e8f0', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={config.show_stock_only}
                                    onChange={(e) => setConfig({ ...config, show_stock_only: e.target.checked })}
                                    style={{ width: '18px', height: '18px' }}
                                />
                                <span style={{ fontSize: '1.1rem' }}>Solo productos con stock disponible</span>
                            </label>
                        </div>
                    </div>

                    {/* COLUMNA DERECHA: Datos del Inventario y Generación */}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ ...sectionStyle, flex: 1 }}>
                            <h3 style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: 0, fontSize: '1.2rem', marginBottom: '1.5rem' }}>
                                <Filter size={20} color="#3b82f6" /> Selección de Inventario
                            </h3>

                            <div style={{ marginBottom: '2rem' }}>
                                <p style={{ color: '#e2e8f0', fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>Categorías a Incluir</p>
                                <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1rem' }}>Si no seleccionas ninguna, se incluirán TODAS las categorías disponibles.</p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
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
                            </div>

                            <div style={{ borderTop: '1px solid #334155', margin: '2rem 0' }}></div>

                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                    <p style={{ color: '#e2e8f0', fontSize: '1rem', fontWeight: 'bold', margin: 0 }}>Marcas a Incluir</p>
                                    <button 
                                        onClick={handleSelectAllBrands}
                                        style={{ background: 'none', border: '1px solid #3b82f6', color: '#3b82f6', borderRadius: '1rem', padding: '0.25rem 0.75rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold', transition: 'all 0.2s' }}
                                        onMouseOver={(e) => { e.target.style.background = '#3b82f6'; e.target.style.color = 'white'; }}
                                        onMouseOut={(e) => { e.target.style.background = 'none'; e.target.style.color = '#3b82f6'; }}
                                    >
                                        {config.selected_brands.length === brands.length ? 'Limpiar Selección' : 'Seleccionar Todas'}
                                    </button>
                                </div>
                                <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1rem' }}>Si no seleccionas ninguna, se incluirán TODAS las marcas.</p>
                                
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

                        <Button
                            variant="primary"
                            size="lg"
                            fullWidth
                            onClick={handleGenerate}
                            style={{ height: '4.5rem', fontSize: '1.3rem', fontWeight: 'bold', letterSpacing: '1px', boxShadow: '0 10px 25px rgba(59, 130, 246, 0.4)' }}
                        >
                            <Printer size={24} style={{ marginRight: '0.5rem' }} /> GENERAR CATÁLOGO {config.orientation === 'portrait' ? 'VERTICAL' : 'HORIZONTAL'}
                        </Button>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default CatalogConfig;
