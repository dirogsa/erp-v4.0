import React from 'react';
import { ShoppingCartIcon, StarIcon, GiftIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

const MobileProductCard = ({ product, onAddToCart, isPrize = false }) => {
    return (
        <div className="card-premium">
            <Link to={`/product/${product.sku}`} className="flex-1">
                {/* Image Container */}
                <div className="aspect-square w-full bg-brand-surface-2 rounded-2xl mb-4 overflow-hidden flex items-center justify-center relative p-4 group-hover:bg-brand-surface-3 transition-colors">
                    <img
                        src={product.image_url || 'https://via.placeholder.com/200x200?text=No+Image'}
                        alt={product.name}
                        className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-700"
                    />
                    {product.is_new && (
                        <div className="absolute top-2 left-2 bg-brand-primary text-black text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg">
                            NUEVO
                        </div>
                    )}
                </div>

                {/* Product Info */}
                <div className="px-1 space-y-1.5 text-left">
                    <span className="text-brand-label">
                        {product.brand || 'DIROGSA'}
                    </span>
                    <h3 className="text-brand-title-sm">
                        {product.name}
                    </h3>
                    <div className="flex items-center gap-1.5">
                        <span className="text-brand-metadata">{product.sku}</span>
                    </div>
                </div>
            </Link>

            {/* Price & Action */}
            <div className="mt-4 pt-4 border-t border-brand-border flex items-center justify-between">
                <div className="flex flex-col">
                    {isPrize ? (
                        <div className="flex items-baseline gap-1">
                            <span className="text-base font-bold text-brand-primary">{product.points_cost}</span>
                            <span className="text-brand-metadata font-bold">pts</span>
                        </div>
                    ) : (
                        <>
                            <span className="text-brand-price">
                                S/ {product.price_retail ? product.price_retail.toFixed(2) : '0.00'}
                            </span>
                            <div className="flex items-center gap-1 mt-1.5 px-1.5 py-0.5 bg-brand-primary/10 rounded-md w-fit">
                                <span className="text-brand-label !text-[9px]">+{product.loyalty_points || 0} PTS</span>
                            </div>
                        </>
                    )}
                </div>

                <button
                    onClick={(e) => {
                        e.preventDefault();
                        onAddToCart?.(product);
                    }}
                    className={isPrize ? 'btn-icon' : 'h-10 w-10 flex items-center justify-center rounded-xl bg-brand-primary text-black transition-all active:scale-90'}
                >
                    {isPrize ? <GiftIcon className="h-5 w-5" /> : <ShoppingCartIcon className="h-5 w-5" />}
                </button>
            </div>
        </div>
    );
};

export default MobileProductCard;
