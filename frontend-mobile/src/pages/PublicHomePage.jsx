import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
    MagnifyingGlassIcon, 
    UserIcon,
    ChevronRightIcon,
    ShieldCheckIcon,
    TagIcon,
    TruckIcon
} from '@heroicons/react/24/outline';

const PublicHomePage = () => {
    const [activeBrand, setActiveBrand] = useState('wix'); // 'wix' or 'asakashi'
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    const handleSearch = (e) => {
        if (e.key === 'Enter' || e.type === 'click') {
            if (searchQuery.trim()) {
                navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
            }
        }
    };

    return (
        <div className={`min-h-screen brand-transition bg-brand-bg text-brand-text brand-${activeBrand}`}>
            {/* Header / Brand Switcher */}
            <header className="px-6 pt-12 pb-6 border-b border-brand-surface sticky top-0 bg-brand-bg/80 backdrop-blur-md z-50 flex justify-between items-center">
                <div className="flex bg-brand-surface p-1 rounded-2xl border border-brand-muted/20">
                    <button 
                        onClick={() => setActiveBrand('wix')}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            activeBrand === 'wix' 
                            ? 'bg-brand-primary text-brand-bg shadow-lg shadow-brand-primary/20' 
                            : 'text-brand-muted'
                        }`}
                    >
                        WIX
                    </button>
                    <button 
                        onClick={() => setActiveBrand('asakashi')}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            activeBrand === 'asakashi' 
                            ? 'bg-brand-primary text-brand-bg shadow-lg shadow-brand-primary/20' 
                            : 'text-brand-muted'
                        }`}
                    >
                        ASAKASHI
                    </button>
                </div>
                
                <Link to="/login" className="p-3 bg-brand-surface rounded-2xl border border-brand-muted/10 group active:scale-95 transition-all">
                    <UserIcon className="h-5 w-5 text-brand-primary" />
                </Link>
            </header>

            <main className="px-6 py-8">
                {/* Hero Section */}
                <div className="mb-12">
                    <div className="flex gap-2 mb-3">
                        <span className="text-[10px] bg-brand-primary/10 text-brand-primary border border-brand-primary/30 px-3 py-1 rounded-full font-black tracking-widest uppercase">
                            Premium Filters
                        </span>
                    </div>
                    <h1 className="text-4xl font-black leading-[1.1] mb-4">
                        {activeBrand === 'wix' ? 'El filtro que tu motor merece.' : 'Ingeniería Japonesa a tu alcance.'}
                    </h1>
                    <p className="text-brand-muted text-sm leading-relaxed mb-8 max-w-[80%]">
                        {activeBrand === 'wix' 
                            ? 'Tecnología estadounidense para máxima durabilidad y rendimiento en condiciones extremas.' 
                            : 'Precisión y flujo optimizado para los motores más modernos del mercado.'}
                    </p>

                    {/* Search Bar - Principal CTA */}
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                            <MagnifyingGlassIcon className="h-5 w-5 text-brand-muted group-focus-within:text-brand-primary transition-colors" />
                        </div>
                        <input 
                            type="text" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={handleSearch}
                            placeholder="Buscar por código o equivalencia..."
                            className="w-full bg-brand-surface h-16 pl-14 pr-6 rounded-[2rem] border-2 border-brand-muted/10 focus:border-brand-primary focus:outline-none text-sm font-bold tracking-tight transition-all placeholder:text-brand-muted/50"
                        />
                        <button 
                            onClick={handleSearch}
                            className="absolute right-3 top-3 bottom-3 bg-brand-primary px-6 flex items-center justify-center rounded-[1.5rem] shadow-lg shadow-brand-primary/20 active:scale-95 transition-all"
                        >
                            <ChevronRightIcon className="h-5 w-5 text-brand-bg font-black" />
                        </button>
                    </div>
                </div>

                {/* Main Categories Section (The rest of the code is the same) */}
                <div className="grid grid-cols-2 gap-4 mb-12">
                    <div className="bg-brand-surface p-6 rounded-[2.5rem] border border-brand-muted/10 flex flex-col items-center text-center group active:scale-[0.98] transition-all">
                        <div className="h-14 w-14 bg-brand-bg rounded-2xl flex items-center justify-center mb-4 shadow-inner ring-1 ring-brand-muted/10 group-hover:scale-110 transition-transform">
                            🛢️
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-brand-muted mb-1">Filtros de</span>
                        <span className="text-sm font-black">Aceite</span>
                    </div>
                    <div className="bg-brand-surface p-6 rounded-[2.5rem] border border-brand-muted/10 flex flex-col items-center text-center group active:scale-[0.98] transition-all">
                        <div className="h-14 w-14 bg-brand-bg rounded-2xl flex items-center justify-center mb-4 shadow-inner ring-1 ring-brand-muted/10 group-hover:scale-110 transition-transform">
                            🌬️
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-brand-muted mb-1">Filtros de</span>
                        <span className="text-sm font-black">Aire</span>
                    </div>
                </div>

                {/* Brand Showcase Section */}
                <div className="mb-12">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-black tracking-tight italic uppercase">Destaque {activeBrand}</h2>
                        <div className="h-px flex-1 mx-4 bg-brand-muted/10"></div>
                    </div>

                    <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 pr-10">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="min-w-[70%] bg-brand-surface rounded-[2.5rem] p-6 border border-brand-muted/10 shadow-xl shadow-brand-bg/10 relative overflow-hidden group">
                                <div className="relative z-10 flex flex-col h-full">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="bg-brand-bg px-3 py-1 rounded-full text-[9px] font-black text-brand-primary uppercase border border-brand-muted/20">
                                            Stock Disponible
                                        </div>
                                        <span className="text-sm font-black text-brand-primary">S/ 45.00</span>
                                    </div>
                                    <div className="h-32 w-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500">
                                        <div className={`h-24 w-24 rounded-full ${activeBrand === 'wix' ? 'bg-black' : 'bg-white shadow-xl'} flex items-center justify-center border border-brand-muted/10`}>
                                            <span className="text-xs font-black">BOX</span>
                                        </div>
                                    </div>
                                    <h3 className="text-sm font-black mb-1">FILTRO {activeBrand.toUpperCase()} {i}500S</h3>
                                    <p className="text-[10px] text-brand-muted uppercase font-bold">Equivalencia: PH2870A</p>
                                </div>
                                <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-brand-primary/5 rounded-full blur-2xl"></div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Features Bar */}
                <div className="grid grid-cols-3 gap-6 py-8 border-y border-brand-muted/10 mb-12">
                    <div className="flex flex-col items-center text-center gap-2">
                        <TruckIcon className="h-5 w-5 text-brand-primary" />
                        <span className="text-[8px] font-black uppercase tracking-tighter text-brand-muted leading-tight">Envíos a todo el país</span>
                    </div>
                    <div className="flex flex-col items-center text-center gap-2">
                        <TagIcon className="h-5 w-5 text-brand-primary" />
                        <span className="text-[8px] font-black uppercase tracking-tighter text-brand-muted leading-tight">Precios de Mayorista</span>
                    </div>
                    <div className="flex flex-col items-center text-center gap-2">
                        <ShieldCheckIcon className="h-5 w-5 text-brand-primary" />
                        <span className="text-[8px] font-black uppercase tracking-tighter text-brand-muted leading-tight">Garantía Asegurada</span>
                    </div>
                </div>

                {/* Login Redirect Section */}
                <div className="bg-brand-primary p-8 rounded-[3rem] text-brand-bg flex flex-col items-center text-center shadow-2xl shadow-brand-primary/20 mb-10">
                    <h3 className="text-xl font-black mb-2">¿Ya eres cliente?</h3>
                    <p className="text-[11px] font-bold opacity-80 mb-6 max-w-[80%] uppercase tracking-widest">
                        Accede a tu historial, recompensas y descuentos especiales.
                    </p>
                    <Link to="/login" className="w-full bg-brand-bg text-brand-primary py-4 rounded-2xl text-xs font-black uppercase tracking-widest active:scale-95 transition-all">
                        Iniciar Sesión Ahora
                    </Link>
                </div>
            </main>
        </div>
    );
};

export default PublicHomePage;
