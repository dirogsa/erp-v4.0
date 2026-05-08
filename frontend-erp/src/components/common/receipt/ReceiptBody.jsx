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
                        <th className="text-center" style={{ width: '10mm' }}>CANT</th>
                        <th className="text-center" style={{ width: '6mm' }}>UM</th>
                        <th className="text-center" style={{ width: '16mm' }}>CÓDIGO</th>
                        <th className="text-left">DESCRIPCIÓN</th>
                        {showPrices && (
                            <>
                                <th className="text-right" style={{ width: '18mm' }}>P. UNIT.</th>
                                <th className="text-right" style={{ width: '18mm' }}>TOTAL</th>
                            </>
                        )}
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, index) => (
                        <tr key={index}>
                        <td className="text-center item-quantity" style={{ width: '10mm' }}>
                            {Number(item.quantity).toFixed(2)}
                        </td>
                        <td className="text-center" style={{ width: '6mm' }}>
                            U
                        </td>
                        <td className="text-center receipt-product-sku" style={{ width: '16mm' }}>
                            {item.product_sku || '-'}
                        </td>
                            <td className="item-description-cell">
                                <div className="receipt-product-name">
                                    {item.product_name || 
                                     item.name || 
                                     item.product?.name || 
                                     item.description || 
                                     item.product?.description || 
                                     'N/A'}
                                </div>
                            </td>
                            {showPrices && (
                                <>
                                    <td className="text-right item-price" style={{ width: '18mm' }}>{formatCurrency(item.unit_price || item.unit_cost, currencySymbol)}</td>
                                    <td className="text-right item-subtotal" style={{ width: '18mm' }}>{formatCurrency(item.subtotal, currencySymbol)}</td>
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
