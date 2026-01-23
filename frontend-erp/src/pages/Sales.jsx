import React, { useState } from 'react';
import Button from '../components/common/Button';
import Loading from '../components/common/Loading';
import Input from '../components/common/Input';
import OrderForm from '../components/forms/OrderForm';
import OrdersTable from '../components/features/sales/OrdersTable';
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

const Sales = () => {
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

    const [sourceFilter, setSourceFilter] = useState('');

    // Hooks
    const {
        orders,
        pagination,
        loading: ordersLoading,
        createOrder,
        deleteOrder,
        convertBackorder
    } = useSalesOrders({ page, limit, search });

    const {
        invoices,
        loading: invoicesLoading,
        createInvoice,
        registerPayment,
        createDispatchGuide,
        deleteInvoice,
        fetchInvoices
    } = useSalesInvoices();

    const {
        quotes,
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


    const {
        notes,
        loading: notesLoading,
        createNote
    } = useSalesNotes({ page, limit, search });

    const {
        guides,
        loading: guidesLoading,
        createGuide,
        dispatchGuide,
        deliverGuide,
        cancelGuide
    } = useDeliveryGuides({ page, limit, search });

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
                        onSubmit={selectedQuote ? handleUpdateQuote : handleCreateQuote}
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
                        current={pagination.current}
                        total={pagination.total}
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
                        current={pagination.current}
                        total={pagination.total}
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
                        current={pagination.current}
                        total={pagination.total}
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
                        current={pagination.current}
                        total={pagination.total}
                        onChange={setPage}
                        pageSize={limit}
                        onPageSizeChange={(newSize) => {
                            setLimit(newSize);
                            setPage(1);
                        }}
                    />
                </>
            ) : activeTab === 'invoices' ? (
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
                        current={pagination.current}
                        total={pagination.total}
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
                        current={pagination.current}
                        total={pagination.total}
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
                onConfirm={(data) => {
                    // Map XML data to Quote form structure
                    const mappedQuote = {
                        customer: {
                            ruc: data.customer.ruc,
                            name: data.customer.name,
                            address: '', // To be filled or fetched
                            branches: []
                        },
                        customer_ruc: data.customer.ruc,
                        customer_name: data.customer.name,
                        items: data.items.map(item => ({
                            product_sku: item.product_sku,
                            product_name: item.product_name,
                            quantity: item.quantity,
                            unit_price: item.unit_price // Net price (15.25)
                        }))
                    };
                    setSelectedQuote(mappedQuote);
                    setShowCreateQuote(true);
                }}
            />
        </div >
    );
};

export default Sales;
