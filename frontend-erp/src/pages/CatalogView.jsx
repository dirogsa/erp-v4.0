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

    useEffect(() => {
        // Set document title for PDF saving (e.g. "Dirogsa-June-2026-Catalog")
        const companyName = activeCompany?.name ? activeCompany.name.split(' ')[0].replace(/[^a-zA-Z0-9]/g, '') : 'Company';
        const date = new Date();
        const month = date.toLocaleString('en-US', { month: 'long' });
        const year = date.getFullYear();
        
        const originalTitle = document.title;
        document.title = `${companyName}-${month}-${year}-Catalog`;

        return () => {
            document.title = originalTitle;
        };
    }, [activeCompany]);

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

    // Group products by category AND then by brand
    const groupedProducts = categories
        .filter(cat => config.cats.length === 0 || config.cats.includes(cat._id))
        .map(cat => {
            const catItems = products.filter(p => p.category_id === cat._id);
            const brands = Array.from(new Set(catItems.map(p => p.brand || 'Otras Marcas'))).sort();
            
            const groupedBrands = brands.map(brandName => ({
                name: brandName,
                items: catItems.filter(p => (p.brand || 'Otras Marcas') === brandName)
            }));

            return {
                ...cat,
                brands: groupedBrands
            };
        })
        .filter(cat => cat.brands.length > 0);

    const isNew = (product) => {
        return !!product.is_new;
    };

    const newArrivals = products.filter(p => isNew(p));

    const ProductCard = ({ product }) => {
        // Uso estricto de la base de datos para la imagen del producto
        const displayImageUrl = product.image_url;

        // Normalizador de etiquetas para ajustarse a la nomenclatura estándar del diagrama (A, B, C, D, G, H)
        const normalizeSpecLabel = (label) => {
            if (!label) return '';
            const l = label.toUpperCase().trim();
            if (['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].includes(l)) return l;
            
            if (l.includes('ALTURA') || l.includes('HEIGHT') || l.includes('ALTO')) return 'H';
            if (l.includes('OUTSIDE DIAMETER TOP') || l.includes('OUTSIDE DIAMETER') || l.includes('DIÁMETRO EXTERIOR')) return 'A';
            if (l.includes('INSIDE DIAMETER TOP') || l.includes('DIÁMETRO INTERIOR 1')) return 'B';
            if (l.includes('INSIDE DIAMETER BOTTOM') || l.includes('DIÁMETRO INTERIOR 2') || l.includes('INSIDE DIAMETER')) return 'C';
            if (l.includes('THREAD') || l.includes('ROSCA')) return 'G';
            if (l.includes('BY-PASS') || l.includes('VALVE') || l.includes('VÁLVULA')) return 'Válv.';
            return label;
        };

        return (
            <div className="product-card no-break">
                {/* Header with SKU and Novedad badge */}
                <div className="card-header">
                    <span className="sku-text">{product.sku}</span>
                    {product.is_new && <span className="novedad-badge">Novedad</span>}
                </div>

                <div className="card-body-top">
                    {/* Image Area */}
                    <div className="product-image-container">
                        {displayImageUrl ? (
                            <img 
                                src={displayImageUrl} 
                                alt={product.name} 
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.style.display = 'none';
                                    e.target.parentElement.innerHTML = `
                                        <div style="background: #f1f5f9; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #94a3b8; gap: 0.5rem; border-radius: 4px;">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                                            <span style="font-size: 9px; font-weight: bold;">Sin foto</span>
                                        </div>
                                    `;
                                }}
                            />
                        ) : (
                            <div style={{ background: '#f1f5f9', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', gap: '0.5rem', borderRadius: '4px' }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                                <span style={{ fontSize: '9px', fontWeight: 'bold' }}>Sin foto</span>
                            </div>
                        )}
                    </div>

                    {/* Specs Area (Moved next to image) */}
                    <div className="specs-column">
                        <div className="info-section-title" style={{ marginBottom: '1.5mm', color: '#1e293b' }}>Medidas (mm):</div>
                        <div className="specs-grid">
                            {product.specs?.length > 0 ? (
                                product.specs.slice(0, 8).map((spec, i) => (
                                    <div key={i} className="spec-item-inline">
                                        <span className="spec-label">{normalizeSpecLabel(spec.label)}:</span>
                                        <span className="spec-value">{spec.value}</span>
                                    </div>
                                ))
                            ) : (
                                <span style={{ color: '#94a3b8', fontSize: '8pt' }}>N/A</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Full Width Text Area (Refs & Apps) */}
                <div className="full-width-info">
                    <div className="info-block" style={{ WebkitLineClamp: 2 }}>
                        <span className="info-section-title">Ref. Cruzadas:</span>
                        <span className="info-text">
                            { (product.equivalences || []).filter(eq => !eq.is_original).slice(0, 10).map(eq => `${eq.brand} ${eq.code}`).join(' • ') || 'N/A' }
                        </span>
                    </div>

                    <div className="info-block" style={{ WebkitLineClamp: 4 }}>
                        <span className="info-section-title">Aplicaciones:</span>
                        <span className="info-text">
                            { product.applications?.length > 0 ? product.applications.slice(0, 10).map(app => `${app.make} ${app.model}`).join(' • ') : 'N/A' }
                        </span>
                    </div>
                </div>
            </div>
        );
    };

    const currentDate = new Date();
    const currentMonth = currentDate.toLocaleString('es-PE', { month: 'long' });
    const currentYear = currentDate.getFullYear();
    const dateStr = `${currentMonth.toUpperCase()} ${currentYear}`;

    // === LECTURA DE PARÁMETROS ===
    const orientation = query.get('orientation') || 'portrait';
    const gridColumns = orientation === 'landscape' ? '1fr 1fr 1fr' : '1fr 1fr';
    const gridItemsPerPage = orientation === 'landscape' ? 9 : 6;

    const renderPages = () => {
        const pages = [];
        let pageNumber = 1;

        // 1. PÁGINA 1: PORTADA PRINCIPAL (Intro)
        pages.push(
            <div key="intro" className="catalog-page intro-page" style={{ display: 'block', position: 'relative', overflow: 'hidden' }}>
                <div className="page-content-wrapper">
                    {/* Contenido Principal (Bloque centrado con padding) */}
                    <div style={{ position: 'relative', zIndex: 1, display: 'block', textAlign: 'center', paddingTop: '40mm' }}>
                        <img src="/shared-images/logo-company.webp" alt="Logo" className="intro-logo" style={{ display: 'inline-block', margin: '0 auto' }} onError={(e) => {
                            e.target.onerror = null;
                            if(activeCompany?.logo_url) e.target.src = activeCompany.logo_url;
                            else e.target.style.display = 'none';
                        }} />
                        <h1 className="intro-title" style={{ marginTop: '2rem' }}>{config.title}</h1>
                        <h2 style={{ color: '#64748b', fontSize: '1.8rem', marginTop: '1rem', margin: '1rem auto' }}>{activeCompany?.name || 'DIROGSA B2B'}</h2>
                        <h3 style={{ color: '#3b82f6', marginTop: '1.5rem', letterSpacing: '4px', fontSize: '1.2rem', textTransform: 'uppercase' }}>{dateStr}</h3>

                        {config.watermark && (
                            <div style={{ marginTop: '3rem', display: 'inline-block', padding: '1.5rem 3rem', border: '2px dashed #e2e8f0', borderRadius: '1rem', color: '#64748b', fontSize: '1.2rem' }}>
                                PREPARADO PARA: <strong>{config.watermark.toUpperCase()}</strong>
                            </div>
                        )}
                    </div>

                    {/* Footer al fondo siempre (Posición absoluta) */}
                    <div style={{ position: 'absolute', bottom: '15mm', left: '15mm', right: '15mm', textAlign: 'center', borderTop: '2px solid #e2e8f0', paddingTop: '15mm' }}>
                        <p style={{ margin: 0, color: '#475569', fontWeight: 'bold', fontSize: '1.1rem' }}>{activeCompany?.address}</p>
                        <p style={{ margin: '0.5rem 0 0 0', color: '#475569', fontSize: '1.1rem' }}>{activeCompany?.phone}</p>
                    </div>
                </div>
            </div>
        );

        // 2. CATEGORÍAS Y MARCAS
        groupedProducts.forEach(category => {
            // PÁGINA 2: PORTADA DE LA CATEGORÍA (Ej. Filtro de Aceite)
            pageNumber++;
            pages.push(
                <div key={`sep-${category._id}`} className="catalog-page type-separator" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="page-content-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: '40mm', height: '10px', background: '#3b82f6', marginBottom: '20mm' }}></div>
                        <h1 className="type-title" style={{ fontSize: '3rem', margin: '0 0 1rem 0' }}>{category.name}</h1>
                        <p style={{ maxWidth: '600px', textAlign: 'center', color: '#64748b', fontSize: '1.2rem', lineHeight: '1.6' }}>
                            Sección dedicada exclusivamente a {category.name.toLowerCase()}. Tecnología avanzada en filtración y retención de partículas para proteger el motor.
                        </p>
                        <img src={`/shared-images/category-${category.name.toLowerCase().replace(/ /g, '-')}.webp`} 
                             style={{ marginTop: '20mm', maxWidth: '300px', maxHeight: '300px', objectFit: 'contain' }}
                             onError={(e) => e.target.style.display = 'none'} />
                    </div>
                </div>
            );

            // RECORREMOS CADA MARCA DENTRO DE ESTA CATEGORÍA
            category.brands.forEach(brand => {
                // PÁGINA 3: PORTADA DE LA MARCA (Ej. WIX)
                pageNumber++;
                pages.push(
                    <div key={`brand-sep-${category._id}-${brand.name}`} className="catalog-page brand-separator" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
                        <div className="page-content-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
                            <div style={{ width: '100%', maxWidth: '500px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <img src={`/shared-images/logo-${brand.name.toLowerCase()}.webp`} 
                                     style={{ maxWidth: '400px', maxHeight: '200px', objectFit: 'contain', marginBottom: '2rem' }}
                                     onError={(e) => {
                                         e.target.style.display = 'none';
                                         e.target.parentElement.insertAdjacentHTML('afterbegin', `<h1 class="type-title" style="font-size: 4rem; color: #1e293b;">${brand.name}</h1>`);
                                     }} />
                                <h2 style={{ color: '#0f172a', margin: '0 0 1rem 0', letterSpacing: '2px' }}>{brand.name.toUpperCase()}</h2>
                                <p style={{ textAlign: 'center', color: '#475569', fontSize: '1.1rem', lineHeight: '1.6' }}>
                                    Repuestos originales y equivalencias exactas de calidad premium. Diseñados bajo los estándares más estrictos de {brand.name}.
                                </p>
                            </div>
                        </div>
                    </div>
                );

                // PÁGINA 4+: GRILLA DE PRODUCTOS DE ESTA MARCA Y CATEGORÍA (6 o 9 por página)
                const items = brand.items;
                for (let i = 0; i < items.length; i += gridItemsPerPage) {
                    pageNumber++;
                    const pageItems = items.slice(i, i + gridItemsPerPage);
                    pages.push(
                        <div key={`page-${category._id}-${brand.name}-${i}`} className="catalog-page" style={{ position: 'relative' }}>
                            <div className="page-content-wrapper">
                                {/* Cabecera del Documento Impreso */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '2px solid #e2e8f0', paddingBottom: '3mm', marginBottom: '8mm' }}>
                                    <div>
                                        <span style={{ fontWeight: '900', color: '#1e293b', fontSize: '1.2rem', marginRight: '3mm' }}>{category.name}</span>
                                        <span style={{ color: '#64748b', fontSize: '1rem', borderLeft: '2px solid #cbd5e1', paddingLeft: '3mm' }}>{brand.name}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4mm' }}>
                                        <img src="/shared-images/logo-company.webp" alt="Logo" style={{ height: '50px', objectFit: 'contain', filter: 'grayscale(100%)', opacity: 0.6 }} onError={(e) => {
                                            e.target.onerror = null;
                                            if(activeCompany?.logo_url) e.target.src = activeCompany.logo_url;
                                            else e.target.style.display = 'none';
                                        }} />
                                        <span style={{ color: '#94a3b8', fontWeight: 'bold', fontSize: '1.1rem' }}>Pág. {pageNumber}</span>
                                    </div>
                                </div>
                                
                                {/* Grilla de Tarjetas (Adaptativa) */}
                                <div className="product-grid" style={{ gridTemplateColumns: gridColumns }}>
                                    {pageItems.map((p, idx) => <ProductCard key={p._id || p.sku || `item-${idx}`} product={p} />)}
                                </div>
                            </div>
                        </div>
                    );
                }
            });
        });

        return pages;
    };

    return (
        <div className={`catalog-container format-${orientation}`}>
            {/* INYECCIÓN ARQUITECTÓNICA DE CSS PARA EL MOTOR DE IMPRESIÓN */}
            <style type="text/css" media="print">
                {`
                    @page { 
                        size: ${orientation === 'landscape' ? 'A4 landscape' : 'A4 portrait'} !important; 
                        margin: 0mm !important;
                    }
                    /* Reset global para evitar heurística de Landscape de Chrome */
                    html, body, #root, .app-container {
                        min-width: 0 !important;
                        max-width: 100vw !important;
                        overflow: visible !important;
                    }
                    /* Prevención de desbordamiento de tipografía */
                    * {
                        overflow-wrap: break-word !important;
                        word-wrap: break-word !important;
                        white-space: normal !important;
                    }
                `}
            </style>
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
