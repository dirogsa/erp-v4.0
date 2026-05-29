'use client';

import { useEffect, useState, useRef } from 'react';

export default function VersionWatcher() {
  const [hasUpdate, setHasUpdate] = useState(false);
  const currentVersion = useRef(null);

  useEffect(() => {
    let intervalId;

    const checkVersion = async () => {
      try {
        // Añadimos un timestamp a la petición para evitar caché del propio JSON
        const res = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        const serverVersion = data.version;

        if (!currentVersion.current) {
          // Primera carga, guardamos la versión actual
          currentVersion.current = serverVersion;
        } else if (currentVersion.current !== serverVersion) {
          // Si difiere, hay una actualización
          setHasUpdate(true);
        }
      } catch (err) {
        // Fallo silencioso si no se puede conectar
      }
    };

    // Revisar al montar
    checkVersion();

    // Revisar cada 2 minutos
    intervalId = setInterval(checkVersion, 120000);

    return () => clearInterval(intervalId);
  }, []);

  const handleUpdate = () => {
    // Hard reload sin caché
    window.location.reload(true);
  };

  if (!hasUpdate) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] bg-white border border-gray-200 p-4 rounded-xl shadow-2xl animate-fade-in flex flex-col md:flex-row items-center gap-4 text-black">
      <div className="flex items-center gap-3">
        <div className="h-2 w-2 rounded-full bg-blue-500 animate-ping absolute"></div>
        <div className="h-2 w-2 rounded-full bg-blue-500 relative"></div>
        <div>
          <h4 className="font-bold text-sm">Actualización Disponible</h4>
          <p className="text-xs text-gray-500">Hemos lanzado una nueva versión.</p>
        </div>
      </div>
      <button 
        onClick={handleUpdate}
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors w-full md:w-auto"
      >
        Actualizar ahora
      </button>
    </div>
  );
}
