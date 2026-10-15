import React from 'react';
import { formatCurrency } from '../../../utils/formatters';

const OrderSummary = ({
    items = [],
    shippingCost = 0,
    deliveryMethod = 'STORE_PICKUP',
    shippingAgency = '',
    shippingPaymentType = 'PAID',
    currency = 'PEN'
}) => {
    const symbol = currency === 'USD' || currency === 'DOLARES' ? '$' : 'S/';
    const itemsTotal = items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
    const shipping = (shippingPaymentType !== 'DESTINATION') ? (parseFloat(shippingCost) || 0) : 0;
    const total = itemsTotal + shipping;
    const subtotal = total / 1.18;
    const igv = total - subtotal;

    const rowStyle = {
        display: 'flex',
        justifyContent: 'space-between',
        padding: '0.5rem 0',
        borderBottom: '1px solid #334155',
        color: '#cbd5e1',
        fontSize: '0.9rem'
    };

    const totalStyle = {
        ...rowStyle,
        borderBottom: 'none',
        borderTop: '2px solid #334155',
        marginTop: '0.5rem',
        paddingTop: '1rem',
        fontSize: '1.25rem',
        fontWeight: 'bold',
        color: 'white'
    };

    return (
        <div style={{
            padding: '1.5rem',
            backgroundColor: '#1e293b',
            borderRadius: '0.5rem',
            width: '100%',
            maxWidth: '340px',
            marginLeft: 'auto',
            border: '1px solid #334155'
        }}>
            <h3 style={{ marginBottom: '1rem', color: '#e2e8f0', fontSize: '1.1rem' }}>
                Resumen Económico
            </h3>

            <div style={rowStyle}>
                <span>Productos:</span>
                <span>{formatCurrency(itemsTotal, symbol)}</span>
            </div>

            {shipping > 0 && (
                <div style={{ ...rowStyle, color: '#38bdf8' }}>
                    <span>Movilidad / Flete:</span>
                    <span style={{ fontWeight: 600 }}>+{formatCurrency(shipping, symbol)}</span>
                </div>
            )}

            {deliveryMethod === 'AGENCY_SHIPPING' && shippingPaymentType === 'DESTINATION' && (
                <div style={{ ...rowStyle, color: '#94a3b8', fontSize: '0.8rem' }}>
                    <span>Flete Agencia:</span>
                    <span>Pago en destino</span>
                </div>
            )}

            <div style={{ ...rowStyle, color: '#94a3b8' }}>
                <span>Subtotal (Base):</span>
                <span>{formatCurrency(subtotal, symbol)}</span>
            </div>

            <div style={{ ...rowStyle, color: '#94a3b8' }}>
                <span>IGV (18%):</span>
                <span>{formatCurrency(igv, symbol)}</span>
            </div>

            <div style={totalStyle}>
                <span>Total:</span>
                <span style={{ color: '#10b981' }}>{formatCurrency(total, symbol)}</span>
            </div>
        </div>
    );
};

export default OrderSummary;
