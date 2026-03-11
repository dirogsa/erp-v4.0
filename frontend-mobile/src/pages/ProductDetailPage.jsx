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

    if (loading) return <div className="p-6 h-screen flex items-center justify-center">Cargando detalles...</div>;
    if (!product) return <div className="p-6 text-center">Producto no encontrado.</div>;

    return (
        <div className="bg-white min-h-screen pb-32">
            {/* Header / Nav */}
            <div className="fixed top-0 left-0 right-0 z-50 px-4 py-4 flex justify-between items-center bg-white/80 backdrop-blur-md">
                <button
                    onClick={() => navigate(-1)}
                    className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 active:scale-90 transition-all"
                >
                    <ChevronLeftIcon className="h-6 w-6" />
                </button>
                <div className="text-xs font-black text-slate-400 uppercase tracking-widest">Detalle de Producto</div>
                <div className="w-10"></div> {/* Spacer */}
            </div>

            {/* Image Section */}
            <div className="pt-20 px-6 pb-6">
                <div className="aspect-square bg-slate-50 rounded-[2.5rem] overflow-hidden flex items-center justify-center shadow-inner border border-slate-50">
                    <img
                        src={product.image_url || 'https://via.placeholder.com/400'}
                        alt={product.name}
                        className="w-full h-full object-cover"
                    />
                </div>
            </div>

            {/* Content Section */}
            <div className="px-6 space-y-6">
                <div>
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-black text-primary-600 uppercase tracking-widest bg-primary-50 px-2 py-1 rounded-md border border-primary-100">
                            {product.brand || 'Dirogsa Premium'}
                        </span>
                        {product.is_new && (
                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                                Nuevo
                            </span>
                        )}
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 leading-tight mb-1">{product.name}</h1>
                    <p className="text-sm font-mono text-slate-400 font-bold">{product.sku}</p>
                </div>

                <div className="flex items-center justify-between bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Precio Unitario</p>
                        <span className="text-3xl font-black text-slate-900">S/ {product.price?.toFixed(2)}</span>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1 flex items-center justify-end gap-1">
                            <StarIcon className="h-3 w-3" /> Ganas
                        </p>
                        <span className="text-xl font-black text-amber-500">{product.loyalty_points || 0} pts</span>
                    </div>
                </div>

                {/* Specs / Info */}
                <div className="space-y-4">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                        <InformationCircleIcon className="h-5 w-5 text-primary-600" />
                        Especificaciones
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                            <span className="text-slate-400 block mb-1">Stock Actual</span>
                            <span className={`font-black ${product.stock_current > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                {product.stock_current} unidades
                            </span>
                        </div>
                        {product.weight_g && (
                            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                <span className="text-slate-400 block mb-1">Peso</span>
                                <span className="font-black text-slate-900">{product.weight_g} g</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Features */}
                {product.features?.length > 0 && (
                    <div className="space-y-3">
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                            <ClipboardDocumentListIcon className="h-5 w-5 text-primary-600" />
                            Características
                        </h3>
                        <ul className="space-y-2">
                            {product.features.map((f, i) => (
                                <li key={i} className="flex gap-2 text-xs text-slate-600 font-medium">
                                    <span className="text-primary-500">•</span> {f}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {/* Bottom Purchase Bar - Optimized for iPhone Pro Max / PWA */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-6 flex items-center gap-4 z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.03)]"
                style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1.5rem)' }}>
                <div className="flex items-center gap-4 bg-slate-900 text-white px-4 py-3 rounded-2xl">
                    <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="p-1 hover:text-primary-400 transition-colors"
                    >
                        <ChevronLeftIcon className="h-5 w-5" />
                    </button>
                    <span className="w-8 text-center font-black text-lg">{quantity}</span>
                    <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="p-1 hover:text-primary-400 transition-colors rotate-180"
                    >
                        <ChevronLeftIcon className="h-5 w-5" />
                    </button>
                </div>

                <button
                    onClick={() => {
                        addToCart(product, quantity);
                        navigate('/cart');
                    }}
                    className="flex-1 bg-primary-600 text-white h-full rounded-2xl font-black text-sm shadow-xl shadow-primary-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                    <ShoppingCartIcon className="h-5 w-5" />
                    AÑADIR A MI PEDIDO
                </button>
            </div>
        </div>
    );
};

export default ProductDetailPage;
