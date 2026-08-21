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

    // Revisar cada 30 segundos
    intervalId = setInterval(checkVersion, 30000);

    return () => clearInterval(intervalId);
  }, []);

  const handleUpdate = async () => {
    // 1. Limpiar Service Workers zombies
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (let registration of registrations) {
          await registration.unregister();
        }
      } catch (e) {
        console.error('Error unregistering service workers', e);
      }
    }

    // 2. Limpiar Storage API caches
    if ('caches' in window) {
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      } catch (e) {
        console.error('Error clearing caches', e);
      }
    }

    // 3. Navegación limpia rompiendo SPA
    window.location.href = window.location.pathname + window.location.search;
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
