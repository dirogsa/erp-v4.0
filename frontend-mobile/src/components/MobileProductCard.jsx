import React from 'react';
import { ShoppingCartIcon, StarIcon, GiftIcon, MagnifyingGlassPlusIcon, XMarkIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { Link, useNavigate } from 'react-router-dom';

const MobileProductCard = ({ product, onAddToCart, isPrize = false }) => {
    const [isZoomed, setIsZoomed] = React.useState(false);
    const [fullProduct, setFullProduct] = React.useState(product);
    const navigate = useNavigate();

    // Smart Hydration: Fetch full specs if missing when zooming
    React.useEffect(() => {
        if (isZoomed && (!fullProduct.specs || fullProduct.specs.length === 0)) {
            const fetchFullSpecs = async () => {
                try {
                    const { shopService } = await import('../services/api');
                    const res = await shopService.getProductBySku(product.sku);
                    if (res.data) {
                        setFullProduct(res.data);
                    }
                } catch (error) {
                    console.error("Failed to hydrate specs for zoom", error);
                }
            };
            fetchFullSpecs();
        }
    }, [isZoomed, product.sku, fullProduct.specs]);

    // Keep fullProduct in sync with prop if it changes
    React.useEffect(() => {
        setFullProduct(product);
    }, [product]);

    return (
        <div className="card-premium h-full flex flex-col group relative">
            {/* Image Zone - ZOOM TRIGGER */}
            <div 
                onClick={() => setIsZoomed(true)}
                className="aspect-square w-full bg-brand-surface-2 rounded-[2rem] mb-4 overflow-hidden flex items-center justify-center relative p-6 group-hover:bg-brand-surface-3 transition-colors shadow-inner active:scale-95 transition-transform"
            >
                <img
                    src={product.image_url || 'https://via.placeholder.com/200x200?text=No+Image'}
                    alt={product.name}
                    className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-700"
                />
                
                {/* Visual Hint for Zoom */}
                <div className="absolute top-4 right-4 h-10 w-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 shadow-lg group-hover:bg-brand-primary group-hover:text-black transition-all">
                    <MagnifyingGlassPlusIcon className="h-5 w-5" />
                </div>

                {product.is_new && (
                    <div className="absolute top-4 left-4 bg-brand-primary text-black text-[10px] font-black px-3 py-1 rounded-full shadow-lg">
                        NUEVO
                    </div>
                )}
            </div>

            {/* Info Zone - DETAIL NAVIGATION */}
            <div 
                onClick={() => navigate(`/product/${product.sku}`)}
                className="px-2 space-y-3 text-left flex-1 cursor-pointer active:opacity-60 transition-opacity"
            >
                <div className="flex justify-between items-start">
                    <span className="text-brand-label">
                        {product.brand || 'DIROGSA'}
                    </span>
                    <ChevronRightIcon className="h-4 w-4 text-brand-text-dim mt-1" />
                </div>
                
                <h3 className="text-brand-title line-clamp-2 min-h-[3rem] uppercase tracking-tighter">
                    {product.name}
                </h3>

                <div className="flex flex-col gap-3">
                    <span className="text-brand-metadata font-black tracking-widest">{product.sku}</span>
                    
                    {/* NEW: PROFESSIONAL TECHNICAL CTA */}
                    <button className="w-full py-2.5 bg-brand-orange/5 border border-brand-orange/30 rounded-xl flex items-center justify-center gap-2 group/btn hover:bg-brand-orange/10 transition-all">
                        <span className="text-[10px] font-black text-brand-orange uppercase tracking-[0.1em]">Ver Ficha Técnica</span>
                        <ChevronRightIcon className="h-3 w-3 text-brand-orange group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>

            {/* FULL SCREEN IMAGE OVERLAY - ADAPTIVE VISUALS V3 (With Smart Hydration) */}
            {isZoomed && (
                <div className="fixed inset-0 z-[999] flex flex-col bg-black/95 backdrop-blur-3xl animate-in fade-in duration-300 h-screen overflow-hidden" onClick={(e) => e.stopPropagation()}>
                    {/* Header Area */}
                    <header className="flex-shrink-0 h-20 flex items-center justify-end px-6 relative z-50">
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsZoomed(false);
                            }}
                            className="h-12 w-12 bg-brand-surface rounded-2xl flex items-center justify-center text-white border border-white/10 shadow-2xl active:scale-90 transition-all"
                        >
                            <XMarkIcon className="h-7 w-7" />
                        </button>
                    </header>
                    
                    {/* Main Image Area (Strict Constrain) */}
                    <main className="flex-1 flex items-center justify-center p-6 relative z-10 overflow-hidden" onClick={() => setIsZoomed(false)}>
                        <div className="w-full h-full flex items-center justify-center bg-white/[0.02] rounded-[3rem] border border-white/5 shadow-inner">
                            <img
                                src={fullProduct.image_url || 'https://via.placeholder.com/200x200?text=No+Image'}
                                alt={fullProduct.name}
                                className="max-w-[90%] max-h-[45vh] object-contain drop-shadow-[0_0_80px_rgba(255,255,255,0.1)] pointer-events-none transition-all duration-500"
                            />
                        </div>
                    </main>

                    {/* Floating Technical Control Bar (Hydrated Data) */}
                    <footer className="flex-shrink-0 p-6 pb-10 relative z-20" onClick={(e) => e.stopPropagation()}>
                        <div className="max-w-md mx-auto bg-brand-surface/60 backdrop-blur-3xl border border-white/10 p-6 rounded-[2rem] shadow-[0_30px_60px_rgba(0,0,0,0.8)] space-y-5 animate-in slide-in-from-bottom-10 duration-500">
                            <div className="text-center">
                                <h2 className="text-white font-black text-lg uppercase tracking-tighter mb-1 leading-tight line-clamp-1">{fullProduct.name}</h2>
                                <p className="text-brand-orange font-black tracking-[0.2em] text-[10px] uppercase">{fullProduct.sku}</p>
                            </div>

                            {/* Technical Ribbon (Now consistent and dynamic) */}
                            <div className="flex justify-center gap-2 overflow-x-auto no-scrollbar">
                                {fullProduct.specs?.length > 0 ? (
                                    fullProduct.specs.slice(0, 4).map((spec, i) => (
                                        <div key={i} className="flex flex-col items-center min-w-[70px] bg-white/5 border border-white/5 p-2.5 rounded-xl">
                                            <span className="text-[8px] font-black text-brand-orange uppercase tracking-widest mb-0.5">{spec.label}</span>
                                            <span className="text-brand-xs font-black text-white font-mono">{spec.value}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl animate-pulse">
                                        <span className="text-[10px] font-black text-brand-text-dim uppercase tracking-widest italic">Cargando detalles técnicos...</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </footer>
                </div>
            )}

            {/* Price & Action */}
            <div className="mt-6 pt-5 border-t border-brand-border flex items-center justify-between">
                <div className="flex flex-col">
                    {isPrize ? (
                        <div className="flex items-baseline gap-1">
                            <span className="text-brand-lg font-black text-brand-primary">{product.points_cost}</span>
                            <span className="text-brand-xs font-black text-brand-text-muted">PTS</span>
                        </div>
                    ) : (
                        <>
                            <span className="text-brand-price">
                                S/ {product.price_retail ? product.price_retail.toFixed(2) : '0.00'}
                            </span>
                            <div className="flex items-center gap-1 mt-2 px-2 py-0.5 bg-brand-primary/10 rounded-lg w-fit">
                                <span className="text-brand-label !text-[11px]">+{product.loyalty_points || 0} PTS</span>
                            </div>
                        </>
                    )}
                </div>

                <button
                    onClick={(e) => {
                        e.preventDefault();
                        onAddToCart?.(product);
                    }}
                    className={isPrize ? 'btn-icon' : 'h-14 w-14 flex items-center justify-center rounded-2xl bg-brand-primary text-black transition-all active:scale-90 shadow-lg'}
                >
                    {isPrize ? <GiftIcon className="h-6 w-6" /> : <ShoppingCartIcon className="h-6 w-6" />}
                </button>
            </div>
        </div>
    );
};

export default MobileProductCard;
