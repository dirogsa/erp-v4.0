import React, { useState, useEffect } from 'react';
import MobileProductCard from '../components/MobileProductCard';
import { shopService } from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ChevronLeftIcon, GiftIcon, SparklesIcon } from '@heroicons/react/24/outline';

const PrizesPage = () => {
    const { user } = useAuth();
    const { addToCart } = useCart();
    const navigate = useNavigate();
    const [prizes, setPrizes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPrizes = async () => {
            try {
                const res = await shopService.getPrizes();
                setPrizes(res.data.items || []);
            } catch (error) {
                console.error("Error loading prizes", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPrizes();
    }, []);

    return (
        <div className="bg-slate-50 min-h-screen pb-24">
            {/* Header Modernista Estilo Glassmorphism (Estandarizado con HomePage) */}
            <div className="bg-white px-6 pt-12 pb-6 sticky top-0 z-50 border-b border-slate-100 flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2.5 bg-slate-50 rounded-2xl text-slate-500 active:scale-95 transition-all outline-none"
                >
                    <ChevronLeftIcon className="h-5 w-5" />
                </button>
                <div className="flex-1">
                    <h1 className="text-xl font-black text-slate-900 leading-tight">Canje de Premios</h1>
                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em] mt-0.5 flex items-center gap-1">
                        <SparklesIcon className="h-3 w-3" /> Catálogo Exclusivo
                    </p>
                </div>
                <div className="bg-amber-50 px-4 py-2 rounded-2xl border border-amber-100 flex flex-col items-end">
                    <span className="text-[8px] font-black text-amber-600 uppercase tracking-widest">Mis Puntos</span>
                    <span className="text-lg font-black text-amber-700 leading-none">{user?.loyalty_points || 0}</span>
                </div>
            </div>

            {/* Banner Informativo Moderno */}
            <div className="p-6">
                <div className="bg-slate-900 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden mb-8">
                    <div className="relative z-10">
                        <h2 className="text-2xl font-black text-white mb-2 leading-tight">Recompensa tu lealtad.</h2>
                        <p className="text-sm text-slate-400 font-medium mb-0">Canjea tus puntos por merchandising oficial y beneficios exclusivos de DIROGSA.</p>
                    </div>
                    {/* Background decoration */}
                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-amber-500/20 rounded-full blur-3xl"></div>
                    <div className="absolute top-10 right-10">
                        <GiftIcon className="h-12 w-12 text-white/10" />
                    </div>
                </div>

                <div className="flex justify-between items-end mb-6 pl-1">
                    <h2 className="text-lg font-black text-slate-900">Artículos Disponibles</h2>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full">{prizes.length} Items</span>
                </div>

                {loading ? (
                    <div className="grid grid-cols-2 gap-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="bg-white rounded-[2rem] h-64 animate-pulse border border-slate-50"></div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4">
                        {prizes.map(prize => (
                            <MobileProductCard
                                key={prize.sku}
                                product={prize}
                                isPrize={true}
                                onAddToCart={(p) => {
                                    addToCart({ ...p, type: 'MARKETING' });
                                    // Usar una notificación más elegante en el futuro o un simple feedback visual
                                }}
                            />
                        ))}
                    </div>
                )}

                {prizes.length === 0 && !loading && (
                    <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
                        <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                            <GiftIcon className="h-8 w-8" />
                        </div>
                        <p className="text-slate-400 font-black text-sm uppercase tracking-widest">No hay premios listados</p>
                        <p className="text-xs text-slate-400 mt-1">Vuelve pronto para ver novedades.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PrizesPage;
