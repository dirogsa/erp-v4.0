import React, { useState, useEffect } from 'react';
import { ArrowPathIcon, CheckBadgeIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { useRegisterSW } from 'virtual:pwa-register/react';

const VersionInfo = ({ className = "" }) => {
    const version = "0.1.1"; // Versión de despliegue actual
    const sw = useRegisterSW();
    
    // Extracción soberana y segura
    const [needUpdate, setNeedUpdate] = Array.isArray(sw?.needUpdate) 
        ? sw.needUpdate 
        : [false, () => {}];
        
    const updateServiceWorker = typeof sw?.updateServiceWorker === 'function' 
        ? sw.updateServiceWorker 
        : () => {};

    const [isChecking, setIsChecking] = useState(false);

    const handleUpdate = () => {
        if (needUpdate) {
            updateServiceWorker(true);
        } else {
            // Simular búsqueda de actualización si no hay una detectada por SW
            setIsChecking(true);
            setTimeout(() => {
                setIsChecking(false);
            }, 2000);
        }
    };

    return (
        <div 
            onClick={handleUpdate}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all cursor-pointer active:scale-95 ${
                needUpdate 
                ? 'bg-blue-600/20 border-blue-500/50 text-blue-400 animate-pulse shadow-[0_0_15px_rgba(59,130,246,0.4)]' 
                : 'bg-white/10 border-white/20 text-white/70 hover:bg-white/20'
            } ${className}`}
        >
            {isChecking ? (
                <ArrowPathIcon className="h-3 w-3 animate-spin" />
            ) : needUpdate ? (
                <SparklesIcon className="h-3 w-3" />
            ) : (
                <CheckBadgeIcon className="h-3 w-3" />
            )}
            
            <span className="text-[10px] font-black uppercase tracking-widest">
                {needUpdate ? 'Actualizar v' : 'v'}{version}
            </span>
        </div>
    );
};

export default VersionInfo;
