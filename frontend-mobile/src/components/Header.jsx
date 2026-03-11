import React from 'react';
import { MagnifyingGlassIcon, QrCodeIcon } from '@heroicons/react/24/outline';

const Header = ({ onSearch }) => {
    return (
        <header className="bg-white px-4 pt-6 pb-4 sticky top-0 z-40 border-b border-slate-100">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-black text-primary-600 tracking-tighter">
                    DIROGSA <span className="text-slate-300">filtros</span>
                </h1>
                <button className="p-2 bg-slate-50 rounded-xl text-slate-600 active:bg-slate-100">
                    <QrCodeIcon className="h-6 w-6" />
                </button>
            </div>

            <div className="relative group">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                    type="text"
                    placeholder="Busca por SKU, Marca o Modelo..."
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-100 border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary-500 transition-all font-medium"
                    onChange={(e) => onSearch(e.target.value)}
                />
            </div>
        </header>
    );
};

export default Header;
