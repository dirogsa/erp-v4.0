import React, { useState, useEffect } from 'react';

const SystemLoader = ({ message = "Despertando Sistemas" }) => {
    const [progress, setProgress] = useState(0);
    const [statusIndex, setStatusIndex] = useState(0);

    const statuses = [
        "Estableciendo Conexión Segura...",
        "Sincronizando Base de Datos Central...",
        "Validando Protocolos Industriales...",
        "Cargando Módulos de Inventario...",
        "Preparando Terminal de Consulta..."
    ];

    useEffect(() => {
        const progressTimer = setInterval(() => {
            setProgress(prev => (prev < 90 ? prev + (90 - prev) * 0.1 : prev));
        }, 800);

        const statusTimer = setInterval(() => {
            setStatusIndex(prev => (prev + 1) % statuses.length);
        }, 2500);

        return () => {
            clearInterval(progressTimer);
            clearInterval(statusTimer);
        };
    }, []);

    return (
        <div className="fixed inset-0 z-[9999] bg-brand-bg flex flex-col items-center justify-center p-8 text-center overflow-hidden">
            {/* Industrial Background Pulse */}
            <div className="absolute inset-0 bg-brand-primary/5 animate-pulse"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-primary/10 rounded-full blur-[120px] pointer-events-none"></div>

            {/* Logo/Icon Animation */}
            <div className="relative mb-12">
                <div className="h-24 w-24 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-12 w-12 bg-brand-surface border border-brand-border rounded-2xl flex items-center justify-center shadow-2xl">
                        <span className="text-brand-primary font-black text-xl">D</span>
                    </div>
                </div>
            </div>

            {/* Text Context */}
            <div className="space-y-4 max-w-xs relative z-10">
                <h2 className="text-white font-black text-2xl uppercase tracking-tighter leading-tight animate-in fade-in slide-in-from-bottom-2 duration-700">
                    DIROGSA TECH
                </h2>
                <div className="h-6">
                    <p key={statusIndex} className="text-brand-primary font-black text-[10px] uppercase tracking-[0.3em] animate-in slide-in-from-right fade-in duration-500">
                        {statuses[statusIndex]}
                    </p>
                </div>
                
                <p className="text-brand-text-dim text-[11px] leading-relaxed mt-8 font-medium">
                    Iniciando sistemas de alta disponibilidad. Por favor, espere mientras establecemos el enlace con nuestra central de datos.
                </p>
            </div>

            {/* Progress Bar (Industrial Style) */}
            <div className="absolute bottom-20 left-10 right-10">
                <div className="flex justify-between items-end mb-2">
                    <span className="text-[9px] font-black text-brand-primary uppercase tracking-widest">System Boot</span>
                    <span className="text-brand-xs font-black text-white">{Math.round(progress)}%</span>
                </div>
                <div className="h-1.5 w-full bg-brand-surface border border-white/5 rounded-full overflow-hidden shadow-inner">
                    <div 
                        className="h-full bg-gradient-to-r from-brand-primary to-emerald-400 transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
            </div>

            {/* Decorative Grid */}
            <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-brand-primary/5 to-transparent pointer-events-none"></div>
        </div>
    );
};

export default SystemLoader;
