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
    WrenchScrewdriverIcon,
    CheckCircleIcon,
    MagnifyingGlassPlusIcon,
    XMarkIcon,
    TagIcon
} from '@heroicons/react/24/outline';
import { useNotifications } from '../context/NotificationContext';

const ProductDetailPage = () => {
    const { sku } = useParams();
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const { showNotification } = useNotifications();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [activeTab, setActiveTab] = useState('equivalences');
    const [isVolumeModalOpen, setIsVolumeModalOpen] = useState(false);
    const [customVolumeQuantity, setCustomVolumeQuantity] = useState(50);
    const [isImageZoomed, setIsImageZoomed] = useState(false);

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
            <div className="fixed top-0 left-0 right-0 z-50 px-4 py-6 flex justify-between items-center glass-card border-b border-white/5 shadow-2xl">
                <button
                    onClick={() => navigate(-1)}
                    className="h-14 w-14 bg-brand-surface rounded-2xl flex items-center justify-center text-brand-text active:scale-95 transition-all border border-brand-border shadow-xl"
                >
                    <ChevronLeftIcon className="h-6 w-6" />
                </button>
                <div className="text-brand-metadata">Detalle Técnico</div>
                <div className="w-14"></div> {/* Spacer */}
            </div>

            {/* Technical Hub: Image + Integrated Specs (Adaptive V3) */}
            <div className="pt-32 px-6 pb-6 space-y-6">
                <div 
                    onClick={() => setIsImageZoomed(true)}
                    className="h-80 sm:h-96 bg-brand-surface rounded-[2.5rem] overflow-hidden flex items-center justify-center shadow-2xl border border-white/5 p-10 relative group active:scale-95 transition-all cursor-zoom-in"
                >
                    <img
                        src={product.image_url || 'https://via.placeholder.com/400?text=No+Image'}
                        alt={product.name}
                        className="max-w-full max-h-full object-contain drop-shadow-2xl transition-transform duration-700 group-hover:scale-110"
                    />
                    
                    {/* Visual Hint for Zoom */}
                    <div className="absolute top-6 right-6 h-10 w-10 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20 shadow-2xl group-hover:bg-brand-primary group-hover:text-black transition-all">
                        <MagnifyingGlassPlusIcon className="h-5 w-5" />
                    </div>

                    {product.is_new && (
                        <div className="absolute top-6 left-6 bg-brand-primary text-brand-bg text-[10px] font-black px-4 py-1.5 rounded-xl shadow-2xl uppercase tracking-widest animate-pulse">
                            NUEVO
                        </div>
                    )}
                </div>

                {/* Blueprint Specs Grid (Now Integrated) */}
                <div className="grid grid-cols-4 gap-2.5">
                    {product.specs?.slice(0, 4).map((spec, i) => (
                        <div key={i} className="bg-brand-surface/30 border border-brand-orange/20 p-3.5 rounded-2xl flex flex-col items-center justify-center text-center shadow-lg backdrop-blur-sm">
                            <span className="text-[9px] font-black mb-1.5 uppercase tracking-tight text-brand-orange/80">{spec.label}</span>
                            <span className="text-brand-xs font-black text-white">{spec.value}</span>
                            <span className="text-[8px] font-bold text-brand-text-dim uppercase mt-0.5">{spec.measure_type}</span>
                        </div>
                    ))}
                    {product.weight_g > 0 && (
                        <div className="bg-brand-surface/30 border border-brand-orange/20 p-3.5 rounded-2xl flex flex-col items-center justify-center text-center shadow-lg backdrop-blur-sm">
                            <span className="text-[9px] font-black mb-1.5 uppercase tracking-tight text-brand-orange/80">PESO</span>
                            <span className="text-brand-xs font-black text-white">{product.weight_g}</span>
                            <span className="text-[8px] font-bold text-brand-text-dim uppercase mt-0.5">GRAMOS</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Content Section */}
            <div className="px-6 space-y-8">
                {/* Product Title & Code */}
                <div className="space-y-4">
                    <div className="flex flex-col gap-2">
                        <span className="text-brand-label !text-brand-xs">{product.brand || 'DIROGSA'}</span>
                        <h1 className="text-brand-xl font-black text-white leading-tight uppercase tracking-tighter">
                            {product.name}
                        </h1>
                        <div className="flex items-center gap-3">
                            <span className="bg-brand-surface border border-brand-border px-4 py-1.5 rounded-lg text-brand-primary font-black text-brand-sm tracking-widest">
                                {product.sku}
                            </span>
                            <div className={`px-3 py-1.5 rounded-xl border-2 text-[9px] font-black tracking-widest uppercase ${
                                product.stock_current > 0 
                                ? 'bg-brand-primary/10 border-brand-primary/20 text-brand-primary' 
                                : 'bg-brand-danger/10 border-brand-danger/20 text-brand-danger'
                            }`}>
                                {product.stock_current > 0 ? `${product.stock_current} EN STOCK` : 'SIN STOCK'}
                            </div>
                        </div>
                    </div>

                    {/* Price Display */}
                    <div className="bg-brand-surface/50 border-2 border-white/5 p-6 rounded-[2rem] shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <TagIcon className="h-16 w-16 text-brand-primary" />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-baseline gap-2 mb-2">
                                <span className="text-brand-xs font-bold text-brand-text-dim uppercase tracking-widest">Precio Unitario</span>
                                {product.promo_discount_pct > 0 && (
                                    <span className="bg-brand-orange/20 text-brand-orange text-[10px] font-black px-3 py-1 rounded-full animate-pulse border border-brand-orange/30">
                                        ¡OFERTA -{product.promo_discount_pct}%!
                                    </span>
                                )}
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-brand-2xl font-black text-white">S/ {product.price_retail?.toFixed(2) || product.price?.toFixed(2)}</span>
                                <span className="text-brand-xs font-bold text-brand-text-muted">Incl. IGV</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* VOLUME OFFERS SECTION */}
                <div className="space-y-4">
                    <h3 className="text-brand-metadata flex items-center gap-3 px-1 uppercase tracking-widest font-black text-[10px]">
                        <ShoppingCartIcon className="h-5 w-5 text-brand-primary" />
                        Ofertas por Volumen
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { qty: 3, label: 'PACK 3', discount: product.discount_3_pct || 5 },
                            { qty: 6, label: 'PACK 6', discount: product.discount_6_pct || 10 },
                            { qty: 12, label: 'PACK 12', discount: product.discount_12_pct || 15 }
                        ].map((tier) => (
                            <button
                                key={tier.qty}
                                onClick={() => {
                                    setQuantity(tier.qty);
                                    showNotification({
                                        type: 'info',
                                        title: 'Nivel Aplicado',
                                        message: `Has seleccionado el Pack de ${tier.qty} unidades.`
                                    });
                                }}
                                className={`
                                    relative overflow-hidden p-5 rounded-[2rem] border-2 transition-all duration-300 text-left
                                    ${quantity === tier.qty 
                                        ? 'bg-brand-primary/10 border-brand-primary shadow-[0_0_30px_rgba(16,185,129,0.2)]' 
                                        : 'bg-brand-surface border-white/5 shadow-xl'}
                                `}
                            >
                                <span className="block text-[10px] font-black text-brand-text-dim uppercase tracking-widest mb-1">{tier.label}</span>
                                <span className="block text-brand-lg font-black text-white mb-1">-{tier.discount}%</span>
                                <span className="block text-[9px] font-black text-brand-primary uppercase tracking-tighter">Aplicar Descuento</span>
                            </button>
                        ))}

                        <button
                            onClick={() => setIsVolumeModalOpen(true)}
                            className="p-5 rounded-[2rem] border-2 border-brand-orange/30 bg-brand-orange/5 shadow-xl flex flex-col justify-center items-start text-left gap-1 active:scale-95 transition-all group"
                        >
                            <span className="text-brand-orange font-black text-brand-sm uppercase tracking-tighter group-hover:scale-105 transition-transform">
                                +50 UNIDADES
                            </span>
                            <span className="text-brand-xs font-bold text-brand-text-muted uppercase tracking-widest leading-tight">
                                SOLICITAR PRECIO ESPECIAL
                            </span>
                        </button>
                    </div>
                </div>

                {/* MODAL DE VOLUMEN PERSONALIZADO */}
                {isVolumeModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
                        <div className="absolute inset-0 bg-brand-bg/90 backdrop-blur-md" onClick={() => setIsVolumeModalOpen(false)}></div>
                        <div className="glass-card w-full max-w-sm p-8 rounded-[3rem] border border-white/10 shadow-2xl relative z-10 animate-in fade-in zoom-in duration-300">
                            <h2 className="text-brand-lg font-black text-white mb-2 uppercase tracking-tighter text-center">Cotización por Volumen</h2>
                            <p className="text-brand-xs text-brand-text-dim text-center mb-8 uppercase tracking-widest font-bold">Mínimo 50 unidades para precio especial</p>
                            <div className="space-y-6">
                                <div className="flex flex-col gap-2">
                                    <label className="text-brand-xs font-black text-brand-primary uppercase tracking-widest px-2">Cantidad deseada</label>
                                    <input 
                                        type="number" 
                                        min="50"
                                        value={customVolumeQuantity}
                                        onChange={(e) => setCustomVolumeQuantity(parseInt(e.target.value) || 0)}
                                        className="w-full bg-brand-bg border-2 border-brand-border rounded-2xl p-6 text-2xl font-black text-white text-center focus:border-brand-primary focus:outline-none shadow-inner transition-all"
                                        placeholder="50"
                                    />
                                </div>
                                <div className="flex gap-4">
                                    <button onClick={() => setIsVolumeModalOpen(false)} className="flex-1 bg-brand-surface border border-white/5 p-5 rounded-2xl text-brand-text font-black text-brand-xs uppercase">Cancelar</button>
                                    <button 
                                        onClick={() => {
                                            if (customVolumeQuantity < 50) return;
                                            setQuantity(customVolumeQuantity);
                                            setIsVolumeModalOpen(false);
                                        }}
                                        className="flex-[2] bg-brand-primary text-brand-bg p-5 rounded-2xl font-black text-brand-xs uppercase shadow-lg active:scale-95 transition-all"
                                    >Confirmar</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* VISOR DE IMAGEN FULL SCREEN - ADAPTIVE VISUALS V3 */}
                {isImageZoomed && (
                    <div className="fixed inset-0 z-[1000] flex flex-col bg-black/95 backdrop-blur-3xl animate-in fade-in duration-300 h-screen overflow-hidden" onClick={() => setIsImageZoomed(false)}>
                        <header className="flex-shrink-0 h-20 flex items-center justify-end px-6 relative z-50">
                            <button onClick={(e) => { e.stopPropagation(); setIsImageZoomed(false); }} className="h-12 w-12 bg-brand-surface rounded-2xl flex items-center justify-center text-white border border-white/10 shadow-2xl active:scale-90 transition-all">
                                <XMarkIcon className="h-7 w-7" />
                            </button>
                        </header>
                        <main className="flex-1 flex items-center justify-center p-6 relative z-10 overflow-hidden">
                            <div className="w-full h-full flex items-center justify-center bg-white/[0.02] rounded-[3rem] border border-white/5 shadow-inner">
                                <img
                                    src={product.image_url || 'https://via.placeholder.com/400?text=No+Image'}
                                    alt={product.name}
                                    className="max-w-[90%] max-h-[45vh] object-contain drop-shadow-[0_0_80px_rgba(255,255,255,0.15)] pointer-events-none transition-all duration-500"
                                />
                            </div>
                        </main>
                        <footer className="flex-shrink-0 p-6 pb-10 relative z-20" onClick={(e) => e.stopPropagation()}>
                            <div className="max-w-md mx-auto bg-brand-surface/60 backdrop-blur-3xl border border-white/10 p-6 rounded-[2rem] shadow-[0_30px_60px_rgba(0,0,0,0.8)] space-y-5 animate-in slide-in-from-bottom-10 duration-500">
                                <div className="text-center">
                                    <h2 className="text-white font-black text-lg uppercase tracking-tighter mb-1 leading-tight line-clamp-1">{product.name}</h2>
                                    <p className="text-brand-orange font-black tracking-[0.2em] text-[10px] uppercase">{product.sku}</p>
                                </div>
                                <div className="flex justify-center gap-2 overflow-x-auto no-scrollbar">
                                    {product.specs?.slice(0, 4).map((spec, i) => (
                                        <div key={i} className="flex flex-col items-center min-w-[70px] bg-white/5 border border-white/5 p-2.5 rounded-xl">
                                            <span className="text-[8px] font-black text-brand-orange uppercase tracking-widest mb-0.5">{spec.label}</span>
                                            <span className="text-brand-xs font-black text-white font-mono">{spec.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </footer>
                    </div>
                )}

                {/* TABS SECTION */}
                <div className="space-y-6 pt-4">
                    <div className="flex items-center gap-1 bg-brand-surface p-1 rounded-2xl border border-brand-border">
                        {[
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
                                    <tab.icon className="h-6 w-6" style={{ color: isActive ? tab.color : `${tab.color}88` }} />
                                    <span className="text-brand-xs font-black uppercase tracking-widest">
                                        {tab.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Tab Content */}
                    <div className="min-h-[150px] fade-in">
                        {activeTab === 'equivalences' && (
                            <div className="space-y-2">
                                {product.equivalences?.length > 0 ? (
                                    product.equivalences.map((eq, i) => (
                                        <div key={i} className="flex items-center justify-between bg-brand-surface/50 border-2 border-white/5 p-5 rounded-[1.5rem] shadow-xl"
                                             style={{ borderColor: 'rgba(110,231,183,0.15)' }}>
                                            <div>
                                                <p className="text-brand-xs font-black uppercase tracking-widest leading-none mb-2" style={{ color: '#6EE7B7' }}>{eq.brand}</p>
                                                <p className="text-brand-sm font-mono font-black text-white">{eq.code}</p>
                                            </div>
                                            {eq.is_original && (
                                                <span className="text-brand-xs font-black bg-brand-primary/20 text-brand-primary border border-brand-primary/30 px-3 py-1 rounded-lg uppercase shadow-lg">OEM</span>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-12 text-center text-brand-text-muted text-brand-sm italic">
                                        No se encontraron referencias.
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'applications' && (
                            <div className="space-y-3">
                                {product.applications?.length > 0 ? (
                                    product.applications.map((app, i) => (
                                        <div key={i} className="bg-brand-surface/50 border-2 border-white/5 rounded-[2rem] p-6 relative overflow-hidden group shadow-xl"
                                             style={{ borderColor: 'rgba(56,189,248,0.15)' }}>
                                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
                                                <TruckIcon className="h-14 w-14" style={{ color: '#38BDF8' }} />
                                            </div>
                                            <div className="relative z-10">
                                                <h4 className="text-brand-sm font-black text-white uppercase mb-3 tracking-tight">
                                                    {app.make} {app.model}
                                                </h4>
                                                <div className="flex flex-wrap gap-3 items-center">
                                                    <span className="text-brand-xs font-black bg-brand-accent-dim px-3 py-1 rounded-xl border border-brand-accent-dim shadow-sm" 
                                                          style={{ color: '#38BDF8', borderColor: 'rgba(56,189,248,0.2)' }}>
                                                        {app.year}
                                                    </span>
                                                    {app.engine && (
                                                        <span className="text-brand-xs font-black bg-brand-accent-dim px-3 py-1 rounded-xl border border-brand-accent-dim shadow-sm"
                                                              style={{ color: '#38BDF8', borderColor: 'rgba(56,189,248,0.2)' }}>
                                                            MOT: {app.engine}
                                                        </span>
                                                    )}
                                                </div>
                                                {app.notes && (
                                                    <p className="text-brand-xs text-brand-text-muted mt-4 font-bold italic leading-relaxed">
                                                        Nota: {app.notes}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-12 text-center text-brand-text-muted text-brand-sm italic">
                                        No hay información vehicular.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Features */}
                {product.features?.length > 0 && (
                    <div className="space-y-6 pb-4">
                        <h3 className="text-brand-metadata flex items-center gap-3">
                            <ClipboardDocumentListIcon className="h-5 w-5" />
                            Atributos Adicionales
                        </h3>
                        <div className="flex flex-wrap gap-3">
                            {product.features.map((f, i) => (
                                <span key={i} className="text-brand-xs font-black bg-brand-surface border-2 border-white/5 text-white px-5 py-2.5 rounded-2xl whitespace-nowrap shadow-xl">
                                    {f}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
                
                <div className="h-6"></div>
            </div>

            {/* Sticky Bottom Bar */}
            <div className="fixed left-0 right-0 glass-card border-t border-white/5 p-6 z-40 shadow-[0_-20px_50px_rgba(0,0,0,0.6)]"
                style={{ bottom: 'calc(4rem + env(safe-area-inset-bottom))' }}>
                
                {/* ETIQUETA DINÁMICA DE PRECIO ESPECIAL */}
                {quantity >= 50 && (
                    <div className="flex justify-center mb-4 animate-in slide-in-from-bottom-2 duration-300">
                        <div className="bg-brand-orange/20 border border-brand-orange/40 px-4 py-2 rounded-xl flex items-center gap-3 shadow-[0_0_20px_rgba(251,146,60,0.1)]">
                            <span className="h-2.5 w-2.5 bg-brand-orange rounded-full animate-pulse shadow-[0_0_10px_rgba(251,146,60,0.5)]"></span>
                            <span className="text-[11px] font-black text-brand-orange uppercase tracking-wider">
                                Precio Especial Sujeto a Evaluación (+50u)
                            </span>
                        </div>
                    </div>
                )}

                <div className="flex items-center gap-4">
                    {/* Quantity Controls */}
                    <div className="flex items-center gap-6 bg-brand-bg border-2 border-brand-border text-white px-6 py-4 rounded-[1.5rem] shadow-inner">
                        <button
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            className="p-1 hover:text-brand-primary active:scale-75 transition-all text-brand-text-muted"
                        >
                            <ChevronLeftIcon className="h-7 w-7" />
                        </button>
                        <span className="w-10 text-center font-black text-brand-lg">{quantity}</span>
                        <button
                            onClick={() => setQuantity(quantity + 1)}
                            className="p-1 hover:text-brand-primary active:scale-75 transition-all text-brand-text-muted rotate-180"
                        >
                            <ChevronLeftIcon className="h-7 w-7" />
                        </button>
                    </div>

                    {/* Add to Order Action */}
                    <button
                        onClick={() => {
                            addToCart(product, quantity);
                            navigate('/cart');
                        }}
                        className="flex-1 bg-brand-primary text-brand-bg h-full min-h-[64px] rounded-[1.5rem] font-black text-brand-sm uppercase tracking-widest active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-2xl shadow-brand-primary/20 hover:brightness-110"
                    >
                        <ShoppingCartIcon className="h-6 w-6" />
                        AÑADIR A PEDIDO
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductDetailPage;
