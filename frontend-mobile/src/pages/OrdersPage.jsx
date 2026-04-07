import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { shopService } from '../services/api';
import { 
    ClipboardDocumentListIcon, 
    ChevronRightIcon, 
    CheckCircleIcon, 
    ClockIcon,
    DocumentArrowDownIcon,
    ClipboardDocumentCheckIcon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { generateQuotationPDF } from '../utils/generateQuotationPDF';

const OrdersPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [quotes, setQuotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [copiedId, setCopiedId] = useState(null); // tracks which card's text was copied

    const buildSummaryText = (quote) => {
        const lines = (quote.items || []).map(
            i => `  • ${i.quantity}x ${i.product_name || i.product_sku} → S/ ${((i.quantity || 0) * (i.unit_price || 0)).toFixed(2)}`
        ).join('\n');
        const total = (quote.total_amount || 0).toFixed(2);
        return `🧾 COTIZACIÓN DIROGSA\n\nNro: ${quote.quote_number || 'S/N'}\nFecha: ${new Date(quote.date).toLocaleDateString()}\n\nDetalle:\n${lines}\n\n💰 TOTAL: S/ ${total}\n\n_Generado desde DIROGSA Mobile_`;
    };

    const handleCopy = async (quote) => {
        try {
            await navigator.clipboard.writeText(buildSummaryText(quote));
            setCopiedId(quote.quote_number);
            setTimeout(() => setCopiedId(null), 2500);
        } catch {
            alert('No se pudo copiar. Intente de nuevo.');
        }
    };

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        loadQuotes();
    }, [user, navigate]);

    const loadQuotes = async () => {
        setLoading(true);
        try {
            const res = await shopService.getQuotes();
            setQuotes(res.data || []);
        } catch (error) {
            console.error("Failed to load quotes", error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'PENDING': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
            case 'COMPLETED': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
            case 'CANCELLED': return 'text-red-500 bg-red-500/10 border-red-500/20';
            default: return 'text-brand-muted bg-brand-surface border-brand-border';
        }
    };

    return (
        <div className="bg-brand-bg min-h-screen pb-32 text-brand-text">
            <header className="bg-brand-bg/90 backdrop-blur-xl px-6 pt-12 pb-6 border-b border-brand-border/50 shadow-sm sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-brand-surface rounded-xl border border-brand-border">
                        <ClipboardDocumentListIcon className="h-6 w-6 text-brand-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-brand-text leading-tight uppercase tracking-tighter">Mis Pedidos</h1>
                        <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest mt-0.5">Historial de cotizaciones</p>
                    </div>
                </div>
            </header>

            <main className="p-6">
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-24 bg-brand-surface rounded-[2rem] border border-brand-border animate-pulse"></div>
                        ))}
                    </div>
                ) : quotes.length === 0 ? (
                    <div className="text-center py-20 bg-brand-surface rounded-[2.5rem] border border-brand-border px-6">
                        <div className="h-20 w-20 bg-brand-bg border border-brand-border text-brand-muted/30 rounded-full flex items-center justify-center mx-auto mb-6">
                            <ClockIcon className="h-10 w-10" />
                        </div>
                        <h3 className="text-lg font-black text-brand-text">Aún no tienes pedidos</h3>
                        <p className="text-xs text-brand-muted mt-2 mb-8">Tus cotizaciones aparecerán aquí una vez que las generes en el carrito.</p>
                        <button onClick={() => navigate('/')} className="bg-brand-primary text-brand-bg px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg">
                            Empezar a comprar
                        </button>
                    </div>
                ) : (
                    <div className="space-y-5">
                        {quotes.map((quote) => (
                            <div 
                                key={quote.quote_number || quote._id}
                                className="bg-brand-surface border-2 border-brand-border/30 rounded-[2.5rem] p-6 shadow-xl transition-all active:scale-[0.97] relative overflow-hidden group"
                            >
                                {/* Decorative industrial accent */}
                                <div className="absolute top-0 left-0 w-1.5 h-full bg-brand-primary/40 group-hover:bg-brand-primary transition-colors"></div>

                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-2">
                                            <div className={`px-3 py-1 rounded-full border ${getStatusColor(quote.status)} flex items-center gap-1.5`}>
                                                <div className="h-1.5 w-1.5 rounded-full bg-current animate-pulse"></div>
                                                <span className="text-[10px] font-black uppercase tracking-widest">
                                                    {quote.status === 'PENDING' ? 'Pendiente' : quote.status === 'COMPLETED' ? 'Completado' : quote.status}
                                                </span>
                                            </div>
                                        </div>
                                        <h3 className="text-sm font-black text-white uppercase tracking-tighter">COTIZACIÓN #{quote.quote_number || 'S/N'}</h3>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] font-black text-brand-muted uppercase tracking-widest block mb-1">Emitido</span>
                                        <span className="text-[11px] font-bold text-white bg-brand-bg px-2 py-1 rounded-lg border border-brand-border/50">
                                            {quote.date ? new Date(quote.date).toLocaleDateString() : '---'}
                                        </span>
                                    </div>
                                </div>

                                <div className="bg-brand-bg/40 rounded-2xl p-4 mb-6 border border-brand-border/20">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-[9px] font-black text-brand-muted uppercase tracking-widest mb-1.5">Descripción de Carga</p>
                                            <p className="text-[11px] font-bold text-brand-text uppercase leading-none">
                                                {quote.items?.length || 0} {quote.items?.length === 1 ? 'Ítem Detectado' : 'Ítems Detectados'}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] font-black text-brand-primary uppercase tracking-widest mb-1">TOTAL PROYECTADO</p>
                                            <div className="text-2xl font-black text-white leading-none tracking-tighter drop-shadow-sm">
                                                S/ {(quote.total_amount || 0).toLocaleString('en-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button 
                                        onClick={() => generateQuotationPDF(quote, quote.items || [])}
                                        className="flex-1 bg-brand-primary text-brand-bg py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-brand-primary/10"
                                    >
                                        <DocumentArrowDownIcon className="h-5 w-5" /> DESCARGAR PDF
                                    </button>
                                    <button 
                                        onClick={() => quote.items?.[0] && navigate(`/product/${quote.items[0].product_sku}`)}
                                        className="w-14 h-14 bg-brand-surface rounded-2xl border-2 border-brand-border flex items-center justify-center text-brand-muted active:border-brand-primary active:text-brand-primary transition-all"
                                    >
                                        <ChevronRightIcon className="h-6 w-6" />
                                    </button>
                                </div>

                                {/* Share Actions: 2-col grid */}
                                <div className="grid grid-cols-2 gap-2 mt-3">
                                    {/* Enviar PDF por WhatsApp (native share) */}
                                    <button
                                        onClick={() => generateQuotationPDF(quote, quote.items || [], 'share')}
                                        className="flex items-center justify-center gap-1.5 bg-[#25D366]/10 border border-[#25D366]/30 text-[#25D366] py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all"
                                    >
                                        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                                        Enviar PDF
                                    </button>
                                    {/* Copiar Resumen al portapapeles */}
                                    <button
                                        onClick={() => handleCopy(quote)}
                                        className={`flex items-center justify-center gap-1.5 py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all border ${
                                            copiedId === quote.quote_number
                                                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                                                : 'bg-brand-surface border-brand-border text-brand-muted'
                                        }`}
                                    >
                                        {copiedId === quote.quote_number
                                            ? <><ClipboardDocumentCheckIcon className="h-4 w-4" /> ¡Copiado!</>
                                            : <><ClipboardDocumentCheckIcon className="h-4 w-4" /> Copiar Texto</>
                                        }
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default OrdersPage;
