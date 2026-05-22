import React, { useState, useEffect } from 'react';
import { TruckIcon, XMarkIcon } from '@heroicons/react/24/outline';

const BrandCombobox = ({
    consolidatedBrands,
    selectedMake,
    setSelectedMake,
    setSelectedModel
}) => {
    const [makeSearch, setMakeSearch] = useState(selectedMake || '');
    const [showMakeSuggestions, setShowMakeSuggestions] = useState(false);

    // Sync search input if selectedMake is cleared from outside
    useEffect(() => {
        setMakeSearch(selectedMake || '');
    }, [selectedMake]);

    return (
        <div className="relative">
            <TruckIcon className="absolute left-4 top-[50%] -translate-y-1/2 h-4 w-4 pointer-events-none z-10" style={{ color: '#38BDF8' }} />
            <input
                type="text"
                value={makeSearch}
                placeholder="Escribe la marca, ej: Toyota..."
                autoComplete="off"
                onChange={(e) => {
                    const val = e.target.value.toUpperCase();
                    setMakeSearch(val);
                    setSelectedMake('');
                    if (setSelectedModel) setSelectedModel('');
                    setShowMakeSuggestions(true);
                }}
                onFocus={() => setShowMakeSuggestions(true)}
                onBlur={() => setTimeout(() => setShowMakeSuggestions(false), 180)}
                className="tech-input w-full h-14 rounded-xl pl-11 pr-10 text-[11px] font-black uppercase"
                style={{ borderColor: selectedMake ? 'rgba(56,189,248,0.6)' : 'rgba(56,189,248,0.25)' }}
            />
            {makeSearch && (
                <button
                    onMouseDown={(e) => {
                        e.preventDefault();
                        setMakeSearch('');
                        setSelectedMake('');
                        if (setSelectedModel) setSelectedModel('');
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                >
                    <XMarkIcon className="h-4 w-4" />
                </button>
            )}

            {/* Suggestions dropdown */}
            {showMakeSuggestions && makeSearch.length >= 1 && (() => {
                // Relevance ranking: starts-with first, then contains — sorted by product_count DESC
                const term = makeSearch;
                const startsWith = consolidatedBrands.filter(b => b.name.startsWith(term));
                const contains  = consolidatedBrands.filter(b => !b.name.startsWith(term) && b.name.includes(term));
                const filtered  = [
                    ...startsWith.sort((a, b) => (b.product_count || 0) - (a.product_count || 0)),
                    ...contains.sort((a, b) => (b.product_count || 0) - (a.product_count || 0)),
                ];
                return filtered.length > 0 ? (
                    <div
                        className="absolute top-[calc(100%+6px)] left-0 right-0 z-50 rounded-2xl overflow-hidden shadow-2xl"
                        style={{ background: 'var(--brand-surface)', border: '1.5px solid rgba(56,189,248,0.25)' }}
                    >
                        {filtered.slice(0, 8).map(b => (
                            <button
                                key={b.name}
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    setSelectedMake(b.name);
                                    setMakeSearch(b.name);
                                    if (setSelectedModel) setSelectedModel('');
                                    setShowMakeSuggestions(false);
                                }}
                                className="w-full text-left px-4 py-3 flex items-center gap-3 transition-all active:scale-[0.98] hover:bg-white/5"
                                style={{ borderBottom: '1px solid rgba(56,189,248,0.08)' }}
                            >
                                <TruckIcon className="h-4 w-4 flex-shrink-0" style={{ color: '#38BDF8' }} />
                                <div className="flex-1 min-w-0">
                                    <span className="text-[11px] font-black text-white block truncate">
                                        {b.name}
                                    </span>
                                    {b.is_popular && (
                                        <span className="text-[9px] font-bold" style={{ color: '#38BDF8' }}>Popular</span>
                                    )}
                                </div>
                                {/* Product count badge */}
                                <span
                                    className="flex-shrink-0 text-[10px] font-black px-2 py-0.5 rounded-lg"
                                    style={{
                                        background: b.product_count > 0 ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.05)',
                                        color: b.product_count > 0 ? '#38BDF8' : 'rgba(255,255,255,0.2)'
                                    }}
                                >
                                    {b.product_count > 0 ? `${b.product_count} filtros` : 'próximamente'}
                                </span>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div
                        className="absolute top-[calc(100%+6px)] left-0 right-0 z-50 rounded-2xl p-4 text-center"
                        style={{ background: 'var(--brand-surface)', border: '1.5px solid rgba(56,189,248,0.15)' }}
                    >
                        <span className="text-[11px] text-slate-500 font-bold">Sin resultados para "{makeSearch}"</span>
                    </div>
                );
            })()}
        </div>
    );
};

export default BrandCombobox;
