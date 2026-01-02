import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { shopService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Home = () => {
    const [brands, setBrands] = useState([]);
    const { isB2B } = useAuth();

    useEffect(() => {
        shopService.getVehicleBrands().then(res => {
            setBrands(res.data.filter(b => b.is_popular).slice(0, 8));
        });
    }, []);

    return (
        <div>
            {/* Hero Section */}
            <header className="bg-slate-900 text-white py-16 md:py-32 px-4 relative overflow-hidden">
                <div className="max-w-7xl mx-auto text-center relative z-10">
                    <span className="inline-block bg-primary-500/10 text-primary-400 px-4 py-2 rounded-full text-sm font-bold mb-8 border border-primary-500/20">
                        SOLUCIONES AUTOMOTRICES PREMIUM
                    </span>
                    <h1 className="text-5xl md:text-7xl font-black mb-8 tracking-tighter leading-tight">
                        Encuentra el filtro perfecto <br className="hidden md:block" />
                        <span className="text-primary-500">{isB2B ? 'con tus precios de socio' : 'para tu vehículo'}</span>
                    </h1>
                    <p className="text-slate-400 text-lg md:text-2xl max-w-3xl mx-auto mb-12">
                        Accede a nuestro catálogo completo con más de 5,000 aplicaciones.
                        Calidad certificada y entrega inmediata.
                    </p>
                    <div className="flex flex-col md:flex-row justify-center gap-6">
                        <Link to="/catalog" className="bg-primary-600 text-white px-10 py-5 rounded-2xl font-black text-xl hover:bg-primary-500 transition-all shadow-xl shadow-primary-600/20 active:scale-95">
                            Explorar Catálogo
                        </Link>
                        {isB2B ? (
                            <Link to="/profile" className="bg-white/10 backdrop-blur-xl text-white border border-white/20 px-10 py-5 rounded-2xl font-black text-xl hover:bg-white/20 transition-all">
                                Ver Mi Perfil
                            </Link>
                        ) : (
                            <Link to="/b2b" className="bg-white/10 backdrop-blur-xl text-white border border-white/20 px-10 py-5 rounded-2xl font-black text-xl hover:bg-white/20 transition-all">
                                Solicitar Cuenta B2B
                            </Link>
                        )}
                    </div>
                </div>

                {/* Background Decorations */}
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary-600/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2"></div>
            </header>

            {/* Features/Stats */}
            <section className="py-24 max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-12">
                <div className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all">
                    <div className="w-14 h-14 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center mb-6">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </div>
                    <h3 className="text-2xl font-black mb-4">Calidad OEM</h3>
                    <p className="text-slate-500 leading-relaxed">Filtros fabricados con los más altos estándares, igualando o superando las piezas originales.</p>
                </div>
                <div className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all">
                    <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                    </div>
                    <h3 className="text-2xl font-black mb-4">Envío Digital</h3>
                    <p className="text-slate-500 leading-relaxed">Gestión simplificada de catálogos y pedidos para que nunca te quedes sin stock.</p>
                </div>
                <div className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all">
                    <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-6">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </div>
                    <h3 className="text-2xl font-black mb-4">Puntos de Lealtad</h3>
                    <p className="text-slate-500 leading-relaxed">Gana puntos en cada compra y canjéalos por productos exclusivos o descuentos.</p>
                </div>
            </section>

            {/* Trusted Brands Carousel */}
            {brands.length > 0 && (
                <section className="py-20 border-y border-slate-100 bg-slate-50/30">
                    <div className="max-w-7xl mx-auto px-4">
                        <div className="text-center mb-12">
                            <span className="text-primary-600 font-black text-xs uppercase tracking-[0.2em] mb-4 block">PRESENCIA GLOBAL</span>
                            <h2 className="text-3xl font-black text-slate-900">Marcas Compatibles</h2>
                        </div>
                        <div className="flex flex-wrap justify-center gap-8 md:gap-16 items-center opacity-60 hover:opacity-100 transition-opacity grayscale hover:grayscale-0 duration-500">
                            {brands.map(brand => (
                                <Link
                                    key={brand.name}
                                    to={`/catalog?brand=${brand.name}`}
                                    className="flex flex-col items-center gap-4 group"
                                >
                                    <div className="w-20 h-20 md:w-28 md:h-28 bg-white rounded-3xl shadow-sm border border-slate-100 flex items-center justify-center p-4 group-hover:shadow-xl group-hover:-translate-y-2 transition-all">
                                        {brand.logo_url ? (
                                            <img src={brand.logo_url} alt={brand.name} className="w-full h-full object-contain" />
                                        ) : (
                                            <span className="text-2xl font-black text-slate-300">{brand.name[0]}</span>
                                        )}
                                    </div>
                                    <span className="text-[10px] font-black uppercase text-slate-400 group-hover:text-primary-600 tracking-widest">{brand.name}</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* B2B Banner (Prominent) */}
            <section className="max-w-7xl mx-auto px-4 mb-24">
                <div className="bg-slate-900 rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden">
                    <div className="relative z-10">
                        <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">
                            {isB2B ? "Tu cuenta B2B está activa" : "¿Tienes un taller o negocio?"}
                        </h2>
                        <p className="text-slate-400 text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
                            {isB2B
                                ? "Ahora disfrutas de precios especiales y beneficios exclusivos de socio. Revisa tu catálogo actualizado."
                                : "Únete a nuestro programa exclusivo B2B FILTROS y accede a precios de mayorista, crédito empresarial y soporte técnico especializado."}
                        </p>
                        <Link to={isB2B ? "/catalog" : "/b2b"} className="inline-block bg-primary-600 text-white px-12 py-5 rounded-2xl font-black text-xl hover:bg-primary-500 transition-all shadow-2xl shadow-primary-600/40">
                            {isB2B ? "VER MI CATÁLOGO" : "SOLICITAR CUENTA EMPRESARIAL"}
                        </Link>
                    </div>

                    {/* Abstract background */}
                    <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
                        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2"></div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
