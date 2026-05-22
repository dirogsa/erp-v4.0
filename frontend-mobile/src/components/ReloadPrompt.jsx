import React, { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { ArrowPathIcon, XMarkIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

function ReloadPrompt() {
  const sw = useRegisterSW({
    onRegistered(r) {
      console.log('[PWA] Service Worker registrado');
    },
    onRegisterError(error) {
      console.error('[PWA] Error en Service Worker', error);
    },
  });

  // Efecto para buscar actualizaciones periódicamente de forma segura
  useEffect(() => {
    if (sw?.needUpdate === undefined) return; // Esperar a que el hook esté listo
  }, [sw]);

  // Técnica de Soberanía de Tipos: Extraer con validación estricta
  const [offlineReady, setOfflineReady] = Array.isArray(sw?.offlineReady) 
    ? sw.offlineReady 
    : [false, () => {}];

  const [needUpdate, setNeedUpdate] = Array.isArray(sw?.needUpdate) 
    ? sw.needUpdate 
    : [false, () => {}];

  const updateServiceWorker = typeof sw?.updateServiceWorker === 'function' 
    ? sw.updateServiceWorker 
    : () => {};

  const close = () => {
    if (setOfflineReady) setOfflineReady(false);
    if (setNeedUpdate) setNeedUpdate(false);
  };

  // CONSTITUTION §6 — Premium UX: Solo mostramos el banner si hay una actualización REAL del código.
  // El evento "offlineReady" (caché del cascarón) es un detalle de infraestructura, no un hecho
  // que el cliente de negocio necesite conocer. No mostramos nada en ese caso.
  return (
    <AnimatePresence>
      {needUpdate && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-6 left-6 right-6 z-[9999]"
        >
          <div className="bg-slate-900/90 backdrop-blur-xl border border-blue-500/20 p-5 rounded-3xl shadow-2xl flex flex-col gap-4">
            <div className="flex items-start gap-4">
              <div className="bg-blue-500/20 p-2.5 rounded-2xl flex-shrink-0">
                <SparklesIcon className="w-6 h-6 text-blue-400" />
              </div>
              <div className="flex-1">
                <h4 className="text-white font-bold text-sm">¡Nueva Versión Disponible!</h4>
                <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                  Hay mejoras disponibles para la plataforma DIROGSA. Actualiza ahora para continuar.
                </p>
              </div>
              <button
                onClick={() => close()}
                className="text-slate-500 hover:text-white transition-colors flex-shrink-0"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <button
              onClick={() => updateServiceWorker(true)}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-2xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <ArrowPathIcon className="w-4 h-4" />
              Actualizar Ahora
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ReloadPrompt;
