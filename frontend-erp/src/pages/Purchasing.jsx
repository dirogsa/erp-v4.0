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
import Pagination from '../components/common/Table/Pagination';
import { usePurchaseOrders } from '../hooks/usePurchaseOrders';

import { usePurchaseInvoices } from '../hooks/usePurchaseInvoices';
import { usePurchaseQuotes } from '../hooks/usePurchaseQuotes';
import PurchaseQuotesTable from '../components/features/purchasing/PurchaseQuotesTable';
import PurchaseQuoteForm from '../components/forms/PurchaseQuoteForm';
import PurchaseQuoteDetailModal from '../components/features/purchasing/PurchaseQuoteDetailModal';
import XMLImportModal from '../components/common/XMLImportModal';
import { formatCurrency } from '../utils/formatters';

const Purchasing = () => {
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
    const [showXMLImportModal, setShowXMLImportModal] = useState(false);
    const [xmlBatch, setXmlBatch] = useState([]); // New state for staging area

    // Hooks
    const {
        orders,
        pagination,
        loading: ordersLoading,
        createOrder,
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

    const handleReception = async (receptionData) => {
        try {
            await registerReception(selectedInvoice.invoice_number, receptionData);
            setShowReceptionModal(false);
        } catch (error) {
            // Error handled by hook
        }
    };

    const handleCreateQuote = async (quoteData) => {
        try {
            await createQuote(quoteData);
            setShowCreateQuote(false);
        } catch (error) {
            // Error handled by hook
        }
    };

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
                    Solicitudes (RFQ)
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
                    Órdenes de Compra
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
                    Facturas de Proveedores
                </button>
            </div>

            {activeTab === 'orders' ? (
                <>
                    <div style={{ maxWidth: '400px', marginBottom: '1rem' }}>
                        <Input
                            placeholder="Buscar orden o proveedor..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                        />
                    </div>

                    <PurchaseOrdersTable
                        orders={orders}
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
            ) : activeTab === 'quotes' ? (
                <>
                    <div style={{ maxWidth: '400px', marginBottom: '1rem' }}>
                        <Input
                            placeholder="Buscar solicitud o proveedor..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                        />
                    </div>
                    <PurchaseQuotesTable
                        quotes={quotes}
                        loading={quotesLoading}
                        onView={(quote) => {
                            setSelectedQuote(quote);
                            setShowQuoteDetailModal(true);
                        }}
                        onConvert={async (quote) => {
                            if (window.confirm(`¿Convertir solicitud ${quote.quote_number} a Orden de Compra?`)) {
                                await convertQuote(quote.quote_number);
                            }
                        }}
                        onDelete={(quote) => {
                            if (window.confirm('¿Está seguro de eliminar esta solicitud?')) {
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
            ) : (
                <PurchaseInvoicesTable
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
                    onReceive={(invoice) => {
                        setSelectedInvoice(invoice);
                        setShowReceptionModal(true);
                    }}
                    onDelete={(invoice) => {
                        if (window.confirm('¿Está seguro de eliminar esta factura? Esto revertirá la orden asociada a PENDIENTE.')) {
                            deleteInvoice(invoice.invoice_number);
                        }
                    }}
                />
            )}

            {/* Modals */}
            <InvoiceModal
                visible={showInvoiceModal}
                order={selectedOrder}
                loading={invoicesLoading}
                onClose={() => setShowInvoiceModal(false)}
                onSubmit={handleCreateInvoice}
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

            <ReceptionModal
                visible={showReceptionModal}
                invoice={selectedInvoice}
                loading={invoicesLoading}
                onClose={() => setShowReceptionModal(false)}
                onSubmit={handleReception}
            />

            {/* Receipt Modals */}
            <PurchaseOrderReceipt
                visible={showOrderReceipt}
                order={selectedOrder}
                onClose={() => setShowOrderReceipt(false)}
            />

            <PurchaseInvoiceReceipt
                visible={showInvoiceReceipt}
                invoice={selectedInvoice}
                onClose={() => setShowInvoiceReceipt(false)}
            />


            {/* Quote Modals */}
            <PurchaseQuoteDetailModal
                visible={showQuoteDetailModal}
                quote={selectedQuote}
                onClose={() => setShowQuoteDetailModal(false)}
            />

            {showCreateQuote && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000,
                    padding: '2rem', overflowY: 'auto'
                }}>
                    <div style={{
                        backgroundColor: '#0f172a', padding: '2rem', borderRadius: '0.5rem',
                        maxWidth: '900px', margin: '0 auto'
                    }}>
                        <h2 style={{ color: 'white', marginTop: 0 }}>Nueva Solicitud de Cotización</h2>
                        <PurchaseQuoteForm
                            initialData={selectedQuote}
                            onSubmit={handleCreateQuote}
                            onCancel={() => {
                                setShowCreateQuote(false);
                                setSelectedQuote(null);
                            }}
                            loading={quotesLoading}
                        />
                    </div>
                </div>
            )}

            <XMLImportModal
                visible={showXMLImportModal}
                onClose={() => setShowXMLImportModal(false)}
                type="PURCHASE"
                onConfirm={(batch) => {
                    if (batch.length === 1) {
                        const data = batch[0];
                        const mappedQuote = {
                            date: data.date,
                            currency: data.currency,
                            supplier: {
                                ruc: data.supplier.ruc,
                                name: data.supplier.name,
                                address: data.supplier.address
                            },
                            supplier_name: data.supplier.name,
                            items: data.items.map(item => ({
                                product_sku: item.product_sku,
                                product_name: item.product_name,
                                quantity: item.quantity,
                                unit_cost: item.unit_price,
                                subtotal: item.subtotal
                            })),
                            amount_in_words: data.amount_in_words || ''
                        };
                        setSelectedQuote(mappedQuote);
                        setShowCreateQuote(true);
                    } else {
                        setXmlBatch(batch);
                    }
                }}
            />

            {/* STAGING AREA: Review Batch before importing */}
            {xmlBatch.length > 0 && (
                <div style={{
                    backgroundColor: '#1e293b',
                    padding: '1.5rem',
                    borderRadius: '1rem',
                    marginBottom: '2rem',
                    border: '1px solid #3b82f644',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                    animation: 'slideDown 0.4s ease-out'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <div>
                            <h3 style={{ margin: 0, color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ backgroundColor: '#3b82f6', color: 'white', padding: '0.2rem 0.6rem', borderRadius: '0.5rem', fontSize: '0.9rem' }}>{xmlBatch.length}</span>
                                Facturas Pendientes de Revisión
                            </h3>
                            <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>Confirme o edite cada una antes de guardarlas en el sistema.</p>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <Button variant="secondary" onClick={() => setXmlBatch([])} style={{ fontSize: '0.8rem' }}>Cancelar Todo</Button>
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
                                    <div style={{ fontWeight: 'bold', color: 'white' }}>{doc.document_number}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{doc.supplier.name}</div>
                                    <div style={{ fontSize: '0.85rem', color: '#60a5fa', fontWeight: 'bold', marginTop: '0.4rem' }}>{formatCurrency(doc.total_amount)}</div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <Button
                                        size="small"
                                        variant="primary"
                                        onClick={() => {
                                            const mappedQuote = {
                                                date: doc.date,
                                                currency: doc.currency,
                                                supplier: { ruc: doc.supplier.ruc, name: doc.supplier.name, address: doc.supplier.address },
                                                supplier_name: doc.supplier.name,
                                                items: doc.items.map(item => ({
                                                    product_sku: item.product_sku,
                                                    product_name: item.product_name,
                                                    quantity: item.quantity,
                                                    unit_cost: item.unit_price,
                                                    subtotal: item.subtotal
                                                })),
                                                amount_in_words: doc.amount_in_words || ''
                                            };
                                            setSelectedQuote(mappedQuote);
                                            setShowCreateQuote(true);
                                            // Optional: remove from batch after opening
                                            setXmlBatch(prev => prev.filter((_, i) => i !== idx));
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
        </div>
    );
};

export default Purchasing;
