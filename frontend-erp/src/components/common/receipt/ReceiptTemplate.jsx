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
                <div style={{ marginTop: '2rem', borderTop: '1px solid #eee', paddingTop: '1.5rem', pageBreakInside: 'avoid' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                        <div>
                            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', borderBottom: '0.5px solid #eee', paddingBottom: '2px' }}>
                                Instrucciones de Cotización:
                            </h4>
                            <ul style={{ margin: 0, padding: '0 0 0 1rem', fontSize: '10px', color: '#334155', lineHeight: '1.6' }}>
                                <li>Favor de indicar tiempo de entrega aproximado.</li>
                                <li>Especificar validez de la oferta (días).</li>
                                <li>Indicar si los precios incluyen IGV (18%).</li>
                                <li>Enviar su respuesta al correo de contacto o vía WhatsApp.</li>
                            </ul>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {notes && (
                                <div>
                                    <h4 style={{ margin: '0 0 0.3rem 0', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', borderBottom: '0.5px solid #eee', paddingBottom: '2px' }}>
                                        Notas Adicionales:
                                    </h4>
                                    <p style={{ margin: 0, fontSize: '10px', color: '#334155', lineHeight: '1.4' }}>{notes}</p>
                                </div>
                            )}
                            <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
                                <p style={{ margin: 0, fontSize: '10px', color: '#64748b', fontStyle: 'italic', textAlign: 'right' }}>
                                    "Agradecemos de antemano su pronta respuesta."
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div style={{ marginTop: '3.5rem', display: 'flex', justifyContent: 'center' }}>
                        <div style={{ width: '220px', borderTop: '1px solid #334155', textAlign: 'center', paddingTop: '0.5rem' }}>
                            <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Departamento Comercial
                            </div>
                            <div style={{ fontSize: '9px', color: '#64748b', marginTop: '2px' }}>{companyName}</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReceiptTemplate;
