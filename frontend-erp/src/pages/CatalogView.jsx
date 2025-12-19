import React, { useState, useEffect } from 'react';
import { inventoryService, companyService, categoryService } from '../services/api';
import { useCompany } from '../context/CompanyContext';
import { useLocation } from 'react-router-dom';
import Loading from '../components/common/Loading';
import Button from '../components/common/Button';
import '../styles/catalog.css';

const CatalogView = () => {
    const { activeCompany } = useCompany();
    const location = useLocation();

    // Config from URL
    const query = new URLSearchParams(location.search);
    const config = {
        title: query.get('title') || 'CATÁLOGO DE PRODUCTOS',
        show_new: query.get('new') === 'true',
        cats: query.get('cats') ? query.get('cats').split(',') : [],
        brands: query.get('brands') ? query.get('brands').split(',') : [],
        stock: query.get('stock') === 'true',
        watermark: query.get('watermark') || ''
    };

    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [prodRes, catRes] = await Promise.all([
                inventoryService.getProducts(1, 1000),
                categoryService.getCategories()
            ]);

            let filteredProducts = prodRes.data.items || [];

            // Apply Filters from Config
            if (config.brands.length > 0) {
                filteredProducts = filteredProducts.filter(p => config.brands.includes(p.brand));
            }
            if (config.stock) {
                filteredProducts = filteredProducts.filter(p => p.stock_current > 0);
            }
            // Category filter is applied during grouping

            setProducts(filteredProducts);
            setCategories(catRes.data || []);
        } catch (err) {
            console.error("Error fetching catalog data", err);
            setError("No se pudo cargar la información del catálogo.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <Loading fullScreen text="Generando catálogo profesional..." />;

    if (error) return <div style={{ color: 'white', padding: '2rem' }}>{error}</div>;

    // Group products by category
    const groupedProducts = categories
        .filter(cat => config.cats.length === 0 || config.cats.includes(cat._id))
        .map(cat => ({
            ...cat,
            items: products.filter(p => p.category_id === cat._id)
        }))
        .filter(cat => cat.items.length > 0);

    const isNew = (product) => {
        return !!product.is_new;
    };

    const newArrivals = products.filter(p => isNew(p));

    const ProductCard = ({ product }) => {
        return (
            <div className="product-card no-break">
                {/* Header with SKU and Novedad badge */}
                <div className="card-header">
                    <span className="sku-text">{product.sku}</span>
                    {product.is_new && <span className="novedad-badge">Novedad</span>}
                </div>

                <div className="card-body">
                    {/* Image Area */}
                    <div className="product-image-container">
                        {product.image_url ? (
                            <img src={product.image_url} alt={product.name} />
                        ) : (
                            <div style={{ background: '#f8fafc', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#94a3b8' }}>Sin foto</div>
                        )}
                    </div>

                    {/* Details Area */}
                    <div className="info-column">
                        <div className="info-section-title">Referencias Cruzadas:</div>
                        <div style={{ color: '#475569' }}>
                            {
                                (product.equivalences || [])
                                    .filter(eq => !eq.is_original)
                                    .slice(0, 3)
                                    .map(eq => `${eq.brand}: ${eq.code}`)
                                    .join(' | ') || 'N/A'
                            }
                        </div>

                        <div className="info-section-title">Aplicaciones:</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 2mm' }}>
                            {product.applications?.slice(0, 6).map((app, i) => (
                                <div key={i} style={{ display: 'flex', gap: '1mm', alignItems: 'baseline' }}>
                                    <span style={{ color: '#3b82f6' }}>•</span>
                                    <span>{app.make} {app.model}</span>
                                </div>
                            )) || 'N/A'}
                        </div>
                    </div>
                </div>

                {/* Technical Specs Footer */}
                <div className="specs-footer">
                    {product.specs?.slice(0, 5).map((spec, i) => (
                        <div key={i} className="spec-item">
                            <span>{spec.label}:</span>
                            <span>{spec.value}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderPages = () => {
        const pages = [];

        // 1. Introduction Page
        pages.push(
            <div key="intro" className="catalog-page intro-page">
                {activeCompany?.logo_url && <img src={activeCompany.logo_url} alt="Logo" className="intro-logo" />}
                <h1 className="intro-title">{config.title}</h1>
                <h2 style={{ color: '#64748b' }}>{activeCompany?.name || 'Mi Empresa'}</h2>

                {config.watermark && (
                    <div style={{ marginTop: '2rem', padding: '1rem', border: '2px dashed #e2e8f0', borderRadius: '1rem', color: '#64748b' }}>
                        PREPARADO PARA: <strong>{config.watermark.toUpperCase()}</strong>
                    </div>
                )}

                <div style={{ marginTop: '5rem', borderTop: '1px solid #e2e8f0', paddingTop: '2rem' }}>
                    <p>{activeCompany?.address}</p>
                    <p>{activeCompany?.phone} | {activeCompany?.email}</p>
                </div>
            </div>
        );

        // 1.5 New Arrivals Section (Phase 5)
        if (config.show_new && newArrivals.length > 0) {
            pages.push(
                <div key="sep-new" className="catalog-page type-separator" style={{ background: '#059669' }}>
                    <h1 className="type-title">✨ NOVEDADES ✨</h1>
                    <p style={{ position: 'absolute', bottom: '20mm', color: 'white', width: '100%', textAlign: 'center' }}>Selección especial de productos destacados</p>
                </div>
            );

            for (let i = 0; i < newArrivals.length; i += 10) {
                const pageItems = newArrivals.slice(i, i + 10);
                pages.push(
                    <div key={`page-new-${i}`} className="catalog-page">
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #059669', paddingBottom: '2mm', marginBottom: '5mm' }}>
                            <span style={{ fontWeight: 'bold', color: '#059669' }}>NOVEDADES</span>
                            <span style={{ color: '#94a3b8' }}>Pág. {pages.length + 1}</span>
                        </div>
                        <div className="product-grid">
                            {pageItems.map(p => <ProductCard key={p._id} product={p} />)}
                        </div>
                    </div>
                );
            }
        }

        // 2. Category Groups
        groupedProducts.forEach(category => {
            // Category Separator
            pages.push(
                <div key={`sep-${category._id}`} className="catalog-page type-separator">
                    <h1 className="type-title">{category.name}</h1>
                </div>
            );

            // Product Pages (10 per page)
            const items = category.items;
            for (let i = 0; i < items.length; i += 10) {
                const pageItems = items.slice(i, i + 10);
                pages.push(
                    <div key={`page-${category._id}-${i}`} className="catalog-page">
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '2mm', marginBottom: '5mm' }}>
                            <span style={{ fontWeight: 'bold', color: '#64748b' }}>{category.name}</span>
                            <span style={{ color: '#94a3b8' }}>Pág. {pages.length + 1}</span>
                        </div>
                        <div className="product-grid">
                            {pageItems.map(p => <ProductCard key={p._id} product={p} />)}
                        </div>
                    </div>
                );
            }
        });

        return pages;
    };

    return (
        <div className="catalog-container">
            <div className="no-print" style={{
                position: 'fixed', top: '1rem', right: '1rem', zIndex: 1000,
                background: 'rgba(30, 41, 59, 0.9)', padding: '1rem', borderRadius: '0.5rem',
                border: '1px solid #334155', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}>
                <h4 style={{ margin: '0 0 1rem 0' }}>Opciones de Catálogo</h4>
                <Button onClick={() => window.print()} variant="primary">🖨️ Imprimir / Guardar PDF</Button>
                <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#94a3b8' }}>
                    Tip: Ajusta el zoom del navegador si las hojas no se ven completas.
                </div>
            </div>
            {renderPages()}
        </div>
    );
};

export default CatalogView;
