import React from 'react';
import ReceiptHeader from './ReceiptHeader';
import ReceiptBody from './ReceiptBody';
import ReceiptFooter from './ReceiptFooter';
import './receipt.css';

import { numberToWords } from '../../../utils/numberToWords';

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
    currency = "SOLES", // Moneda original del documento (usualmente SOLES)
    amountInWords = "",
    paymentTerms = null,

    // Props inyectados por PrintableModal para conversión visual
    targetCurrency = 'PEN',
    exchangeRate = 1
}) => {
    // Lógica de Conversión de Moneda (Solo Visual)
    const isConverting = targetCurrency === 'USD' && exchangeRate > 0;

    // Función helper para convertir montos
    const convert = (amount) => {
        if (!amount) return 0;
        return isConverting ? (amount / exchangeRate) : amount;
    };

    // 1. Recalculate Totals
    const displayTotalAmount = convert(totalAmount);
    const displayAmountPaid = convert(amountPaid);

    // 2. Recalculate Items
    const displayItems = items.map(item => ({
        ...item,
        unit_price: convert(item.unit_price),
        subtotal: convert(item.subtotal)
    }));

    // 3. Recalculate Payments History
    const displayPayments = payments.map(payment => ({
        ...payment,
        amount: convert(payment.amount)
    }));

    // 4. Recalculate Payment Terms (Cuotas)
    let displayPaymentTerms = paymentTerms;
    if (paymentTerms && paymentTerms.type === 'CREDIT' && paymentTerms.installments) {
        displayPaymentTerms = {
            ...paymentTerms,
            installments: paymentTerms.installments.map(inst => ({
                ...inst,
                amount: convert(inst.amount)
            }))
        };
    }

    // 5. Recalculate Amount in Words & Currency Label
    const displayCurrency = isConverting ? 'USD' : (currency === 'SOLES' ? 'PEN' : currency);
    const displayCurrencyText = isConverting ? 'DÓLARES' : currency;
    const currencySymbol = isConverting ? '$' : 'S/';

    // Si estamos convirtiendo, regeneramos el texto "SON: ...", sino usamos el que viene
    const displayAmountInWords = isConverting
        ? numberToWords(displayTotalAmount, 'USD')
        : amountInWords;

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

                currency={displayCurrencyText} // Texto "SOLES" o "DOLARES"
                currencySymbol={currencySymbol} // Símbolo para formateo
                amountInWords={displayAmountInWords}
                paymentTerms={displayPaymentTerms}
            />

            <ReceiptBody
                partyInfo={partyInfo}
                partyType={partyType}
                items={displayItems} // Items con precios convertidos
                currencySymbol={currencySymbol}
            />

            <ReceiptFooter
                totalAmount={displayTotalAmount}
                amountPaid={displayAmountPaid}
                payments={displayPayments}
                notes={notes}
                showPaymentDetails={showPaymentDetails}
                paymentTerms={displayPaymentTerms}
                currencySymbol={currencySymbol}
            />
        </div>
    );
};

export default ReceiptTemplate;
