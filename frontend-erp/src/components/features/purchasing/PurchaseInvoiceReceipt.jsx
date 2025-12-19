import PrintableModal from '../../common/receipt/PrintableModal';
import ReceiptTemplate from '../../common/receipt/ReceiptTemplate';
import DualReceiptWrapper from '../../common/receipt/DualReceiptWrapper';

const PurchaseInvoiceReceipt = ({
    visible,
    onClose,
    invoice
}) => {
    if (!visible || !invoice) return null;

    // Prepare party info
    const partyInfo = {
        name: invoice.supplier_name,
        ruc: invoice.supplier_ruc,
        address: invoice.supplier_address
    };

    return (
        <PrintableModal
            visible={visible}
            onClose={onClose}
            title={`Factura de Compra ${invoice.invoice_number}`}
        >
            <DualReceiptWrapper>
                <div className="receipt-content">
                    <ReceiptTemplate
                        documentType="FACTURA DE COMPRA"
                        documentNumber={invoice.sunat_number || invoice.invoice_number}
                        internalId={invoice.invoice_number}
                        documentDate={invoice.invoice_date}
                        partyInfo={partyInfo}
                        partyType="Proveedor"
                        items={invoice.items?.map(item => ({
                            ...item,
                            subtotal: item.subtotal || (item.quantity * item.unit_price)
                        })) || []}
                        totalAmount={invoice.total_amount}
                        showPaymentDetails={false}
                    />
                </div>
            </DualReceiptWrapper>
        </PrintableModal>
    );
};

export default PurchaseInvoiceReceipt;
