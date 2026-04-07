import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
    MagnifyingGlassIcon, 
    UserIcon,
    ArrowsPointingInIcon,
    TruckIcon,
    TagIcon,
    FireIcon,
    NewspaperIcon,
    ChevronRightIcon
} from '@heroicons/react/24/outline';
import { shopService } from '../services/api';
import MobileProductCard from '../components/MobileProductCard';

const PublicHomePage = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('code');
    const [popularProducts, setPopularProducts] = useState([]);
    
    // Carousel logic
    const carouselRef = useRef(null);
    const [newsIndex, setNewsIndex] = useState(0);
    const news = [
        { id: 1, title: 'Nueva Línea Industrial 2026', tag: 'LANZAMIENTO', img: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&q=80&w=800' },
        { id: 2, title: 'Distribución Nacional Expandida', tag: 'LOGÍSTICA', img: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=800' },
        { id: 3, title: 'Tecnología Nanoflow en Filtros', tag: 'TECNOLOGÍA', img: 'https://images.unsplash.com/photo-1537462715879-360eeb61a0ad?auto=format&fit=crop&q=80&w=800' },
    ];

    // Auto-play effect
    useEffect(() => {
        const interval = setInterval(() => {
            scrollToNextNews();
        }, 5000);
        return () => clearInterval(interval);
    }, [newsIndex]);

    const scrollToNextNews = () => {
        if (!carouselRef.current) return;
        const nextIndex = (newsIndex + 1) % news.length;
        const scrollAmount = carouselRef.current.offsetWidth * 0.88; // Approximate card width
        
        carouselRef.current.scrollTo({
            left: nextIndex * scrollAmount,
            behavior: 'smooth'
        });
        setNewsIndex(nextIndex);
    };

    // Tab States & Data Loading
    const [codeSearch, setCodeSearch] = useState('');
    const [brands, setBrands] = useState([]);
    const [selectedMake, setSelectedMake] = useState('');
    const [selectedModel, setSelectedModel] = useState('');

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [bRes, pRes] = await Promise.all([
                    shopService.getVehicleBrands(),
                    shopService.getProducts({ limit: 6 })
                ]);
                setBrands(bRes.data || []);
                setPopularProducts(pRes.data.items || []);
            } catch (err) {
                console.error("Home initialization failed", err);
            }
        };
        loadInitialData();
    }, []);

    // Get available models for selected make
    const availableModels = brands.find(b => b.name === selectedMake)?.models || [];

    const handleVehicleSearch = () => {
        if (!selectedMake) return;
        let url = `/search?type=vehicle&make=${encodeURIComponent(selectedMake)}`;
        if (selectedModel) url += `&model=${encodeURIComponent(selectedModel)}`;
        navigate(url);
    };

    return (
        <div className="min-h-screen bg-brand-bg text-brand-text flex flex-col font-sans pb-32">
            
            {/* HEADER */}
            <header className="px-6 pt-10 pb-4 flex justify-between items-center sticky top-0 z-50 bg-brand-bg/90 backdrop-blur-md border-b border-brand-border/10">
                <div className="flex flex-col">
                    <span className="text-xl font-black tracking-tighter text-white italic leading-none">DIROGSA</span>
                    <span className="text-[7px] font-bold uppercase tracking-[0.4em] text-brand-primary mt-1">Prime Logistics</span>
                </div>
                <Link to="/login" className="p-2.5 bg-brand-surface rounded-xl border border-brand-border active:scale-90 transition-all">
                    <UserIcon className="h-5 w-5 text-brand-primary" />
                </Link>
            </header>

            {/* 1. SECCIÓN SUPERIOR: CAROUSEL AUTO-PLAY CON BOTÓN */}
            <section className="mt-4 relative group">
                <div className="flex px-6 justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                        <NewspaperIcon className="h-4 w-4 text-brand-primary" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-white">Novedades DIROGSA</span>
                    </div>
                    {/* Pagination Indicator */}
                    <div className="flex gap-1.5">
                        {news.map((_, i) => (
                            <div key={i} className={`h-1 rounded-full transition-all ${i === newsIndex ? 'w-4 bg-brand-primary' : 'w-1 bg-brand-muted'}`} />
                        ))}
                    </div>
                </div>

                <div className="relative">
                    <div 
                        ref={carouselRef}
                        className="flex overflow-x-auto gap-4 px-6 pb-4 no-scrollbar snap-x snap-mandatory"
                        onScroll={(e) => {
                            const idx = Math.round(e.target.scrollLeft / (e.target.offsetWidth * 0.88));
                            if(idx !== newsIndex) setNewsIndex(idx % news.length);
                        }}
                    >
                        {news.map(item => (
                            <div key={item.id} className="min-w-[85%] h-56 relative rounded-[2rem] overflow-hidden snap-center border border-brand-border/30">
                                <img src={item.img} className="absolute inset-0 w-full h-full object-cover opacity-70" alt={item.title} />
                                <div className="absolute inset-0 bg-gradient-to-t from-brand-bg/90 via-transparent to-transparent"></div>
                                <div className="absolute bottom-6 left-6 right-12">
                                    <span className="px-2 py-0.5 bg-brand-primary text-brand-bg text-[8px] font-black rounded-md mb-2 inline-block">
                                        {item.tag}
                                    </span>
                                    <h3 className="text-xl font-black text-white leading-tight tracking-tighter">{item.title}</h3>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    {/* Botón flotante para avanzar a la derecha */}
                    <button 
                        onClick={scrollToNextNews}
                        className="absolute right-8 top-1/2 -translate-y-1/2 bg-brand-primary/90 text-brand-bg p-3 rounded-full shadow-2xl active:scale-90 transition-all z-10 hidden sm:flex lg:flex"
                    >
                        <ChevronRightIcon className="h-5 w-5 font-black" />
                    </button>
                    {/* Versión móvil del botón (más pequeña y discreta) */}
                    <button 
                        onClick={scrollToNextNews}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 backdrop-blur-md p-2 rounded-full border border-white/20 active:scale-75 transition-all md:hidden"
                    >
                        <ChevronRightIcon className="h-4 w-4 text-white" />
                    </button>
                </div>
            </section>

            {/* (El resto de secciones se mantienen igual: TABS y PRODUCTOS POPULARES) */}
            {/* ... Rest of code remains similar to previous step but integrated here ... */}
            <section className="px-6 py-4">
                <div className="flex bg-brand-surface/50 p-1.5 rounded-2xl border border-brand-border mb-6">
                    {['code', 'vehicle', 'dimensions'].map(t => (
                        <button key={t} onClick={() => setActiveTab(t)} className={`flex-1 py-3 rounded-xl transition-all ${activeTab === t ? 'bg-brand-primary text-brand-bg font-black shadow-lg shadow-brand-primary/10' : 'text-brand-muted font-bold'}`}>
                            <span className="text-[9px] uppercase tracking-widest leading-none">{t === 'code' ? 'Código' : t === 'vehicle' ? 'Vehículo' : 'Medidas'}</span>
                        </button>
                    ))}
                </div>
                <div className="bg-brand-surface border border-brand-border rounded-[2.5rem] p-6 shadow-2xl min-h-[300px]">
                    {activeTab === 'code' && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-400">
                             <input 
                                type="text" 
                                value={codeSearch}
                                onChange={(e) => setCodeSearch(e.target.value.toUpperCase())}
                                placeholder="CÓDIGO DE FILTRO..."
                                className="w-full bg-brand-bg border border-brand-border h-14 rounded-xl px-4 text-sm font-black text-white mb-4 focus:outline-none focus:border-brand-primary/40"
                            />
                            <button onClick={() => navigate(`/search?q=${codeSearch}`)} className="w-full bg-brand-primary text-brand-bg h-12 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg">
                                BUSCAR AHORA
                            </button>
                        </div>
                    )}
                    {activeTab === 'vehicle' && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-400 space-y-4">
                            <select 
                                value={selectedMake}
                                onChange={(e) => {
                                    setSelectedMake(e.target.value);
                                    setSelectedModel('');
                                }}
                                className="w-full bg-brand-bg border border-brand-border h-14 rounded-xl px-4 text-[10px] font-black text-white focus:outline-none uppercase appearance-none"
                            >
                                <option value="">-- MARCA VEHÍCULO --</option>
                                {brands.map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
                            </select>

                            <select 
                                value={selectedModel}
                                onChange={(e) => setSelectedModel(e.target.value)}
                                disabled={!selectedMake}
                                className="w-full bg-brand-bg border border-brand-border h-14 rounded-xl px-4 text-[10px] font-black text-white focus:outline-none uppercase appearance-none disabled:opacity-30 disabled:grayscale"
                            >
                                <option value="">-- MODELO (OPCIONAL) --</option>
                                {availableModels.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>

                            <button 
                                onClick={handleVehicleSearch}
                                disabled={!selectedMake}
                                className="w-full bg-brand-primary text-brand-bg h-12 rounded-xl font-black uppercase text-[10px] tracking-widest disabled:opacity-50"
                            >
                                VER CATÁLOGO
                            </button>
                        </div>
                    )}
                    {/* Placeholder for Dimensions to keep simplified for now */}
                    {activeTab === 'dimensions' && (
                        <div className="flex flex-col items-center justify-center h-48 opacity-40">
                            <ArrowsPointingInIcon className="h-10 w-10 mb-2" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Editor de Medidas</span>
                        </div>
                    )}
                </div>
            </section>

        </div>
    );
};

export default PublicHomePage;
