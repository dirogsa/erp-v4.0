import React from 'react';
import { ShoppingCartIcon, StarIcon, GiftIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

const MobileProductCard = ({ product, onAddToCart, isPrize = false }) => {
    return (
        <div className="bg-brand-surface rounded-2xl p-2.5 border border-brand-border/40 flex flex-col h-full active:scale-[0.98] transition-all shadow-lg active:shadow-inner group">
            <Link to={`/product/${product.sku}`} className="flex-1">
                {/* Image Container - Compacted for Mobile */}
                <div className="h-28 w-full bg-brand-bg rounded-xl mb-3 overflow-hidden flex items-center justify-center relative border border-brand-border/20 p-3">
                    <img
                        src={product.image_url || 'https://via.placeholder.com/200x200?text=No+Image'}
                        alt={product.name}
                        className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-500"
                    />
                    {product.is_new && (
                        <div className="absolute top-2 left-2 bg-brand-primary text-brand-bg text-[7px] font-black px-1.5 py-0.5 rounded-md shadow-xl">
                            NUEVO
                        </div>
                    )}
                </div>

                {/* Product Info */}
                <div className="px-1">
                    <span className="text-[7px] font-black text-brand-primary uppercase tracking-[0.2em] mb-1 block">
                        {product.brand || 'DIROGSA'}
                    </span>
                    <h3 className="text-[11px] font-black text-white line-clamp-2 leading-tight tracking-tighter uppercase min-h-[22px]">
                        {product.name}
                    </h3>
                    <p className="text-brand-muted text-[8px] font-mono mt-1 opacity-60 tracking-widest">{product.sku}</p>
                </div>
            </Link>

            {/* Price & Action */}
            <div className="mt-3 pt-3 border-t border-brand-border/30 flex items-center justify-between">
                <div className="flex flex-col">
                    {isPrize ? (
                        <span className="text-xs font-black text-brand-primary flex items-center gap-1">
                            {product.points_cost} <span className="text-[8px] opacity-60 uppercase">pts</span>
                        </span>
                    ) : (
                        <>
                            <span className="text-[13px] font-black text-white leading-none tracking-tighter">
                                S/ {product.price_retail?.toFixed(2)}
                            </span>
                            <div className="flex items-center gap-1 mt-1">
                                <StarIcon className="h-2 w-2 text-brand-primary" />
                                <span className="text-[7px] font-black text-brand-primary uppercase tracking-tighter">+{product.loyalty_points || 0} PTS</span>
                            </div>
                        </>
                    )}
                </div>

                <button
                    onClick={(e) => {
                        e.preventDefault();
                        onAddToCart?.(product);
                    }}
                    className={`p-2 rounded-lg transition-all shadow-md active:scale-75 ${isPrize ? 'bg-brand-primary/10 text-brand-primary' : 'bg-brand-primary text-brand-bg'}`}
                >
                    {isPrize ? <GiftIcon className="h-4 w-4" /> : <ShoppingCartIcon className="h-4 w-4" />}
                </button>
            </div>
        </div>
    );
};

export default MobileProductCard;
