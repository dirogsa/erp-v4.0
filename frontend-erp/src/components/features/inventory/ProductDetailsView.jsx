import React, { useState, useEffect } from 'react';
import { analyticsService } from '../../../services/api';
import { formatCurrency, formatDate } from '../../../utils/formatters';

const ProductDetailsView = ({ product, onClose }) => {
    const [activeTab, setActiveTab] = useState('specs'); // specs, apps, crosses, sales
    const [salesHistory, setSalesHistory] = useState([]);
    const [loadingSales, setLoadingSales] = useState(false);

    useEffect(() => {
        if (activeTab === 'sales' && product?.sku) {
            fetchSalesHistory();
        }
    }, [activeTab, product?.sku]);

    const fetchSalesHistory = async () => {
        setLoadingSales(true);
        try {
            const res = await analyticsService.getProductHistory(product.sku);
            setSalesHistory(res.data);
        } catch (error) {
            console.error("Error loading sales history", error);
        } finally {
            setLoadingSales(false);
        }
    };

    if (!product) return null;

    // Helper para badges
    const StatusBadge = ({ active, label, color, icon }) => (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: active ? `${color}33` : '#1e293b',
            color: active ? color : '#64748b',
            padding: '6px 12px',
            borderRadius: '20px',
            fontSize: '0.8rem',
            fontWeight: '600',
            border: `1px solid ${active ? color : '#334155'}`
        }}>
            <span>{icon}</span>
            {label}
        </div>
    );

    // Helper para display de valores
    const InfoItem = ({ label, value, highlight = false }) => (
        <div style={{ marginBottom: '1rem' }}>
            <div style={{ color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                {label}
            </div>
            <div style={{
                color: highlight ? '#3b82f6' : '#f1f5f9',
                fontSize: highlight ? '1.1rem' : '0.95rem',
                fontWeight: highlight ? '600' : '400'
            }}>
                {value || '-'}
            </div>
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', color: '#e2e8f0' }}>

            {/* Header / Hero Section */}
            <div style={{
                display: 'flex',
                gap: '2rem',
                padding: '2rem',
                background: '#0f172a',
                borderBottom: '1px solid #1e293b'
            }}>
                {/* Product Image */}
                <div style={{
                    width: '180px',
                    height: '180px',
                    borderRadius: '1rem',
                    overflow: 'hidden',
                    background: '#1e293b',
                    border: '1px solid #334155',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                }}>
                    {product.image_url ? (
                        <img
                            src={product.image_url}
                            alt={product.name}
                            style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#fff' }}
                        />
                    ) : (
                        <span style={{ fontSize: '3rem', opacity: 0.2 }}>📦</span>
                    )}
                </div>

                {/* Main Info */}
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                        <StatusBadge active={product.is_active_in_shop} label="Tienda Online" color="#3b82f6" icon="🛒" />
                        <StatusBadge active={product.is_new} label="Novedad" color="#10b981" icon="✨" />
                        {product.type === 'MARKETING' && <StatusBadge active={true} label="Publicidad" color="#f59e0b" icon="🎁" />}
                    </div>

                    <h1 style={{ fontSize: '1.8rem', fontWeight: '800', margin: '0 0 0.5rem 0', lineHeight: 1.2 }}>
                        {product.name}
                    </h1>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div style={{
                            background: '#1e293b',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontFamily: 'monospace',
                            fontSize: '1.1rem',
                            color: '#e2e8f0',
                            border: '1px solid #334155'
                        }}>
                            {product.sku}
                        </div>
                        <div style={{ color: '#94a3b8' }}>{product.brand}</div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2rem' }}>
                        <InfoItem label="Stock Actual" value={product.stock_current} highlight />
                        <InfoItem label="Precio Sugerido" value={`S/ ${(product.price_retail || 0).toFixed(2)}`} />
                        <InfoItem label="Ubicación" value={product.location || 'General'} />
                        <InfoItem label="Peso" value={`${product.weight_g || 0} g`} />
                    </div>
                </div>
            </div>

            {/* Content Tabs */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#020617', padding: '0 2rem 2rem 2rem' }}>

                {/* Tabs Header */}
                <div style={{ display: 'flex', gap: '2rem', borderBottom: '1px solid #1e293b', marginBottom: '2rem' }}>
                    {['specs', 'apps', 'crosses', 'sales', 'marketing'].map(tab => {
                        const labels = {
                            specs: '📏 Medidas',
                            apps: '🚗 Aplicaciones',
                            crosses: '🔄 Equivalencias',
                            sales: '💰 Historial de Ventas',
                            marketing: '🎁 Marketing'
                        };
                        // Solo mostrar marketing tab si aplica
                        if (tab === 'marketing' && product.type !== 'COMMERCIAL') return null;
                        if (tab !== 'marketing' && product.type === 'MARKETING') return null;

                        return (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    padding: '1.5rem 0',
                                    color: activeTab === tab ? '#3b82f6' : '#64748b',
                                    borderBottom: `2px solid ${activeTab === tab ? '#3b82f6' : 'transparent'}`,
                                    fontSize: '0.95rem',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'color 0.2s'
                                }}
                            >
                                {labels[tab]}
                            </button>
                        );
                    })}
                </div>

                {/* Tab Content */}
                <div style={{ flex: 1, overflowY: 'auto' }}>

                    {/* SPECS TAB */}
                    {activeTab === 'specs' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                            {/* Medidas */}
                            <div>
                                <h3 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '1.5rem' }}>Dimensiones</h3>
                                {(product.specs && product.specs.length > 0) ? (
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <tbody>
                                            {product.specs.map((spec, i) => (
                                                <tr key={i} style={{ borderBottom: '1px solid #1e293b' }}>
                                                    <td style={{ padding: '12px 0', color: '#94a3b8', width: '40%' }}>{spec.label}</td>
                                                    <td style={{ padding: '12px 0', color: '#e2e8f0', fontWeight: '500' }}>
                                                        {spec.value} <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{spec.measure_type}</span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <p style={{ color: '#64748b', fontStyle: 'italic' }}>No hay medidas registradas.</p>
                                )}
                            </div>

                            {/* Atributos Extra */}
                            <div>
                                <h3 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '1.5rem' }}>Atributos Adicionales</h3>
                                {product.custom_attributes && Object.keys(product.custom_attributes).length > 0 ? (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        {Object.entries(product.custom_attributes).map(([key, value]) => (
                                            <div key={key} style={{ background: '#1e293b', padding: '1rem', borderRadius: '0.5rem' }}>
                                                <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: '4px', textTransform: 'uppercase' }}>{key}</div>
                                                <div style={{ color: '#e2e8f0' }}>{value.toString()}</div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p style={{ color: '#64748b', fontStyle: 'italic' }}>No hay atributos extra.</p>
                                )}

                                {/* Features Tags */}
                                {product.features && product.features.length > 0 && (
                                    <div style={{ marginTop: '2rem' }}>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                            {product.features.map(feat => (
                                                <span key={feat} style={{ background: '#3b82f620', color: '#60a5fa', padding: '4px 10px', borderRadius: '4px', fontSize: '0.85rem' }}>
                                                    ✓ {feat}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* APPS TAB */}
                    {activeTab === 'apps' && (
                        <div>
                            <h3 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '1.5rem' }}>Compatible con:</h3>
                            {(product.applications && product.applications.length > 0) ? (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                                    {product.applications.map((app, i) => (
                                        <div key={i} style={{ background: '#1e293b', padding: '1rem', borderRadius: '0.5rem', borderLeft: '3px solid #3b82f6' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                <span style={{ fontWeight: '700', color: '#fff' }}>{app.make} {app.model}</span>
                                                <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>{app.year}</span>
                                            </div>
                                            <div style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>
                                                Motor: {app.engine || 'N/A'}
                                            </div>
                                            {app.notes && <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.5rem', fontStyle: 'italic' }}>"{app.notes}"</div>}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p style={{ color: '#64748b', fontStyle: 'italic' }}>No hay aplicaciones registradas.</p>
                            )}
                        </div>
                    )}

                    {/* CROSSES TAB */}
                    {activeTab === 'crosses' && (
                        <div>
                            <h3 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '1.5rem' }}>Referencias Cruzadas</h3>
                            {(product.equivalences && product.equivalences.length > 0) ? (
                                <table style={{ width: '100%', maxWidth: '800px', borderCollapse: 'separate', borderSpacing: '0 0.5rem' }}>
                                    <thead>
                                        <tr style={{ textAlign: 'left', color: '#94a3b8', fontSize: '0.85rem' }}>
                                            <th style={{ padding: '0 1rem' }}>Marca</th>
                                            <th style={{ padding: '0 1rem' }}>Código</th>
                                            <th style={{ padding: '0 1rem' }}>Tipo</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {product.equivalences.map((eq, i) => (
                                            <tr key={i} style={{ background: '#1e293b' }}>
                                                <td style={{ padding: '1rem', borderRadius: '0.5rem 0 0 0.5rem', fontWeight: '600', color: '#fff' }}>
                                                    {eq.brand}
                                                </td>
                                                <td style={{ padding: '1rem', fontFamily: 'monospace', fontSize: '1rem', color: '#e2e8f0' }}>
                                                    {eq.code}
                                                </td>
                                                <td style={{ padding: '1rem', borderRadius: '0 0.5rem 0.5rem 0' }}>
                                                    {eq.is_original ? (
                                                        <span style={{ background: '#f59e0b22', color: '#fbbf24', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>OEM / ORIGINAL</span>
                                                    ) : (
                                                        <span style={{ color: '#64748b', fontSize: '0.8rem' }}>Alternativo</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p style={{ color: '#64748b', fontStyle: 'italic' }}>No hay equivalencias registradas.</p>
                            )}
                        </div>
                    )}

                    {/* SALES TAB */}
                    {activeTab === 'sales' && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h3 style={{ color: '#fff', fontSize: '1.1rem', margin: 0 }}>Historial de Precios de Venta</h3>
                                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                    Mostrando últimas transacciones facturadas
                                </div>
                            </div>

                            {loadingSales ? (
                                <div style={{ color: '#94a3b8', padding: '2rem', textAlign: 'center' }}>Cargando historial...</div>
                            ) : salesHistory.length > 0 ? (
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                        <thead>
                                            <tr style={{ color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', borderBottom: '1px solid #1e293b' }}>
                                                <th style={{ padding: '12px 1rem' }}>Fecha</th>
                                                <th style={{ padding: '12px 1rem' }}>Cliente</th>
                                                <th style={{ padding: '12px 1rem' }}>Documento</th>
                                                <th style={{ padding: '12px 1rem', textAlign: 'center' }}>Cant.</th>
                                                <th style={{ padding: '12px 1rem', textAlign: 'right' }}>Precio Unit.</th>
                                                <th style={{ padding: '12px 1rem', textAlign: 'right' }}>Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {salesHistory.map((sale, i) => (
                                                <tr key={i} style={{ borderBottom: '1px solid #0f172a', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#1e293b'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                                    <td style={{ padding: '1rem', color: '#cbd5e1' }}>{formatDate(sale.date)}</td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <div style={{ color: '#fff', fontWeight: '500' }}>{sale.customer_name}</div>
                                                        <div style={{ color: '#64748b', fontSize: '0.75rem' }}>RUC: {sale.customer_ruc}</div>
                                                    </td>
                                                    <td style={{ padding: '1rem', color: '#94a3b8', fontFamily: 'monospace' }}>{sale.document_number}</td>
                                                    <td style={{ padding: '1rem', textAlign: 'center', color: '#fff' }}>{sale.quantity}</td>
                                                    <td style={{ padding: '1rem', textAlign: 'right', color: '#10b981', fontWeight: '600' }}>
                                                        {sale.currency} {formatCurrency(sale.unit_price).replace('S/', '').replace('$', '')}
                                                    </td>
                                                    <td style={{ padding: '1rem', textAlign: 'right', color: '#fff' }}>
                                                        {sale.currency} {formatCurrency(sale.unit_price * sale.quantity).replace('S/', '').replace('$', '')}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div style={{
                                    padding: '3rem',
                                    textAlign: 'center',
                                    background: '#1e293b22',
                                    borderRadius: '1rem',
                                    border: '1px dashed #334155',
                                    color: '#64748b'
                                }}>
                                    <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔍</div>
                                    No se han encontrado ventas facturadas para este producto todavía.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Footer Actions */}
            <div style={{ padding: '1.5rem', borderTop: '1px solid #1e293b', display: 'flex', justifyContent: 'flex-end', gap: '1rem', background: '#0f172a' }}>
                <button
                    onClick={onClose}
                    style={{
                        padding: '0.75rem 2rem',
                        background: '#334155',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        fontWeight: '600'
                    }}
                >
                    Cerrar
                </button>
            </div>
        </div>
    );
};

export default ProductDetailsView;
