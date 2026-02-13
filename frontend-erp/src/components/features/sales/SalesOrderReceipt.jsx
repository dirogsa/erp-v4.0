import React from 'react';
import DualReceiptWrapper from '../../common/receipt/DualReceiptWrapper';
import PrintableModal from '../../common/receipt/PrintableModal';
import ReceiptTemplate from '../../common/receipt/ReceiptTemplate';

const SalesOrderReceipt = ({
    visible,
    onClose,
    order
}) => {
    if (!visible || !order) return null;

    // Prepare party info
    const partyInfo = {
        name: order.customer_name,
        ruc: order.customer_ruc,
        address: order.delivery_address,
        branchName: order.delivery_branch_name
    };

    return (
        <PrintableModal
            visible={visible}
            onClose={onClose}
            title={`Orden de Venta ${order.order_number}`}
        >
            <DualReceiptWrapper>
                <div className="receipt-content">
                    <ReceiptTemplate
                        documentType="ORDEN DE VENTA"
                        documentNumber={order.order_number}
                        documentDate={order.date}
                        partyInfo={partyInfo}
                        partyType="Cliente"
                        items={order.items?.map(item => ({
                            ...item,
                            subtotal: item.subtotal || (item.quantity * item.unit_price)
                        })) || []}
                        totalAmount={order.total_amount}
                        showPaymentDetails={false}
                        paymentTerms={order.payment_terms}
                        requestedBy={order.requested_by}
                        notes={order.notes}
                        // Issuer Info (Snapshot)
                        companyName={order.issuer_info?.name}
                        companyRuc={order.issuer_info?.ruc}
                        companyAddress={order.issuer_info?.address}
                        companyPhone={order.issuer_info?.phone}
                        companyBankName={order.issuer_info?.bank_name}
                        companyAccountSoles={order.issuer_info?.account_soles}
                        companyAccountDollars={order.issuer_info?.account_dollars}
                    />
                </div>
            </DualReceiptWrapper>
        </PrintableModal>
    );
};

export default SalesOrderReceipt;
