import VersionInfo from './VersionInfo';
import { MagnifyingGlassIcon, QrCodeIcon } from '@heroicons/react/24/outline';

const Header = ({ onSearch }) => {
    return (
        <header className="glass-card px-4 pt-10 pb-4 sticky top-0 z-40 border-b border-white/5 shadow-xl">
            <div className="flex items-center justify-between mb-6 px-2">
                <div className="flex items-center gap-3">
                    <h1 className="text-brand-xl font-black text-brand-primary tracking-tighter">
                        DIROGSA <span className="text-brand-text-dim font-medium">ERP</span>
                    </h1>
                    <VersionInfo className="mt-1" />
                </div>
                <button className="h-12 w-12 flex items-center justify-center bg-brand-surface-2 rounded-2xl border border-brand-border-2 text-brand-primary active:scale-90 transition-all shadow-lg">
                    <QrCodeIcon className="h-6 w-6" />
                </button>
            </div>

            <div className="relative group px-1">
                <MagnifyingGlassIcon className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-brand-primary/60 group-focus-within:text-brand-primary transition-colors" />
                <input
                    type="text"
                    placeholder="Busca por SKU, Marca o Modelo..."
                    className="w-full pl-14 pr-4 py-4 bg-brand-surface border-2 border-brand-border-2 rounded-2xl text-brand-sm focus:border-brand-primary focus:outline-none transition-all font-bold placeholder:text-brand-muted/40 shadow-2xl"
                    onChange={(e) => onSearch(e.target.value)}
                />
            </div>
        </header>
    );
};

export default Header;
