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
import PurchaseQuotesTable from '../components/features/purchasing/PurchaseQuotesTable';
import PurchaseQuoteForm from '../components/forms/PurchaseQuoteForm';
import PurchaseQuoteDetailModal from '../components/features/purchasing/PurchaseQuoteDetailModal';
import XMLImportModal from '../components/common/XMLImportModal';
import XMLReviewModal from '../components/common/XMLReviewModal';
import { formatCurrency } from '../utils/formatters';
import RFQToOrderConversionModal from '../components/features/purchasing/RFQToOrderConversionModal';
import { purchasingService, purchasingQuotesService } from '../services/api';
import { useNotifications } from '../hooks/useNotifications';

const Purchasing = () => {
    const [selectedXmlForReview, setSelectedXmlForReview] = useState(null);
    const { showNotification } = useNotifications();
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
    const [showQuoteDetailModal, setShowQuoteDetailModal] = useState(false);
    const [showQuoteReceipt, setShowQuoteReceipt] = useState(false);
    const [showXMLImportModal, setShowXMLImportModal] = useState(false);
    const [xmlBatch, setXmlBatch] = useState([]);
    const [showConversionModal, setShowConversionModal] = useState(false);
    const [quoteToConvert, setQuoteToConvert] = useState(null);

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

    // Handlers
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
                            <Button variant="secondary" onClick={() => setShowXMLImportModal(true)}>
                                📧 Importar XML
                            </Button>
                            <Button onClick={() => setShowCreateQuote(true)}>
                                + Nueva Solicitud RFQ
                            </Button>
                        </>
                    )}
                </div>
            </div>

            <div style={{ marginBottom: '2rem', borderBottom: '1px solid #334155' }}>
                <button
                    onClick={() => { setActiveTab('quotes'); setPage(1); }}
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
                    onClick={() => { setActiveTab('orders'); setPage(1); }}
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
                    onClick={() => setActiveTab('invoices')}
                    style={{
                        padding: '1rem 2rem', background: 'none', border: 'none',
                        borderBottom: activeTab === 'invoices' ? '2px solid #3b82f6' : 'none',
                        color: activeTab === 'invoices' ? '#3b82f6' : '#94a3b8',
                        cursor: 'pointer', fontWeight: '500'
                    }}
                >
                    Facturas de Proveedores
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
            ) : (
                <PurchaseInvoicesTable
                    invoices={invoices}
                    loading={invoicesLoading}
                    onView={(invoice) => { setSelectedInvoice(invoice); setShowInvoiceReceipt(true); }}
                    onRegisterPayment={(invoice) => { setSelectedInvoice(invoice); setShowPaymentInfoModal(true); }}
                    onReceive={(invoice) => { setSelectedInvoice(invoice); setShowReceptionModal(true); }}
                    onDelete={(invoice) => {
                        if (window.confirm('¿Está seguro de eliminar esta factura? Esto revertirá la orden asociada a PENDIENTE.')) {
                            deleteInvoice(invoice.invoice_number);
                        }
                    }}
                />
            )}

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

            {/* Other Modals */}
            <InvoiceModal visible={showInvoiceModal} order={selectedOrder} loading={invoicesLoading} onClose={() => setShowInvoiceModal(false)} onSubmit={handleCreateInvoice} />
            <PaymentInfoModal visible={showPaymentInfoModal} invoice={selectedInvoice} onClose={() => setShowPaymentInfoModal(false)} onRegisterPayment={() => { setShowPaymentInfoModal(false); setShowPaymentModal(true); }} />
            <PaymentModal visible={showPaymentModal} invoice={selectedInvoice} loading={invoicesLoading} onClose={() => setShowPaymentModal(false)} onSubmit={handleRegisterPayment} />
            <ReceptionModal visible={showReceptionModal} invoice={selectedInvoice} loading={invoicesLoading} onClose={() => setShowReceptionModal(false)} onSubmit={handleReception} />

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

            <XMLImportModal
                visible={showXMLImportModal}
                onClose={() => setShowXMLImportModal(false)}
                type="PURCHASE"
                onConfirm={(batch) => {
                    setXmlBatch(prev => [...prev, ...batch]);
                    setShowXMLImportModal(false);
                }}
            />

            <XMLReviewModal
                visible={!!selectedXmlForReview}
                doc={selectedXmlForReview}
                onClose={() => setSelectedXmlForReview(null)}
                loading={loading}
                onConfirm={async (doc) => {
                    if (doc.import_mode === 'direct_invoice') {
                        setLoading(true);
                        try {
                            // Check for duplicates
                            const existingRes = await purchasingQuotesService.getQuotes(1, 1, doc.document_number);
                            if (existingRes.data.total > 0) {
                                alert(`⚠️ El documento ${doc.document_number} ya existe en el sistema.`);
                                setSelectedXmlForReview(null);
                                return;
                            }

                            await purchasingService.importInvoiceXml(doc, true, doc.exchange_rate);
                            
                            setXmlBatch(prev => prev.filter(x => x.document_number !== doc.document_number));
                            setSelectedXmlForReview(null);
                            showNotification(`Factura de compra ${doc.document_number} importada correctamente con recepción automática.`, 'success');
                            setActiveTab('invoices');
                        } catch (err) {
                            console.error("Error en importación directa:", err);
                        } finally {
                            setLoading(false);
                        }
                        return;
                    }

                    const mappedQuote = {
                        date: doc.date,
                        currency: 'PEN', // Normalized to soles for system
                        supplier: { ruc: doc.supplier.ruc, name: doc.supplier.name, address: doc.supplier.address },
                        supplier_name: doc.supplier.name,
                        items: doc.items.map(item => ({
                            product_sku: item.product_sku,
                            product_name: item.product_name,
                            quantity: item.quantity,
                            unit_cost: item.unit_price, // already in soles after XMLReviewModal
                            subtotal: item.subtotal,
                            is_custom: true
                        })),
                        amount_in_words: doc.amount_in_words || '',
                        internal_notes: `Importado de Factura XML ${doc.document_number}. T.C: ${doc.exchange_rate}`
                    };
                    setSelectedQuote(mappedQuote);
                    setShowCreateQuote(true);
                    setXmlBatch(prev => prev.filter(x => x.document_number !== doc.document_number));
                    setSelectedXmlForReview(null);
                }}
            />

            {xmlBatch.length > 0 && (
                <div style={{ backgroundColor: '#1e293b', padding: '1.5rem', borderRadius: '1rem', marginBottom: '2rem', border: '1px solid #3b82f644', boxShadow: '0 10px 25px rgba(0,0,0,0.3)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ margin: 0, color: 'white' }}>{xmlBatch.length} Facturas Pendientes de Revisión</h3>
                        <Button variant="secondary" onClick={() => setXmlBatch([])}>Cancelar Todo</Button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                        {xmlBatch.map((doc, idx) => (
                            <div key={idx} style={{ backgroundColor: '#0f172a', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div><div style={{ fontWeight: 'bold', color: 'white' }}>{doc.document_number}</div><div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{doc.supplier.name}</div></div>
                                <Button size="small" onClick={() => setSelectedXmlForReview(doc)}>Revisar</Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Purchasing;
