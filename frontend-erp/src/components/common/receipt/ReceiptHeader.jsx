import React from 'react';
import { formatDate } from '../../../utils/formatters';
import { COMPANY_INFO } from '../../../config/company';
import { MapPin, Phone, CreditCard, Calendar, User, Building2, DollarSign, Wallet } from 'lucide-react';

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
    requestedBy,
    currency = "SOLES",
    amountInWords = "",
    paymentTerms,
    showPrices = true,
    showBankAccounts = true,
    partyType = "Cliente"
}) => {
    // Helper to format payment type
    const getPaymentType = () => {
        if (!paymentTerms) return "CONTADO";
        return paymentTerms.type === 'CREDIT' ? 'CRÉDITO' : 'CONTADO';
    };

    return (
        <div className="receipt-header-container" style={{ position: 'relative' }}>
            {/* Status Badge - Modern Touch */}
            <div className="receipt-status-badge">
                {documentType?.includes("COTIZACION") || documentType?.includes("RFQ") ? "SOLICITUD OFICIAL" : "COMPROBANTE OFICIAL"}
            </div>

            {/* Header con dos columnas: Empresa a la izquierda, Factura a la derecha */}
            <div className="receipt-top-section">
                {/* Columna izquierda - Datos de la empresa */}
                <div className="receipt-company-col">
                    <div className="company-name">{companyName}</div>
                    <div className="company-details">
                        <MapPin size={10} strokeWidth={2.5} style={{ marginRight: '4px', color: '#3b82f6' }} />
                        {companyAddress}
                    </div>
                    <div className="company-details">
                        <Phone size={10} strokeWidth={2.5} style={{ marginRight: '4px', color: '#3b82f6' }} />
                        Tel: {companyPhone}
                    </div>
                    {(companyAccountSoles || companyAccountDollars) && showBankAccounts && (
                        <div className="company-bank-info">
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '3px', fontWeight: 'bold', color: '#1e293b' }}>
                                <CreditCard size={11} style={{ marginRight: '5px' }} />
                                CUENTAS BANCARIAS
                            </div>
                            <div style={{ paddingLeft: '16px' }}>
                                {companyAccountSoles && <div>Soles: {companyAccountSoles}</div>}
                                {companyAccountDollars && <div>Dólares: {companyAccountDollars}</div>}
                            </div>
                        </div>
                    )}
                </div>

                {/* Columna derecha - Tipo de documento (Recuadro SUNAT) */}
                <div className="receipt-invoice-col">
                    <div className="invoice-type">
                        {documentType === "FACTURA DE VENTA" ? "FACTURA ELECTRÓNICA" : documentType}
                    </div>
                    <div className="invoice-ruc">
                        RUC: {companyRuc}
                    </div>
                    {documentNumber && (
                        <div className="invoice-number">
                           {documentNumber}
                        </div>
                    )}
                </div>
            </div>

            {/* Fila compacta: Datos del Cliente / Proveedor (Alineación SUNAT) */}
            <div className="receipt-details-grid">
                <div className="receipt-customer-col">
                    <div className="customer-row">
                        <span className="label">
                            <Calendar size={10} style={{ marginRight: '6px', color: '#64748b' }} />
                            Fecha de Emisión
                        </span>
                        <span className="label-colon">:</span>
                        <span className="value">{formatDate(documentDate)}</span>
                    </div>
                    <div className="customer-row">
                        <span className="label">
                            <User size={10} style={{ marginRight: '6px', color: '#64748b' }} />
                            {partyType}(es)
                        </span>
                        <span className="label-colon">:</span>
                        <span className="value" style={{ fontWeight: '600' }}>{customerName || '-'}</span>
                    </div>
                    <div className="customer-row">
                        <span className="label">
                            <Building2 size={10} style={{ marginRight: '6px', color: '#64748b' }} />
                            RUC / DNI
                        </span>
                        <span className="label-colon">:</span>
                        <span className="value">{customerRuc || '-'}</span>
                    </div>
                    <div className="customer-row">
                        <span className="label">
                            <MapPin size={10} style={{ marginRight: '6px', color: '#64748b' }} />
                            Dirección
                        </span>
                        <span className="label-colon">:</span>
                        <span className="value">{customerAddress || '-'}</span>
                    </div>
                    {requestedBy?.name && (
                        <div className="customer-row">
                            <span className="label">
                                <Phone size={10} style={{ marginRight: '6px', color: '#64748b' }} />
                                Contacto / Ref.
                            </span>
                            <span className="label-colon">:</span>
                            <span className="value emphasis" style={{ color: '#2563eb' }}>
                                {requestedBy.name} {requestedBy.phone ? `| Tel: ${requestedBy.phone}` : ''}
                            </span>
                        </div>
                    )}
                </div>

                {/* Columna Derecha: Metadatos adicionales */}
                <div className="receipt-meta-col" style={{ minWidth: '45mm' }}>
                    <div className="customer-row">
                        <span className="label">
                            <DollarSign size={10} style={{ marginRight: '6px', color: '#64748b' }} />
                            Moneda
                        </span>
                        <span className="label-colon">:</span>
                        <span className="value">{currency}</span>
                    </div>
                    <div className="customer-row">
                        <span className="label">
                            <Wallet size={10} style={{ marginRight: '6px', color: '#64748b' }} />
                            Pago
                        </span>
                        <span className="label-colon">:</span>
                        <span className="value">{getPaymentType()}</span>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default ReceiptHeader;
