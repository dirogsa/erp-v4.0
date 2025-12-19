import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="bg-slate-900 text-slate-400 py-16 px-4">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
                <div className="md:col-span-2">
                    <span className="text-3xl font-black text-white tracking-tighter mb-6 block">
                        FILTROS<span className="text-primary-500">SHOP</span>
                    </span>
                    <p className="max-w-md leading-relaxed">
                        Líderes en soluciones de filtración automotriz premium.
                        Importamos directamente para ofrecerte el mejor precio y calidad garantizada.
                    </p>
                </div>
                <div>
                    <h4 className="text-white font-bold mb-6">Enlaces</h4>
                    <ul className="space-y-4">
                        <li><Link to="/" className="hover:text-primary-500 transition-colors">Inicio</Link></li>
                        <li><Link to="/catalog" className="hover:text-primary-500 transition-colors">Catálogo</Link></li>
                        <li><Link to="/b2b" className="hover:text-primary-500 transition-colors">Empresas B2B</Link></li>
                        <li><Link to="/privacy" className="hover:text-primary-500 transition-colors">Privacidad</Link></li>
                    </ul>
                </div>
                <div>
                    <h4 className="text-white font-bold mb-6">Contacto</h4>
                    <ul className="space-y-4">
                        <li>Lima, Perú</li>
                        <li>soporte@filtroshop.pe</li>
                        <li>+51 900 000 000</li>
                    </ul>
                </div>
            </div>
            <div className="max-w-7xl mx-auto border-t border-slate-800 mt-16 pt-8 text-sm text-center">
                <p>&copy; {new Date().getFullYear()} FILTROS SHOP. Todos los derechos reservados.</p>
            </div>
        </footer>
    );
};

export default Footer;
