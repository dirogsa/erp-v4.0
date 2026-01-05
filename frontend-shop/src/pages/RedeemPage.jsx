import React, { useState, useEffect } from 'react';
import { shopService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { ShoppingCartIcon, TrophyIcon, MapPinIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { useNotification } from '../hooks/useNotification';
import LoadingSpinner from '../components/LoadingSpinner';
import { SparklesIcon } from '@heroicons/react/24/outline';

const RedeemPage = () => {
    const { user, isAuthenticated, refreshProfile } = useAuth();
    const { showNotification } = useNotification();
    const { addToCart } = useCart();
    const [prizes, setPrizes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const LIMIT = 20;

    useEffect(() => {
        setPage(1);
        setHasMore(true);
        loadPrizes(1, true);
    }, [user]);

    const loadPrizes = async (pageNum = 1, isFresh = false) => {
        setLoading(true);
        try {
            const params = {
                page: pageNum,
                limit: LIMIT,
                skip: (pageNum - 1) * LIMIT
            };
            const res = await shopService.getPrizes(params);

            const newItems = res.data.items || [];
            if (isFresh) {
                setPrizes(newItems);
            } else {
                setPrizes(prev => [...prev, ...newItems]);
            }

            const total = res.data.total || 0;
            const currentCount = isFresh ? newItems.length : prizes.length + newItems.length;
            setHasMore(currentCount < total);

        } catch (error) {
            console.error("Error loading prizes", error);
            showNotification("Error al cargar los premios", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        loadPrizes(nextPage, false);
    };

    const handleAddToCart = (prize) => {
        addToCart(prize, 1);
        showNotification("¡Premio añadido al carrito!", "success");
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Header Section */}
            <div className="relative overflow-hidden bg-slate-900 rounded-[2.5rem] p-8 md:p-12 mb-12 shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600 opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="text-center md:text-left">
                        <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
                            Club de <span className="text-primary-400">Premios</span>
                        </h1>
                        <p className="text-slate-400 text-lg font-medium max-w-xl">
                            Canjea tus puntos acumulados por productos exclusivos. ¡Tu fidelidad tiene recompensa!
                        </p>
                    </div>

                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 text-center min-w-[200px]">
                        <TrophyIcon className="h-8 w-8 text-amber-400 mx-auto mb-2" />
                        <div className="text-xs text-slate-400 uppercase font-black tracking-widest mb-1">Tus Puntos</div>
                        <div className="text-4xl font-black text-white">
                            {user?.loyalty_points?.toLocaleString() || 0}
                        </div>
                    </div>
                </div>
            </div>

            {/* New Arrivals Section */}
            <div className="mb-12">
                <div className="flex items-center gap-2 mb-4">
                    <div className="h-1 w-8 bg-amber-400 rounded-full"></div>
                    <h3 className="text-sm font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                        <SparklesIcon className="h-4 w-4 text-amber-500" /> Novedades
                    </h3>
                </div>

                <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative overflow-hidden group hover:shadow-primary-900/20 transition-all">
                    {/* Decorative background elements */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary-600/20 transition-all duration-700"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
                        <div className="space-y-4 max-w-lg">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-white border border-white/5 backdrop-blur-md text-xs font-black uppercase tracking-wider">
                                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                                Club de Premios
                            </div>
                            <h2 className="text-3xl md:text-5xl font-black text-white leading-tight tracking-tight">
                                Nuevos Canjes <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-amber-400">2025</span>
                            </h2>
                            <p className="text-slate-400 text-lg font-medium">
                                Aprovecha tus puntos al máximo con los nuevos artículos exclusivos que tenemos para ti.
                            </p>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => document.getElementById('prizes-grid').scrollIntoView({ behavior: 'smooth' })}
                                className="bg-white text-slate-900 px-8 py-4 rounded-2xl font-black hover:bg-slate-50 transition-all shadow-xl shadow-white/5 hover:scale-105 active:scale-95 duration-300"
                            >
                                Ver Premios
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Address Selection */}

            {!isAuthenticated && (
                <div className="bg-amber-50 border border-amber-100 rounded-3xl p-8 text-center mb-12">
                    <h3 className="text-amber-800 font-bold text-xl mb-2">¡Inicia sesión para canjear!</h3>
                    <p className="text-amber-700 mb-4">Necesitas estar identificado para ver tus puntos y solicitar premios.</p>
                </div>
            )}

            {/* Prizes Grid */}
            <div id="prizes-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {prizes.length === 0 ? (
                    <div className="col-span-full py-20 text-center">
                        <div className="text-6xl mb-4">🎁</div>
                        <h3 className="text-2xl font-bold text-slate-400">No hay premios disponibles por ahora</h3>
                        <p className="text-slate-500">Vuelve pronto para ver las novedades.</p>
                    </div>
                ) : (
                    prizes.map((prize) => {
                        const canAfford = (user?.loyalty_points || 0) >= prize.points_cost;

                        return (
                            <div key={prize.sku} className="group bg-white rounded-[2rem] overflow-hidden border border-slate-100 hover:shadow-2xl hover:shadow-primary-600/10 transition-all duration-500 flex flex-col">
                                {/* Image Wrapper */}
                                <div className="aspect-square relative overflow-hidden bg-slate-100">
                                    <img
                                        src={prize.image_url || 'https://via.placeholder.com/400x400?text=Sin+Imagen'}
                                        alt={prize.name}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                    />
                                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-lg border border-white/20">
                                        <div className="text-[10px] text-slate-400 font-black uppercase tracking-tighter leading-none">Costo</div>
                                        <div className="text-xl font-black text-primary-600">{prize.points_cost} <span className="text-xs">PTS</span></div>
                                    </div>
                                    {prize.is_new && (
                                        <div className="absolute top-4 left-4 bg-primary-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                                            Nuevo
                                        </div>
                                    )}
                                    {prize.type === 'MARKETING' && (
                                        <div className="absolute bottom-4 left-4 bg-amber-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
                                            Publicidad
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="p-6 flex-grow flex flex-col">
                                    <div className="text-[10px] text-primary-500 font-black uppercase tracking-widest mb-1">{prize.brand || 'Original'}</div>
                                    <h3 className="text-lg font-bold text-slate-900 leading-tight mb-2 line-clamp-2">{prize.name}</h3>
                                    <p className="text-slate-500 text-xs mb-6 line-clamp-3">SKU: {prize.sku}</p>

                                    <div className="mt-auto">
                                        {isAuthenticated ? (
                                            <button
                                                disabled={!canAfford || prize.stock_current <= 0}
                                                onClick={() => handleAddToCart(prize)}
                                                className={`w-full py-4 rounded-2xl font-black text-sm tracking-wider uppercase transition-all flex items-center justify-center gap-2 ${canAfford && prize.stock_current > 0
                                                    ? 'bg-slate-900 text-white hover:bg-primary-600 shadow-xl shadow-slate-900/10'
                                                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                    }`}
                                            >
                                                {prize.stock_current <= 0 ? (
                                                    'Agotado'
                                                ) : canAfford ? (
                                                    <><ShoppingCartIcon className="h-5 w-5" /> Agregar al Carrito</>
                                                ) : (
                                                    'Puntos Insuficientes'
                                                )}
                                            </button>
                                        ) : (
                                            <div className="text-center py-2 text-xs font-bold text-slate-400">
                                                Identifícate para canjear
                                            </div>
                                        )}
                                        <div className="mt-4 flex items-center justify-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${prize.stock_current > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                {prize.stock_current > 0 ? `${prize.stock_current} Unidades disponibles` : 'Sin stock'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Load More Button */}
            {!loading && hasMore && prizes.length > 0 && (
                <div className="mt-12 text-center">
                    <button
                        onClick={handleLoadMore}
                        className="px-8 py-4 bg-white border border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                    >
                        Cargar más premios
                    </button>
                </div>
            )}

        </div>
    );
};

export default RedeemPage;
