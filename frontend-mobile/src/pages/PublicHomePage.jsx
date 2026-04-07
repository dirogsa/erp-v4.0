import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
    MagnifyingGlassIcon, 
    UserIcon,
    ChevronRightIcon,
    Bars3Icon,
    ArrowsPointingInIcon,
    Squares2X2Icon
} from '@heroicons/react/24/outline';
import { shopService } from '../services/api';

const PublicHomePage = () => {
    const navigate = useNavigate();
    const [codeSearch, setCodeSearch] = useState('');
    
    // Section 02 - Vehicles (Synchronized)
    const [vehiclesData, setVehiclesData] = useState([]); // Array of {make, models}
    const [selectedMake, setSelectedMake] = useState('');
    const [selectedModel, setSelectedModel] = useState('');
    
    // Section 03 - Measurements (Standard A-H labels)
    const [specs, setSpecs] = useState({
        a: '', b: '', c: '', d: '', e: '', f: '', g: '', h: ''
    });
    const [forma, setForma] = useState('');

    useEffect(() => {
        const loadVehicles = async () => {
            try {
                // This connects directly to your ERP master product list
                const res = await shopService.getSynchronizedVehicles();
                setVehiclesData(res.data || []);
            } catch (err) {
                console.error("Master list synchronization failed", err);
            }
        };
        loadVehicles();
    }, []);

    const handleCodeSearch = (e) => {
        if (e.key === 'Enter' || e.type === 'click') {
            if (codeSearch.trim()) navigate(`/search?q=${encodeURIComponent(codeSearch)}`);
        }
    };

    const handleVehicleSearch = () => {
        const query = selectedModel === 'TODOS' ? selectedMake : `${selectedMake} ${selectedModel}`;
        navigate(`/catalog?brand=${selectedMake}&model=${selectedModel}`);
    };

    const handleSpecChange = (key, value) => {
        setSpecs(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className="min-h-screen brand-transition bg-brand-bg text-brand-text flex flex-col font-sans">
            {/* Header DIROGSA */}
            <header className="px-6 pt-10 pb-4 flex justify-between items-center bg-brand-bg/80 backdrop-blur-md sticky top-0 z-50 border-b border-brand-border/30">
                <div className="flex flex-col">
                    <span className="text-xl font-black tracking-tighter text-white italic">DIROGSA</span>
                    <span className="text-[7px] font-bold uppercase tracking-[0.3em] text-brand-primary">Terminal de Filtración</span>
                </div>
                <Link to="/login" className="p-2.5 bg-brand-surface rounded-xl border border-brand-border active:scale-90 transition-all">
                    <UserIcon className="h-5 w-5 text-brand-primary" />
                </Link>
            </header>

            <main className="px-6 py-6 pb-20 space-y-10">
                
                {/* 01. BÚSQUEDA POR CÓDIGO - IMPROVED FOR SMALL SCREENS */}
                <section>
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-[10px] font-black text-brand-primary uppercase tracking-[0.2em]">01. Código / Equivalencia</span>
                    </div>
                    <div className="space-y-3">
                        <div className="relative">
                            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-brand-muted" />
                            <input 
                                type="text" 
                                value={codeSearch}
                                onChange={(e) => setCodeSearch(e.target.value)}
                                onKeyDown={handleCodeSearch}
                                placeholder="DIGITE CÓDIGO DIRECTO..."
                                className="w-full bg-brand-surface h-14 pl-12 pr-6 rounded-xl border border-brand-border focus:border-brand-primary/50 text-base font-black tracking-tighter placeholder:text-brand-muted/20 focus:outline-none shadow-sm"
                            />
                        </div>
                        <button 
                            onClick={handleCodeSearch}
                            className="w-full bg-brand-primary h-12 rounded-xl text-[10px] font-black uppercase text-brand-bg active:scale-95 transition-all shadow-lg"
                        >
                            BUSCAR POR CÓDIGO
                        </button>
                    </div>
                </section>

                {/* 02. CATÁLOGO VEHICULAR - MASTER LIST SYNC */}
                <section>
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-[10px] font-black text-brand-primary uppercase tracking-[0.2em]">02. Marca y Modelo</span>
                    </div>
                    <div className="bg-brand-surface/50 border border-brand-border p-5 rounded-2xl space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                            <select 
                                value={selectedMake}
                                onChange={(e) => { setSelectedMake(e.target.value); setSelectedModel(''); }}
                                className="bg-brand-bg h-14 rounded-xl border border-brand-border text-xs font-black px-4 uppercase text-white appearance-none focus:outline-none focus:border-brand-primary/50"
                            >
                                <option value="">-- SELECCIONE MARCA --</option>
                                {vehiclesData.map(v => (
                                    <option key={v.make} value={v.make}>{v.make}</option>
                                ))}
                            </select>
                            
                            <select 
                                value={selectedModel}
                                disabled={!selectedMake}
                                onChange={(e) => setSelectedModel(e.target.value)}
                                className={`bg-brand-bg h-14 rounded-xl border border-brand-border text-xs font-black px-4 uppercase text-white appearance-none focus:outline-none focus:border-brand-primary/50 ${!selectedMake && 'opacity-30'}`}
                            >
                                <option value="">-- SELECCIONE MODELO --</option>
                                {selectedMake && (
                                    <>
                                        <option value="TODOS">- TODOS LOS MODELOS -</option>
                                        {vehiclesData.find(v => v.make === selectedMake)?.models.map(m => (
                                            <option key={m} value={m}>{m}</option>
                                        ))}
                                    </>
                                )}
                            </select>
                        </div>
                        <button 
                            disabled={!selectedMake || !selectedModel}
                            onClick={handleVehicleSearch}
                            className="w-full bg-brand-surface border-2 border-brand-primary h-12 rounded-xl text-[10px] font-black uppercase text-brand-primary active:scale-95 transition-all disabled:opacity-20"
                        >
                            IDENTIFICAR POR VEHÍCULO
                        </button>
                    </div>
                </section>

                {/* 03. BÚSQUEDA TÉCNICA - A TO H LABELS */}
                <section>
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-[10px] font-black text-brand-primary uppercase tracking-[0.2em]">03. Medidas Técnicas (A-H)</span>
                    </div>
                    <div className="bg-brand-surface border border-brand-border p-5 rounded-2xl shadow-xl">
                        <div className="grid grid-cols-4 gap-3 mb-5">
                            {['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map(letter => (
                                <div key={letter} className="flex flex-col gap-1.5">
                                    <label className="text-[9px] font-black text-brand-muted uppercase text-center">{letter}</label>
                                    <input 
                                        type="text" 
                                        value={specs[letter]}
                                        onChange={(e) => handleSpecChange(letter, e.target.value)}
                                        placeholder="0"
                                        className="bg-brand-bg h-10 rounded-lg text-center font-black text-xs text-brand-primary border border-brand-border focus:outline-none focus:border-brand-primary/40 shadow-inner"
                                    />
                                </div>
                            ))}
                        </div>
                        
                        <div className="mb-5 px-1">
                            <label className="text-[9px] font-black text-brand-muted uppercase tracking-widest mb-1.5 block italic">Forma (Opcional)</label>
                            <select 
                                value={forma}
                                onChange={(e) => setForma(e.target.value)}
                                className="w-full bg-brand-bg h-12 rounded-xl border border-brand-border text-[10px] font-black px-4 uppercase text-brand-primary appearance-none focus:outline-none"
                            >
                                <option value="">-- CUALQUIER FORMA --</option>
                                <option value="REDONDO">REDONDO/CILÍNDRICO</option>
                                <option value="PANEL">PANEL / RECTANGULAR</option>
                                <option value="OVALADO">OVALADO</option>
                                <option value="ESPECIAL">FORMA ESPECIAL</option>
                            </select>
                        </div>

                        <button 
                            onClick={() => navigate('/search?type=dimensions')}
                            className="w-full bg-brand-primary h-12 rounded-xl text-[10px] font-black uppercase text-brand-bg active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            <ArrowsPointingInIcon className="h-4 w-4" />
                            BUSCAR POR MEDIDAS
                        </button>
                    </div>
                </section>

            </main>

            <footer className="px-8 py-10 flex flex-col items-center gap-2 opacity-20 mt-auto">
                <span className="text-[8px] font-black uppercase tracking-widest">Dirogsa v4.0</span>
                <div className="h-px w-20 bg-brand-muted"></div>
                <span className="text-[7px] font-black uppercase tracking-[0.4em]">Engineered for Excellence</span>
            </footer>
        </div>
    );
};

export default PublicHomePage;
