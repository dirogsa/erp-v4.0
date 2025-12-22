import React, { useState, useEffect } from 'react';

const LoadingSpinner = ({ message = "Cargando catálogo...", fullScreen = false }) => {
    const [showSlowMessage, setShowSlowMessage] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowSlowMessage(true);
        }, 5000); // Aparece después de 5 segundos

        return () => clearTimeout(timer);
    }, []);

    const containerStyle = fullScreen
        ? "fixed inset-0 bg-slate-50/90 backdrop-blur-sm z-50 flex flex-col justify-center items-center w-full h-full"
        : "flex flex-col justify-center items-center py-24 w-full";

    return (
        <div className={containerStyle}>
            <div className="relative mb-10">
                {/* Decorative background ring */}
                <div className="absolute -inset-6 border-4 border-primary-50 rounded-full"></div>
                {/* Secondary pulse ring */}
                <div className="absolute -inset-6 border-2 border-primary-100 rounded-full animate-ping opacity-20"></div>

                {/* Main Spinner */}
                <div className="relative h-20 w-20">
                    <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
                    <div className="absolute inset-0 rounded-full border-t-4 border-primary-600 animate-spin"></div>
                </div>
            </div>

            <div className="text-center max-w-sm px-6">
                <h3 className="text-2xl font-black text-slate-800 mb-2">
                    {message}
                </h3>

                <div className={`transition-all duration-1000 overflow-hidden ${showSlowMessage ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <p className="text-slate-500 font-medium mb-6">
                        Nuestros sistemas están "despertando". Esto sucede tras unos minutos de inactividad y puede tardar un momento. ¡Gracias por tu paciencia!
                    </p>
                    <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-700 px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider border border-primary-100">
                        🚀 Optimizando tu conexión
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoadingSpinner;
