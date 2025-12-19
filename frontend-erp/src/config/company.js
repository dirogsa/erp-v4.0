// Single Source of Truth for Company Information
// This configuration is used to:
// 1. Populate default props in ReceiptHeader (for old documents without saved info)
// 2. Send as 'issuer_info' snapshot when creating NEW documents (to freeze history)

export const COMPANY_INFO = {
    name: "ROJAS GARCIA JEEF GELDER",
    ruc: "10434346318",
    address: "CAL.JOSE ORENGO NRO. 850 URB. EL TREBOL LIMA - LIMA - SAN LUIS",
    phone: "+5114742827",
    email: "", // Add if needed
    website: "", // Add if needed
    logo_url: "", // Add if needed

    // Bank Accounts
    bank_name: "BCP",
    account_soles: "193-15439649-0-03", // Example placeholder, user can update
    account_dollars: "193-18003034-1-82" // Example placeholder
};

export default COMPANY_INFO;
