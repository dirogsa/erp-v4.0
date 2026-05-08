import React, { useState } from 'react';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import PurchaseOrdersTable from '../components/features/purchasing/PurchaseOrdersTable';
import PurchaseInvoicesTable from '../components/features/purchasing/PurchaseInvoicesTable';
import InvoiceModal from '../components/features/purchasing/InvoiceModal';
import PaymentModal from '../components/features/purchasing/PaymentModal';
import PaymentInfoModal from '../components/features/purchasing/PaymentInfoModal';
import ReceptionModal from '../components/features/purchasing/ReceptionModal';
import PurchaseOrderReceipt from '../components/features/purchasing/PurchaseOrderReceipt';
import PurchaseInvoiceReceipt from '../components/features/purchasing/PurchaseInvoiceReceipt';
import PurchaseQuoteReceipt from '../components/features/purchasing/PurchaseQuoteReceipt';
import Pagination from '../components/common/Table/Pagination';
import { usePurchaseOrders } from '../hooks/usePurchaseOrders';
import { usePurchaseInvoices } from '../hooks/usePurchaseInvoices';
import { usePurchaseQuotes } from '../hooks/usePurchaseQuotes';
import { useDeliveryGuides } from '../hooks/useDeliveryGuides';
import PurchaseQuotesTable from '../components/features/purchasing/PurchaseQuotesTable';
import GuidesTable from '../components/features/sales/GuidesTable';
import DeliveryGuideReceipt from '../components/features/sales/DeliveryGuideReceipt';
import PurchaseQuoteForm from '../components/forms/PurchaseQuoteForm';
import { formatCurrency } from '../utils/formatters';
import RFQToOrderConversionModal from '../components/features/purchasing/RFQToOrderConversionModal';
import { purchasingService, purchaseQuotesService } from '../services/api';
import { useNotification } from '../hooks/useNotification';
import BulkCorrectionModal from '../components/common/BulkCorrectionModal';

const Purchasing = () => {
    const { showNotification } = useNotification();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('quotes');

    // Pagination & Search State
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [search, setSearch] = useState('');

    // Modals state
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showPaymentInfoModal, setShowPaymentInfoModal] = useState(false);
    const [showReceptionModal, setShowReceptionModal] = useState(false);
    const [showOrderReceipt, setShowOrderReceipt] = useState(false);
    const [showInvoiceReceipt, setShowInvoiceReceipt] = useState(false);

    // Quotes State
    const [showCreateQuote, setShowCreateQuote] = useState(false);
    const [selectedQuote, setSelectedQuote] = useState(null);
    const [showQuoteReceipt, setShowQuoteReceipt] = useState(false);
    const [showConversionModal, setShowConversionModal] = useState(false);
    const [quoteToConvert, setQuoteToConvert] = useState(null);
    const [selectedInvoices, setSelectedInvoices] = useState([]);
    const [selectedGuideIds, setSelectedGuideIds] = useState([]);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [selectedGuide, setSelectedGuide] = useState(null);
    const [showGuideReceipt, setShowGuideReceipt] = useState(false);

    // Hooks
    const {
        orders,
        pagination: ordersPagination,
        loading: ordersLoading,
        deleteOrder
    } = usePurchaseOrders({ page, limit, search });

    const {
        invoices,
        loading: invoicesLoading,
        fetchInvoices,
        createInvoice,
        registerPayment,
        registerReception,
        deleteInvoice
    } = usePurchaseInvoices();

    const {
        quotes,
        pagination: quotesPagination,
        loading: quotesLoading,
        createQuote,
        deleteQuote,
        updateQuote,
        convertQuote
    } = usePurchaseQuotes({ page, limit, search });
    
    const {
        guides,
        pagination: guidesPagination,
        loading: guidesLoading,
        dispatchGuide,
        deliverGuide,
        cancelGuide,
        bulkDispatchGuides,
        bulkDeliverGuides,
        bulkDeleteGuides
    } = useDeliveryGuides({ page, limit, search, guideType: 'RECEPTION' });

    // Handlers
    const handleBulkGuideDispatch = async () => {
        if (selectedGuideIds.length === 0) return;
        if (!window.confirm(`¿Seguro que desea procesar ${selectedGuideIds.length} guías? Esto ingresará el stock masivamente.`)) return;

        try {
            await bulkDispatchGuides(selectedGuideIds);
            setSelectedGuideIds([]);
        } catch (error) { }
    };

    const handleBulkGuideDeliver = async () => {
        if (selectedGuideIds.length === 0) return;
        if (!window.confirm(`¿Seguro que desea confirmar la recepción de ${selectedGuideIds.length} guías?`)) return;

        try {
            await bulkDeliverGuides(selectedGuideIds, "RECEPCION MASIVA");
            setSelectedGuideIds([]);
        } catch (error) { }
    };

    const handleBulkGuideCancel = async () => {
        if (selectedGuideIds.length === 0) return;
        if (!window.confirm(`¿Seguro que desea anular ${selectedGuideIds.length} guías de recepción?`)) return;

        try {
            await bulkDeleteGuides(selectedGuideIds);
            setSelectedGuideIds([]);
        } catch (error) { }
    };
    const handleBulkUpdateCondition = async (condition, customTerms = null) => {
        if (selectedInvoices.length === 0) return;
        
        if (condition === 'CREDITO' && !customTerms) {
            setShowBulkModal(true);
            return;
        }

        const label = condition === 'CREDITO' ? 'CRÉDITO (Cuentas por Pagar)' : 'CONTADO (Caja)';
        if (!customTerms && !window.confirm(`¿Seguro que desea regularizar ${selectedInvoices.length} facturas a ${label}?`)) return;

        setLoading(true);
        try {
            const res = await purchasingService.bulkUpdatePaymentCondition({
                invoice_numbers: selectedInvoices,
                condition,
                payment_terms: customTerms
            });
            showNotification(res.data.message, 'success');
            setSelectedInvoices([]);
            setShowBulkModal(false);
            fetchInvoices(); // Refresh list
        } catch (error) {
            showNotification('Error al actualizar facturas', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateInvoice = async (invoiceData) => {
        try {
            await createInvoice(invoiceData);
            setShowInvoiceModal(false);
            setActiveTab('invoices');
        } catch (error) { }
    };

    const handleRegisterPayment = async (paymentData) => {
        try {
            await registerPayment(selectedInvoice.invoice_number, paymentData);
            setShowPaymentModal(false);
        } catch (error) { }
    };

    const handleReception = async (receptionData) => {
        try {
            await registerReception(selectedInvoice.invoice_number, receptionData);
            setShowReceptionModal(false);
        } catch (error) { }
    };

    const handleCreateQuote = async (quoteData) => {
        try {
            if (selectedQuote && selectedQuote.quote_number) {
                await updateQuote(selectedQuote.quote_number, quoteData);
            } else {
                await createQuote(quoteData);
            }
            setShowCreateQuote(false);
            setSelectedQuote(null);
        } catch (error) { }
    };

    const handleFinalConversion = async (updatedQuote) => {
        try {
            // 1. Update the quote with final negotiation prices
            await updateQuote(updatedQuote.quote_number, updatedQuote);
            
            // 2. Perform the conversion to Purchase Order
            await convertQuote(updatedQuote.quote_number);
            
            setShowConversionModal(false);
            setQuoteToConvert(null);
            setPage(1);
            setActiveTab('orders');
        } catch (error) { }
    };

    const pagination = activeTab === 'quotes' ? quotesPagination : ordersPagination;

    return (
        <div style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ color: 'white', marginBottom: '0.5rem' }}>Compras</h1>
                    <p style={{ color: '#94a3b8' }}>Gestión de solicitudes, órdenes y facturas</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    {(activeTab === 'orders' || activeTab === 'quotes') && (
                        <>
                            <Button onClick={() => setShowCreateQuote(true)}>
                                + Nueva Solicitud RFQ
                            </Button>
                        </>
                    )}
                </div>
            </div>

            <div style={{ marginBottom: '2rem', borderBottom: '1px solid #334155' }}>
                <button
                    onClick={() => { setActiveTab('quotes'); setPage(1); setSelectedInvoices([]); setSelectedGuideIds([]); }}
                    style={{
                        padding: '1rem 2rem', background: 'none', border: 'none',
                        borderBottom: activeTab === 'quotes' ? '2px solid #3b82f6' : 'none',
                        color: activeTab === 'quotes' ? '#3b82f6' : '#94a3b8',
                        cursor: 'pointer', fontWeight: '500'
                    }}
                >
                    Solicitudes (RFQ)
                </button>
                <button
                    onClick={() => { setActiveTab('orders'); setPage(1); setSelectedInvoices([]); setSelectedGuideIds([]); }}
                    style={{
                        padding: '1rem 2rem', background: 'none', border: 'none',
                        borderBottom: activeTab === 'orders' ? '2px solid #3b82f6' : 'none',
                        color: activeTab === 'orders' ? '#3b82f6' : '#94a3b8',
                        cursor: 'pointer', fontWeight: '500'
                    }}
                >
                    Órdenes de Compra
                </button>
                <button
                    onClick={() => { setActiveTab('invoices'); setSelectedInvoices([]); setSelectedGuideIds([]); }}
                    style={{
                        padding: '1rem 2rem', background: 'none', border: 'none',
                        borderBottom: activeTab === 'invoices' ? '2px solid #3b82f6' : 'none',
                        color: activeTab === 'invoices' ? '#3b82f6' : '#94a3b8',
                        cursor: 'pointer', fontWeight: '500'
                    }}
                >
                    Facturas de Proveedores
                </button>
                <button
                    onClick={() => { setActiveTab('guides'); setPage(1); setSelectedInvoices([]); setSelectedGuideIds([]); }}
                    style={{
                        padding: '1rem 2rem', background: 'none', border: 'none',
                        borderBottom: activeTab === 'guides' ? '2px solid #3b82f6' : 'none',
                        color: activeTab === 'guides' ? '#3b82f6' : '#94a3b8',
                        cursor: 'pointer', fontWeight: '500'
                    }}
                >
                    📦 Guías
                </button>
            </div>

            {activeTab === 'orders' ? (
                <>
                    <div style={{ maxWidth: '400px', marginBottom: '1rem' }}>
                        <Input
                            placeholder="Buscar orden o proveedor..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        />
                    </div>
                    <PurchaseOrdersTable
                        orders={orders}
                        loading={ordersLoading}
                        onView={(order) => { setSelectedOrder(order); setShowOrderReceipt(true); }}
                        onCreateInvoice={(order) => { setSelectedOrder(order); setShowInvoiceModal(true); }}
                        onDelete={(order) => {
                            if (window.confirm('¿Está seguro de eliminar esta orden?')) {
                                deleteOrder(order.order_number);
                            }
                        }}
                    />
                </>
            ) : activeTab === 'quotes' ? (
                <>
                    <div style={{ maxWidth: '400px', marginBottom: '1rem' }}>
                        <Input
                            placeholder="Buscar solicitud o proveedor..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        />
                    </div>
                    <PurchaseQuotesTable
                        quotes={quotes}
                        loading={quotesLoading}
                        onView={(quote) => { setSelectedQuote(quote); setShowQuoteReceipt(true); }}
                        onEdit={(quote) => { 
                            setSelectedQuote(quote); 
                            setShowCreateQuote(true); 
                        }}
                        onConvert={(quote) => {
                            setQuoteToConvert(quote);
                            setShowConversionModal(true);
                        }}
                        onDelete={(quote) => {
                            if (window.confirm('¿Está seguro de eliminar esta solicitud?')) {
                                deleteQuote(quote.quote_number);
                            }
                        }}
                    />
                </>
            ) : activeTab === 'invoices' ? (
                <>
                    <PurchaseInvoicesTable
                        invoices={invoices}
                        loading={invoicesLoading || loading}
                        selectedIds={selectedInvoices}
                        onSelectionChange={setSelectedInvoices}
                        onView={(invoice) => { setSelectedInvoice(invoice); setShowInvoiceReceipt(true); }}
                        onRegisterPayment={(invoice) => { setSelectedInvoice(invoice); setShowPaymentInfoModal(true); }}
                        onReceive={(invoice) => { setSelectedInvoice(invoice); setShowReceptionModal(true); }}
                        onDelete={(invoice) => {
                            if (window.confirm('¿Está seguro de eliminar esta factura? Esto revertirá la orden asociada a PENDIENTE.')) {
                                deleteInvoice(invoice.invoice_number);
                            }
                        }}
                    />

                    {/* Barra de Acciones Masivas (Clase Mundial - Sincronizada con Ventas) */}
                    {selectedInvoices.length > 0 && (
                        <div style={{
                            position: 'fixed',
                            bottom: '2rem',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            backgroundColor: '#1e293b',
                            padding: '1rem 2rem',
                            borderRadius: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '2rem',
                            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
                            border: '1px solid #334155',
                            zIndex: 1000,
                            animation: 'slideUp 0.3s ease-out'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ backgroundColor: '#3b82f6', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '0.5rem', fontWeight: 'bold' }}>
                                    {selectedInvoices.length}
                                </div>
                                <span style={{ color: 'white', fontWeight: '500' }}>Facturas Seleccionadas</span>
                            </div>

                            <div style={{ width: '1px', height: '24px', backgroundColor: '#334155' }}></div>

                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <Button 
                                    variant="warning" 
                                    size="small"
                                    onClick={() => handleBulkUpdateCondition('CREDITO')}
                                >
                                    Convertir a CRÉDITO
                                </Button>
                                <Button 
                                    variant="success" 
                                    size="small"
                                    onClick={() => handleBulkUpdateCondition('CONTADO')}
                                >
                                    Convertir a CONTADO
                                </Button>
                                <Button 
                                    variant="secondary" 
                                    size="small"
                                    onClick={() => setSelectedInvoices([])}
                                >
                                    Cancelar
                                </Button>
                            </div>
                        </div>
                    )}

                    <style>{`
                        @keyframes slideUp {
                            from { transform: translate(-50%, 100%); opacity: 0; }
                            to { transform: translate(-50%, 0); opacity: 1; }
                        }
                    `}</style>
                </>
            ) : activeTab === 'guides' ? (
                <>
                    <div style={{ maxWidth: '400px', marginBottom: '1rem' }}>
                        <Input
                            placeholder="Buscar guía de recepción o proveedor..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        />
                    </div>
                    <GuidesTable
                        guides={guides}
                        loading={guidesLoading}
                        selectedIds={selectedGuideIds}
                        onSelectionChange={setSelectedGuideIds}
                        onView={(guide) => {
                            setSelectedGuide(guide);
                            setShowGuideReceipt(true);
                        }}
                        onDispatch={async (guideNumber) => {
                            if (window.confirm('¿Confirmar salida/tránsito de esta guía?')) {
                                await dispatchGuide(guideNumber);
                            }
                        }}
                        onDeliver={(guide) => {
                            const receivedBy = window.prompt('Nombre de quien recibe en almacén:', 'ALMACÉN CENTRAL');
                            if (receivedBy !== null) {
                                deliverGuide(guide.guide_number, receivedBy);
                            }
                        }}
                        onCancel={async (guideNumber) => {
                            if (window.confirm('¿Anular guía? Esto revertirá ingresos a stock.')) {
                                await cancelGuide(guideNumber);
                            }
                        }}
                        onPrint={(guide) => {
                            setSelectedGuide(guide);
                            setShowGuideReceipt(true);
                        }}
                    />

                    {/* Barra de Acciones Masivas para Guías de Recepción (Ingeniería de Clase Mundial) */}
                    {selectedGuideIds.length > 0 && (() => {
                        const selectedGuides = guides.filter(g => selectedGuideIds.includes(g.guide_number));
                        const allDraft = selectedGuides.length > 0 && selectedGuides.every(g => g.status === 'DRAFT');
                        const allDispatched = selectedGuides.length > 0 && selectedGuides.every(g => g.status === 'DISPATCHED');
                        const isMixed = !allDraft && !allDispatched;

                        return (
                            <div style={{
                                position: 'fixed',
                                bottom: '2rem',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                backgroundColor: '#1e293b',
                                padding: '1rem 2rem',
                                borderRadius: '1rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '2rem',
                                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
                                border: '1px solid #334155',
                                zIndex: 1000,
                                animation: 'slideUp 0.3s ease-out'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ backgroundColor: '#3b82f6', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '0.5rem', fontWeight: 'bold' }}>
                                        {selectedGuideIds.length}
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ color: 'white', fontWeight: '500', fontSize: '0.9rem' }}>Guías Seleccionadas</span>
                                        {isMixed && (
                                            <span style={{ color: '#ef4444', fontSize: '0.7rem', fontWeight: 'bold' }}>⚠️ Mezcla de estados detectada</span>
                                        )}
                                    </div>
                                </div>

                                <div style={{ width: '1px', height: '32px', backgroundColor: '#334155' }}></div>

                                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                    {allDraft && (
                                        <Button 
                                            variant="primary" 
                                            size="small"
                                            onClick={handleBulkGuideDispatch}
                                        >
                                            🚀 Marcar En Tránsito / Listo
                                        </Button>
                                    )}
                                    
                                    {allDispatched && (
                                        <Button 
                                            variant="success" 
                                            size="small"
                                            onClick={handleBulkGuideDeliver}
                                        >
                                            ✅ Confirmar Recepción Final
                                        </Button>
                                    )}

                                    {!isMixed && (
                                        <Button 
                                            variant="danger" 
                                            size="small"
                                            onClick={handleBulkGuideCancel}
                                        >
                                            ✕ Anular
                                        </Button>
                                    )}

                                    {isMixed && (
                                        <span style={{ color: '#94a3b8', fontSize: '0.85rem', fontStyle: 'italic' }}>
                                            Seleccione guías con el mismo estado para procesar
                                        </span>
                                    )}

                                    <Button 
                                        variant="secondary" 
                                        size="small"
                                        onClick={() => setSelectedGuideIds([])}
                                    >
                                        Cancelar
                                    </Button>
                                </div>
                            </div>
                        );
                    })()}
                </>
            ) : null}

            {activeTab !== 'invoices' && (
                <Pagination
                    current={pagination.current}
                    total={pagination.total}
                    onChange={setPage}
                    pageSize={limit}
                    onPageSizeChange={(newSize) => { setLimit(newSize); setPage(1); }}
                />
            )}

            {/* Conversion Modal */}
            <RFQToOrderConversionModal
                visible={showConversionModal}
                quote={quoteToConvert}
                onClose={() => setShowConversionModal(false)}
                onConfirm={handleFinalConversion}
                loading={quotesLoading}
            />

            {/* Receipt Modals */}
            <PurchaseOrderReceipt visible={showOrderReceipt} order={selectedOrder} onClose={() => setShowOrderReceipt(false)} />
            <PurchaseQuoteReceipt visible={showQuoteReceipt} quote={selectedQuote} onClose={() => setShowQuoteReceipt(false)} />
            <PurchaseInvoiceReceipt visible={showInvoiceReceipt} invoice={selectedInvoice} onClose={() => setShowInvoiceReceipt(false)} />
            <DeliveryGuideReceipt visible={showGuideReceipt} guide={selectedGuide} onClose={() => setShowGuideReceipt(false)} />

            {/* Other Modals */}
            <InvoiceModal visible={showInvoiceModal} order={selectedOrder} loading={invoicesLoading} onClose={() => setShowInvoiceModal(false)} onSubmit={handleCreateInvoice} />
            <PaymentInfoModal visible={showPaymentInfoModal} invoice={selectedInvoice} onClose={() => setShowPaymentInfoModal(false)} onRegisterPayment={() => { setShowPaymentInfoModal(false); setShowPaymentModal(true); }} />
            <PaymentModal visible={showPaymentModal} invoice={selectedInvoice} loading={invoicesLoading} onClose={() => setShowPaymentModal(false)} onSubmit={handleRegisterPayment} />
            <ReceptionModal visible={showReceptionModal} invoice={selectedInvoice} loading={invoicesLoading} onClose={() => setShowReceptionModal(false)} onSubmit={handleReception} />

            <BulkCorrectionModal
                visible={showBulkModal}
                onClose={() => setShowBulkModal(false)}
                selectedCount={selectedInvoices.length}
                onConfirm={(terms) => handleBulkUpdateCondition('CREDITO', terms)}
                loading={loading}
            />

            {showCreateQuote && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000, padding: '2rem', overflowY: 'auto' }}>
                    <div style={{ backgroundColor: '#0f172a', padding: '2rem', borderRadius: '0.5rem', maxWidth: '900px', margin: '0 auto' }}>
                        <h2 style={{ color: 'white', marginTop: 0 }}>
                            {selectedQuote && selectedQuote.quote_number ? `Editar Solicitud ${selectedQuote.quote_number}` : 'Nueva Solicitud de Cotización'}
                        </h2>
                        <PurchaseQuoteForm initialData={selectedQuote} onSubmit={handleCreateQuote} onCancel={() => { setShowCreateQuote(false); setSelectedQuote(null); }} loading={quotesLoading} />
                    </div>
                </div>
            )}

        </div>
    );
};

export default Purchasing;
