import React from 'react';
import { formatCurrency } from '../../../utils/formatters';

const ReceiptBody = ({
    partyInfo,
    items = [],
    partyType = "Cliente", // "Cliente" or "Proveedor"
    currencySymbol = 'S/',
    showPrices = true
}) => {
    return (
        <div className="receipt-body">
            {/* Items Table */}
            <table className="receipt-items-table">
                <thead>
                    <tr>
                        <th className="text-center">Cant.</th>
                        <th>SKU / Código</th>
                        <th style={{ textAlign: 'left' }}>Descripción del Producto</th>
                        {showPrices && (
                            <>
                                <th className="text-right">P. Unit.</th>
                                <th className="text-right">Subtotal</th>
                            </>
                        )}
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, index) => (
                        <tr key={index}>
                            <td className="text-center" style={{ padding: '0.25rem 0.5rem', fontWeight: 'bold' }}>
                                {item.quantity}
                            </td>
                            <td style={{ padding: '0.25rem 0.5rem', fontSize: '8.5px', color: '#4b5563', textTransform: 'uppercase' }}>
                                {item.product_sku || '-'}
                            </td>
                            <td style={{ padding: '0.25rem 0.5rem' }}>
                                <div style={{ 
                                    fontSize: '10.5px', 
                                    fontWeight: '600', 
                                    color: '#0f172a' 
                                }}>
                                    {item.product_name || 
                                     item.name || 
                                     item.product?.name || 
                                     item.description || 
                                     item.product?.description || 
                                     'Producto sin nombre'}
                                </div>
                            </td>
                            {showPrices && (
                                <>
                                    <td className="text-right" style={{ padding: '0.25rem 0.5rem' }}>{formatCurrency(item.unit_price || item.unit_cost, currencySymbol)}</td>
                                    <td className="text-right" style={{ padding: '0.25rem 0.5rem' }}>{formatCurrency(item.subtotal, currencySymbol)}</td>
                                </>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ReceiptBody;
