import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { shopService } from '../services/api';
import { useCart } from '../context/CartContext';
import { ShoppingCartIcon, ArrowLeftIcon, StarIcon, CheckBadgeIcon } from '@heroicons/react/24/outline';

const ProductDetail = () => {
    const { sku } = useParams();
    const { addToCart } = useCart();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('specs');

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const response = await shopService.getProductBySku(sku);
                setProduct(response.data);
            } catch (error) {
                console.error("Error fetching product detail", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [sku]);

    if (loading) return (
        <div className="flex justify-center items-center h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
    );

    if (!product) return (
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
            <h2 className="text-2xl font-bold mb-4">Producto no encontrado</h2>
            <Link to="/catalog" className="text-primary-600 hover:underline flex items-center justify-center gap-2">
                <ArrowLeftIcon className="h-5 w-5" /> Volver al catálogo
            </Link>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto px-4 py-6 md:py-12">
            <Link to="/catalog" className="inline-flex items-center gap-2 text-slate-500 hover:text-primary-600 transition-colors mb-8 font-bold">
                <ArrowLeftIcon className="h-5 w-5" /> VOLVER AL CATÁLOGO
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-16 mb-16">
                {/* Image Section */}
                <div className="bg-white rounded-[3rem] p-8 shadow-sm border border-slate-100 flex items-center justify-center">
                    <img
                        src={product.image_url || 'https://via.placeholder.com/600x600?text=No+Image'}
                        alt={product.name}
                        className="w-full h-auto object-contain max-h-[500px] hover:scale-105 transition-transform duration-500"
                    />
                </div>

                {/* Info Section */}
                <div className="flex flex-col">
                    <div className="mb-6">
                        <span className="bg-primary-50 text-primary-600 px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-4 inline-block">
                            {product.brand || 'Genérico'}
                        </span>
                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 leading-tight">
                            {product.name}
                        </h1>
                        <p className="text-slate-400 font-mono text-lg mb-6">SKU: {product.sku}</p>

                        <div className="flex items-center gap-4 mb-8">
                            <div className="flex items-center gap-2 bg-amber-50 text-amber-600 px-4 py-2 rounded-2xl border border-amber-100">
                                <StarIcon className="h-6 w-6" />
                                <span className="text-lg font-black">{product.loyalty_points || 0} Puntos de Fidelidad</span>
                            </div>
                            {product.stock_current > 0 ? (
                                <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-2xl border border-emerald-100">
                                    <CheckBadgeIcon className="h-6 w-6" />
                                    <span className="text-lg font-black">Stock Disponible</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 bg-rose-50 text-rose-600 px-4 py-2 rounded-2xl border border-rose-100">
                                    <span className="text-lg font-black">Agotado</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 mb-8 shadow-2xl relative overflow-hidden">
                        <div className="relative z-10">
                            <span className="text-slate-400 font-bold mb-1 block uppercase tracking-wider text-xs">Precio del Producto</span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-5xl font-black">S/ {product.price.toFixed(2)}</span>
                                <span className="text-slate-400 font-medium">Inc. IGV</span>
                            </div>
                        </div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500 opacity-10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={() => addToCart(product)}
                            className="flex-1 bg-primary-600 text-white py-5 rounded-2xl font-black text-xl hover:bg-primary-500 transition-all shadow-xl shadow-primary-600/20 active:scale-95 flex items-center justify-center gap-3"
                        >
                            <ShoppingCartIcon className="h-7 w-7" /> AÑADIR AL CARRITO
                        </button>
                    </div>
                </div>
            </div>

            {/* Tabs Section */}
            <div className="space-y-8">
                <div className="flex border-b border-slate-200 gap-8">
                    {[
                        { id: 'specs', label: 'Especificaciones' },
                        { id: 'equiv', label: 'Equivalencias' },
                        { id: 'apps', label: 'Aplicaciones' },
                        { id: 'desc', label: 'Descripción' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`pb-4 text-sm font-black uppercase tracking-widest transition-all relative ${activeTab === tab.id ? 'text-primary-600' : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            {tab.label}
                            {activeTab === tab.id && (
                                <div className="absolute bottom-0 left-0 w-full h-1 bg-primary-600 rounded-full animate-in slide-in-from-left-2 duration-300"></div>
                            )}
                        </button>
                    ))}
                </div>

                <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm min-h-[300px]">
                    {activeTab === 'specs' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {(product.specs && product.specs.length > 0) ? product.specs.map((spec, i) => (
                                <div key={i} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <span className="font-black text-slate-400 text-xs uppercase tracking-widest">{spec.label}</span>
                                    <span className="font-bold text-slate-800 text-lg">{spec.value} <span className="text-xs text-slate-400">{spec.measure_type}</span></span>
                                </div>
                            )) : (
                                <p className="text-slate-400 italic col-span-full">No hay especificaciones técnicas registradas.</p>
                            )}
                        </div>
                    )}

                    {activeTab === 'equiv' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {(product.equivalences && product.equivalences.length > 0) ? product.equivalences.map((eq, i) => (
                                <div key={i} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="flex flex-col">
                                        <span className="font-black text-slate-400 text-[10px] uppercase tracking-widest leading-none mb-1">{eq.brand}</span>
                                        <span className="font-bold text-slate-800 text-xl">{eq.code}</span>
                                    </div>
                                    {eq.is_original && (
                                        <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-2 py-1 rounded-lg">OEM</span>
                                    )}
                                </div>
                            )) : (
                                <p className="text-slate-400 italic col-span-full">No hay equivalencias registradas.</p>
                            )}
                        </div>
                    )}

                    {activeTab === 'apps' && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-slate-400 text-xs uppercase tracking-widest border-b border-slate-100">
                                        <th className="pb-4 font-black">Marca</th>
                                        <th className="pb-4 font-black">Modelo</th>
                                        <th className="pb-4 font-black">Año</th>
                                        <th className="pb-4 font-black">Motor</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {(product.applications && product.applications.length > 0) ? product.applications.map((app, i) => (
                                        <tr key={i}>
                                            <td className="py-4 font-bold text-slate-800">{app.make}</td>
                                            <td className="py-4 font-bold text-slate-800">{app.model}</td>
                                            <td className="py-4 text-slate-500">{app.year}</td>
                                            <td className="py-4 text-slate-500">{app.engine}</td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="4" className="py-8 text-slate-400 italic text-center">No hay aplicaciones vehiculares registradas.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'desc' && (
                        <div className="prose prose-slate max-w-none">
                            <p className="text-lg text-slate-600 leading-relaxed whitespace-pre-line">
                                {product.description || 'Este producto no cuenta con una descripción detallada por el momento.'}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductDetail;
