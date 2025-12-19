import React from 'react';
import PrintableModal from '../../common/receipt/PrintableModal';
import ReceiptTemplate from '../../common/receipt/ReceiptTemplate';
import DualReceiptWrapper from '../../common/receipt/DualReceiptWrapper';

const SalesQuoteReceipt = ({
    visible,
    onClose,
    quote
}) => {
    if (!visible || !quote) return null;

    // Prepare party info
    const partyInfo = {
        name: quote.customer_name,
        ruc: quote.customer_ruc,
        address: quote.delivery_address,
        branchName: quote.delivery_branch_name
    };

    return (
        <PrintableModal
            visible={visible}
            onClose={onClose}
            title={`Cotización ${quote.quote_number}`}
        >
            <DualReceiptWrapper>
                <div className="receipt-content">
                    <ReceiptTemplate
                        documentType="COTIZACIÓN"
                        documentNumber={quote.quote_number}
                        documentDate={quote.date}
                        partyInfo={partyInfo}
                        partyType="Cliente"
                        items={quote.items?.map(item => ({
                            ...item,
                            subtotal: item.subtotal || (item.quantity * item.unit_price)
                        })) || []}
                        totalAmount={quote.total_amount}
                        showPaymentDetails={false}
                        notes={quote.notes}
                        // Issuer Info (Snapshot)
                        companyName={quote.issuer_info?.name}
                        companyRuc={quote.issuer_info?.ruc}
                        companyAddress={quote.issuer_info?.address}
                        companyPhone={quote.issuer_info?.phone}
                        companyBankName={quote.issuer_info?.bank_name}
                        companyAccountSoles={quote.issuer_info?.account_soles}
                        companyAccountDollars={quote.issuer_info?.account_dollars}
                    />
                </div>
            </DualReceiptWrapper>
        </PrintableModal>
    );
};

export default SalesQuoteReceipt;
