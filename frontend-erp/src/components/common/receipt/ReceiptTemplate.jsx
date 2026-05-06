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
    requestedBy = null,

    targetCurrency = 'PEN',
    exchangeRate = 1,
    showPrices = true,
    showBankAccounts = true,
    format = 'A5_SINGLE'
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
        unit_price: convert(item.unit_price || item.unit_cost || 0),
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
    const displayCurrency = isConverting ? 'USD' : (currency === 'SOLES' || currency === "PEN" ? 'PEN' : currency);
    const displayCurrencyText = isConverting ? 'DÓLARES' : (currency === "USD" || currency === "DOLARES" ? "DOLARES" : "SOLES");
    const currencySymbol = isConverting ? '$' : (currency === 'USD' || currency === 'DOLARES' ? '$' : 'S/');

    // Si estamos convirtiendo, regeneramos el texto "SON: ...", sino usamos el que viene
    const displayAmountInWords = isConverting
        ? numberToWords(displayTotalAmount, 'USD')
        : amountInWords;

    const containerClass = `receipt-container ${format === 'A4_FULL' ? 'format-a4-full' : ''} ${!showPrices ? 'format-rfq' : ''}`;

    return (
        <div className={containerClass}>
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
                partyType={partyType}
                requestedBy={requestedBy}

                currency={displayCurrencyText} // Texto "SOLES" o "DOLARES"
                currencySymbol={currencySymbol} // Símbolo para formateo
                amountInWords={showPrices ? displayAmountInWords : ""}
                paymentTerms={showPrices ? displayPaymentTerms : null}
                showBankAccounts={showBankAccounts}
                showPrices={showPrices}
            />

            <ReceiptBody
                partyInfo={partyInfo}
                partyType={partyType}
                items={displayItems} // Items con precios convertidos
                currencySymbol={currencySymbol}
                showPrices={showPrices}
            />

            {showPrices && (
                <ReceiptFooter
                    totalAmount={displayTotalAmount}
                    amountPaid={displayAmountPaid}
                    payments={displayPayments}
                    notes={notes}
                    showPaymentDetails={showPaymentDetails}
                    paymentTerms={displayPaymentTerms}
                    currencySymbol={currencySymbol}
                />
            )}

            {!showPrices && (
                <div className="receipt-section-divider format-rfq-instructions">
                    <div className="receipt-grid-2">
                        <div>
                            <h4 className="receipt-section-title">
                                Instrucciones de Cotización:
                            </h4>
                            <ul className="receipt-list-reset">
                                <li>Favor de indicar tiempo de entrega aproximado.</li>
                                <li>Especificar validez de la oferta (días) y si incluyen IGV (18%).</li>
                                <li>Enviar su respuesta al correo de contacto o vía WhatsApp.</li>
                            </ul>
                        </div>
                        <div className="receipt-column-flex">
                            {notes && (
                                <div>
                                    <h4 className="receipt-section-title">
                                        Notas Adicionales:
                                    </h4>
                                    <p className="receipt-notes-text">{notes}</p>
                                </div>
                            )}
                            <div className="receipt-thank-you">
                                <p className="receipt-italic-text">
                                    "Agradecemos de antemano su pronta respuesta."
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="receipt-signature-container">
                        <div className="receipt-signature-box">
                            <div className="receipt-signature-name">
                                Departamento Comercial
                            </div>
                            <div className="receipt-signature-company">{companyName}</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReceiptTemplate;
