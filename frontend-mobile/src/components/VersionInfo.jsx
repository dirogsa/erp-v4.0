import React, { useState, useEffect } from 'react';
import { ArrowPathIcon, CheckBadgeIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { useRegisterSW } from 'virtual:pwa-register/react';
import axios from 'axios';

// La versión con la que se compiló este frontend.
const LOCAL_VERSION = "0.1.1";

const VersionInfo = ({ className = "" }) => {
    const sw = useRegisterSW();
    
    const [swNeedUpdate, setSwNeedUpdate] = Array.isArray(sw?.needUpdate) 
        ? sw.needUpdate 
        : [false, () => {}];
        
    const updateServiceWorker = typeof sw?.updateServiceWorker === 'function' 
        ? sw.updateServiceWorker 
        : () => {};

    const [isChecking, setIsChecking] = useState(false);
    const [serverVersion, setServerVersion] = useState(LOCAL_VERSION);
    
    // El sistema necesita actualizarse si el SW lo dice, o si la versión del backend difiere.
    const hasServerUpdate = serverVersion !== LOCAL_VERSION;
    const needUpdate = swNeedUpdate || hasServerUpdate;

    useEffect(() => {
        // Consultar silenciosamente al backend al iniciar la app (Global Governance)
        const checkServerVersion = async () => {
            try {
                // Usamos la variable de entorno o una url relativa (dependiendo de la configuración del proyecto)
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
                const response = await axios.get(`${apiUrl}/system/version`);
                if (response.data && response.data.version) {
                    setServerVersion(response.data.version.replace('v', ''));
                }
            } catch (error) {
                console.error("Failed to fetch system version", error);
            }
        };
        checkServerVersion();
        
        // Opcional: Podríamos hacer polling cada X horas
        // const interval = setInterval(checkServerVersion, 3600000);
        // return () => clearInterval(interval);
    }, []);

    const handleUpdate = () => {
        if (swNeedUpdate) {
            updateServiceWorker(true);
        } else if (hasServerUpdate) {
            // Si el backend se actualizó pero el SW aún no lo pilla, forzamos la recarga de página
            window.location.reload(true);
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
                needUpdate 
                ? 'bg-blue-600/20 border-blue-500/50 text-blue-400 animate-pulse shadow-[0_0_15px_rgba(59,130,246,0.4)]' 
                : 'bg-white/10 border-white/20 text-white/70 hover:bg-white/20'
            } ${className}`}
            title={`Local: v${LOCAL_VERSION} | Servidor: v${serverVersion}`}
        >
            {isChecking ? (
                <ArrowPathIcon className="h-3 w-3 animate-spin" />
            ) : needUpdate ? (
                <SparklesIcon className="h-3 w-3" />
            ) : (
                <CheckBadgeIcon className="h-3 w-3" />
            )}
            
            <span className="text-[10px] font-black uppercase tracking-widest">
                {needUpdate ? `Actualizar v${serverVersion}` : `v${LOCAL_VERSION}`}
            </span>
        </div>
    );
};

export default VersionInfo;
