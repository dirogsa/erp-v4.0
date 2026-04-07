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
    ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';

const ProductDetailPage = () => {
    const { sku } = useParams();
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);

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
                    <p className="text-sm font-mono text-brand-muted font-bold tracking-widest">{product.sku}</p>
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

                {/* Specs / Info */}
                <div className="space-y-4">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                        <InformationCircleIcon className="h-5 w-5 text-brand-primary" />
                        Ficha Técnica
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                        <div className="bg-brand-surface p-4 rounded-2xl border border-brand-border shadow-sm">
                            <span className="text-[10px] uppercase font-black text-brand-muted block mb-1 tracking-widest">Disponibilidad</span>
                            <span className={`font-black text-sm ${product.stock_current > 0 ? 'text-brand-primary' : 'text-red-400'}`}>
                                {product.stock_current} unidades
                            </span>
                        </div>
                        {product.weight_g && (
                            <div className="bg-brand-surface p-4 rounded-2xl border border-brand-border shadow-sm">
                                <span className="text-[10px] uppercase font-black text-brand-muted block mb-1 tracking-widest">Peso Ref.</span>
                                <span className="font-black text-white text-sm">{product.weight_g} g</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Features */}
                {product.features?.length > 0 && (
                    <div className="space-y-4 pb-4">
                        <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                            <ClipboardDocumentListIcon className="h-5 w-5 text-brand-primary" />
                            Atributos Clave
                        </h3>
                        <ul className="space-y-3 bg-brand-surface p-5 rounded-2xl border border-brand-border">
                            {product.features.map((f, i) => (
                                <li key={i} className="flex gap-3 text-sm text-brand-text font-medium items-center">
                                    <span className="h-1.5 w-1.5 rounded-full bg-brand-primary shrink-0 opacity-80"></span> 
                                    {f}
                                </li>
                            ))}
                        </ul>
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

