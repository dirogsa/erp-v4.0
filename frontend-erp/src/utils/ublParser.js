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

    // Helper to extract address from a Party element
    const extractAddress = (party) => {
        if (!party) return '';

        const addrNode = findElement(party, 'cac:RegistrationAddress') ||
            findElement(party, 'cac:PostalAddress') ||
            findElement(party, 'cac:PhysicalLocation');

        if (!addrNode) return getTagText(party, 'cbc:Line');

        const line = getTagText(addrNode, 'cbc:Line');
        const district = getTagText(addrNode, 'cbc:District');
        const city = getTagText(addrNode, 'cbc:CityName');
        const region = getTagText(addrNode, 'cbc:CountrySubentity');

        // Build composite address
        let parts = [];
        if (line) parts.push(line);
        if (district) parts.push(district);
        if (city) parts.push(city);
        if (region && region !== city) parts.push(region);

        if (parts.length > 0) return parts.join(', ');

        const street = getTagText(addrNode, 'cbc:StreetName');
        if (street) return street + (city ? `, ${city}` : '');

        return getTagText(party, 'cbc:Line');
    };

    // 1. Basic Info
    const documentId = getTagText(xmlDoc, 'cbc:ID');
    const issueDate = getTagText(xmlDoc, 'cbc:IssueDate');
    const currencyRaw = getTagText(xmlDoc, 'cbc:DocumentCurrencyCode');
    const currency = currencyRaw === 'PEN' ? 'SOLES' : (currencyRaw === 'USD' ? 'DOLARES' : currencyRaw);

    // 2. Supplier Info
    const supplierParty = findElement(xmlDoc, 'cac:AccountingSupplierParty');
    const supplierRuc = supplierParty ? getTagText(supplierParty, 'cbc:ID') : '';
    const supplierName = supplierParty ? (getTagText(supplierParty, 'cbc:RegistrationName') || getTagText(supplierParty, 'cbc:Name')) : '';
    const supplierAddress = extractAddress(supplierParty);

    // 3. Customer Info
    const customerParty = findElement(xmlDoc, 'cac:AccountingCustomerParty');
    const customerRuc = customerParty ? getTagText(customerParty, 'cbc:ID') : '';
    const customerName = customerParty ? (getTagText(customerParty, 'cbc:RegistrationName') || getTagText(customerParty, 'cbc:Name')) : '';
    const customerAddress = extractAddress(customerParty);

    // 4. Totals
    const legalTotal = findElement(xmlDoc, 'cac:LegalMonetaryTotal');
    const totalAmount = parseFloat(getTagText(legalTotal, 'cbc:PayableAmount') || '0');

    // 5. Items (InvoiceLine)
    const lineElements = xmlDoc.getElementsByTagName('cac:InvoiceLine');
    const lines = lineElements.length > 0 ? Array.from(lineElements) : Array.from(xmlDoc.getElementsByTagName('InvoiceLine'));

    const items = lines.map(line => {
        const lineId = getTagText(line, 'cbc:ID');
        const itemInfo = findElement(line, 'cac:Item');

        let productSku = '';
        if (itemInfo) {
            const sellersId = findElement(itemInfo, 'cac:SellersItemIdentification');
            if (sellersId) {
                const rawSku = getTagText(sellersId, 'cbc:ID');
                // Si el SKU tiene espacios (ej: "AC31011C AZUMI"), tomamos solo la primera parte
                productSku = rawSku.includes(' ') ? rawSku.split(/\s+/)[0] : rawSku;
            }
        }
        if (!productSku) productSku = lineId;

        const productName = getTagText(line, 'cbc:Description');
        const quantity = parseFloat(getTagText(line, 'cbc:InvoicedQuantity') || '0');

        let unitPriceIncTax = 0;
        let basePriceNet = parseFloat(getTagText(line, 'cbc:PriceAmount') || '0');

        const pricingRefs = line.getElementsByTagName('cac:AlternativeConditionPrice');
        for (let ref of Array.from(pricingRefs)) {
            const typeCode = getTagText(ref, 'cbc:PriceTypeCode');
            if (typeCode === '01') {
                unitPriceIncTax = parseFloat(getTagText(ref, 'cbc:PriceAmount') || '0');
                break;
            }
        }

        const finalUnitPrice = unitPriceIncTax > 0 ? unitPriceIncTax : (basePriceNet * 1.18);

        return {
            product_sku: productSku,
            product_name: productName,
            quantity: quantity,
            unit_price: Math.round(finalUnitPrice * 100) / 100,
            net_unit_price: Math.round(basePriceNet * 100) / 100,
            subtotal: Math.round((quantity * finalUnitPrice) * 100) / 100,
            tax_status: getTagText(line, 'cbc:TaxExemptionReasonCode') || '10'
        };
    });

    // 6. Extraction of "SON: ..." (Amount in words)
    // In SUNAT UBL 2.1, this is usually a cbc:Note at the root level with languageLocaleID="1000"
    let amountInWords = '';
    const notesElements = xmlDoc.getElementsByTagName('cbc:Note');
    for (let i = 0; i < notesElements.length; i++) {
        if (notesElements[i].getAttribute('languageLocaleID') === '1000') {
            amountInWords = notesElements[i].textContent.trim();
            break;
        }
    }

    return {
        document_number: documentId,
        date: issueDate,
        currency,
        supplier: { ruc: supplierRuc, name: supplierName, address: supplierAddress },
        customer: { ruc: customerRuc, name: customerName, address: customerAddress },
        items,
        total_amount: Math.round(totalAmount * 100) / 100,
        amount_in_words: amountInWords
    };
};
