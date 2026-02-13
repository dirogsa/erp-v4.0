import React from 'react';
import DualReceiptWrapper from '../../common/receipt/DualReceiptWrapper';
import PrintableModal from '../../common/receipt/PrintableModal';
import ReceiptTemplate from '../../common/receipt/ReceiptTemplate';

const SalesInvoiceReceipt = ({
    visible,
    onClose,
    invoice
}) => {
    if (!visible || !invoice) return null;

    // Prepare party info
    const partyInfo = {
        name: invoice.customer_name,
        ruc: invoice.customer_ruc,
        address: invoice.delivery_address,
        branchName: invoice.delivery_branch_name
    };

    return (
        <PrintableModal
            visible={visible}
            onClose={onClose}
            title={`Factura de Venta ${invoice.invoice_number}`}
        >
            <DualReceiptWrapper>
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
                        showPaymentDetails={false}
                        amountInWords={invoice.amount_in_words || ''}
                        paymentTerms={invoice.payment_terms}
                        requestedBy={invoice.requested_by}
                        // Issuer Info (Snapshot) - Fallback to defaults (defined in ReceiptHeader) if missing
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
        </PrintableModal>
    );
};

export default SalesInvoiceReceipt;
