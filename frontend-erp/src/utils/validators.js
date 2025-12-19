// Validación de RUC
export const isValidRUC = (ruc) => {
    if (!ruc) return false;
    // RUC debe tener 11 dígitos
    return /^\d{11}$/.test(ruc);
};

// Validación de email
export const isValidEmail = (email) => {
    if (!email) return true; // Email es opcional
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Validación de teléfono
export const isValidPhone = (phone) => {
    if (!phone) return true; // Teléfono es opcional
    // Acepta formatos: 999999999, +51999999999, etc.
    return /^[\d\s\-\+\(\)]{7,15}$/.test(phone);
};

// Validación de cantidad
export const isValidQuantity = (quantity) => {
    const num = parseInt(quantity);
    return !isNaN(num) && num > 0;
};

// Validación de precio
export const isValidPrice = (price) => {
    const num = parseFloat(price);
    return !isNaN(num) && num >= 0;
};

// Validación de SKU
export const isValidSKU = (sku) => {
    if (!sku) return false;
    // SKU debe tener al menos 3 caracteres
    return sku.trim().length >= 3;
};

// Validación de orden
export const validateOrder = (order) => {
    const errors = [];

    if (!order.customer_name && !order.supplier_name) {
        errors.push('Debe seleccionar un cliente o proveedor');
    }

    if (!order.items || order.items.length === 0) {
        errors.push('Debe agregar al menos un producto');
    }

    if (order.items) {
        order.items.forEach((item, index) => {
            if (!isValidQuantity(item.quantity)) {
                errors.push(`Item ${index + 1}: Cantidad inválida`);
            }
            if (!isValidPrice(item.unit_price || item.unit_cost)) {
                errors.push(`Item ${index + 1}: Precio inválido`);
            }
        });
    }

    return errors;
};

// Validación de factura
export const validateInvoice = (invoice) => {
    const errors = [];

    if (!invoice.invoice_number || invoice.invoice_number.trim() === '') {
        errors.push('Número de factura requerido');
    }

    if (!invoice.invoice_date) {
        errors.push('Fecha de factura requerida');
    }

    if (invoice.payment_status === 'PAID' || invoice.payment_status === 'PARTIAL') {
        if (!isValidPrice(invoice.amount_paid)) {
            errors.push('Monto pagado inválido');
        }
        if (!invoice.payment_date) {
            errors.push('Fecha de pago requerida');
        }
    }

    return errors;
};
