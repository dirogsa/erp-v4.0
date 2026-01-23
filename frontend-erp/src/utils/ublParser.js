/**
 * Utility to parse UBL 2.1 XML documents (SUNAT standard)
 */
export const parseUBLXml = (xmlString) => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "text/xml");

    // Helper to get text content correctly handling namespaces
    const getTagText = (parent, tagName) => {
        const elements = parent.getElementsByTagName(tagName);
        return elements.length > 0 ? elements[0].textContent.trim() : '';
    };

    // 1. Basic Info
    const documentId = getTagText(xmlDoc, 'cbc:ID') || getTagText(xmlDoc, 'ID');
    const issueDate = getTagText(xmlDoc, 'cbc:IssueDate') || getTagText(xmlDoc, 'IssueDate');
    const currencyRaw = getTagText(xmlDoc, 'cbc:DocumentCurrencyCode') || getTagText(xmlDoc, 'DocumentCurrencyCode');
    const currency = currencyRaw === 'PEN' ? 'SOLES' : (currencyRaw === 'USD' ? 'DOLARES' : currencyRaw);

    // 2. Supplier Info
    const supplierParty = xmlDoc.getElementsByTagName('cac:AccountingSupplierParty')[0] || xmlDoc.getElementsByTagName('AccountingSupplierParty')[0];
    const supplierRuc = supplierParty ? getTagText(supplierParty, 'cbc:ID') : '';
    const supplierName = supplierParty ? (getTagText(supplierParty, 'cbc:RegistrationName') || getTagText(supplierParty, 'cbc:Name')) : '';
    const supplierAddress = supplierParty ? getTagText(supplierParty, 'cbc:Line') : '';

    // 3. Customer Info
    const customerParty = xmlDoc.getElementsByTagName('cac:AccountingCustomerParty')[0] || xmlDoc.getElementsByTagName('AccountingCustomerParty')[0];
    const customerRuc = customerParty ? getTagText(customerParty, 'cbc:ID') : '';
    const customerName = customerParty ? (getTagText(customerParty, 'cbc:RegistrationName') || getTagText(customerParty, 'cbc:Name')) : '';

    // 4. Totals
    const legalTotal = xmlDoc.getElementsByTagName('cac:LegalMonetaryTotal')[0] || xmlDoc.getElementsByTagName('LegalMonetaryTotal')[0];
    const totalAmount = parseFloat(getTagText(legalTotal, 'cbc:PayableAmount') || '0');

    // 5. Items (InvoiceLine)
    const lines = Array.from(xmlDoc.getElementsByTagName('cac:InvoiceLine')).length > 0
        ? Array.from(xmlDoc.getElementsByTagName('cac:InvoiceLine'))
        : Array.from(xmlDoc.getElementsByTagName('InvoiceLine'));

    const items = lines.map(line => {
        const productSku = getTagText(line, 'cbc:ID'); // Item Identification
        const productName = getTagText(line, 'cbc:Description');
        const quantity = parseFloat(getTagText(line, 'cbc:InvoicedQuantity') || '0');

        // PRICES logic
        let unitPrice = 0;
        let basePrice = parseFloat(getTagText(line, 'cbc:PriceAmount') || '0'); // Usually net

        // Look for AlternativeConditionPrice (Type 01 = Price with Tax)
        const pricingRefs = line.getElementsByTagName('cac:AlternativeConditionPrice') || line.getElementsByTagName('AlternativeConditionPrice');
        for (let ref of Array.from(pricingRefs)) {
            const typeCode = getTagText(ref, 'cbc:PriceTypeCode');
            if (typeCode === '01') {
                unitPrice = parseFloat(getTagText(ref, 'cbc:PriceAmount') || '0');
                break;
            }
        }

        // Final rounding to 2 decimals for clean ERP entry
        return {
            product_sku: productSku,
            product_name: productName,
            quantity: quantity,
            unit_price: Math.round((unitPrice > 0 ? unitPrice : basePrice) * 100) / 100, // 18.00
            net_unit_price: Math.round(basePrice * 100) / 100, // 15.25
            tax_status: getTagText(line, 'cbc:TaxExemptionReasonCode') || '10'
        };
    });

    return {
        document_number: documentId,
        date: issueDate,
        currency,
        supplier: { ruc: supplierRuc, name: supplierName, address: supplierAddress },
        customer: { ruc: customerRuc, name: customerName },
        items,
        total_amount: Math.round(totalAmount * 100) / 100
    };
};
