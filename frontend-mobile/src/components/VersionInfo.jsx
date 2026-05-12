import React, { useState, useEffect } from 'react';
import { ArrowPathIcon, CheckBadgeIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { useRegisterSW } from 'virtual:pwa-register/react';

const VersionInfo = ({ className = "" }) => {
    const version = "0.1.0"; // Sincronizado con package.json
    const {
        needUpdate: [needUpdate, setNeedUpdate],
        updateServiceWorker,
    } = useRegisterSW();

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
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all cursor-pointer active:scale-95 ${
                needUpdate 
                ? 'bg-blue-500/10 border-blue-500/30 text-blue-400 animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.3)]' 
                : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'
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
