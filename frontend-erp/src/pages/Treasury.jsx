import React, { useState, useEffect } from 'react';
import { salesService } from '../services/api';
import { useNotification } from '../hooks/useNotification';
import { useLoading } from '../context/LoadingContext';
import { 
    Banknote, ShieldCheck, CheckCircle2, Clock, 
    AlertCircle, Search, Calendar, FileText,
    ArrowRight, HandCoins, Building2
} from 'lucide-react';
import Layout from '../components/Layout';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Modal from '../components/Modal';

const Treasury = () => {
    const { showNotification } = useNotification();
    const { showLoading, hideLoading } = useLoading();
    
    const [invoices, setInvoices] = useState([]);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState(''); // PENDING, PARTIAL, PAID
    const [page, setPage] = useState(1);
    
    // Modal states
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showTermsModal, setShowTermsModal] = useState(false);
    
    // Payment form
    const [paymentData, setPaymentData] = useState({
        amount: '',
        payment_date: new Date().toISOString().split('T')[0],
        bank_name: '',
        operation_number: '',
        notes: ''
    });
    
    // Financial terms form
    const [termsData, setTermsData] = useState({
        payment_condition: 'CONTADO',
        due_date: '',
        notes: ''
    });

    useEffect(() => {
        loadInvoices();
    }, [page, statusFilter, search]);

    const loadInvoices = async () => {
        try {
            showLoading("Cargando cartera...", "Consultando comprobantes confirmados financieramente.");
            // Assuming is_confirmed is passed as true to only get processed invoices
            const res = await salesService.getInvoices(page, 50, search, statusFilter, '', '', true);
            setInvoices(res.data.items || res.data);
        } catch (err) {
            console.error(err);
            showNotification('Error al cargar la cartera', 'error');
        } finally {
            hideLoading();
        }
    };

    const handleRegisterPayment = async () => {
        if (!paymentData.amount || paymentData.amount <= 0) {
            showNotification('Ingrese un monto válido', 'warning');
            return;
        }
        try {
            showLoading("Verificando transacción...", "Registrando abono con auditoría bancaria.");
            await salesService.registerPaymentVerified(selectedInvoice.invoice_number, {
                ...paymentData,
                amount: parseFloat(paymentData.amount)
            });
            showNotification('Abono registrado exitosamente', 'success');
            setShowPaymentModal(false);
            setPaymentData({ amount: '', payment_date: new Date().toISOString().split('T')[0], bank_name: '', operation_number: '', notes: '' });
            loadInvoices();
        } catch (err) {
            console.error(err);
            // The API interceptor will show the error via showNotification if it's setup, but let's be safe
            showNotification(err.message || 'Error al registrar el pago', 'error');
        } finally {
            hideLoading();
        }
    };

    const handleUpdateTerms = async () => {
        if (!termsData.payment_condition) {
            showNotification('Seleccione una condición de pago', 'warning');
            return;
        }
        try {
            showLoading("Reprogramando condiciones...", "Actualizando estado contable interno (XML inmutable).");
            await salesService.updateFinancialTerms(selectedInvoice.invoice_number, termsData);
            showNotification('Términos financieros actualizados', 'success');
            setShowTermsModal(false);
            loadInvoices();
        } catch (err) {
            console.error(err);
            showNotification(err.message || 'Error al actualizar términos', 'error');
        } finally {
            hideLoading();
        }
    };

    const openPaymentModal = (inv) => {
        setSelectedInvoice(inv);
        const pending = inv.total_amount - (inv.amount_paid || 0);
        setPaymentData({
            ...paymentData,
            amount: pending.toFixed(2),
            bank_name: 'BCP' // Default
        });
        setShowPaymentModal(true);
    };

    const openTermsModal = (inv) => {
        setSelectedInvoice(inv);
        setTermsData({
            payment_condition: inv.payment_condition || 'CONTADO',
            due_date: inv.due_date ? inv.due_date.split('T')[0] : '',
            notes: ''
        });
        setShowTermsModal(true);
    };

    return (
        <Layout>
            <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '1rem', color: 'white' }}>
                <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid #1e293b', paddingBottom: '1.5rem' }}>
                    <div>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: '900', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Banknote size={36} color="#10b981" />
                            Auditoría de Tesorería
                        </h1>
                        <p style={{ color: '#94a3b8', margin: 0, fontSize: '1.1rem' }}>
                            Gestión de Cuentas por Cobrar, Conciliación Bancaria y Reprogramación Crediticia.
                        </p>
                    </div>
                </header>

                <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                    <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                        <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} size={18} />
                        <input 
                            type="text" 
                            placeholder="Buscar por RUC, cliente, comprobante..." 
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && loadInvoices()}
                            style={{ width: '100%', background: '#0f172a', border: '1px solid #1e293b', color: 'white', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '0.75rem', outline: 'none' }}
                        />
                    </div>
                    
                    <select 
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        style={{ background: '#0f172a', border: '1px solid #1e293b', color: 'white', padding: '0.75rem 1rem', borderRadius: '0.75rem', outline: 'none', appearance: 'none', minWidth: '150px' }}
                    >
                        <option value="">Todos los Estados</option>
                        <option value="PENDING">Pendientes</option>
                        <option value="PARTIAL">Pagos Parciales</option>
                        <option value="PAID">Pagados Totalmente</option>
                    </select>

                    <Button variant="primary" onClick={loadInvoices}>Buscar</Button>
                </div>

                {/* Tabla de Facturas */}
                <Card style={{ background: '#0f172a', border: '1px solid #1e293b', padding: '0', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid #1e293b' }}>
                                <th style={{ padding: '1rem', textAlign: 'left', color: '#64748b', fontSize: '0.8rem' }}>DOCUMENTO</th>
                                <th style={{ padding: '1rem', textAlign: 'left', color: '#64748b', fontSize: '0.8rem' }}>CLIENTE</th>
                                <th style={{ padding: '1rem', textAlign: 'left', color: '#64748b', fontSize: '0.8rem' }}>INTEGRIDAD XML vs ERP</th>
                                <th style={{ padding: '1rem', textAlign: 'right', color: '#64748b', fontSize: '0.8rem' }}>PENDIENTE / TOTAL</th>
                                <th style={{ padding: '1rem', textAlign: 'center', color: '#64748b', fontSize: '0.8rem' }}>ACCIONES</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>No se encontraron comprobantes para gestión.</td>
                                </tr>
                            ) : invoices.map(inv => {
                                const pending = inv.total_amount - (inv.amount_paid || 0);
                                const isPaid = pending <= 0.01;
                                const discrepancy = inv.payment_condition !== inv.payment_condition_xml;
                                
                                return (
                                    <tr key={inv._id} style={{ borderBottom: '1px solid #1e293b' }}>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>{inv.sunat_number || inv.invoice_number}</div>
                                            <div style={{ color: '#64748b', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                <Calendar size={12} /> {new Date(inv.invoice_date).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontWeight: '600' }}>{inv.issuer_info?.client_name || 'N/A'}</div>
                                            <div style={{ color: '#94a3b8', fontSize: '0.8rem', fontFamily: 'monospace' }}>RUC: {inv.issuer_info?.client_ruc}</div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                                <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: '#3b82f620', color: '#60a5fa', border: '1px solid #3b82f640' }}>
                                                    XML: {inv.payment_condition_xml || 'N/A'}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: discrepancy ? '#f59e0b20' : '#10b98120', color: discrepancy ? '#f59e0b' : '#10b981', border: `1px solid ${discrepancy ? '#f59e0b40' : '#10b98140'}` }}>
                                                    ERP: {inv.payment_condition || 'N/A'}
                                                </span>
                                                {discrepancy && <AlertCircle size={14} color="#f59e0b" title="Divergencia justificada" />}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                                            <div style={{ fontSize: '1.1rem', fontWeight: '900', color: isPaid ? '#10b981' : (pending > 0 && pending < inv.total_amount ? '#f59e0b' : '#ef4444') }}>
                                                S/ {pending.toFixed(2)}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>de S/ {inv.total_amount.toFixed(2)}</div>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                                                <Button size="xs" variant="primary" onClick={() => openPaymentModal(inv)} disabled={isPaid}>
                                                    <HandCoins size={14} style={{ marginRight: '0.25rem' }} /> Pagar
                                                </Button>
                                                <Button size="xs" variant="outline" onClick={() => openTermsModal(inv)}>
                                                    Reprogramar
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </Card>

                {/* MODAL DE REGISTRO DE PAGO (VERIFICADO) */}
                <Modal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} title="Validación de Depósito (Tesorería)">
                    {selectedInvoice && (
                        <div style={{ padding: '1rem' }}>
                            <div style={{ background: '#1e293b', padding: '1rem', borderRadius: '0.75rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
                                <div>
                                    <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Comprobante</div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{selectedInvoice.sunat_number || selectedInvoice.invoice_number}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Saldo Pendiente</div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#ef4444' }}>S/ {(selectedInvoice.total_amount - (selectedInvoice.amount_paid || 0)).toFixed(2)}</div>
                                </div>
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#94a3b8' }}>Monto a registrar (S/)</label>
                                    <input 
                                        type="number" 
                                        step="0.01" 
                                        value={paymentData.amount}
                                        onChange={e => setPaymentData({...paymentData, amount: e.target.value})}
                                        style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: 'white', padding: '0.75rem', borderRadius: '0.5rem', outline: 'none' }}
                                    />
                                </div>
                                
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#94a3b8' }}>Fecha de Depósito</label>
                                        <input 
                                            type="date" 
                                            value={paymentData.payment_date}
                                            onChange={e => setPaymentData({...paymentData, payment_date: e.target.value})}
                                            style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: 'white', padding: '0.75rem', borderRadius: '0.5rem', outline: 'none' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#94a3b8' }}>Banco Destino</label>
                                        <select 
                                            value={paymentData.bank_name}
                                            onChange={e => setPaymentData({...paymentData, bank_name: e.target.value})}
                                            style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: 'white', padding: '0.75rem', borderRadius: '0.5rem', outline: 'none' }}
                                        >
                                            <option value="">Seleccione Banco</option>
                                            <option value="BCP">BCP</option>
                                            <option value="BBVA">BBVA</option>
                                            <option value="Interbank">Interbank</option>
                                            <option value="Scotiabank">Scotiabank</option>
                                            <option value="Efectivo">Efectivo (Caja)</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#94a3b8' }}>N° Operación / Transferencia (Auditoría)</label>
                                    <input 
                                        type="text" 
                                        placeholder="Obligatorio para evitar doble registro"
                                        value={paymentData.operation_number}
                                        onChange={e => setPaymentData({...paymentData, operation_number: e.target.value})}
                                        style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: 'white', padding: '0.75rem', borderRadius: '0.5rem', outline: 'none' }}
                                    />
                                </div>
                                
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#94a3b8' }}>Notas Internas</label>
                                    <textarea 
                                        value={paymentData.notes}
                                        onChange={e => setPaymentData({...paymentData, notes: e.target.value})}
                                        style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: 'white', padding: '0.75rem', borderRadius: '0.5rem', outline: 'none', resize: 'vertical', minHeight: '60px' }}
                                    />
                                </div>
                                
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                                    <Button variant="outline" onClick={() => setShowPaymentModal(false)}>Cancelar</Button>
                                    <Button variant="primary" onClick={handleRegisterPayment}>
                                        <ShieldCheck size={16} style={{ marginRight: '0.5rem' }} /> Procesar Abono
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </Modal>

                {/* MODAL DE REPROGRAMACIÓN (TÉRMINOS FINANCIEROS) */}
                <Modal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} title="Reprogramación de Crédito (Auditable)">
                    {selectedInvoice && (
                        <div style={{ padding: '1rem' }}>
                            <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '1rem', borderRadius: '0.75rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
                                <AlertCircle color="#f59e0b" style={{ flexShrink: 0 }} />
                                <div>
                                    <div style={{ color: '#f59e0b', fontWeight: 'bold', fontSize: '0.9rem' }}>Soberanía de Datos Fiscales</div>
                                    <div style={{ color: '#d97706', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                                        Cualquier cambio realizado aquí afectará <strong>únicamente el estado interno del ERP</strong> para gestión de cobranzas. El XML original de SUNAT (condición: {selectedInvoice.payment_condition_xml}) permanece inmutable.
                                    </div>
                                </div>
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#94a3b8' }}>Nueva Condición Interna</label>
                                    <select 
                                        value={termsData.payment_condition}
                                        onChange={e => setTermsData({...termsData, payment_condition: e.target.value})}
                                        style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: 'white', padding: '0.75rem', borderRadius: '0.5rem', outline: 'none' }}
                                    >
                                        <option value="CONTADO">CONTADO</option>
                                        <option value="CREDITO">CRÉDITO (Refinanciamiento)</option>
                                    </select>
                                </div>
                                
                                {termsData.payment_condition === 'CREDITO' && (
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#94a3b8' }}>Nueva Fecha de Vencimiento</label>
                                        <input 
                                            type="date" 
                                            value={termsData.due_date}
                                            onChange={e => setTermsData({...termsData, due_date: e.target.value})}
                                            style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: 'white', padding: '0.75rem', borderRadius: '0.5rem', outline: 'none' }}
                                        />
                                    </div>
                                )}
                                
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#94a3b8' }}>Motivo de la Reprogramación (Obligatorio)</label>
                                    <textarea 
                                        value={termsData.notes}
                                        onChange={e => setTermsData({...termsData, notes: e.target.value})}
                                        placeholder="Ej: Cliente solicita 15 días adicionales. Aprobado por Gerencia."
                                        style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: 'white', padding: '0.75rem', borderRadius: '0.5rem', outline: 'none', resize: 'vertical', minHeight: '80px' }}
                                    />
                                </div>
                                
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                                    <Button variant="outline" onClick={() => setShowTermsModal(false)}>Cancelar</Button>
                                    <Button variant="primary" onClick={handleUpdateTerms} disabled={!termsData.notes.trim()}>
                                        Guardar Términos
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </Modal>
            </div>
        </Layout>
    );
};

export default Treasury;
