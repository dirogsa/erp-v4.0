import React from 'react';
import { formatDate } from '../../../utils/formatters';
import { COMPANY_INFO } from '../../../config/company';

const ReceiptHeader = ({
    documentType,
    documentNumber,
    documentDate,
    companyName = COMPANY_INFO.name,
    companyRuc = COMPANY_INFO.ruc,
    companyAddress = COMPANY_INFO.address,
    companyPhone = COMPANY_INFO.phone,
    companyBankName = COMPANY_INFO.bank_name,
    companyAccountSoles = COMPANY_INFO.account_soles,
    companyAccountDollars = COMPANY_INFO.account_dollars,
    customerName,
    customerRuc,
    customerAddress,
    currency = "SOLES",
    amountInWords = "",
    paymentTerms
}) => {
    // Helper to format payment type
    const getPaymentType = () => {
        if (!paymentTerms) return "CONTADO";
        return paymentTerms.type === 'CREDIT' ? 'CRÉDITO' : 'CONTADO';
    };

    // Helper to format installments text
    const getInstallmentsText = () => {
        if (paymentTerms?.type === 'CREDIT' && paymentTerms.installments?.length > 0) {
            const count = paymentTerms.installments.length;
            const firstAmount = paymentTerms.installments[0]?.amount;
            return `${count} cuotas - ${currency} ${firstAmount?.toFixed(2)}`;
        }
        return null;
    };
    return (
        <div className="receipt-header-container">
            {/* Header con dos columnas: Empresa a la izquierda, Factura a la derecha */}
            <div className="receipt-top-section">
                {/* Columna izquierda - Datos de la empresa */}
                <div className="receipt-company-col">
                    <div className="company-name">{companyName}</div>
                    <div className="company-details">{companyAddress}</div>
                    <div className="company-details">Tel: {companyPhone}</div>
                    {(companyAccountSoles || companyAccountDollars) && (
                        <div className="company-details" style={{ marginTop: '4px', fontSize: '9px' }}>
                            <div><strong>{companyBankName}:</strong></div>
                            {companyAccountSoles && <div>S/: {companyAccountSoles}</div>}
                            {companyAccountDollars && <div>$: {companyAccountDollars}</div>}
                        </div>
                    )}
                </div>

                {/* Columna derecha - Tipo de documento */}
                <div className="receipt-invoice-col">
                    <div className="invoice-type">
                        {documentType === "FACTURA DE VENTA" ? "FACTURA ELECTRÓNICA" : documentType}
                    </div>
                    <div className="invoice-ruc">
                        RUC: {companyRuc}
                    </div>
                    <div className="invoice-number">
                        {documentNumber ? `N° ${documentNumber}` : ''}
                    </div>
                </div>
            </div>

            {/* Fila compacta: Fecha/Moneda y Cliente juntos */}
            <div className="receipt-details-grid">
                {/* Columna Izquierda: Cliente (Priority) */}
                <div className="receipt-customer-col">
                    <div className="customer-row">
                        <span className="label">Cliente:</span>
                        <span className="value">{customerName || '-'}</span>
                    </div>
                    {/* RUC Row - No Bold */}
                    <div className="customer-sub-row">
                        <span className="label-normal">RUC:</span>
                        <span className="value-normal">{customerRuc || '-'}</span>
                    </div>
                    {/* Address Row - No Bold, New Line */}
                    <div className="customer-sub-row">
                        <span className="label-normal">Dirección:</span>
                        <span className="value-normal">{customerAddress || '-'}</span>
                    </div>
                </div>

                {/* Columna Derecha: Fecha */}
                <div className="receipt-meta-col">
                    <div className="meta-row">
                        <span className="label">Fecha:</span>
                        <span className="value">{formatDate(documentDate)}</span>
                    </div>
                    <div className="meta-row">
                        <span className="label">Moneda:</span>
                        <span className="value">{currency}</span>
                    </div>
                    {/* Payment Info Added */}
                    <div className="meta-row">
                        <span className="label">Pago:</span>
                        <span className="value">{getPaymentType()}</span>
                    </div>
                </div>
            </div>

            {/* Monto en letras - Ultra compacto */}
            {amountInWords && (
                <div className="receipt-amount-words">
                    <strong>SON:</strong> {amountInWords}
                </div>
            )}
        </div>
    );
};

export default ReceiptHeader;
