import React from 'react';
import { ShoppingCartIcon, StarIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

const MobileProductCard = ({ product, onAddToCart, isPrize = false }) => {
    return (
        <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 flex flex-col h-full active:scale-[0.98] transition-transform">
            <Link to={`/product/${product.sku}`} className="flex-1">
                <div className="aspect-square bg-slate-50 rounded-xl mb-3 overflow-hidden flex items-center justify-center relative">
                    <img
                        src={product.image_url || 'https://via.placeholder.com/200x200?text=No+Image'}
                        alt={product.name}
                        className="w-full h-full object-cover"
                    />
                    {product.is_new && (
                        <span className="absolute top-2 left-2 bg-emerald-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-md">
                            NUEVO
                        </span>
                    )}
                </div>

                <div className="mb-2">
                    <span className="text-[9px] font-black text-primary-600 uppercase tracking-wider bg-primary-50 px-1.5 py-0.5 rounded-full">
                        {product.brand || 'Personalizado'}
                    </span>
                    <h3 className="text-sm font-bold text-slate-800 line-clamp-2 mt-1 leading-tight">
                        {product.name}
                    </h3>
                    <p className="text-slate-400 text-[10px] font-mono mt-1">{product.sku}</p>
                </div>
            </Link>

            <div className="mt-auto pt-2 border-t border-slate-50 flex items-center justify-between">
                <div className="flex flex-col">
                    {isPrize ? (
                        <span className="text-base font-black text-amber-600 flex items-center gap-1">
                            {product.points_cost} <span className="text-[10px] font-medium">pts</span>
                        </span>
                    ) : (
                        <>
                            <span className="text-lg font-black text-slate-900 leading-none">
                                S/ {product.price_retail?.toFixed(2)}
                            </span>
                            <span className="text-[9px] font-bold text-amber-600 mt-1 flex items-center gap-0.5">
                                <StarIcon className="h-2.5 w-2.5" /> +{product.loyalty_points || 0}
                            </span>
                        </>
                    )}
                </div>

                <button
                    onClick={() => onAddToCart(product)}
                    className={`p-2 rounded-xl transition-all shadow-md active:scale-90 ${isPrize ? 'bg-amber-100 text-amber-700' : 'bg-primary-600 text-white'}`}
                >
                    {isPrize ? <GiftIcon className="h-5 w-5" /> : <ShoppingCartIcon className="h-5 w-5" />}
                </button>
            </div>
        </div>
    );
};

// Mock GiftIcon since it's used conditionally
const GiftIcon = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-14v14m0-14L4 7m8 4L4 7m0 0v10l8 4" />
    </svg>
);

export default MobileProductCard;
