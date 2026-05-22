import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { shopService } from '../services/api';
import api from '../services/api';
import {
    UserCircleIcon,
    ArrowRightOnRectangleIcon,
    DocumentTextIcon,
    ShieldCheckIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    WalletIcon,
    CreditCardIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    ClockIcon,
} from '@heroicons/react/24/outline';
import VersionInfo from '../components/VersionInfo';

const STATUS_CONFIG = {
    PAID:    { label: 'Pagado',   color: '#10B981', bg: 'rgba(16,185,129,0.12)', Icon: CheckCircleIcon },
    OVERDUE: { label: 'Vencido',  color: '#EF4444', bg: 'rgba(239,68,68,0.12)',  Icon: ExclamationTriangleIcon },
    PENDING: { label: 'Pendiente',color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', Icon: ClockIcon },
};

const ProfilePage = () => {
    const { user, logout } = useAuth();
    const [invoices, setInvoices] = useState([]);
    const [financialStatus, setFinancialStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expandedInvoice, setExpandedInvoice] = useState(null);

    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                const [finRes, invRes] = await Promise.all([
                    api.get('/shop/financial-status'),
                    shopService.getInvoices()
                ]);
                setFinancialStatus(finRes.data);
                setInvoices(invRes.data);
            } catch (error) {
                console.error("Error loading profile", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfileData();
    }, []);

    const toggleInvoice = (invoiceNo) => {
        setExpandedInvoice(expandedInvoice === invoiceNo ? null : invoiceNo);
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-screen bg-brand-bg">
            <div className="h-10 w-10 border-4 border-brand-surface border-t-brand-primary rounded-full animate-spin" />
        </div>
    );

    const creditPct = financialStatus?.credit_limit > 0
        ? Math.min((financialStatus.available_credit / financialStatus.credit_limit) * 100, 100)
        : 0;

    return (
        <div className="bg-brand-bg text-brand-text min-h-screen pb-28 font-sans selection:bg-brand-primary/30">

            {/* ── STICKY HEADER ── */}
            <div className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-white/5 shadow-2xl px-5 py-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-2xl overflow-hidden border-2 shrink-0 shadow-lg"
                        style={{ borderColor: 'rgba(16,185,129,0.4)' }}>
                        <img
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.full_name || 'U')}&background=10B981&color=0A0A0B&bold=true`}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div>
                        <h1 className="text-sm font-black text-white leading-tight uppercase tracking-tight">
                            Mi Perfil
                        </h1>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#10B981' }}>
                                RUC: {user?.ruc_linked || 'Sin RUC'}
                            </span>
                            <VersionInfo />
                        </div>
                    </div>
                </div>
                <button
                    onClick={logout}
                    title="Cerrar Sesión"
                    className="h-11 w-11 rounded-2xl flex items-center justify-center bg-brand-surface border border-brand-border active:scale-90 transition-all"
                    style={{ color: '#EF4444' }}
                >
                    <ArrowRightOnRectangleIcon className="h-5 w-5" />
                </button>
            </div>

            {/* ── CONTENT ── */}
            <div className="pt-24 px-5 space-y-6">

                {/* HERO CARD */}
                <div className="relative rounded-[2.5rem] p-6 overflow-hidden"
                    style={{
                        background: 'var(--brand-surface)',
                        border: '1.5px solid rgba(16,185,129,0.2)',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(16,185,129,0.05)',
                    }}>
                    {/* Ambient glow */}
                    <div className="absolute -bottom-16 -right-16 w-56 h-56 rounded-full blur-[80px] pointer-events-none"
                        style={{ background: 'rgba(16,185,129,0.12)' }} />
                    <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full blur-[60px] pointer-events-none"
                        style={{ background: 'rgba(14,165,233,0.06)' }} />

                    <div className="relative z-10">
                        {/* User identity */}
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-xl font-black text-white uppercase tracking-tight leading-tight">
                                    {user?.full_name}
                                </h2>
                                <p className="text-[10px] font-black uppercase tracking-widest mt-1"
                                    style={{ color: '#10B981' }}>
                                    Socio {user?.classification || 'Standard'}
                                </p>
                            </div>
                            <div className="h-12 w-12 rounded-2xl flex items-center justify-center"
                                style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)' }}>
                                <ShieldCheckIcon className="h-7 w-7" style={{ color: '#10B981' }} />
                            </div>
                        </div>

                        {/* Financial grid */}
                        {financialStatus?.has_account ? (
                            <div className="grid grid-cols-2 gap-3">
                                {/* Credito */}
                                <div className="rounded-2xl p-4"
                                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                    <div className="flex items-center gap-1.5 mb-2">
                                        <WalletIcon className="h-3.5 w-3.5" style={{ color: '#10B981' }} />
                                        <p className="text-[9px] font-black uppercase tracking-widest text-brand-text-muted">
                                            Crédito Disponible
                                        </p>
                                    </div>
                                    <p className="text-lg font-black text-white leading-none">
                                        S/ {financialStatus.available_credit.toFixed(2)}
                                    </p>
                                    <div className="w-full rounded-full mt-2.5 overflow-hidden"
                                        style={{ height: '3px', background: 'rgba(255,255,255,0.08)' }}>
                                        <div className="h-full rounded-full transition-all duration-700"
                                            style={{ width: `${creditPct}%`, background: 'linear-gradient(90deg, #10B981, #34d399)' }} />
                                    </div>
                                </div>
                                {/* Deuda */}
                                <div className="rounded-2xl p-4"
                                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                    <div className="flex items-center gap-1.5 mb-2">
                                        <CreditCardIcon className="h-3.5 w-3.5" style={{ color: '#F59E0B' }} />
                                        <p className="text-[9px] font-black uppercase tracking-widest text-brand-text-muted">
                                            Deuda Total
                                        </p>
                                    </div>
                                    <p className="text-lg font-black text-white leading-none">
                                        S/ {financialStatus.total_debt.toFixed(2)}
                                    </p>
                                    <p className="text-[8px] font-bold mt-2 tracking-tight text-brand-text-dim">
                                        Límite: S/ {financialStatus?.credit_limit || 0}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-2xl p-4 text-center"
                                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                <p className="text-[10px] font-black text-brand-text-muted uppercase tracking-widest">
                                    Sin cuenta de crédito activa
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── INVOICES SECTION ── */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center px-1">
                        <h3 className="text-brand-metadata flex items-center gap-2">
                            <DocumentTextIcon className="h-4 w-4" style={{ color: '#10B981' }} />
                            Estado de Cuenta
                        </h3>
                        <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full"
                            style={{ background: 'rgba(255,255,255,0.06)', color: '#94A3B8' }}>
                            {invoices.length} Facturas
                        </span>
                    </div>

                    {invoices.length === 0 ? (
                        <div className="rounded-[2.5rem] p-12 text-center"
                            style={{ background: 'var(--brand-surface)', border: '1.5px dashed rgba(255,255,255,0.08)' }}>
                            <div className="h-16 w-16 rounded-3xl flex items-center justify-center mx-auto mb-4"
                                style={{ background: 'rgba(255,255,255,0.05)' }}>
                                <DocumentTextIcon className="h-8 w-8 text-brand-text-dim" />
                            </div>
                            <p className="text-[11px] font-black text-brand-text-muted uppercase tracking-widest">Sin documentos</p>
                            <p className="text-[10px] text-brand-text-dim mt-1">Tus facturas aparecerán aquí.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {invoices.map(inv => {
                                const status = STATUS_CONFIG[inv.payment_status] || STATUS_CONFIG.PENDING;
                                const isExpanded = expandedInvoice === inv.invoice_number;
                                const balance = (inv.total_amount - (inv.amount_paid || 0));

                                return (
                                    <div
                                        key={inv.invoice_number}
                                        className="rounded-[2rem] overflow-hidden transition-all duration-300"
                                        style={{
                                            background: 'var(--brand-surface)',
                                            border: `1.5px solid ${isExpanded ? status.color + '40' : 'rgba(255,255,255,0.06)'}`,
                                            boxShadow: isExpanded ? `0 8px 30px rgba(0,0,0,0.4)` : 'none',
                                        }}>
                                        {/* Invoice row */}
                                        <div
                                            className="p-5 flex items-center justify-between cursor-pointer active:opacity-70 transition-opacity"
                                            onClick={() => toggleInvoice(inv.invoice_number)}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                                                    style={{ background: status.bg }}>
                                                    <status.Icon className="h-6 w-6" style={{ color: status.color }} />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-black text-white uppercase tracking-tight">
                                                        {inv.invoice_number}
                                                    </div>
                                                    <div className="text-[10px] font-bold text-brand-text-muted uppercase tracking-tight mt-0.5">
                                                        {new Date(inv.date).toLocaleDateString('es-PE')}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="text-right">
                                                    <div className="text-sm font-black text-white leading-none">
                                                        S/ {inv.total_amount?.toFixed(2)}
                                                    </div>
                                                    <div className="text-[9px] font-black uppercase mt-1"
                                                        style={{ color: status.color }}>
                                                        {status.label}
                                                    </div>
                                                </div>
                                                <div className="text-brand-text-dim">
                                                    {isExpanded
                                                        ? <ChevronUpIcon className="h-4 w-4" />
                                                        : <ChevronDownIcon className="h-4 w-4" />}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Expanded detail */}
                                        {isExpanded && (
                                            <div className="px-5 pb-5 pt-2 animate-in fade-in slide-in-from-top-2 duration-200"
                                                style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                                <p className="text-[9px] font-black text-brand-text-dim uppercase tracking-widest mb-3 pl-1 pt-2">
                                                    Detalle de Items
                                                </p>
                                                <div className="space-y-2 mb-4">
                                                    {inv.items?.map((item, idx) => (
                                                        <div key={idx}
                                                            className="flex justify-between items-center p-3 rounded-xl"
                                                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                            <div>
                                                                <span className="text-[11px] text-white font-bold leading-tight block">
                                                                    {item.product_name}
                                                                </span>
                                                                <span className="text-[9px] text-brand-text-dim font-medium">
                                                                    Cant: {item.quantity} × S/ {item.unit_price?.toFixed(2)}
                                                                </span>
                                                            </div>
                                                            <span className="text-xs font-black text-white">
                                                                S/ {(item.quantity * item.unit_price).toFixed(2)}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Balance footer */}
                                                <div className="flex justify-between items-center p-4 rounded-2xl"
                                                    style={{ background: 'rgba(0,0,0,0.3)', border: `1px solid ${status.color}30` }}>
                                                    <span className="text-[10px] font-black text-brand-text-muted uppercase tracking-widest">
                                                        Saldo Pendiente
                                                    </span>
                                                    <span className="text-base font-black" style={{ color: status.color }}>
                                                        S/ {balance.toFixed(2)}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
