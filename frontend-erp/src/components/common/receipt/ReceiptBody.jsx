import React from 'react';
import { formatCurrency } from '../../../utils/formatters';

const ReceiptBody = ({
    partyInfo,
    items = [],
    partyType = "Cliente", // "Cliente" or "Proveedor"
    currencySymbol = 'S/'
}) => {
    return (
        <div className="receipt-body">
            {/* Items Table */}
            <table className="receipt-items-table">
                <thead>
                    <tr>
                        <th>Producto</th>
                        <th className="text-center">Cant.</th>
                        <th className="text-right">P. Unit.</th>
                        <th className="text-right">Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, index) => (
                        <tr key={index}>
                            <td>
                                <div className="receipt-product-name">{item.product_name}</div>
                                {item.product_sku && (
                                    <div className="receipt-product-sku">SKU: {item.product_sku}</div>
                                )}
                            </td>
                            <td className="text-center">{item.quantity}</td>
                            <td className="text-right">{formatCurrency(item.unit_price, currencySymbol)}</td>
                            <td className="text-right">{formatCurrency(item.subtotal, currencySymbol)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ReceiptBody;
