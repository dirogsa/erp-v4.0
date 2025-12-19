import React from 'react';
import { formatCurrency } from '../../../utils/formatters';

const OrderSummary = ({ items = [] }) => {
    const total = items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
    const subtotal = total / 1.18;
    const igv = total - subtotal;

    const rowStyle = {
        display: 'flex',
        justifyContent: 'space-between',
        padding: '0.5rem 0',
        borderBottom: '1px solid #334155',
        color: '#cbd5e1'
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
            maxWidth: '300px',
            marginLeft: 'auto'
        }}>
            <h3 style={{ marginBottom: '1rem', color: '#e2e8f0', fontSize: '1.1rem' }}>
                Resumen
            </h3>

            <div style={rowStyle}>
                <span>Subtotal:</span>
                <span>{formatCurrency(subtotal)}</span>
            </div>

            <div style={rowStyle}>
                <span>IGV (18%):</span>
                <span>{formatCurrency(igv)}</span>
            </div>

            <div style={totalStyle}>
                <span>Total:</span>
                <span style={{ color: '#10b981' }}>{formatCurrency(total)}</span>
            </div>
        </div>
    );
};

export default OrderSummary;
