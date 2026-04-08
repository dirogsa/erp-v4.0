import React, { useState } from 'react';
import DualReceiptWrapper from '../../common/receipt/DualReceiptWrapper';
import PrintableModal from '../../common/receipt/PrintableModal';
import ReceiptTemplate from '../../common/receipt/ReceiptTemplate';
import SunatInvoiceTemplate from '../../common/receipt/SunatInvoiceTemplate';

const SalesInvoiceReceipt = ({
    visible,
    onClose,
    invoice
}) => {
    const [printFormat, setPrintFormat] = useState('A5_SINGLE');

    // All hooks MUST be called before any conditional return
    const partyInfo = invoice ? {
        name: invoice.customer_name,
        ruc: invoice.customer_ruc,
        address: invoice.delivery_address,
        branchName: invoice.delivery_branch_name
    } : {};

    if (!visible || !invoice) return null;

    const renderContent = () => {
        if (printFormat === 'SUNAT') {
            return (
                <SunatInvoiceTemplate
                    documentType="FACTURA ELECTRONICA"
                    documentNumber={invoice.sunat_number}
                    internalId={invoice.invoice_number}
                    documentDate={invoice.invoice_date}
                    partyInfo={partyInfo}
                    items={invoice.items?.map(item => ({
                        ...item,
                        subtotal: item.subtotal || (item.quantity * item.unit_price)
                    })) || []}
                    totalAmount={invoice.total_amount}
                    currency={invoice.currency}
                    amountInWords={invoice.amount_in_words || ''}
                    companyName={invoice.issuer_info?.name}
                    companyRuc={invoice.issuer_info?.ruc}
                    companyAddress={invoice.issuer_info?.address}
                />
            );
        }

        return (
            <DualReceiptWrapper format={printFormat}>
                <div className="receipt-content">
                    <ReceiptTemplate
                        documentType="FACTURA DE VENTA"
                        documentNumber={invoice.sunat_number}
                        internalId={invoice.invoice_number}
                        documentDate={invoice.invoice_date}
                        partyInfo={partyInfo}
                        partyType="Cliente"
                        items={invoice.items?.map(item => ({
                            ...item,
                            subtotal: item.subtotal || (item.quantity * item.unit_price)
                        })) || []}
                        totalAmount={invoice.total_amount}
                        currency={invoice.currency}
                        showPaymentDetails={false}
                        amountInWords={invoice.amount_in_words || ''}
                        paymentTerms={invoice.payment_terms}
                        requestedBy={invoice.requested_by}
                        companyName={invoice.issuer_info?.name}
                        companyRuc={invoice.issuer_info?.ruc}
                        companyAddress={invoice.issuer_info?.address}
                        companyPhone={invoice.issuer_info?.phone}
                        companyBankName={invoice.issuer_info?.bank_name}
                        companyAccountSoles={invoice.issuer_info?.account_soles}
                        companyAccountDollars={invoice.issuer_info?.account_dollars}
                    />
                </div>
            </DualReceiptWrapper>
        );
    };

    return (
        <PrintableModal
            visible={visible}
            onClose={onClose}
            title={`Factura de Venta ${invoice.invoice_number}`}
            onFormatChange={setPrintFormat}
        >
            {renderContent()}
        </PrintableModal>
    );
};

export default SalesInvoiceReceipt;
