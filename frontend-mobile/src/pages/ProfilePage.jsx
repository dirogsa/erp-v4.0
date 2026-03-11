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
    CreditCardIcon
} from '@heroicons/react/24/outline';

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
        <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
            <div className="h-10 w-10 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="bg-slate-50 min-h-screen pb-24">
            {/* Header Modernista Estilo Glassmorphism */}
            <div className="bg-white px-6 pt-12 pb-6 sticky top-0 z-50 border-b border-slate-100 flex justify-between items-center transition-all">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-slate-100 overflow-hidden border-2 border-white shadow-sm shrink-0">
                        <img src={`https://ui-avatars.com/api/?name=${user?.full_name}&background=6366f1&color=fff`} alt="Profile" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-slate-900 leading-tight">Mi Perfil</h1>
                        <p className="text-[10px] font-black text-primary-600 uppercase tracking-[0.2em] mt-0.5">
                            RUC: {user?.ruc_linked || 'Sin RUC'}
                        </p>
                    </div>
                </div>
                <button
                    onClick={logout}
                    className="p-2.5 bg-red-50 rounded-2xl text-red-500 active:scale-95 transition-all outline-none"
                    title="Cerrar Sesión"
                >
                    <ArrowRightOnRectangleIcon className="h-5 w-5" />
                </button>
            </div>

            {/* Account Info / Hero Section */}
            <div className="p-6">
                <div className="bg-slate-900 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden mb-8">
                    <div className="relative z-10 text-white">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-2xl font-black mb-1">{user?.full_name}</h3>
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Socio {user?.classification || 'Standard'}</p>
                            </div>
                            <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
                                <ShieldCheckIcon className="h-7 w-7 text-primary-400" />
                            </div>
                        </div>

                        {financialStatus?.has_account && (
                            <div className="grid grid-cols-2 gap-4 mt-2">
                                <div className="bg-white/5 p-4 rounded-[2rem] border border-white/10 backdrop-blur-sm">
                                    <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-1">Crédito Disponible</p>
                                    <p className="text-lg font-black text-white">S/ {financialStatus.available_credit.toFixed(2)}</p>
                                    <div className="w-full bg-white/10 h-1 rounded-full mt-2 overflow-hidden">
                                        <div
                                            className="bg-primary-500 h-full rounded-full"
                                            style={{ width: `${Math.min((financialStatus?.available_credit / financialStatus?.credit_limit) * 100 || 0, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                                <div className="bg-white/5 p-4 rounded-[2rem] border border-white/10 backdrop-blur-sm">
                                    <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-1">Deuda Total</p>
                                    <p className="text-lg font-black text-white">S/ {financialStatus.total_debt.toFixed(2)}</p>
                                    <p className="text-[8px] text-slate-500 font-bold mt-1 tracking-tight">Límite S/ {financialStatus?.credit_limit || 0}</p>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-primary-600/20 rounded-full blur-[100px]"></div>
                </div>

                <div className="flex justify-between items-end mb-6 pl-1">
                    <h2 className="text-lg font-black text-slate-900 leading-tight">Estado de Cuenta</h2>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full">{invoices.length} Facturas</span>
                </div>

                {invoices.length === 0 ? (
                    <div className="bg-white p-12 rounded-[3.5rem] border-2 border-dashed border-slate-100 text-center">
                        <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                            <DocumentTextIcon className="h-8 w-8" />
                        </div>
                        <p className="text-slate-400 font-black text-xs uppercase tracking-widest">Sin documentos</p>
                        <p className="text-[10px] text-slate-400 mt-1">Tus facturas aparecerán aquí.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {invoices.map(inv => (
                            <div
                                key={inv.invoice_number}
                                className={`bg-white rounded-[2.5rem] border transition-all duration-300 ${expandedInvoice === inv.invoice_number ? 'border-primary-200 shadow-xl shadow-slate-200/50' : 'border-slate-100 shadow-sm'}`}
                            >
                                <div
                                    className="p-5 flex items-center justify-between active:bg-slate-50 transition-colors"
                                    onClick={() => toggleInvoice(inv.invoice_number)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${inv.payment_status === 'PAID' ? 'bg-green-50 text-green-600' :
                                                inv.payment_status === 'OVERDUE' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                                            }`}>
                                            <DocumentTextIcon className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-black text-slate-900 uppercase">{inv.invoice_number}</div>
                                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                                                {new Date(inv.date).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right flex items-center gap-3">
                                        <div className="flex flex-col items-end mr-1">
                                            <div className="text-sm font-black text-slate-900 leading-none">S/ {inv.total_amount?.toFixed(2)}</div>
                                            <div className={`text-[9px] font-black uppercase mt-1 ${inv.payment_status === 'PAID' ? 'text-green-600' :
                                                    inv.payment_status === 'OVERDUE' ? 'text-red-500' : 'text-amber-600'
                                                }`}>
                                                {inv.payment_status === 'PAID' ? 'Pagado' :
                                                    inv.payment_status === 'OVERDUE' ? 'Vencido' : 'Pendiente'}
                                            </div>
                                        </div>
                                        {expandedInvoice === inv.invoice_number ? <ChevronUpIcon className="h-4 w-4 text-slate-400" /> : <ChevronDownIcon className="h-4 w-4 text-slate-400" />}
                                    </div>
                                </div>

                                {expandedInvoice === inv.invoice_number && (
                                    <div className="px-6 pb-6 pt-2 border-t border-slate-50 bg-slate-50/30 rounded-b-[2.5rem]">
                                        <div className="space-y-3 mb-5">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-2">Detalle de items</p>
                                            {inv.items?.map((item, idx) => (
                                                <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-2xl border border-slate-100/50">
                                                    <div className="flex flex-col">
                                                        <span className="text-[11px] text-slate-900 font-bold leading-tight">{item.product_name}</span>
                                                        <span className="text-[9px] text-slate-400 font-medium">Cant: {item.quantity}</span>
                                                    </div>
                                                    <span className="text-xs font-black text-slate-900">S/ {(item.quantity * item.unit_price).toFixed(2)}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex justify-between items-center bg-slate-900 p-4 rounded-2xl shadow-lg shadow-slate-900/20">
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Saldo Pendiente</div>
                                            <div className="text-base font-black text-primary-400">S/ {(inv.total_amount - (inv.amount_paid || 0)).toFixed(2)}</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfilePage;
