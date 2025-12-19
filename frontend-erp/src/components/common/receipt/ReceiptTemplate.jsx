import React from 'react';
import ReceiptHeader from './ReceiptHeader';
import ReceiptBody from './ReceiptBody';
import ReceiptFooter from './ReceiptFooter';
import './receipt.css';

const ReceiptTemplate = ({
    documentType,
    documentNumber,
    documentDate,
    partyInfo,
    partyType = "Cliente",
    items = [],
    totalAmount,
    amountPaid = 0,
    payments = [],
    notes,
    showPaymentDetails = false,
    companyName,
    companyRuc,
    companyAddress,

    companyPhone,
    companyBankName,
    companyAccountSoles,
    companyAccountDollars,
    currency = "SOLES",
    amountInWords = "",
    paymentTerms = null
}) => {
    return (
        <div className="receipt-container">
            <ReceiptHeader
                documentType={documentType}
                documentNumber={documentNumber}
                documentDate={documentDate}
                companyName={companyName}
                companyRuc={companyRuc}
                companyAddress={companyAddress}
                companyPhone={companyPhone}
                companyBankName={companyBankName}
                companyAccountSoles={companyAccountSoles}
                companyAccountDollars={companyAccountDollars}
                customerName={partyInfo?.name}
                customerRuc={partyInfo?.ruc}
                customerAddress={partyInfo?.address}
                currency={currency}
                amountInWords={amountInWords}
                paymentTerms={paymentTerms}
            />

            <ReceiptBody
                partyInfo={partyInfo}
                partyType={partyType}
                items={items}
            />

            <ReceiptFooter
                totalAmount={totalAmount}
                amountPaid={amountPaid}
                payments={payments}
                notes={notes}
                showPaymentDetails={showPaymentDetails}
                paymentTerms={paymentTerms}
            />
        </div>
    );
};

export default ReceiptTemplate;
