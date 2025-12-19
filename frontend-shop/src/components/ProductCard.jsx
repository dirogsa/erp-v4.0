import { ShoppingCartIcon } from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const ProductCard = ({ product }) => {
    const { addToCart } = useCart();
    return (
        <div className="bg-white rounded-3xl p-4 shadow-sm hover:shadow-xl transition-all border border-slate-100 group relative">
            {product.is_new && (
                <div className="absolute top-4 left-4 z-10">
                    <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-sm animate-pulse">
                        NUEVO
                    </span>
                </div>
            )}

            <Link to={`/product/${product.sku}`}>
                <div className="aspect-square bg-slate-50 rounded-2xl mb-4 overflow-hidden flex items-center justify-center relative">
                    <img
                        src={product.image_url || 'https://via.placeholder.com/400x400?text=No+Image'}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                </div>

                <div className="space-y-1 mb-4">
                    <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold text-primary-600 uppercase tracking-wider bg-primary-50 px-2 py-0.5 rounded-full">
                            {product.brand || 'Genérico'}
                        </span>
                    </div>
                    <h3 className="font-bold text-slate-800 line-clamp-2 min-h-[3rem] group-hover:text-primary-600 transition-colors">
                        {product.name}
                    </h3>
                    <p className="text-slate-400 text-xs font-mono">{product.sku}</p>
                </div>
            </Link>

            <div className="flex items-center justify-between border-t border-slate-50 pt-4">
                <div className="flex flex-col">
                    <span className="text-2xl font-black text-slate-900">
                        S/ {product.price.toFixed(2)}
                    </span>
                    <div className="flex items-center gap-1 mt-1">
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <StarIcon className="h-3 w-3" /> {product.loyalty_points || 0} pts
                        </span>
                    </div>
                </div>

                <button
                    onClick={() => addToCart(product)}
                    className="bg-slate-900 text-white p-3 rounded-2xl hover:bg-primary-600 transition-all shadow-lg active:scale-95"
                >
                    <ShoppingCartIcon className="h-6 w-6" />
                </button>
            </div>
        </div>
    );
};

export default ProductCard;
