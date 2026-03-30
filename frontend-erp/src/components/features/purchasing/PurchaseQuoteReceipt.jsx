import React from 'react';
import PrintableModal from '../../common/receipt/PrintableModal';
import ReceiptTemplate from '../../common/receipt/ReceiptTemplate';
import DualReceiptWrapper from '../../common/receipt/DualReceiptWrapper';
import { useCompany } from '../../../context/CompanyContext';

const PurchaseQuoteReceipt = ({
    visible,
    onClose,
    quote
}) => {
    const { activeCompany } = useCompany();
    if (!visible || !quote) return null;

    // Prepare party info with robust fallbacks
    const partyInfo = {
        name: quote.supplier?.name || quote.supplier_name || 'Proveedor No Identificado',
        ruc: quote.supplier?.ruc || quote.supplier_ruc || '',
        address: quote.supplier?.address || quote.supplier_address || ''
    };

    return (
        <PrintableModal
            visible={visible}
            onClose={onClose}
            title={quote.show_prices ? `Cotización Recibida ${quote.quote_number}` : `Solicitud de Cotización ${quote.quote_number}`}
        >
            <DualReceiptWrapper>
                <div className="receipt-content">
                    <ReceiptTemplate
                        documentType={quote.show_prices ? "COTIZACIÓN RECIBIDA" : "SOLICITUD DE COTIZACIÓN"}
                        documentNumber={quote.quote_number}
                        documentDate={quote.date}
                        partyInfo={partyInfo}
                        partyType="Proveedor"
                        items={quote.items || []}
                        totalAmount={quote.total_amount || 0}
                        notes={quote.notes}
                        currency={quote.currency || "SOLES"}
                        amountInWords={quote.amount_in_words}
                        showPrices={false} // Strictly hide prices as per user request
                        showBankAccounts={false} // Strictly hide bank accounts for RFQ
                        
                        // Company Info (The company requesting - Dirogas or JE7RO)
                        companyName={quote.issuer_info?.name || activeCompany?.name}
                        companyRuc={quote.issuer_info?.ruc || activeCompany?.ruc}
                        companyAddress={quote.issuer_info?.address || activeCompany?.address}
                        companyPhone={quote.issuer_info?.phone || activeCompany?.phone}
                        companyBankName={quote.issuer_info?.bank_name || activeCompany?.bank_name}
                        companyAccountSoles={quote.issuer_info?.account_soles || activeCompany?.account_soles}
                        companyAccountDollars={quote.issuer_info?.account_dollars || activeCompany?.account_dollars}
                    />
                </div>
            </DualReceiptWrapper>
        </PrintableModal>
    );
};

export default PurchaseQuoteReceipt;
