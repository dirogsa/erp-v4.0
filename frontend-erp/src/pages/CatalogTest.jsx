import React, { useState, useEffect } from 'react';
import { inventoryService, categoryService } from '../services/api';
import { useCompany } from '../context/CompanyContext';
import { useLocation } from 'react-router-dom';

const CatalogTest = () => {
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

            if (config.brands.length > 0) {
                filteredProducts = filteredProducts.filter(p => config.brands.includes(p.brand));
            }
            if (config.stock) {
                filteredProducts = filteredProducts.filter(p => p.stock_current > 0);
            }

            setProducts(filteredProducts);
            setCategories(catRes.data || []);
        } catch (err) {
            console.error("Error fetching catalog data", err);
            setError("No se pudo cargar la información.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'sans-serif' }}>Generando catálogo puro...</div>;
    if (error) return <div style={{ padding: '2rem', textAlign: 'center', color: 'red', fontFamily: 'sans-serif' }}>{error}</div>;

    const ProductCard = ({ product }) => {
        const displayImageUrl = product.image_url;

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
                <div className="card-header">
                    <span className="sku-text">{product.sku}</span>
                    {product.is_new && <span className="novedad-badge">Novedad</span>}
                </div>

                <div className="card-body-top">
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
                                            <span style="font-size: 9px; font-weight: bold;">Sin foto</span>
                                        </div>
                                    `;
                                }}
                            />
                        ) : (
                            <div style={{ background: '#f1f5f9', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItem: 'center', justifyContent: 'center', color: '#94a3b8', gap: '0.5rem', borderRadius: '4px' }}>
                                <span style={{ fontSize: '9px', fontWeight: 'bold' }}>Sin foto</span>
                            </div>
                        )}
                    </div>

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

    const orientation = query.get('orientation') || 'portrait';
    const gridColumns = orientation === 'landscape' ? '1fr 1fr 1fr' : '1fr 1fr';
    const gridItemsPerPage = orientation === 'landscape' ? 9 : 6;
    const pageWidth = orientation === 'landscape' ? '297mm' : '210mm';
    const pageHeight = orientation === 'landscape' ? '210mm' : '297mm';

    const renderPages = () => {
        const pages = [];
        let pageNumber = 1;

        // PÁGINA 1: PORTADA
        pages.push(
            <div key="intro" className="catalog-page intro-page">
                <div className="page-content-wrapper">
                    <div style={{ position: 'relative', zIndex: 1, display: 'block', textAlign: 'center', paddingTop: '20mm' }}>
                        <img src="/shared-images/logo-company.webp" alt="Logo" className="intro-logo" style={{ display: 'inline-block', margin: '0 auto', maxWidth: '350px', marginBottom: '3rem' }} onError={(e) => {
                            e.target.onerror = null;
                            if(activeCompany?.logo_url) e.target.src = activeCompany.logo_url;
                            else e.target.style.display = 'none';
                        }} />
                        <h1 style={{ fontSize: '3rem', fontWeight: '800', marginBottom: '1rem', color: '#1e293b' }}>{config.title}</h1>
                        <h2 style={{ color: '#64748b', fontSize: '1.8rem', marginTop: '1rem', margin: '1rem auto' }}>{activeCompany?.name || 'DIROGSA B2B'}</h2>
                        
                        {config.watermark && (
                            <div style={{ marginTop: '3rem', display: 'inline-block', padding: '1.5rem 3rem', border: '2px dashed #e2e8f0', borderRadius: '1rem', color: '#64748b', fontSize: '1.2rem' }}>
                                PREPARADO PARA: <strong>{config.watermark.toUpperCase()}</strong>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );

        // 2. CATEGORÍAS Y MARCAS
        groupedProducts.forEach(category => {
            // PÁGINA 2: PORTADA DE LA CATEGORÍA
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
                // PÁGINA 3: PORTADA DE LA MARCA
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

                // PÁGINA 4+: GRILLA DE PRODUCTOS DE ESTA MARCA Y CATEGORÍA
                const items = brand.items;
                for (let i = 0; i < items.length; i += gridItemsPerPage) {
                    pageNumber++;
                    const pageItems = items.slice(i, i + gridItemsPerPage);
                    pages.push(
                        <div key={`page-${category._id}-${brand.name}-${i}`} className="catalog-page" style={{ display: 'block', position: 'relative', overflow: 'hidden' }}>
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
        <React.Fragment>
            {/* CSS 100% AISLADO Y PURO - NO DEPENDE DE NINGÚN ARCHIVO EXTERNO */}
            <style type="text/css">
                {`
                    /* RESET UNIVERSAL ESTRICTO */
                    * {
                        box-sizing: border-box !important;
                        margin: 0;
                        padding: 0;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        font-family: 'Inter', system-ui, sans-serif;
                    }

                    html, body, #root {
                        width: 100% !important;
                        min-width: 0 !important;
                        max-width: 100% !important;
                        background: #e2e8f0;
                    }

                    /* VISTA EN PANTALLA (PREVIEW) */
                    .catalog-container {
                        padding: 2rem;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        gap: 2rem;
                        background: #0f172a;
                        min-height: 100vh;
                    }

                    .catalog-page {
                        background: white;
                        color: black;
                        width: ${pageWidth} !important;
                        height: ${pageHeight} !important;
                        max-height: ${pageHeight} !important;
                        position: relative;
                        overflow: hidden;
                        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
                    }

                    .page-content-wrapper {
                        width: 100% !important;
                        height: 100% !important;
                        padding: 15mm !important;
                        position: relative;
                    }

                    /* REGLA DE PAPEL (NIVEL RAÍZ OBLIGATORIO) */
                    @page { 
                        size: A4 ${orientation === 'landscape' ? 'landscape' : 'portrait'}; 
                        margin: 0mm;
                    }

                    /* REGLAS ESTRICTAS DE IMPRESIÓN */
                    @media print {
                        html, body, #root, .catalog-container {
                            background: white !important;
                            padding: 0 !important;
                            margin: 0 !important;
                            display: block !important;
                            width: auto !important;
                            max-width: none !important;
                            min-width: 0 !important;
                            height: auto !important;
                            overflow: visible !important;
                        }

                        .catalog-page {
                            width: auto !important;
                            height: auto !important;
                            min-height: 0 !important;
                            box-shadow: none !important;
                            page-break-after: always !important;
                            page-break-inside: avoid !important;
                            margin: 0 !important;
                            border: none !important;
                        }

                        .page-content-wrapper {
                            width: 100% !important;
                            height: auto !important;
                            padding: 15mm !important;
                        }

                        .no-print {
                            display: none !important;
                        }
                    }

                    /* ESTILOS DE ELEMENTOS INTERNOS */
                    .intro-page { text-align: center; }
                    .type-separator {
                        background: #1e293b !important;
                        color: white !important;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    .type-title {
                        font-size: 4rem;
                        text-transform: uppercase;
                        border-bottom: 5px solid #3b82f6;
                        padding-bottom: 2rem;
                    }
                    .product-grid {
                        display: grid;
                        gap: 10mm;
                    }
                    .product-card {
                        height: 78mm;
                        border: 1px solid #e2e8f0;
                        padding: 3.5mm;
                        border-radius: 1.5mm;
                        background: #fff;
                        display: flex;
                        flex-direction: column;
                        position: relative;
                        overflow: hidden;
                        margin-bottom: 2mm;
                    }
                    .card-header {
                        background: #f1f5f9;
                        padding: 1.5mm 3mm;
                        margin-bottom: 2mm;
                        border-radius: 1mm;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }
                    .sku-text { font-size: 14pt; font-weight: 900; color: #0f172a; letter-spacing: -0.5px; }
                    .novedad-badge { background: #059669; color: white; font-size: 6pt; padding: 0.5mm 1.5mm; border-radius: 0.5mm; text-transform: uppercase; font-weight: bold; }
                    .card-body-top { display: flex; gap: 4mm; margin-bottom: 2mm; }
                    .product-image-container { width: 35mm; height: 35mm; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
                    .product-image-container img { max-width: 100%; max-height: 100%; object-fit: contain; }
                    .specs-column { flex: 1; font-size: 8pt; color: #334155; display: flex; flex-direction: column; justify-content: center; }
                    .specs-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1mm 2mm; }
                    .spec-item-inline { display: flex; gap: 1mm; white-space: nowrap; }
                    .spec-label { font-weight: 800; color: #0f172a; }
                    .spec-value { color: #475569; }
                    .full-width-info { flex: 1; font-size: 7.5pt; line-height: 1.2; color: #475569; border-top: 0.5px solid #e2e8f0; padding-top: 2mm; display: flex; flex-direction: column; gap: 1.5mm; }
                    .info-block { display: -webkit-box; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; }
                    .info-section-title { font-weight: 800; color: #0f172a; margin-right: 1mm; }
                    .no-break { page-break-inside: avoid !important; }
                `}
            </style>

            <div className="catalog-container">
                <div className="no-print" style={{ position: 'fixed', top: '1rem', right: '1rem', zIndex: 1000, background: '#1e293b', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #334155', color: 'white' }}>
                    <h4 style={{ margin: '0 0 1rem 0' }}>Modo Aislado (TEST)</h4>
                    <button onClick={() => window.print()} style={{ padding: '0.5rem 1rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}>🖨️ Imprimir</button>
                </div>
                {renderPages()}
            </div>
        </React.Fragment>
    );
};

export default CatalogTest;
