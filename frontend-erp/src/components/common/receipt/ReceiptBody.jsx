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
                        <th className="text-center" style={{ width: '15mm' }}>Cantidad</th>
                        <th className="text-center" style={{ width: '20mm' }}>Unidad</th>
                        <th className="text-center" style={{ width: '25mm' }}>Código</th>
                        <th className="text-left">Descripción</th>
                        {showPrices && (
                            <>
                                <th className="text-right" style={{ width: '25mm' }}>Valor Unit.</th>
                                <th className="text-right" style={{ width: '25mm' }}>Importe</th>
                            </>
                        )}
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, index) => (
                        <tr key={index}>
                            <td className="text-center item-quantity">
                                {Number(item.quantity).toFixed(2)}
                            </td>
                            <td className="text-center">
                                UNIDAD
                            </td>
                            <td className="text-center receipt-product-sku">
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
                                    <td className="text-right item-price">{formatCurrency(item.unit_price || item.unit_cost, currencySymbol)}</td>
                                    <td className="text-right item-subtotal">{formatCurrency(item.subtotal, currencySymbol)}</td>
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
