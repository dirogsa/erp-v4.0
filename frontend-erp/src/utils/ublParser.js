/**
 * Utility to parse UBL 2.1 XML documents (SUNAT standard)
 */
export const parseUBLXml = (xmlString) => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "text/xml");

    // Helper to find an element regardless of prefix
    const findElement = (parent, tagName) => {
        if (!parent) return null;
        const localName = tagName.includes(':') ? tagName.split(':')[1] : tagName;

        // Try exact match
        let elements = parent.getElementsByTagName(tagName);
        if (elements.length > 0) return elements[0];

        // Try local name
        elements = parent.getElementsByTagName(localName);
        if (elements.length > 0) return elements[0];

        // Manual search in descendants
        const all = parent.getElementsByTagName('*');
        for (let i = 0; i < all.length; i++) {
            if (all[i].localName === localName) return all[i];
        }
        return null;
    };

    // Helper to get text content from a tag
    const getTagText = (parent, tagName) => {
        const el = findElement(parent, tagName);
        return el ? el.textContent.trim() : '';
    };

    // Helper to extract address and ubigeo from a Party element
    const extractAddressInfo = (party) => {
        if (!party) return { address: '', ubigeo: '' };

        const addrNode = findElement(party, 'cac:RegistrationAddress') ||
            findElement(party, 'cac:PostalAddress') ||
            findElement(party, 'cac:PhysicalLocation');

        if (!addrNode) return { address: getTagText(party, 'cbc:Line'), ubigeo: '' };

        const line = getTagText(addrNode, 'cbc:Line');
        const district = getTagText(addrNode, 'cbc:District');
        const city = getTagText(addrNode, 'cbc:CityName');
        const region = getTagText(addrNode, 'cbc:CountrySubentity');
        const ubigeo = getTagText(addrNode, 'cbc:CountrySubentityCode');

        let parts = [];
        if (line) parts.push(line);
        if (district) parts.push(district);
        if (city) parts.push(city);
        if (region && region !== city) parts.push(region);

        return {
            address: parts.length > 0 ? parts.join(', ') : getTagText(addrNode, 'cbc:StreetName'),
            ubigeo: ubigeo
        };
    };

    // 1. Basic Info & Document Type
    const documentId = getTagText(xmlDoc, 'cbc:ID');
    const issueDate = getTagText(xmlDoc, 'cbc:IssueDate');
    const issueTime = getTagText(xmlDoc, 'cbc:IssueTime');
    const currencyRaw = getTagText(xmlDoc, 'cbc:DocumentCurrencyCode');
    const currency = currencyRaw === 'PEN' ? 'PEN' : (currencyRaw === 'USD' ? 'USD' : currencyRaw);
    
    const isCreditNote = !!findElement(xmlDoc, 'CreditNote');
    const documentType = isCreditNote ? 'CREDIT_NOTE' : 'INVOICE';

    // 1.5 Billing Reference
    let relatedDocument = null;
    if (isCreditNote) {
        const billingRef = findElement(xmlDoc, 'cac:BillingReference');
        if (billingRef) {
            const invoiceRef = findElement(billingRef, 'cac:InvoiceDocumentReference');
            relatedDocument = invoiceRef ? getTagText(invoiceRef, 'cbc:ID') : '';
        }
    }

    // 2. Payment Terms (Contado/Crédito)
    let paymentTerms = 'Contado';
    let installments = [];
    const paymentTermsElements = xmlDoc.getElementsByTagName('cac:PaymentTerms');
    for (let i = 0; i < paymentTermsElements.length; i++) {
        const item = paymentTermsElements[i];
        const pmid = getTagText(item, 'cbc:PaymentMeansID');
        if (pmid) {
            paymentTerms = pmid; // 'Contado' o 'CuotaXXX'
        }
        // If it's credit, it should have installments
        const id = getTagText(item, 'cbc:ID');
        if (id && id.toLowerCase().includes('cuota')) {
            installments.push({
                index: id,
                amount: parseFloat(getTagText(item, 'cbc:Amount') || '0'),
                dueDate: getTagText(item, 'cbc:DueDate')
            });
        }
    }
    if (installments.length > 0) paymentTerms = 'Crédito';

    // 3. Supplier & Customer Info
    const supplierParty = findElement(xmlDoc, 'cac:AccountingSupplierParty');
    const supplierInfo = extractAddressInfo(supplierParty);
    const supplierRuc = supplierParty ? getTagText(supplierParty, 'cbc:ID') : '';
    const supplierName = supplierParty ? (getTagText(supplierParty, 'cac:PartyLegalEntity/cbc:RegistrationName') || getTagText(supplierParty, 'cbc:RegistrationName') || getTagText(supplierParty, 'cbc:Name')) : '';

    const customerParty = findElement(xmlDoc, 'cac:AccountingCustomerParty');
    const customerInfo = extractAddressInfo(customerParty);
    const customerRuc = customerParty ? getTagText(customerParty, 'cbc:ID') : '';
    const customerName = customerParty ? (getTagText(customerParty, 'cac:PartyLegalEntity/cbc:RegistrationName') || getTagText(customerParty, 'cbc:RegistrationName') || getTagText(customerParty, 'cbc:Name')) : '';

    // 4. Totals & Tax
    const taxTotalNode = findElement(xmlDoc, 'cac:TaxTotal');
    const totalIgv = parseFloat(getTagText(taxTotalNode, 'cbc:TaxAmount') || '0');

    const legalTotal = findElement(xmlDoc, 'cac:LegalMonetaryTotal');
    const totalAmount = parseFloat(getTagText(legalTotal, 'cbc:PayableAmount') || '0');
    const totalValue = parseFloat(getTagText(legalTotal, 'cbc:LineExtensionAmount') || '0');

    // 5. Items
    let lineElements = Array.from(xmlDoc.getElementsByTagName('cac:InvoiceLine'))
        .concat(Array.from(xmlDoc.getElementsByTagName('InvoiceLine')))
        .concat(Array.from(xmlDoc.getElementsByTagName('cac:CreditNoteLine')))
        .concat(Array.from(xmlDoc.getElementsByTagName('CreditNoteLine')));

    const items = lineElements.map(line => {
        const itemInfo = findElement(line, 'cac:Item');
        const sellersId = findElement(itemInfo, 'cac:SellersItemIdentification');
        const rawSku = sellersId ? getTagText(sellersId, 'cbc:ID') : getTagText(line, 'cbc:ID');
        // Sanitizar SKU: Eliminar CUALQUIER carácter que no sea alfanumérico (letras y números)
        // Esto uniformiza '28113- C7000' -> '28113C7000' de forma ultra-robusta
        const productSku = rawSku.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

        const quantity = parseFloat(getTagText(line, 'cbc:InvoicedQuantity') || getTagText(line, 'cbc:CreditedQuantity') || '0');
        const unitCode = findElement(line, 'cbc:InvoicedQuantity')?.getAttribute('unitCode') || 'NIU';

        // PRICE LOGIC (Valor vs Precio)
        let unitValue = parseFloat(getTagText(line, 'cac:Price/cbc:PriceAmount') || '0');
        
        let unitPrice = 0;
        const pricingRefs = line.getElementsByTagName('cac:AlternativeConditionPrice');
        for (let ref of Array.from(pricingRefs)) {
            if (getTagText(ref, 'cbc:PriceTypeCode') === '01') {
                unitPrice = parseFloat(getTagText(ref, 'cbc:PriceAmount') || '0');
                break;
            }
        }
        
        // Fallback calculation
        if (unitPrice === 0 && unitValue > 0) unitPrice = unitValue * 1.18;
        if (unitValue === 0 && unitPrice > 0) unitValue = unitPrice / 1.18;

        return {
            product_sku: productSku,
            product_name: getTagText(line, 'cbc:Description'),
            quantity,
            unit_code: unitCode,
            unit_value: unitValue, // Neto
            unit_price: unitPrice, // Inc. IGV
            subtotal_value: quantity * unitValue,
            subtotal: quantity * unitPrice,
            tax_status: getTagText(line, 'cbc:TaxExemptionReasonCode') || '10'
        };
    });

    const amountInWords = Array.from(xmlDoc.getElementsByTagName('cbc:Note'))
        .find(n => n.getAttribute('languageLocaleID') === '1000')?.textContent.trim() || '';

    return {
        document_type: documentType,
        related_document: relatedDocument,
        document_number: documentId,
        date: issueDate,
        time: issueTime,
        currency,
        payment_terms: paymentTerms,
        installments,
        supplier: { ruc: supplierRuc, name: supplierName, address: supplierInfo.address, ubigeo: supplierInfo.ubigeo },
        customer: { ruc: customerRuc, name: customerName, address: customerInfo.address, ubigeo: customerInfo.ubigeo },
        items,
        total_igv: totalIgv,
        total_value: totalValue,
        total_amount: Math.round(totalAmount * 100) / 100,
        amount_in_words: amountInWords
    };
};
