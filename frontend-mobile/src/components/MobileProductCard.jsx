import React from 'react';
import { ShoppingCartIcon, StarIcon, GiftIcon, MagnifyingGlassPlusIcon, XMarkIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const MobileProductCard = ({ product, onAddToCart, isPrize = false, searchTerm = "" }) => {
    const [isZoomed, setIsZoomed] = React.useState(false);
    const [fullProduct, setFullProduct] = React.useState(product);
    const navigate = useNavigate();
    const { user } = useAuth();
    const isSuperAdmin = user?.role === 'SUPERADMIN';

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
        <div className="card-premium h-auto flex flex-row items-center gap-4 group relative p-3">
            {/* Image Zone (Left Side) */}
            <div 
                onClick={() => setIsZoomed(true)}
                className="h-24 w-24 bg-brand-surface-2 rounded-2xl overflow-hidden flex items-center justify-center relative flex-shrink-0 p-2 group-hover:bg-brand-surface-3 transition-colors shadow-inner active:scale-95 transition-transform"
            >
                <img
                    src={product.image_url || 'https://via.placeholder.com/100x100?text=Filter'}
                    alt={product.name}
                    className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-700"
                />
                {product.is_new && (
                    <div className="absolute top-1 left-1 bg-brand-primary text-black text-[7px] font-black px-1.5 py-0.5 rounded-full shadow-lg">
                        NEW
                    </div>
                )}
            </div>

            {/* Info Zone (Right Side) */}
            <div 
                onClick={() => navigate(`/product/${product.sku}`)}
                className="flex-1 min-w-0 space-y-1 text-left cursor-pointer active:opacity-60 transition-opacity"
            >
                <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-brand-text-dim uppercase tracking-widest truncate">
                        {product.brand || 'DIROGSA'}
                    </span>
                    {isSuperAdmin && (
                        product.stock_current > 0 ? (
                            <span className="text-[8px] font-black text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded-full">STOCK: {product.stock_current}</span>
                        ) : (
                            <span className="text-[8px] font-black text-brand-orange bg-brand-orange/10 px-2 py-0.5 rounded-full uppercase">Reserva</span>
                        )
                    )}
                </div>
                
                <h3 className="text-white font-black uppercase tracking-tight text-xs leading-tight line-clamp-2">
                    {product.name}
                </h3>

                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-brand-orange font-black tracking-widest">{product.sku}</span>
                    {product.promo_discount_pct > 0 && (
                        <span className="bg-brand-danger text-white text-[8px] font-black px-1.5 py-0.5 rounded animate-pulse">PROMO</span>
                    )}
                </div>

                <div className="flex items-center justify-between pt-1">
                    <span className="text-white font-black text-sm">
                        S/ {(product.price || product.price_retail || 0).toFixed(2)}
                    </span>
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onAddToCart?.(product);
                        }}
                        className="h-10 w-10 flex items-center justify-center rounded-xl bg-brand-primary text-black active:scale-90 shadow-lg shadow-brand-primary/20"
                    >
                        <ShoppingCartIcon className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* FULL SCREEN IMAGE OVERLAY (Portal-like logic) */}
            {isZoomed && (
                <div className="fixed inset-0 z-[999] flex flex-col bg-black/95 backdrop-blur-3xl animate-in fade-in duration-300 h-screen overflow-hidden" onClick={(e) => e.stopPropagation()}>
                    <header className="flex-shrink-0 h-20 flex items-center justify-end px-6 relative z-50">
                        <button 
                            onClick={(e) => { e.stopPropagation(); setIsZoomed(false); }}
                            className="h-12 w-12 bg-brand-surface rounded-2xl flex items-center justify-center text-white border border-white/10 shadow-2xl active:scale-90 transition-all"
                        >
                            <XMarkIcon className="h-7 w-7" />
                        </button>
                    </header>
                    <main className="flex-1 flex items-center justify-center p-6 relative z-10 overflow-hidden" onClick={() => setIsZoomed(false)}>
                        <div className="w-full h-full flex items-center justify-center bg-white/[0.02] rounded-[3rem] border border-white/5 shadow-inner">
                            <img
                                src={fullProduct.image_url || 'https://via.placeholder.com/200x200?text=No+Image'}
                                alt={fullProduct.name}
                                className="max-w-[90%] max-h-[45vh] object-contain drop-shadow-[0_0_80px_rgba(255,255,255,0.1)] pointer-events-none transition-all duration-500"
                            />
                        </div>
                    </main>
                    <footer className="flex-shrink-0 p-6 pb-10 relative z-20" onClick={(e) => e.stopPropagation()}>
                        <div className="max-w-md mx-auto bg-brand-surface/60 backdrop-blur-3xl border border-white/10 p-6 rounded-[2rem] shadow-[0_30px_60px_rgba(0,0,0,0.8)] space-y-5 animate-in slide-in-from-bottom-10 duration-500">
                            <div className="text-center">
                                <h2 className="text-white font-black text-lg uppercase tracking-tighter mb-1 leading-tight line-clamp-1">{fullProduct.name}</h2>
                                <p className="text-brand-orange font-black tracking-[0.2em] text-[10px] uppercase">{fullProduct.sku}</p>
                            </div>
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
        </div>
    );
};

export default MobileProductCard;
