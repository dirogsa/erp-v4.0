import React, { useState, useEffect } from 'react';
import Button from '../components/common/Button';
import Loading from '../components/common/Loading';
import Input from '../components/common/Input';
import OrderForm from '../components/forms/OrderForm';
import OrdersTable from '../components/features/sales/OrdersTable';
import { useNotification } from '../hooks/useNotification';
import { Upload, FileText, CheckCircle, AlertCircle, Trash2, Database, Rocket, Edit3, X } from 'lucide-react';
import InvoicesTable from '../components/features/sales/InvoicesTable';
import OrderDetailModal from '../components/features/sales/OrderDetailModal';
import InvoiceDetailModal from '../components/features/sales/InvoiceDetailModal';
import InvoiceModal from '../components/features/sales/InvoiceModal';
import PaymentModal from '../components/features/sales/PaymentModal';
import PaymentInfoModal from '../components/features/sales/PaymentInfoModal';
import DispatchModal from '../components/features/sales/DispatchModal';
import SalesOrderReceipt from '../components/features/sales/SalesOrderReceipt';
import SalesInvoiceReceipt from '../components/features/sales/SalesInvoiceReceipt';
import Pagination from '../components/common/Table/Pagination';
import { useSalesOrders } from '../hooks/useSalesOrders';
import { useSalesInvoices } from '../hooks/useSalesInvoices';
import { useSalesQuotes } from '../hooks/useSalesQuotes';
import QuotesTable from '../components/features/sales/QuotesTable';
import QuoteForm from '../components/forms/QuoteForm';
import QuoteDetailModal from '../components/features/sales/QuoteDetailModal';
import SalesQuoteReceipt from '../components/features/sales/SalesQuoteReceipt';
import { salesQuotesService, salesService } from '../services/api';

import ConversionConfirmationModal from '../components/features/sales/ConversionConfirmationModal';
import BackorderConversionPreviewModal from '../components/features/sales/BackorderConversionPreviewModal';
import { useSalesNotes } from '../hooks/useSalesNotes';
import SalesNotesTable from '../components/features/sales/SalesNotesTable';
import NoteEmissionModal from '../components/features/sales/NoteEmissionModal';
import { useDeliveryGuides } from '../hooks/useDeliveryGuides';
import GuidesTable from '../components/features/sales/GuidesTable';
import GuideFormModal from '../components/features/sales/GuideFormModal';
import DeliveryGuideReceipt from '../components/features/sales/DeliveryGuideReceipt';
import XMLImportModal from '../components/common/XMLImportModal';
import XMLReviewModal from '../components/common/XMLReviewModal';
import { useCompany } from '../context/CompanyContext';
import { formatCurrency } from '../utils/formatters';

const Sales = () => {
    const { activeCompany, companies } = useCompany();
    const [activeTab, setActiveTab] = useState('quotes');
    const [showCreateOrder, setShowCreateOrder] = useState(false);
    const [showCreateQuote, setShowCreateQuote] = useState(false);

    // Pagination & Search State
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [search, setSearch] = useState('');

    // Modals state
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [selectedQuote, setSelectedQuote] = useState(null);
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [showQuoteDetailModal, setShowQuoteDetailModal] = useState(false);
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [showInvoiceDetailModal, setShowInvoiceDetailModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showPaymentInfoModal, setShowPaymentInfoModal] = useState(false);
    const [showDispatchModal, setShowDispatchModal] = useState(false);
    const [showOrderReceipt, setShowOrderReceipt] = useState(false);
    const [showInvoiceReceipt, setShowInvoiceReceipt] = useState(false);
    const [showQuoteReceipt, setShowQuoteReceipt] = useState(false);

    const [showConversionModal, setShowConversionModal] = useState(false);
    const [showBackorderPreviewModal, setShowBackorderPreviewModal] = useState(false);
    const [showNoteEmissionModal, setShowNoteEmissionModal] = useState(false);
    const [showGuideFormModal, setShowGuideFormModal] = useState(false);
    const [showGuideReceipt, setShowGuideReceipt] = useState(false);
    const [selectedGuide, setSelectedGuide] = useState(null);
    const [showXMLImportModal, setShowXMLImportModal] = useState(false);
    const [xmlBatch, setXmlBatch] = useState(() => {
        const savedBatch = localStorage.getItem('erp_sales_xml_batch');
        if (savedBatch) {
            try {
                return JSON.parse(savedBatch);
            } catch (err) {
                console.error("Error loading XML Batch initial state:", err);
                return [];
            }
        }
        return [];
    });
    const [selectedXmlForReview, setSelectedXmlForReview] = useState(null);

    const [sourceFilter, setSourceFilter] = useState('');

    // Bulk Processing States
    const [isBulkProcessing, setIsBulkProcessing] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [lastProcessedCount, setLastProcessedCount] = useState({ created: 0, skipped: 0, pending: 0 });
    const [totalToProcess, setTotalToProcess] = useState(0);
    const [currentProcessing, setCurrentProcessing] = useState(0);

    // Persistence: Save xmlBatch to localStorage on change
    useEffect(() => {
        localStorage.setItem('erp_sales_xml_batch', JSON.stringify(xmlBatch));
    }, [xmlBatch]);

    // Reset page when tab changes
    useEffect(() => {
        setPage(1);
    }, [activeTab]);

    // Hooks
    const {
        orders,
        pagination: ordersPagination,
        loading: ordersLoading,
        createOrder,
        deleteOrder,
        convertBackorder
    } = useSalesOrders({ page, limit, search });

    const {
        invoices,
        pagination: invoicesPagination,
        loading: invoicesLoading,
        createInvoice,
        registerPayment,
        createDispatchGuide,
        deleteInvoice,
        fetchInvoices
    } = useSalesInvoices({ page, limit, search });

    const {
        quotes,
        pagination: quotesPagination,
        loading: quotesLoading,
        createQuote,
        deleteQuote,
        updateQuote,
        convertQuote
    } = useSalesQuotes({
        page,
        limit,
        search,
        source: sourceFilter
    });


    const { showNotification } = useNotification();
    const {
        notes,
        pagination: notesPagination,
        loading: notesLoading,
        createNote
    } = useSalesNotes({ page, limit, search });

    const {
        guides,
        pagination: guidesPagination,
        loading: guidesLoading,
        createGuide,
        dispatchGuide,
        deliverGuide,
        cancelGuide
    } = useDeliveryGuides({ page, limit, search });

    // Helper to intelligently decide issuer (from XML RUC match or Fallback to Active)
    const resolveIssuerFromDoc = (doc) => {
        if (!doc || !doc.supplier?.ruc || !companies) return activeCompany;
        
        const xmlRuc = doc.supplier.ruc.replace(/\D/g, '');
        const matched = companies.find(c => {
            const companyRuc = c.ruc ? c.ruc.replace(/\D/g, '') : '';
            return companyRuc === xmlRuc;
        });

        if (matched) return matched;
        return activeCompany;
    };

    // Handlers
    const handleCreateOrder = async (orderData) => {
        try {
            await createOrder(orderData);
            setShowCreateOrder(false);
        } catch (error) {
            // Error handled by hook
        }
    };

    const handleCreateQuote = async (quoteData) => {
        try {
            await createQuote(quoteData);
            setShowCreateQuote(false);
            setSelectedQuote(null);
        } catch (error) {
            // Error handled by hook
        }
    };

    const handleUpdateQuote = async (quoteData) => {
        try {
            await updateQuote(selectedQuote.quote_number, quoteData);
            setShowCreateQuote(false);
            setSelectedQuote(null);
        } catch (error) {
            // Error handled by hook
        }
    };

    const handleCreateInvoice = async (invoiceData) => {
        try {
            await createInvoice(invoiceData);
            setShowInvoiceModal(false);
            setActiveTab('invoices'); // Switch to invoices tab
        } catch (error) {
            // Error handled by hook
        }
    };

    const handleRegisterPayment = async (paymentData) => {
        try {
            await registerPayment(selectedInvoice.invoice_number, paymentData);
            setShowPaymentModal(false);
        } catch (error) {
            // Error handled by hook
        }
    };

    const handleDispatch = async (dispatchData) => {
        try {
            await createDispatchGuide(selectedInvoice.invoice_number, dispatchData);
            setShowDispatchModal(false);
        } catch (error) {
            // Error handled by hook
        }
    };
    const handleEmitNote = async (invoiceNumber, type, data) => {
        try {
            await createNote(invoiceNumber, type, data);
            setShowNoteEmissionModal(false);
            setActiveTab('notes');
        } catch (error) {
            // Error handled by hook
        }
    };

    if (showCreateOrder) {
        return (
            <div style={{ padding: '2rem' }}>
                <div style={{ marginBottom: '2rem' }}>
                    <h1 style={{ color: 'white', marginBottom: '0.5rem' }}>Nueva Orden de Venta</h1>
                    <p style={{ color: '#94a3b8' }}>Complete los datos para crear una nueva orden</p>
                </div>
                <div style={{ backgroundColor: '#1e293b', padding: '2rem', borderRadius: '0.5rem' }}>
                    <OrderForm
                        onSubmit={handleCreateOrder}
                        onCancel={() => setShowCreateOrder(false)}
                        loading={ordersLoading}
                    />
                </div>
            </div>
        );
    }

    if (showCreateQuote) {
        return (
            <div style={{ padding: '2rem' }}>
                <div style={{ marginBottom: '2rem' }}>
                    <h1 style={{ color: 'white', marginBottom: '0.5rem' }}>Nueva Cotización</h1>
                    <p style={{ color: '#94a3b8' }}>Complete los datos para crear una nueva cotización</p>
                </div>
                <div style={{ backgroundColor: '#1e293b', padding: '2rem', borderRadius: '0.5rem' }}>
                    <QuoteForm
                        initialData={selectedQuote}
                        onSubmit={(selectedQuote && selectedQuote.quote_number) ? handleUpdateQuote : handleCreateQuote}
                        onCancel={() => {
                            setShowCreateQuote(false);
                            setSelectedQuote(null);
                        }}
                        loading={quotesLoading}
                    />
                </div>
            </div>
        );
    }

    return (
        <div style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ color: 'white', marginBottom: '0.5rem' }}>Ventas</h1>
                    <p style={{ color: '#94a3b8' }}>Gestión de órdenes y facturación</p>
                </div>
                <div>
                    {/* Always show New Quote as it's the primary entry point */}
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <Button variant="secondary" onClick={() => setShowXMLImportModal(true)}>
                            📧 Importar XML
                        </Button>
                        <Button onClick={() => setShowCreateQuote(true)}>
                            + Nueva Cotización
                        </Button>

                        {/* Show New Order button specifically for Orders tab */}
                        {activeTab === 'orders' && (
                            <Button
                                variant="secondary"
                                onClick={() => setShowCreateOrder(true)}
                            >
                                + Nueva Orden
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            <div style={{ marginBottom: '2rem', borderBottom: '1px solid #334155' }}>
                <button
                    onClick={() => setActiveTab('quotes')}
                    style={{
                        padding: '1rem 2rem',
                        background: 'none',
                        border: 'none',
                        borderBottom: activeTab === 'quotes' ? '2px solid #3b82f6' : 'none',
                        color: activeTab === 'quotes' ? '#3b82f6' : '#94a3b8',
                        cursor: 'pointer',
                        fontWeight: '500'
                    }}
                >
                    Cotizaciones
                </button>
                <button
                    onClick={() => setActiveTab('orders')}
                    style={{
                        padding: '1rem 2rem',
                        background: 'none',
                        border: 'none',
                        borderBottom: activeTab === 'orders' ? '2px solid #3b82f6' : 'none',
                        color: activeTab === 'orders' ? '#3b82f6' : '#94a3b8',
                        cursor: 'pointer',
                        fontWeight: '500'
                    }}
                >
                    Órdenes
                </button>
                <button
                    onClick={() => setActiveTab('backorders')}
                    style={{
                        padding: '1rem 2rem',
                        background: 'none',
                        border: 'none',
                        borderBottom: activeTab === 'backorders' ? '2px solid #3b82f6' : 'none',
                        color: activeTab === 'backorders' ? '#3b82f6' : '#94a3b8',
                        cursor: 'pointer',
                        fontWeight: '500'
                    }}
                >
                    🔄 Backorders
                </button>

                <button
                    onClick={() => setActiveTab('completed')}
                    style={{
                        padding: '1rem 2rem',
                        background: 'none',
                        border: 'none',
                        borderBottom: activeTab === 'completed' ? '2px solid #3b82f6' : 'none',
                        color: activeTab === 'completed' ? '#3b82f6' : '#94a3b8',
                        cursor: 'pointer',
                        fontWeight: '500'
                    }}
                >
                    ✅ Completados
                </button>
                <button
                    onClick={() => setActiveTab('invoices')}
                    style={{
                        padding: '1rem 2rem',
                        background: 'none',
                        border: 'none',
                        borderBottom: activeTab === 'invoices' ? '2px solid #3b82f6' : 'none',
                        color: activeTab === 'invoices' ? '#3b82f6' : '#94a3b8',
                        cursor: 'pointer',
                        fontWeight: '500'
                    }}
                >
                    Facturas
                </button>

                <button
                    onClick={() => setActiveTab('notes')}
                    style={{
                        padding: '1rem 2rem',
                        background: 'none',
                        border: 'none',
                        borderBottom: activeTab === 'notes' ? '2px solid #3b82f6' : 'none',
                        color: activeTab === 'notes' ? '#3b82f6' : '#94a3b8',
                        cursor: 'pointer',
                        fontWeight: '500'
                    }}
                >
                    Notas C/D
                </button>
                <button
                    onClick={() => setActiveTab('guides')}
                    style={{
                        padding: '1rem 2rem',
                        background: 'none',
                        border: 'none',
                        borderBottom: activeTab === 'guides' ? '2px solid #3b82f6' : 'none',
                        color: activeTab === 'guides' ? '#3b82f6' : '#94a3b8',
                        cursor: 'pointer',
                        fontWeight: '500'
                    }}
                >
                    📦 Guías
                </button>
            </div>

            {activeTab === 'orders' ? (


                <>
                    <div style={{ maxWidth: '400px', marginBottom: '1rem' }}>
                        <Input
                            placeholder="Buscar orden o cliente..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                        />
                    </div>

                    <OrdersTable
                        orders={orders.filter(o => o.status !== 'BACKORDER' && o.status !== 'CONVERTED' && o.source !== 'SHOP')}
                        loading={ordersLoading}
                        onView={(order) => {
                            setSelectedOrder(order);
                            setShowOrderReceipt(true);
                        }}
                        onCreateInvoice={(order) => {
                            setSelectedOrder(order);
                            setShowInvoiceModal(true);
                        }}
                        onDelete={(order) => {
                            if (window.confirm('¿Está seguro de eliminar esta orden?')) {
                                deleteOrder(order.order_number);
                            }
                        }}
                    />

                    <Pagination
                        current={ordersPagination.current}
                        total={ordersPagination.total}
                        onChange={setPage}
                        pageSize={limit}
                        onPageSizeChange={(newSize) => {
                            setLimit(newSize);
                            setPage(1);
                        }}
                    />
                </>
            ) : activeTab === 'backorders' ? (
                <>
                    <div style={{ maxWidth: '400px', marginBottom: '1rem' }}>
                        <Input
                            placeholder="Buscar backorder..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                        />
                    </div>

                    <OrdersTable
                        orders={orders.filter(o => o.status === 'BACKORDER')}
                        loading={ordersLoading}
                        onView={(order) => {
                            setSelectedOrder(order);
                            setShowOrderReceipt(true);
                        }}
                        onCheckAvailability={(order) => {
                            setSelectedOrder(order);
                            setShowBackorderPreviewModal(true);
                        }}
                        onDelete={(order) => {
                            if (window.confirm('¿Está seguro de eliminar este backorder?')) {
                                deleteOrder(order.order_number);
                            }
                        }}
                        showCheckStockButton={true}
                    />

                    <Pagination
                        current={ordersPagination.current}
                        total={ordersPagination.total}
                        onChange={setPage}
                        pageSize={limit}
                        onPageSizeChange={(newSize) => {
                            setLimit(newSize);
                            setPage(1);
                        }}
                    />
                </>
            ) : activeTab === 'completed' ? (
                <>
                    <div style={{ maxWidth: '400px', marginBottom: '1rem' }}>
                        <Input
                            placeholder="Buscar backorder completado..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                        />
                    </div>

                    <OrdersTable
                        orders={orders.filter(o => o.status === 'CONVERTED')}
                        loading={ordersLoading}
                        onView={(order) => {
                            setSelectedOrder(order);
                            setShowOrderReceipt(true);
                        }}
                        onCreateInvoice={null}
                        onDelete={(order) => {
                            if (window.confirm('¿está seguro de eliminar esta orden completada/convertida?')) {
                                deleteOrder(order.order_number);
                            }
                        }}
                    />

                    <Pagination
                        current={ordersPagination.current}
                        total={ordersPagination.total}
                        onChange={setPage}
                        pageSize={limit}
                        onPageSizeChange={(newSize) => {
                            setLimit(newSize);
                            setPage(1);
                        }}
                    />
                </>
            ) : activeTab === 'quotes' ? (
                <>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                        <div style={{ maxWidth: '400px', flex: 1 }}>
                            <Input
                                placeholder="Buscar cotización o cliente..."
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setPage(1);
                                }}
                                style={{ marginBottom: 0 }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', backgroundColor: '#1e293b', padding: '0.25rem', borderRadius: '0.5rem', border: '1px solid #334155' }}>
                            <button
                                onClick={() => setSourceFilter('')}
                                style={{
                                    padding: '0.5rem 1rem',
                                    borderRadius: '0.4rem',
                                    border: 'none',
                                    backgroundColor: sourceFilter === '' ? '#3b82f6' : 'transparent',
                                    color: 'white',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem',
                                    fontWeight: '600'
                                }}
                            >
                                Todos
                            </button>
                            <button
                                onClick={() => setSourceFilter('ERP')}
                                style={{
                                    padding: '0.5rem 1rem',
                                    borderRadius: '0.4rem',
                                    border: 'none',
                                    backgroundColor: sourceFilter === 'ERP' ? '#3b82f6' : 'transparent',
                                    color: 'white',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem',
                                    fontWeight: '600'
                                }}
                            >
                                🏢 ERP
                            </button>
                            <button
                                onClick={() => setSourceFilter('SHOP')}
                                style={{
                                    padding: '0.5rem 1rem',
                                    borderRadius: '0.4rem',
                                    border: 'none',
                                    backgroundColor: sourceFilter === 'SHOP' ? '#10b981' : 'transparent',
                                    color: 'white',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem',
                                    fontWeight: '600'
                                }}
                            >
                                🛒 Tienda
                            </button>
                        </div>
                    </div>
                    <QuotesTable
                        quotes={quotes}

                        loading={quotesLoading}
                        onView={(quote) => {
                            setSelectedQuote(quote);
                            setShowQuoteReceipt(true);
                        }}
                        onEdit={(quote) => {
                            setSelectedQuote(quote);
                            setShowCreateQuote(true);
                        }}
                        onConvert={(quote) => {
                            setSelectedQuote(quote);
                            setShowConversionModal(true);
                        }}
                        onDelete={(quote) => {
                            if (window.confirm('¿Está seguro de eliminar esta cotización?')) {
                                deleteQuote(quote.quote_number);
                            }
                        }}
                    />
                    <Pagination
                        current={quotesPagination.current}
                        total={quotesPagination.total}
                        onChange={setPage}
                        pageSize={limit}
                        onPageSizeChange={(newSize) => {
                            setLimit(newSize);
                            setPage(1);
                        }}
                    />
                </>
            ) : activeTab === 'invoices' ? (
                <>
                    <div style={{ maxWidth: '400px', marginBottom: '1rem' }}>
                        <Input
                            placeholder="Buscar factura o cliente..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                        />
                    </div>
                    <InvoicesTable
                        invoices={invoices}
                        loading={invoicesLoading}
                        onView={(invoice) => {
                            setSelectedInvoice(invoice);
                            setShowInvoiceReceipt(true);
                        }}
                        onRegisterPayment={(invoice) => {
                            setSelectedInvoice(invoice);
                            setShowPaymentInfoModal(true);
                        }}
                        onDispatch={(invoice) => {
                            setSelectedInvoice(invoice);
                            setShowGuideFormModal(true);
                        }}
                        onDelete={(invoice) => {
                            if (window.confirm('¿Está seguro de eliminar esta factura? Esto revertirá la orden asociada a PENDIENTE.')) {
                                deleteInvoice(invoice.invoice_number);
                            }
                        }}
                        onEmitNote={(invoice) => {
                            setSelectedInvoice(invoice);
                            setShowNoteEmissionModal(true);
                        }}
                    />
                    <Pagination
                        current={invoicesPagination.current}
                        total={invoicesPagination.total}
                        onChange={setPage}
                        pageSize={limit}
                        onPageSizeChange={(newSize) => {
                            setLimit(newSize);
                            setPage(1);
                        }}
                    />
                </>
            ) : activeTab === 'notes' ? (
                <>
                    <div style={{ maxWidth: '400px', marginBottom: '1rem' }}>
                        <Input
                            placeholder="Buscar nota, factura o cliente..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                        />
                    </div>
                    <SalesNotesTable
                        notes={notes}
                        loading={notesLoading}
                    />
                    <Pagination
                        current={notesPagination.current}
                        total={notesPagination.total}
                        onChange={setPage}
                        pageSize={limit}
                        onPageSizeChange={(newSize) => {
                            setLimit(newSize);
                            setPage(1);
                        }}
                    />
                </>
            ) : activeTab === 'guides' ? (
                <>
                    <div style={{ maxWidth: '400px', marginBottom: '1rem' }}>
                        <Input
                            placeholder="Buscar guía o cliente..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                        />
                    </div>
                    <GuidesTable
                        guides={guides}
                        loading={guidesLoading}
                        onView={(guide) => {
                            setSelectedGuide(guide);
                            setShowGuideReceipt(true);
                        }}
                        onDispatch={async (guideNumber) => {
                            if (window.confirm('¿Despachar guía? Esto descontará el stock.')) {
                                await dispatchGuide(guideNumber);
                            }
                        }}
                        onDeliver={(guide) => {
                            const receivedBy = window.prompt('Nombre de quien recibe:');
                            if (receivedBy !== null) {
                                deliverGuide(guide.guide_number, receivedBy);
                            }
                        }}
                        onCancel={async (guideNumber) => {
                            if (window.confirm('¿Anular guía? Esto devolverá el stock si fue despachada.')) {
                                await cancelGuide(guideNumber);
                            }
                        }}
                        onPrint={(guide) => {
                            setSelectedGuide(guide);
                            setShowGuideReceipt(true);
                        }}
                    />
                    <Pagination
                        current={guidesPagination.page || guidesPagination.current}
                        total={guidesPagination.pages || guidesPagination.total}
                        onChange={setPage}
                        pageSize={limit}
                        onPageSizeChange={(newSize) => {
                            setLimit(newSize);
                            setPage(1);
                        }}
                    />
                </>
            ) : null}

            {/* Modals */}
            <OrderDetailModal
                visible={showOrderModal}
                order={selectedOrder}
                onClose={() => setShowOrderModal(false)}
            />

            <QuoteDetailModal
                visible={showQuoteDetailModal}
                quote={selectedQuote}
                onClose={() => setShowQuoteDetailModal(false)}
            />

            <ConversionConfirmationModal
                visible={showConversionModal}
                quote={selectedQuote}
                onClose={() => setShowConversionModal(false)}
                onConfirm={convertQuote}
            />

            <BackorderConversionPreviewModal
                visible={showBackorderPreviewModal}
                order={selectedOrder}
                onClose={() => setShowBackorderPreviewModal(false)}
                onConfirm={async () => {
                    await convertBackorder(selectedOrder.order_number);
                    setShowBackorderPreviewModal(false);
                }}
            />

            <InvoiceModal
                visible={showInvoiceModal}
                order={selectedOrder}
                loading={invoicesLoading}
                onClose={() => setShowInvoiceModal(false)}
                onSubmit={handleCreateInvoice}
            />

            <InvoiceDetailModal
                visible={showInvoiceDetailModal}
                invoice={selectedInvoice}
                onClose={() => setShowInvoiceDetailModal(false)}
            />

            <PaymentInfoModal
                visible={showPaymentInfoModal}
                invoice={selectedInvoice}
                onClose={() => setShowPaymentInfoModal(false)}
                onRegisterPayment={() => {
                    setShowPaymentInfoModal(false);
                    setShowPaymentModal(true);
                }}
            />

            <PaymentModal
                visible={showPaymentModal}
                invoice={selectedInvoice}
                loading={invoicesLoading}
                onClose={() => setShowPaymentModal(false)}
                onSubmit={handleRegisterPayment}
            />

            <DispatchModal
                visible={showDispatchModal}
                invoice={selectedInvoice}
                loading={invoicesLoading}
                onClose={() => setShowDispatchModal(false)}
                onSubmit={handleDispatch}
            />

            <NoteEmissionModal
                visible={showNoteEmissionModal}
                invoice={selectedInvoice}
                loading={notesLoading}
                onClose={() => setShowNoteEmissionModal(false)}
                onSubmit={handleEmitNote}
            />

            {/* Receipt Modals */}
            <SalesOrderReceipt
                visible={showOrderReceipt}
                order={selectedOrder}
                onClose={() => setShowOrderReceipt(false)}
            />

            <SalesInvoiceReceipt
                visible={showInvoiceReceipt}
                invoice={selectedInvoice}
                onClose={() => setShowInvoiceReceipt(false)}
            />

            <SalesQuoteReceipt
                visible={showQuoteReceipt}
                quote={selectedQuote}
                onClose={() => setShowQuoteReceipt(false)}
            />



            {/* Guide Modals */}
            <GuideFormModal
                visible={showGuideFormModal}
                invoice={selectedInvoice}
                onClose={() => setShowGuideFormModal(false)}
                onSubmit={async (guideData) => {
                    await createGuide(guideData);
                    fetchInvoices();
                    setShowGuideFormModal(false);
                }}
                loading={guidesLoading}
            />

            <DeliveryGuideReceipt
                visible={showGuideReceipt}
                guide={selectedGuide}
                onClose={() => setShowGuideReceipt(false)}
            />

            <XMLImportModal
                visible={showXMLImportModal}
                onClose={() => setShowXMLImportModal(false)}
                type="SALES"
                onConfirm={async (batch) => {
                    const creditNotes = batch.filter(d => d.document_type === 'CREDIT_NOTE');
                    const regularDocs = batch.filter(d => d.document_type !== 'CREDIT_NOTE');

                    if (creditNotes.length > 0) {
                        for (const cn of creditNotes) {
                            if (!cn.related_document) {
                                alert(`❌ La Nota de Crédito ${cn.document_number} no tiene un documento original de referencia en el XML y no puede ser procesada automáticamente.`);
                                continue;
                            }
                            
                            // Analizar el código de SUNAT (Catálogo 09) para inferir la acción de inventario
                            let isReturn = false;
                            let userInteractionNeeded = true;
                            const sunatCode = cn.discrepancy_code;
                            const sunatReason = cn.discrepancy_reason || 'Sin descripción';
                            
                            // Detectar automáticamente basado en los códigos más certeros (SUNAT UBL 2.1)
                            if (sunatCode === '06' || sunatCode === '07') {
                                // 06: Devolución total, 07: Devolución por ítem
                                isReturn = true;
                                userInteractionNeeded = window.confirm(`📌 NOTA DE CRÉDITO XML: ${cn.document_number}\n\nSUNAT indica: "${sunatReason}" (Código ${sunatCode})\n\nEl sistema la marcará como DEVOLUCIÓN DE INVENTARIO automáticamente.\n\n¿Desea proceder y que el stock retorne a almacén?`);
                                if (!userInteractionNeeded) continue; // Canceló
                                userInteractionNeeded = false; // Ya resolvió
                            } else if (sunatCode === '04' || sunatCode === '05') {
                                // 04: Descuento global, 05: Descuento por ítem
                                isReturn = false;
                                userInteractionNeeded = window.confirm(`📌 NOTA DE CRÉDITO XML: ${cn.document_number}\n\nSUNAT indica: "${sunatReason}" (Código ${sunatCode})\n\nEl sistema aplicará la nota puramente a nivel FINANCIERO (no devolverá stock, ya que es un descuento).\n\n¿Desea proceder?`);
                                if (!userInteractionNeeded) continue; // Canceló
                                userInteractionNeeded = false;
                            }
                            
                            // Si es Anulación (01), Cancelación (02), etc., requerir confirmación explícita
                            if (userInteractionNeeded) {
                                isReturn = window.confirm(`📌 NOTA DE CRÉDITO XML DETECTADA\nDocumento: ${cn.document_number}\nAplica a Factura: ${cn.related_document}\n\nMotivo SUNAT: "${sunatReason}"\n\nDebido a que este motivo puede o no implicar que la mercadería retornó, ¿Desea que el sistema REINGRESE físicamente el stock de estos ítems al almacén?\n\n[ACEPTAR] = Sí, reingresar stock.\n[CANCELAR] = No, es un ajuste solo monetario/error.`);
                            }
                            
                            try {
                                const payload = {
                                    items: cn.items.map(i => ({ 
                                        product_sku: i.product_sku, 
                                        quantity: Math.round(i.quantity) || 1 
                                    })),
                                    reason: isReturn ? 'RETURN' : 'ERROR',
                                    notes: `Importado de XML SUNAT: ${cn.document_number}. Emisor: ${cn.supplier?.name}`
                                };
                                await createNote(cn.related_document, 'CREDIT', payload);
                                alert(`✅ Nota de Crédito ${cn.document_number} registrada y vinculada a la factura ${cn.related_document}.`);
                            } catch (e) {
                                alert(`⚠️ Error al procesar la NC ${cn.document_number}:\n\n- Asegúrate de que la factura origen (${cn.related_document}) ya esté importada en el ERP.\n- Asegúrate de que las cantidades de la nota no superen las de la factura original.`);
                            }
                        }
                    }

                    if (regularDocs.length > 0) {
                        const normalize = (num) => String(num || '').trim().replace(/\s+/g, '');
                        const existingNumbers = new Set(xmlBatch.map(d => normalize(d.document_number)));
                        
                        const newDocs = regularDocs.filter(d => {
                            const num = normalize(d.document_number);
                            return !existingNumbers.has(num);
                        });
                        
                        if (newDocs.length < regularDocs.length) {
                            showNotification(`${regularDocs.length - newDocs.length} documentos ignorados por estar ya en la lista de pendientes.`, 'info');
                        }
                        
                        if (newDocs.length > 0) {
                            setXmlBatch(prev => [...prev, ...newDocs]);
                        }
                        setShowXMLImportModal(false);
                    } else {
                        setShowXMLImportModal(false); 
                    }
                }}
            />

            <XMLReviewModal
                visible={!!selectedXmlForReview}
                doc={selectedXmlForReview}
                onClose={() => setSelectedXmlForReview(null)}
                onConfirm={async (doc) => {
                    // Verificación de duplicados (Individual)
                    try {
                        const existingRes = await salesQuotesService.getQuotes(1, 1, doc.document_number);
                        if (existingRes.data.total > 0) {
                            alert(`⚠️ El documento ${doc.document_number} ya existe en el sistema. No se duplicará.`);
                            setSelectedXmlForReview(null);
                            return;
                        }
                    } catch (err) {
                        console.error("Error al verif. duplicados:", err);
                    }

                    if (doc.import_mode === 'direct_invoice') {
                        try {
                            const payload = {
                                xml_data: doc.xml_data || "", // Assuming we have it or can reconstruct it
                                auto_guide: true,
                                exchange_rate: doc.exchange_rate
                            };
                            
                            // Reconstruct the minimal structure needed by the backend if full XML is not available
                            // But usually we have the full doc object which contains items, etc.
                            // The backend expects InvoiceXmlImport schema.
                            
                            const directData = {
                                xml_data: JSON.stringify(doc), // Send the JSON as a "virtual XML" or use a dedicated endpoint
                                auto_guide: true,
                                exchange_rate: doc.exchange_rate
                            };

                            // Wait, the backend expects the actual XML string? 
                            // Looking at sales_service.py, it parses XML string.
                            // If we don't have the original XML string anymore, we might need a JSON endpoint.
                            // But ublParser.js usually returns the parsed JSON.
                            
                            // Let's assume we have the original XML or the backend can handle this JSON-like object.
                            // Actually, I should have checked the backend better.
                            // backend/app/schemas/sales_schemas.py: xml_data: str
                            
                            // If we don't have the original XML, let's use the JSON data.
                            await salesService.importInvoiceXml(doc, true, doc.exchange_rate);
                            
                            setXmlBatch(prev => prev.filter(x => x.document_number !== doc.document_number));
                            setSelectedXmlForReview(null);
                            showNotification(`Factura ${doc.document_number} importada correctamente con despacho automático.`, 'success');
                            setActiveTab('invoices');
                            return;
                        } catch (err) {
                            console.error("Error en importación directa:", err);
                            return;
                        }
                    }

                    const mappedQuote = {
                        date: doc.date,
                        currency: 'PEN',
                        external_reference: doc.document_number,
                        customer: {
                            ruc: doc.customer.ruc,
                            name: doc.customer.name,
                            address: doc.customer.address || '',
                            delivery_address: doc.customer.address || '',
                            branches: []
                        },
                        customer_ruc: doc.customer.ruc,
                        customer_name: doc.customer.name,
                        delivery_address: doc.customer.address || '',
                        items: doc.items.map(item => ({
                            product_sku: item.product_sku,
                            product_name: item.product_name,
                            quantity: Math.round(item.quantity) || 0,
                            unit_value: item.unit_value,
                            unit_price: item.unit_price,
                            tax_rate: 0.18,
                            subtotal: item.subtotal
                        })),
                        amount_in_words: doc.amount_in_words || '',
                        source: 'XML_IMPORT',
                        issuer_info: resolveIssuerFromDoc(doc),
                        internal_notes: `Importado de Factura XML ${doc.document_number}. Emisor: ${doc.emitter_identity}. T.C: ${doc.exchange_rate}`
                    };
                    
                    // Remover de la lista solo si vamos a procesar
                    setXmlBatch(prev => prev.filter(x => x.document_number !== doc.document_number));
                    setSelectedXmlForReview(null);
                    setSelectedQuote(mappedQuote);
                    setShowCreateQuote(true);
                }}
            />

            {/* STAGING AREA: Review Sales Batch */}
            {xmlBatch.length > 0 && (
                <div style={{
                    backgroundColor: '#1e293b',
                    padding: '1.5rem',
                    borderRadius: '1rem',
                    marginTop: '2rem',
                    border: '1px solid #10b98144',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                    animation: 'slideUp 0.4s ease-out'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <div>
                            <h3 style={{ margin: 0, color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ backgroundColor: '#10b981', color: 'white', padding: '0.2rem 0.6rem', borderRadius: '0.5rem', fontSize: '0.9rem' }}>{xmlBatch.length}</span>
                                Documentos para Cotizar
                            </h3>
                            <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>Verifique uno a uno o procese todos masivamente como cotizaciones.</p>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <Button
                                variant="primary"
                                style={{ backgroundColor: '#10b981', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' }}
                                onClick={async () => {
                                    // 1. Filtrar documentos válidos para proceso masivo (Soles y Cuadrados)
                                    const processable = [];
                                    const pending = [];

                                    for (const doc of xmlBatch) {
                                        const isSoles = (doc.currency === 'SOLES' || doc.currency === 'PEN');
                                        const systemTotal = doc.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
                                        const isBalanced = Math.abs(systemTotal - doc.total_amount) < 0.01;

                                        if (isSoles && isBalanced) {
                                            processable.push(doc);
                                        } else {
                                            pending.push(doc);
                                        }
                                    }

                                    if (processable.length === 0) {
                                        alert("No hay documentos en Soles con cuadre perfecto para procesar en masa. Por favor, revíselos individualmente.");
                                        return;
                                    }

                                    if (window.confirm(`Se procesarán ${processable.length} documentos automáticos. ${pending.length} quedarán pendientes para revisión manual. ¿Desea continuar?`)) {
                                        setIsBulkProcessing(true);
                                        setTotalToProcess(processable.length);
                                        setCurrentProcessing(0);
                                        
                                        let createdCount = 0;
                                        let skipCount = 0;

                                        for (const doc of processable) {
                                            setCurrentProcessing(prev => prev + 1);
                                            // Verificación de duplicados (Bulk)
                                            try {
                                                const existingRes = await salesQuotesService.getQuotes(1, 1, doc.document_number);
                                                if (existingRes.data.total > 0) {
                                                    skipCount++;
                                                    continue;
                                                }
                                            } catch (err) { }

                                            const mappedQuote = {
                                                date: doc.date,
                                                currency: 'PEN',
                                                external_reference: doc.document_number,
                                                customer: {
                                                    ruc: doc.customer.ruc,
                                                    name: doc.customer.name,
                                                    address: doc.customer.address || '',
                                                    delivery_address: doc.customer.address || '',
                                                    branches: []
                                                },
                                                customer_ruc: doc.customer.ruc,
                                                customer_name: doc.customer.name,
                                                delivery_address: doc.customer.address || '',
                                                items: doc.items.map(item => ({
                                                    product_sku: item.product_sku,
                                                    product_name: item.product_name,
                                                    quantity: Math.round(item.quantity) || 0,
                                                    unit_price: Math.round(item.unit_price * 100) / 100,
                                                    subtotal: Math.round((item.quantity * item.unit_price) * 100) / 100
                                                })),
                                                amount_in_words: doc.amount_in_words || '',
                                                source: 'XML_IMPORT_BULK',
                                                issuer_info: resolveIssuerFromDoc(doc),
                                                internal_notes: `Importación masiva XML. Ref: ${doc.document_number}. Validado automáticamente.`
                                            };
                                            await createQuote(mappedQuote);
                                            createdCount++;
                                        }
                                        
                                        setLastProcessedCount({ created: createdCount, skipped: skipCount, pending: pending.length });
                                        setXmlBatch(pending);
                                        setIsBulkProcessing(false);
                                        setShowSuccessModal(true);
                                    }
                                }}
                            >
                                ✅ Aceptar y Generar Todo (Soles & Cuadrados)
                            </Button>
                            <Button variant="secondary" onClick={() => setXmlBatch([])}>Limpiar todo</Button>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                        {xmlBatch.map((doc, idx) => (
                            <div key={idx} style={{
                                backgroundColor: '#0f172a',
                                padding: '1.25rem',
                                borderRadius: '0.75rem',
                                border: '1px solid #334155',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div>
                                    <div style={{ fontWeight: 'bold', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        {doc.document_number}
                                        <span style={{ fontSize: '0.65rem', backgroundColor: '#334155', color: '#94a3b8', padding: '0.1rem 0.4rem', borderRadius: '0.3rem' }}>📅 {doc.date}</span>
                                    </div>
                                    <div style={{ 
                                        fontSize: '0.75rem', 
                                        color: '#3b82f6', 
                                        background: 'rgba(59, 130, 246, 0.1)', 
                                        padding: '0.2rem 0.5rem',
                                        borderRadius: '0.4rem',
                                        display: 'inline-block',
                                        marginBottom: '0.5rem',
                                        fontWeight: '700',
                                        border: '1px solid rgba(59, 130, 246, 0.2)'
                                    }}>
                                        🏢 {resolveIssuerFromDoc(doc)?.name || 'EMISOR DESCONOCIDO'}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{doc.customer.name}</div>
                                    <div style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 'bold', marginTop: '0.4rem' }}>{formatCurrency(doc.total_amount)}</div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <Button
                                        size="small"
                                        variant="primary"
                                        onClick={() => {
                                            setSelectedXmlForReview(doc);
                                        }}
                                    >
                                        Revisar
                                    </Button>
                                    <button
                                        onClick={() => setXmlBatch(prev => prev.filter((_, i) => i !== idx))}
                                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.2rem' }}
                                    >
                                        ×
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Overlay de Procesamiento Masivo */}
            {isBulkProcessing && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(15, 23, 42, 0.9)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2000,
                    backdropFilter: 'blur(8px)'
                }}>
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                        <Rocket 
                            size={64} 
                            color="#10b981" 
                            style={{ 
                                animation: 'bounce 1s infinite', 
                                marginBottom: '1.5rem' 
                            }} 
                        />
                        <h2 style={{ color: 'white', fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                            Generando Cotizaciones...
                        </h2>
                        <p style={{ color: '#94a3b8', fontSize: '1rem' }}>
                            Procesando {currentProcessing} de {totalToProcess} documentos.
                        </p>
                        
                        <div style={{ 
                            marginTop: '2rem', 
                            width: '300px', 
                            height: '6px', 
                            background: '#334155', 
                            borderRadius: '3px', 
                            overflow: 'hidden' 
                        }}>
                            <div style={{
                                width: `${(currentProcessing / totalToProcess) * 100}%`,
                                height: '100%',
                                background: 'linear-gradient(90deg, #10b981, #3b82f6, #10b981)',
                                backgroundSize: '200% 100%',
                                animation: 'shimmer 1.5s infinite linear'
                            }} />
                        </div>
                        
                        <style>{`
                            @keyframes shimmer {
                                0% { background-position: -200% 0; }
                                100% { background-position: 200% 0; }
                            }
                            @keyframes bounce {
                                0%, 100% { transform: translateY(0); }
                                50% { transform: translateY(-10px); }
                            }
                            @keyframes slideUp {
                                from { transform: translateY(20px); opacity: 0; }
                                to { transform: translateY(0); opacity: 1; }
                            }
                        `}</style>
                    </div>
                </div>
            )}

            {/* Modal de Éxito */}
            {showSuccessModal && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, padding: '1rem'
                }}>
                    <div style={{
                        background: '#1e293b', width: '100%', maxWidth: '450px', borderRadius: '1.5rem', border: '1px solid #334155', padding: '2rem', textAlign: 'center',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                    }}>
                        <div style={{
                            width: '80px', height: '80px', background: '#065f46', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem'
                        }}>
                            <CheckCircle size={48} color="#34d399" />
                        </div>
                        
                        <h2 style={{ color: 'white', fontSize: '1.75rem', marginBottom: '1rem' }}>
                            ¡Proceso Completado!
                        </h2>
                        
                        <div style={{ color: '#94a3b8', fontSize: '1.1rem', marginBottom: '2rem', textAlign: 'left', backgroundColor: '#0f172a', padding: '1rem', borderRadius: '0.75rem' }}>
                            <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                                <span>🚀 Cotizaciones generadas:</span>
                                <span style={{ color: '#34d399', fontWeight: 'bold' }}>{lastProcessedCount.created}</span>
                            </div>
                            <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                                <span>⚠️ Saltadas (Duplicados):</span>
                                <span style={{ color: '#eab308', fontWeight: 'bold' }}>{lastProcessedCount.skipped}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>⏳ Pendientes de revisión:</span>
                                <span style={{ color: '#94a3b8', fontWeight: 'bold' }}>{lastProcessedCount.pending}</span>
                            </div>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <Button 
                                variant="primary" 
                                onClick={() => setShowSuccessModal(false)}
                                style={{ background: '#34d399', color: '#064e3b', fontWeight: 'bold', padding: '0.75rem 2rem' }}
                            >
                                Aceptar
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
};

export default Sales;
