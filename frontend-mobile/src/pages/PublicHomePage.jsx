import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    MagnifyingGlassIcon,
    UserIcon,
    ArrowsPointingInIcon,
    TruckIcon,
    TagIcon,
    ChevronRightIcon,
    BoltIcon,
    ShieldCheckIcon,
    CpuChipIcon,
    ChartBarIcon,
} from '@heroicons/react/24/outline';
import { shopService } from '../services/api';
import MobileProductCard from '../components/MobileProductCard';

/* ─── Micro-component: Animated status dot ─── */
const LiveDot = () => (
    <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-primary"></span>
    </span>
);

/* ─── Stat badge ─── */
const StatBadge = ({ value, label, color = 'text-brand-primary' }) => (
    <div className="flex flex-col items-center">
        <span className={`text-lg font-black leading-none ${color}`}>{value}</span>
        <span className="text-[8px] text-brand-muted uppercase tracking-widest font-bold mt-0.5 whitespace-nowrap">{label}</span>
    </div>
);

const PublicHomePage = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('code');
    const [popularProducts, setPopularProducts] = useState([]);

    // Carousel
    const carouselRef = useRef(null);
    const [newsIndex, setNewsIndex] = useState(0);
    const news = [
        {
            id: 1,
            title: 'Nueva Línea Industrial Premium 2026',
            tag: 'LANZAMIENTO',
            sub: 'Filtros certificados ISO para flotas pesadas',
            img: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&q=80&w=800',
            accent: '#6EE7B7'
        },
        {
            id: 2,
            title: 'Distribución Nacional Expandida',
            tag: 'LOGÍSTICA',
            sub: 'Cobertura en Lima, Arequipa y Trujillo',
            img: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=800',
            accent: '#38BDF8'
        },
        {
            id: 3,
            title: 'Tecnología Nanoflow en Filtros',
            tag: 'TECNOLOGÍA',
            sub: 'Eficiencia de filtrado superior al 99.7%',
            img: 'https://images.unsplash.com/photo-1537462715879-360eeb61a0ad?auto=format&fit=crop&q=80&w=800',
            accent: '#FB923C'
        },
    ];

    useEffect(() => {
        const interval = setInterval(scrollToNextNews, 5000);
        return () => clearInterval(interval);
    }, [newsIndex]);

    const scrollToNextNews = () => {
        if (!carouselRef.current) return;
        const nextIndex = (newsIndex + 1) % news.length;
        carouselRef.current.scrollTo({
            left: nextIndex * carouselRef.current.offsetWidth,
            behavior: 'smooth'
        });
        setNewsIndex(nextIndex);
    };

    // Search state
    const [codeSearch, setCodeSearch] = useState('');
    const [brands, setBrands] = useState([]);
    const [selectedMake, setSelectedMake] = useState('');
    const [selectedModel, setSelectedModel] = useState('');

    useEffect(() => {
        const load = async () => {
            try {
                const [bRes, pRes] = await Promise.all([
                    shopService.getVehicleBrands(),
                    shopService.getProducts({ limit: 6 })
                ]);
                setBrands(bRes.data || []);
                setPopularProducts(pRes.data.items || []);
            } catch (err) {
                console.error(err);
            }
        };
        load();
    }, []);

    const availableModels = brands.find(b => b.name === selectedMake)?.models || [];

    const handleVehicleSearch = () => {
        if (!selectedMake) return;
        let url = `/search?type=vehicle&make=${encodeURIComponent(selectedMake)}`;
        if (selectedModel) url += `&model=${encodeURIComponent(selectedModel)}`;
        navigate(url);
    };

    const tabs = [
        { id: 'code',       label: 'Código',   icon: <TagIcon className="h-3.5 w-3.5" />,                color: '#6EE7B7', glow: 'rgba(110,231,183,0.08)' },
        { id: 'vehicle',    label: 'Vehículo',  icon: <TruckIcon className="h-3.5 w-3.5" />,              color: '#38BDF8', glow: 'rgba(56,189,248,0.08)' },
        { id: 'dimensions', label: 'Medidas',   icon: <ArrowsPointingInIcon className="h-3.5 w-3.5" />,   color: '#FB923C', glow: 'rgba(251,146,60,0.08)' },
    ];

    return (
        <div className="min-h-screen bg-brand-bg text-brand-text flex flex-col font-sans pb-32 relative">

            {/* ── Background ambient glows ── */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-brand-primary/5 blur-[100px]" />
                <div className="absolute top-1/3 -right-20 w-64 h-64 rounded-full bg-brand-accent/5 blur-[80px]" />
                <div className="absolute bottom-1/4 left-1/3 w-48 h-48 rounded-full bg-brand-primary/3 blur-[60px]" />
            </div>

            {/* ── HEADER (Top Bar) ── */}
            <header className="px-5 pt-12 pb-4 flex justify-between items-center sticky top-0 z-50 bg-brand-bg/80 backdrop-blur-xl">
                <div className="flex items-center gap-3">
                    <div className="relative h-9 w-9 flex items-center justify-center">
                        <div className="absolute inset-0 rounded-xl bg-brand-primary/10 border border-brand-primary/20" />
                        <CpuChipIcon className="h-5 w-5 text-brand-primary relative z-10" />
                    </div>
                    <div>
                        <span className="text-lg font-black tracking-tight text-white leading-none">DIROGSA</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <LiveDot />
                            <span className="text-[9px] font-bold uppercase tracking-wider text-brand-primary leading-none whitespace-nowrap">
                                Importador y Distribuidor Oficial de Filtros para Carga Ligera
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => navigate('/search')}
                        className="p-2.5 rounded-xl border border-brand-border-2 bg-brand-surface active:scale-90 transition-all"
                        style={{ background: 'var(--brand-surface-2)' }}
                    >
                        <MagnifyingGlassIcon className="h-4.5 w-4.5 text-brand-text-2" style={{ height: '18px', width: '18px' }} />
                    </button>
                    <Link to="/login"
                        className="p-2.5 rounded-xl border border-brand-primary/30 active:scale-90 transition-all"
                        style={{ background: 'var(--brand-primary-dim)' }}
                    >
                        <UserIcon className="h-4.5 w-4.5 text-brand-primary" style={{ height: '18px', width: '18px' }} />
                    </Link>
                </div>
            </header>



            {/* ── NEWS CAROUSEL ── */}
            <section className="pb-4 pt-4">
                <div className="flex px-5 justify-between items-center mb-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-brand-text-2">
                        Novedades
                    </span>
                    <div className="flex gap-1.5">
                        {news.map((_, i) => (
                            <div key={i}
                                className="rounded-full transition-all duration-300"
                                style={{
                                    height: '4px',
                                    width: i === newsIndex ? '16px' : '4px',
                                    background: i === newsIndex ? '#6EE7B7' : 'var(--brand-border-2)'
                                }}
                            />
                        ))}
                    </div>
                </div>

                <div
                    ref={carouselRef}
                    className="flex overflow-x-auto gap-3 px-5 pb-4 no-scrollbar snap-x snap-mandatory"
                    onScroll={(e) => {
                        const idx = Math.round(e.target.scrollLeft / e.target.offsetWidth);
                        if (idx !== newsIndex) setNewsIndex(idx % news.length);
                    }}
                >
                    {news.map(item => (
                        <div key={item.id}
                            className="min-w-[88vw] h-52 relative rounded-3xl overflow-hidden snap-start flex-shrink-0"
                            style={{ border: `1px solid ${item.accent}22` }}
                        >
                            <img src={item.img} className="absolute inset-0 w-full h-full object-cover opacity-50" alt={item.title} />
                            <div className="absolute inset-0"
                                style={{ background: `linear-gradient(to top, #0D0E11 40%, transparent 100%)` }} />
                            <div className="absolute top-0 left-6 right-6 h-px" style={{ background: `linear-gradient(90deg, transparent, ${item.accent}60, transparent)` }} />
                            <div className="absolute bottom-5 left-5 right-5">
                                <span className="inline-block px-2 py-0.5 rounded-md text-[7px] font-black uppercase tracking-widest mb-2"
                                    style={{ background: `${item.accent}20`, border: `1px solid ${item.accent}40`, color: item.accent }}>
                                    {item.tag}
                                </span>
                                <h3 className="text-lg font-black text-white leading-tight">{item.title}</h3>
                                <p className="text-[10px] mt-1" style={{ color: `${item.accent}bb` }}>{item.sub}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>


            {/* ── SEARCH ENGINE ── */}
            <section className="px-5 pb-6">
                {/* Tab selector */}
                <div className="flex gap-1 mb-4 p-1 rounded-2xl"
                    style={{ background: 'var(--brand-surface)', border: '1px solid var(--brand-border-2)' }}>
                    {tabs.map(t => {
                        const isActive = activeTab === t.id;
                        return (
                            <button
                                key={t.id}
                                onClick={() => setActiveTab(t.id)}
                                className="flex-1 py-3 rounded-xl transition-all duration-200 flex flex-col items-center justify-center gap-1"
                                style={isActive ? {
                                    background: `${t.color}18`,
                                    border: `1.5px solid ${t.color}55`,
                                    color: t.color,
                                    fontWeight: '800',
                                    boxShadow: `0 0 24px ${t.color}20`
                                } : {
                                    background: `${t.color}07`,
                                    border: `1.5px solid ${t.color}22`,
                                    color: `${t.color}99`,
                                    fontWeight: '600',
                                }}
                            >
                                <span style={{ color: isActive ? t.color : `${t.color}88` }}>{t.icon}</span>
                                <span className="text-[8px] uppercase tracking-widest">{t.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Search panel */}
                <div className="rounded-[1.75rem] p-5 relative overflow-hidden"
                    style={{
                        background: 'var(--brand-surface)',
                        border: `1.5px solid ${tabs.find(t => t.id === activeTab)?.color ?? '#6EE7B7'}28`,
                        boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
                        transition: 'border-color 0.3s'
                    }}>

                    {/* Panel ambient glow — colour matches active tab */}
                    <div className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl pointer-events-none"
                        style={{ background: tabs.find(t => t.id === activeTab)?.glow ?? 'rgba(110,231,183,0.06)', transition: 'background 0.3s' }} />

                    {/* ── CODE TAB ── */}
                    {activeTab === 'code' && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-3">
                            <label className="text-[9px] font-black uppercase tracking-widest" style={{ color: '#6EE7B7' }}>Código / Referencia del filtro</label>
                            <div className="relative">
                                <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#6EE7B7' }} />
                                <input
                                    type="text"
                                    value={codeSearch}
                                    onChange={(e) => setCodeSearch(e.target.value.toUpperCase())}
                                    onKeyDown={(e) => e.key === 'Enter' && navigate(`/search?q=${codeSearch}`)}
                                    placeholder="Ej: LF3970, P553004..."
                                    className="tech-input w-full h-14 rounded-xl pl-11 pr-4 text-sm font-bold tracking-widest"
                                    style={{ borderColor: 'rgba(110,231,183,0.25)' }}
                                />
                            </div>
                            <button
                                onClick={() => navigate(`/search?q=${codeSearch}`)}
                                disabled={!codeSearch}
                                className="w-full py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 disabled:opacity-30"
                                style={{ background: 'linear-gradient(135deg, #6EE7B7, #34d399)', color: '#0D0E11' }}
                            >
                                Buscar Filtro →
                            </button>
                        </div>
                    )}

                    {/* ── VEHICLE TAB ── */}
                    {activeTab === 'vehicle' && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-3">
                            <label className="text-[9px] font-black uppercase tracking-widest" style={{ color: '#38BDF8' }}>Selecciona tu vehículo</label>

                            <div className="relative">
                                <TruckIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: '#38BDF8' }} />
                                <select
                                    value={selectedMake}
                                    onChange={(e) => { setSelectedMake(e.target.value); setSelectedModel(''); }}
                                    className="tech-input w-full h-14 rounded-xl pl-11 pr-4 text-[11px] font-black appearance-none uppercase"
                                    style={{ borderColor: 'rgba(56,189,248,0.25)' }}
                                >
                                    <option value="">— MARCA DEL VEHÍCULO —</option>
                                    {brands.map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
                                </select>
                            </div>

                            <select
                                value={selectedModel}
                                onChange={(e) => setSelectedModel(e.target.value)}
                                disabled={!selectedMake}
                                className="tech-input w-full h-14 rounded-xl px-4 text-[11px] font-black appearance-none uppercase disabled:opacity-25"
                                style={{ borderColor: 'rgba(56,189,248,0.2)' }}
                            >
                                <option value="">— MODELO (OPCIONAL) —</option>
                                {availableModels.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>

                            <button
                                onClick={handleVehicleSearch}
                                disabled={!selectedMake}
                                className="w-full py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 disabled:opacity-30 flex items-center justify-center gap-2"
                                style={{ background: 'linear-gradient(135deg, #38BDF8, #0ea5e9)', color: '#0D0E11' }}
                            >
                                <TruckIcon className="h-4 w-4" /> Ver Filtros para este Vehículo
                            </button>
                        </div>
                    )}

                    {/* ── DIMENSIONS TAB ── */}
                    {activeTab === 'dimensions' && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-col items-center justify-center py-8 gap-4">
                            <div className="h-16 w-16 rounded-2xl flex items-center justify-center float-anim"
                                style={{ background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.2)' }}>
                                <ArrowsPointingInIcon className="h-8 w-8" style={{ color: '#FB923C' }} />
                            </div>
                            <div className="text-center">
                                <p className="text-[11px] font-black uppercase tracking-widest mb-1" style={{ color: '#FB923C' }}>Editor de Medidas</p>
                                <p className="text-[9px] text-brand-muted">Búsqueda por dimensiones — Próximamente</p>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* ── TRUST BADGES ── */}
            <section className="px-5 pb-6">
                <div className="grid grid-cols-3 gap-2">
                    {[
                        { icon: <ShieldCheckIcon className="h-5 w-5" />, label: 'Calidad Garantizada', color: '#6EE7B7' },
                        { icon: <BoltIcon className="h-5 w-5" />, label: 'Entrega Rápida', color: '#38BDF8' },
                        { icon: <ChartBarIcon className="h-5 w-5" />, label: 'Stock en Tiempo Real', color: '#FB923C' },
                    ].map((item, i) => (
                        <div key={i} className="flex flex-col items-center gap-2 py-4 rounded-2xl text-center"
                            style={{
                                background: `${item.color}08`,
                                border: `1px solid ${item.color}18`
                            }}>
                            <span style={{ color: item.color }}>{item.icon}</span>
                            <span className="text-[8px] font-black uppercase tracking-wide leading-tight" style={{ color: item.color }}>
                                {item.label}
                            </span>
                        </div>
                    ))}
                </div>
            </section>


            {/* ── CTA QUICK ACTIONS ── */}
            <div className="flex gap-2 px-5 pb-8">
                <button
                    onClick={() => navigate('/search')}
                    className="flex-1 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2 text-brand-bg bg-brand-primary"
                >
                    <MagnifyingGlassIcon className="h-4 w-4" /> Catálogo
                </button>
                <Link to="/cart"
                    className="flex-1 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center border border-brand-primary/20 text-brand-primary bg-brand-primary/5"
                >
                    Mi Carrito
                </Link>
            </div>
        </div>
    );
};

export default PublicHomePage;
