import React, { useState, useEffect } from 'react';
import { ArrowPathIcon, CheckBadgeIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { useRegisterSW } from 'virtual:pwa-register/react';
import axios from 'axios';

const VersionInfo = ({ className = "" }) => {
    const sw = useRegisterSW();
    
    const [swNeedUpdate, setSwNeedUpdate] = Array.isArray(sw?.needUpdate) 
        ? sw.needUpdate 
        : [false, () => {}];
        
    const updateServiceWorker = typeof sw?.updateServiceWorker === 'function' 
        ? sw.updateServiceWorker 
        : () => {};

    const [isChecking, setIsChecking] = useState(false);
    const [serverVersion, setServerVersion] = useState("...");

    useEffect(() => {
        // Consultar la versión oficial del sistema desde el Backend (Global Governance)
        const checkServerVersion = async () => {
            try {
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
                const response = await axios.get(`${apiUrl}/system/version`);
                if (response.data && response.data.version) {
                    // Remover 'v' duplicadas si las hay
                    setServerVersion(response.data.version.replace(/^v/, ''));
                }
            } catch (error) {
                console.error("Failed to fetch system version", error);
            }
        };
        checkServerVersion();
    }, []);

    const handleUpdate = () => {
        if (swNeedUpdate) {
            updateServiceWorker(true);
        } else {
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
                swNeedUpdate 
                ? 'bg-blue-600/20 border-blue-500/50 text-blue-400 animate-pulse shadow-[0_0_15px_rgba(59,130,246,0.4)]' 
                : 'bg-white/10 border-white/20 text-white/70 hover:bg-white/20'
            } ${className}`}
            title={`Plataforma ERP v${serverVersion}`}
        >
            {isChecking ? (
                <ArrowPathIcon className="h-3 w-3 animate-spin" />
            ) : swNeedUpdate ? (
                <SparklesIcon className="h-3 w-3" />
            ) : (
                <CheckBadgeIcon className="h-3 w-3" />
            )}
            
            <span className="text-[10px] font-black uppercase tracking-widest">
                {swNeedUpdate ? `Actualizar App` : `v${serverVersion}`}
            </span>
        </div>
    );
};

export default VersionInfo;
