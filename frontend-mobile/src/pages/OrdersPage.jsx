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
import { useNotifications } from '../context/NotificationContext';

const OrdersPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { showNotification } = useNotifications();
    const [quotes, setQuotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [copiedId, setCopiedId] = useState(null);

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
            showNotification({
                type: 'success',
                title: 'Copiado',
                message: 'El resumen ha sido copiado al portapapeles.'
            });
            setTimeout(() => setCopiedId(null), 2500);
        } catch {
            showNotification({
                type: 'error',
                title: 'Error',
                message: 'No se pudo copiar el texto.'
            });
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
            <header className="glass-card px-6 pt-12 pb-6 border-b border-white/5 shadow-xl sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <div className="h-14 w-14 flex items-center justify-center bg-brand-surface rounded-2xl border border-brand-border shadow-lg">
                        <ClipboardDocumentListIcon className="h-7 w-7 text-brand-primary" />
                    </div>
                    <div>
                        <h1 className="text-brand-xl font-black text-white leading-tight uppercase tracking-tighter">Mis Pedidos</h1>
                        <p className="text-brand-metadata mt-1">Historial de cotizaciones</p>
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
                    <div className="text-center py-20 bg-brand-surface rounded-[3rem] border border-brand-border px-8 shadow-2xl">
                        <div className="h-24 w-24 bg-brand-bg border border-brand-border text-brand-muted/30 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                            <ClockIcon className="h-12 w-12" />
                        </div>
                        <h3 className="text-brand-lg font-black text-white">Aún no tienes pedidos</h3>
                        <p className="text-brand-sm text-brand-text-muted mt-3 mb-10">Tus cotizaciones aparecerán aquí una vez que las generes en el carrito.</p>
                        <button onClick={() => navigate('/')} className="w-full bg-brand-primary text-brand-bg px-10 py-5 rounded-2xl font-black text-brand-sm uppercase tracking-widest shadow-xl active:scale-95 transition-all">
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

                                <div className="flex justify-between items-start mb-8">
                                    <div className="flex flex-col gap-3">
                                        <div className="flex items-center gap-2">
                                            <div className={`px-4 py-1.5 rounded-xl border-2 ${getStatusColor(quote.status)} flex items-center gap-2 shadow-lg`}>
                                                <div className="h-2 w-2 rounded-full bg-current animate-pulse"></div>
                                                <span className="text-brand-xs font-black uppercase tracking-widest">
                                                    {quote.status === 'PENDING' ? 'Pendiente' : quote.status === 'COMPLETED' ? 'Completado' : quote.status}
                                                </span>
                                            </div>
                                        </div>
                                        <h3 className="text-brand-sm font-black text-white uppercase tracking-tighter">COTIZACIÓN #{quote.quote_number || 'S/N'}</h3>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-brand-metadata block mb-2">Emitido</span>
                                        <span className="text-brand-sm font-bold text-white bg-brand-bg px-3 py-1.5 rounded-xl border border-brand-border/50 shadow-inner">
                                            {quote.date ? new Date(quote.date).toLocaleDateString() : '---'}
                                        </span>
                                    </div>
                                </div>

                                <div className="bg-brand-bg/60 backdrop-blur-md rounded-3xl p-6 mb-8 border border-white/5 shadow-inner">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-brand-metadata mb-2">Descripción de Carga</p>
                                            <p className="text-brand-sm font-black text-brand-text uppercase leading-none">
                                                {quote.items?.length || 0} {quote.items?.length === 1 ? 'Ítem Detectado' : 'Ítems Detectados'}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-brand-label !text-brand-primary/80 mb-2">TOTAL PROYECTADO</p>
                                            <div className="text-brand-2xl font-black text-white leading-none tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                                                S/ {(quote.total_amount || 0).toLocaleString('en-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <button 
                                        onClick={() => generateQuotationPDF(quote, quote.items || [])}
                                        className="flex-1 bg-brand-primary text-brand-bg py-5 rounded-2xl text-brand-sm font-black uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all shadow-2xl shadow-brand-primary/20"
                                    >
                                        <DocumentArrowDownIcon className="h-6 w-6" /> PDF
                                    </button>
                                    <button 
                                        onClick={() => quote.items?.[0] && navigate(`/product/${quote.items[0].product_sku}`)}
                                        className="h-16 w-16 bg-brand-surface rounded-2xl border-2 border-brand-border flex items-center justify-center text-brand-muted active:border-brand-primary active:text-brand-primary transition-all shadow-xl"
                                    >
                                        <ChevronRightIcon className="h-7 w-7" />
                                    </button>
                                </div>

                                {/* Share Actions: 2-col grid */}
                                <div className="grid grid-cols-2 gap-3 mt-4">
                                    {/* Enviar PDF por WhatsApp (native share) */}
                                    <button
                                        onClick={() => generateQuotationPDF(quote, quote.items || [], 'share')}
                                        className="flex items-center justify-center gap-2 bg-[#25D366]/10 border-2 border-[#25D366]/20 text-[#25D366] py-4 rounded-2xl text-brand-xs font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg"
                                    >
                                        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                                        WhatsApp
                                    </button>
                                    {/* Copiar Resumen al portapapeles */}
                                    <button
                                        onClick={() => handleCopy(quote)}
                                        className={`flex items-center justify-center gap-2 py-4 rounded-2xl text-brand-xs font-black uppercase tracking-widest active:scale-95 transition-all border-2 ${
                                            copiedId === quote.quote_number
                                                ? 'bg-brand-primary/10 border-brand-primary/40 text-brand-primary'
                                                : 'bg-brand-surface border-brand-border text-brand-text-muted'
                                        }`}
                                    >
                                        {copiedId === quote.quote_number
                                            ? <><ClipboardDocumentCheckIcon className="h-5 w-5" /> Copiado</>
                                            : <><ClipboardDocumentCheckIcon className="h-5 w-5" /> Copiar</>
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
