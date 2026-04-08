import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { shopService } from '../services/api';
import { useCart } from '../context/CartContext';
import {
    ChevronLeftIcon,
    StarIcon,
    ShoppingCartIcon,
    InformationCircleIcon,
    TruckIcon,
    ClipboardDocumentListIcon,
    ArrowsRightLeftIcon,
    AdjustmentsHorizontalIcon,
    WrenchScrewdriverIcon
} from '@heroicons/react/24/outline';

const ProductDetailPage = () => {
    const { sku } = useParams();
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [activeTab, setActiveTab] = useState('specs');

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const res = await shopService.getProductBySku(sku);
                setProduct(res.data);
            } catch (error) {
                console.error("Error loading product", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [sku]);

    if (loading) return <div className="p-6 h-screen flex items-center justify-center text-brand-text bg-brand-bg font-bold">Cargando detalles...</div>;
    if (!product) return <div className="p-6 text-center text-brand-text bg-brand-bg min-h-screen">Producto no encontrado.</div>;

    return (
        <div className="bg-brand-bg text-brand-text min-h-screen pb-48 font-sans selection:bg-brand-primary/30">
            {/* Header / Nav */}
            <div className="fixed top-0 left-0 right-0 z-50 px-4 py-4 flex justify-between items-center bg-brand-bg/80 backdrop-blur-xl border-b border-brand-border/50 shadow-sm">
                <button
                    onClick={() => navigate(-1)}
                    className="h-10 w-10 bg-brand-surface rounded-xl flex items-center justify-center text-brand-text active:scale-95 transition-all border border-brand-border"
                >
                    <ChevronLeftIcon className="h-5 w-5" />
                </button>
                <div className="text-[10px] font-black text-brand-muted uppercase tracking-[0.2em]">Detalle Técnico</div>
                <div className="w-10"></div> {/* Spacer */}
            </div>

            {/* Image Section */}
            <div className="pt-24 px-6 pb-6">
                <div className="h-64 sm:h-80 bg-brand-surface rounded-[2rem] overflow-hidden flex items-center justify-center shadow-lg border border-brand-border/40 p-4 relative group">
                    <img
                        src={product.image_url || 'https://via.placeholder.com/400?text=No+Image'}
                        alt={product.name}
                        className="max-w-full max-h-full object-contain drop-shadow-2xl transition-transform duration-500 group-hover:scale-105"
                    />
                    {product.is_new && (
                        <div className="absolute top-4 left-4 bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 text-[10px] font-black px-3 py-1 rounded-lg backdrop-blur-sm shadow-xl uppercase tracking-widest">
                            NUEVO
                        </div>
                    )}
                </div>
            </div>

            {/* Content Section */}
            <div className="px-6 space-y-8">
                <div>
                    <div className="flex justify-between items-start mb-3">
                        <span className="text-[10px] font-black text-brand-primary uppercase tracking-[0.2em] bg-brand-primary/10 px-3 py-1.5 rounded-lg border border-brand-primary/20">
                            {product.brand || 'Dirogsa Industrial'}
                        </span>
                    </div>
                    <h1 className="text-2xl font-black text-white leading-tight mb-2 tracking-tighter uppercase">{product.name}</h1>
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-mono text-brand-muted font-bold tracking-widest">{product.sku}</p>
                        <div className={`px-2 py-1 rounded-md border text-[9px] font-black tracking-widest uppercase ${
                            product.stock_current > 0 
                            ? 'bg-brand-primary/10 border-brand-primary/20 text-brand-primary' 
                            : 'bg-red-500/10 border-red-500/20 text-red-500'
                        }`}>
                            {product.stock_current > 0 ? `${product.stock_current} EN STOCK` : 'SIN STOCK'}
                        </div>
                    </div>
                </div>

                {/* Pricing Block */}
                <div className="flex items-center justify-between bg-brand-surface p-6 rounded-[1.5rem] border border-brand-border shadow-inner relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-black text-brand-muted uppercase tracking-[0.2em] mb-1">Precio Unitario</p>
                        <span className="text-3xl font-black text-white">S/ {product.price?.toFixed(2)}</span>
                    </div>
                    <div className="text-right flex flex-col items-end relative z-10">
                        <p className="text-[9px] font-black justify-end text-amber-500 uppercase tracking-widest mb-1 flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                            <StarIcon className="h-3 w-3" /> PUNTOS
                        </p>
                        <span className="text-lg font-black text-amber-400">+{product.loyalty_points || 0}</span>
                    </div>
                </div>


                {/* 
                  DESIGN RULE: DIROGSA — Tech Industrial Color Coding (V3 - Always Tinted)
                  - REFERENCIAS: #6EE7B7 (Emerald) -> Always visible (Green tint when inactive)
                  - APLICACIONES: #38BDF8 (Cyan)   -> Always visible (Blue tint when inactive)
                  - MEDIDAS:      #FB923C (Orange) -> Always visible (Orange tint when inactive)
                  Never use generic grey/muted for these technical pillars. Use color alpha (99 for text, 22 for border, 07 for bg) when inactive.
                */}
                <div className="space-y-6 pt-4">
                    <div className="flex items-center gap-1 bg-brand-surface p-1 rounded-2xl border border-brand-border">
                        {[
                            { id: 'specs', label: 'Medidas', icon: AdjustmentsHorizontalIcon, color: '#FB923C' },
                            { id: 'equivalences', label: 'Referencias', icon: ArrowsRightLeftIcon, color: '#6EE7B7' },
                            { id: 'applications', label: 'Aplicaciones', icon: WrenchScrewdriverIcon, color: '#38BDF8' }
                        ].map((tab) => {
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex-1 flex flex-col items-center justify-center py-3 rounded-xl transition-all duration-300 gap-1.5 border`}
                                    style={{
                                        backgroundColor: isActive ? `${tab.color}18` : `${tab.color}07`,
                                        borderColor: isActive ? `${tab.color}55` : `${tab.color}22`,
                                        color: isActive ? tab.color : `${tab.color}99`,
                                        boxShadow: isActive ? `0 0 20px ${tab.color}15` : 'none',
                                        fontWeight: isActive ? '800' : '600'
                                    }}
                                >
                                    <tab.icon className="h-5 w-5" style={{ color: isActive ? tab.color : `${tab.color}88` }} />
                                    <span className="text-[9px] uppercase tracking-widest">
                                        {tab.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Tab Content */}
                    <div className="min-h-[200px] fade-in">
                        {activeTab === 'specs' && (
                            <div className="grid grid-cols-3 gap-3">
                                {product.specs?.length > 0 ? (
                                    product.specs.map((spec, i) => (
                                        <div key={i} className="bg-brand-surface/50 border border-brand-border p-3 rounded-xl flex flex-col items-center justify-center text-center" 
                                             style={{ borderColor: 'rgba(251,146,60,0.15)' }}>
                                            <span className="text-[10px] font-black mb-1 uppercase tracking-tight" style={{ color: '#FB923C' }}>{spec.label}</span>
                                            <span className="text-xs font-black text-white">{spec.value}</span>
                                            <span className="text-[8px] font-bold text-brand-muted uppercase mt-0.5">{spec.measure_type}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-3 py-10 text-center text-brand-muted text-xs italic">
                                        No hay medidas específicas registradas.
                                    </div>
                                )}
                                {product.weight_g > 0 && (
                                    <div className="bg-brand-surface/50 border border-brand-border p-3 rounded-xl flex flex-col items-center justify-center text-center"
                                         style={{ borderColor: 'rgba(251,146,60,0.15)' }}>
                                        <span className="text-[10px] font-black mb-1 uppercase tracking-tight" style={{ color: '#FB923C' }}>PESO</span>
                                        <span className="text-xs font-black text-white">{product.weight_g}</span>
                                        <span className="text-[8px] font-bold text-brand-muted uppercase mt-0.5">GRAMOS</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'equivalences' && (
                            <div className="space-y-2">
                                {product.equivalences?.length > 0 ? (
                                    product.equivalences.map((eq, i) => (
                                        <div key={i} className="flex items-center justify-between bg-brand-surface/50 border border-brand-border p-3.5 rounded-xl"
                                             style={{ borderColor: 'rgba(110,231,183,0.15)' }}>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1.5" style={{ color: '#6EE7B7' }}>{eq.brand}</p>
                                                <p className="text-xs font-mono font-bold text-white">{eq.code}</p>
                                            </div>
                                            {eq.is_original && (
                                                <span className="text-[8px] font-black bg-brand-primary/20 text-brand-primary border border-brand-primary/30 px-2 py-0.5 rounded uppercase">OEM</span>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-10 text-center text-brand-muted text-xs italic">
                                        No se encontraron referencias disponibles.
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'applications' && (
                            <div className="space-y-3">
                                {product.applications?.length > 0 ? (
                                    product.applications.map((app, i) => (
                                        <div key={i} className="bg-brand-surface/50 border border-brand-border rounded-xl p-4 relative overflow-hidden group"
                                             style={{ borderColor: 'rgba(56,189,248,0.15)' }}>
                                            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                                <TruckIcon className="h-10 w-10" style={{ color: '#38BDF8' }} />
                                            </div>
                                            <div className="relative z-10">
                                                <h4 className="text-xs font-black text-white uppercase mb-1 tracking-tight">
                                                    {app.make} {app.model}
                                                </h4>
                                                <div className="flex flex-wrap gap-2 items-center">
                                                    <span className="text-[10px] font-bold bg-brand-accent-dim px-2 py-0.5 rounded border border-brand-accent-dim" 
                                                          style={{ color: '#38BDF8', borderColor: 'rgba(56,189,248,0.2)' }}>
                                                        {app.year}
                                                    </span>
                                                    {app.engine && (
                                                        <span className="text-[10px] font-bold bg-brand-accent-dim px-2 py-0.5 rounded border border-brand-accent-dim"
                                                              style={{ color: '#38BDF8', borderColor: 'rgba(56,189,248,0.2)' }}>
                                                            MOT: {app.engine}
                                                        </span>
                                                    )}
                                                </div>
                                                {app.notes && (
                                                    <p className="text-[10px] text-brand-muted mt-2 font-medium italic">
                                                        Nota: {app.notes}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-10 text-center text-brand-muted text-xs italic">
                                        No hay información de aplicaciones vehiculares.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Features (Older section, kept for compatibility) */}
                {product.features?.length > 0 && (
                    <div className="space-y-4 pb-4">
                        <h3 className="text-[10px] font-black text-brand-muted uppercase tracking-widest flex items-center gap-2">
                            <ClipboardDocumentListIcon className="h-4 w-4" />
                            Atributos Adicionales
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {product.features.map((f, i) => (
                                <span key={i} className="text-[10px] font-bold bg-brand-surface border border-brand-border text-brand-text px-3 py-1.5 rounded-lg whitespace-nowrap">
                                    {f}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
                
                {/* Visual spacer to endure scrolling fits the sticky bar */}
                <div className="h-6"></div>
            </div>

            {/* Bottom Purchase Bar - Industrial Glassmorphism */}
            <div className="fixed left-0 right-0 bg-brand-surface/90 backdrop-blur-xl border-y border-brand-border p-4 flex items-center gap-4 z-40 shadow-[0_-15px_40px_rgba(0,0,0,0.5)]"
                style={{ bottom: 'calc(4rem + env(safe-area-inset-bottom))' }}>
                {/* Quantity Controls */}
                <div className="flex items-center gap-4 bg-brand-bg border border-brand-border text-white px-4 py-3.5 rounded-xl">
                    <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="p-1 hover:text-brand-primary active:scale-75 transition-all text-brand-muted"
                    >
                        <ChevronLeftIcon className="h-5 w-5" />
                    </button>
                    <span className="w-8 text-center font-black text-lg">{quantity}</span>
                    <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="p-1 hover:text-brand-primary active:scale-75 transition-all text-brand-muted rotate-180"
                    >
                        <ChevronLeftIcon className="h-5 w-5" />
                    </button>
                </div>

                {/* Add to Order Action */}
                <button
                    onClick={() => {
                        addToCart(product, quantity);
                        navigate('/cart');
                    }}
                    className="flex-1 bg-brand-primary text-brand-bg h-full min-h-[52px] rounded-xl font-black text-xs uppercase tracking-widest active:scale-[0.98] transition-all flex items-center justify-center gap-2 hover:brightness-110"
                >
                    <ShoppingCartIcon className="h-5 w-5" />
                    AÑADIR A PEDIDO
                </button>
            </div>
        </div>
    );
};

export default ProductDetailPage;

