import React, { useState } from 'react';
import { CheckCircle, DollarSign, Calendar, CreditCard, Building2, X, Zap } from 'lucide-react';
import Button from '../../common/Button';

const PAYMENT_METHODS = [
    { value: 'Transferencia Bancaria', label: '🏦 Transferencia Bancaria' },
    { value: 'Efectivo', label: '💵 Efectivo' },
    { value: 'Depósito', label: '📥 Depósito' },
    { value: 'Cheque', label: '🧾 Cheque' },
    { value: 'Otro', label: '📋 Otro' },
];

/**
 * BulkPaymentModal — Treasury-Grade Bulk Confirmation Engine
 * 
 * Confirms payment for N selected invoices at a chosen accounting date.
 * Creates real Payment events in the backend. The XML/fiscal record is NEVER touched.
 * 
 * Props:
 *  - invoiceCount: number of invoices selected
 *  - onConfirm(payload): called with { invoice_numbers, payment_date, payment_method, bank_name, notes }
 *  - onClose(): called to close the modal
 *  - loading: bool
 */
const BulkPaymentModal = ({ invoiceCount, onConfirm, onClose, loading }) => {
    const today = new Date().toISOString().split('T')[0];
    const [paymentDate, setPaymentDate] = useState(today);
    const [paymentMethod, setPaymentMethod] = useState('Transferencia Bancaria');
    const [bankName, setBankName] = useState('');
    const [notes, setNotes] = useState('');

    const handleSubmit = () => {
        if (!paymentDate) return;
        onConfirm({
            payment_date: paymentDate,
            payment_method: paymentMethod,
            bank_name: bankName.trim() || null,
            notes: notes.trim() || null,
        });
    };

    const showBankField = ['Transferencia Bancaria', 'Depósito'].includes(paymentMethod);

    const inputStyle = {
        width: '100%',
        padding: '0.75rem 1rem',
        borderRadius: '0.5rem',
        backgroundColor: '#0f172a',
        color: 'white',
        border: '1px solid #334155',
        outline: 'none',
        fontSize: '0.9rem',
        boxSizing: 'border-box',
        transition: 'border-color 0.2s',
    };

    const labelStyle = {
        display: 'block',
        color: '#94a3b8',
        fontSize: '0.72rem',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginBottom: '0.4rem',
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            zIndex: 5000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(12px)',
        }}>
            <div style={{
                backgroundColor: '#0f172a',
                borderRadius: '1.5rem',
                width: '100%',
                maxWidth: '480px',
                border: '1px solid #334155',
                boxShadow: '0 0 60px rgba(16, 185, 129, 0.15), 0 25px 50px -12px rgba(0,0,0,0.7)',
                overflow: 'hidden',
                animation: 'scaleUp 0.25s ease-out',
            }}>
                {/* Header */}
                <div style={{
                    padding: '1.5rem 2rem',
                    background: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #0f172a 100%)',
                    borderBottom: '1px solid rgba(16, 185, 129, 0.2)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                            width: '40px', height: '40px', borderRadius: '0.75rem',
                            backgroundColor: 'rgba(16, 185, 129, 0.2)',
                            border: '1px solid rgba(16, 185, 129, 0.4)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Zap size={20} color="#10b981" />
                        </div>
                        <div>
                            <h2 style={{ color: 'white', margin: 0, fontSize: '1.15rem', fontWeight: '800' }}>
                                Confirmar Cobro Masivo
                            </h2>
                            <p style={{ color: '#6ee7b7', margin: 0, fontSize: '0.78rem' }}>
                                {invoiceCount} {invoiceCount === 1 ? 'factura seleccionada' : 'facturas seleccionadas'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.25rem' }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Banner informativo */}
                <div style={{
                    margin: '1.5rem 2rem 0',
                    padding: '0.75rem 1rem',
                    backgroundColor: 'rgba(16, 185, 129, 0.05)',
                    border: '1px solid rgba(16, 185, 129, 0.15)',
                    borderRadius: '0.75rem',
                    display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                }}>
                    <CheckCircle size={16} color="#10b981" style={{ flexShrink: 0, marginTop: '0.15rem' }} />
                    <p style={{ color: '#6ee7b7', fontSize: '0.8rem', margin: 0, lineHeight: '1.5' }}>
                        Se registrará el <strong>saldo pendiente completo</strong> de cada factura como cobrado. El XML SUNAT permanece intacto.
                    </p>
                </div>

                {/* Body */}
                <div style={{ padding: '1.5rem 2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {/* Fecha de cobro */}
                    <div>
                        <label style={labelStyle}>
                            <Calendar size={12} style={{ display: 'inline', marginRight: '0.35rem' }} />
                            Fecha de Ingreso a Cuenta
                        </label>
                        <input
                            type="date"
                            value={paymentDate}
                            onChange={e => setPaymentDate(e.target.value)}
                            style={inputStyle}
                        />
                        {paymentDate !== today && (
                            <p style={{ color: '#f59e0b', fontSize: '0.72rem', marginTop: '0.35rem' }}>
                                ⚠️ Fecha retroactiva. Se registrará en la fecha indicada.
                            </p>
                        )}
                    </div>

                    {/* Método de pago */}
                    <div>
                        <label style={labelStyle}>
                            <CreditCard size={12} style={{ display: 'inline', marginRight: '0.35rem' }} />
                            Método de Pago
                        </label>
                        <select
                            value={paymentMethod}
                            onChange={e => setPaymentMethod(e.target.value)}
                            style={inputStyle}
                        >
                            {PAYMENT_METHODS.map(m => (
                                <option key={m.value} value={m.value}>{m.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Banco (condicional) */}
                    {showBankField && (
                        <div>
                            <label style={labelStyle}>
                                <Building2 size={12} style={{ display: 'inline', marginRight: '0.35rem' }} />
                                Banco / Entidad (Opcional)
                            </label>
                            <input
                                type="text"
                                value={bankName}
                                onChange={e => setBankName(e.target.value)}
                                placeholder="Ej: BCP, Interbank, BBVA..."
                                style={inputStyle}
                            />
                        </div>
                    )}

                    {/* Notas */}
                    <div>
                        <label style={labelStyle}>
                            <DollarSign size={12} style={{ display: 'inline', marginRight: '0.35rem' }} />
                            Notas (Opcional)
                        </label>
                        <input
                            type="text"
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder="Ej: Cierre de mes mayo 2026..."
                            style={inputStyle}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div style={{
                    padding: '1.25rem 2rem',
                    borderTop: '1px solid #1e293b',
                    backgroundColor: '#1e293b',
                    display: 'flex', justifyContent: 'flex-end', gap: '0.75rem',
                }}>
                    <Button variant="ghost" onClick={onClose} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button
                        variant="success"
                        icon={CheckCircle}
                        onClick={handleSubmit}
                        disabled={!paymentDate || loading}
                        style={{
                            background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                            boxShadow: '0 4px 15px rgba(5, 150, 105, 0.4)',
                            fontWeight: '800',
                        }}
                    >
                        {loading ? 'Procesando...' : `Confirmar ${invoiceCount} Cobro(s)`}
                    </Button>
                </div>
            </div>

            <style>{`
                @keyframes scaleUp {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default BulkPaymentModal;
