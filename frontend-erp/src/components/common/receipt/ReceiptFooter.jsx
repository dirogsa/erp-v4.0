import React from 'react';
import { formatCurrency, formatDate } from '../../../utils/formatters';

const ReceiptFooter = ({
    totalAmount,
    amountPaid = 0,
    payments = [],
    notes,
    showPaymentDetails = false,
    paymentTerms = null,
    currencySymbol = 'S/'
}) => {
    const pendingAmount = totalAmount - amountPaid;

    // Cálculo de IGV (18%) - El total ya incluye IGV
    // Fórmula: IGV = Total * 18 / 118
    const igv = totalAmount * 18 / 118;
    const subtotal = totalAmount - igv;

    return (
        <div>
            {/* Totals Section - SUNAT Style Box */}
            <div className="receipt-totals">
                <div style={{ flex: 1 }}>
                    {/* Espacio para Monto en Letras si es necesario o códigos QR */}
                </div>
                
                <div className="receipt-totals-box">
                    <div className="receipt-total-row">
                        <span className="receipt-total-label">Sub Total Ventas:</span>
                        <span className="receipt-total-value">{formatCurrency(subtotal, currencySymbol)}</span>
                    </div>
                    <div className="receipt-total-row">
                        <span className="receipt-total-label">Anticipos:</span>
                        <span className="receipt-total-value">{formatCurrency(0, currencySymbol)}</span>
                    </div>
                    <div className="receipt-total-row">
                        <span className="receipt-total-label">Descuentos:</span>
                        <span className="receipt-total-value">{formatCurrency(0, currencySymbol)}</span>
                    </div>
                    <div className="receipt-total-row">
                        <span className="receipt-total-label">Valor Venta:</span>
                        <span className="receipt-total-value">{formatCurrency(subtotal, currencySymbol)}</span>
                    </div>
                    <div className="receipt-total-row">
                        <span className="receipt-total-label">ISC:</span>
                        <span className="receipt-total-value">{formatCurrency(0, currencySymbol)}</span>
                    </div>
                    <div className="receipt-total-row">
                        <span className="receipt-total-label">IGV:</span>
                        <span className="receipt-total-value">{formatCurrency(igv, currencySymbol)}</span>
                    </div>
                    <div className="receipt-total-row">
                        <span className="receipt-total-label">Otros Cargos:</span>
                        <span className="receipt-total-value">{formatCurrency(0, currencySymbol)}</span>
                    </div>
                    <div className="receipt-total-row">
                        <span className="receipt-total-label">Otros Tributos:</span>
                        <span className="receipt-total-value">{formatCurrency(0, currencySymbol)}</span>
                    </div>
                    <div className="receipt-total-row">
                        <span className="receipt-total-label">Monto de redondeo:</span>
                        <span className="receipt-total-value">{formatCurrency(0, currencySymbol)}</span>
                    </div>
                    <div className="receipt-total-row grand-total">
                        <span className="receipt-total-label">Importe Total:</span>
                        <span className="receipt-total-value">{formatCurrency(totalAmount, currencySymbol)}</span>
                    </div>
                </div>
            </div>

            {/* Disclaimer SUNAT */}
            <div className="receipt-disclaimer-box">
                Esta es una representación impresa de la factura electrónica, generada en el Sistema de SUNAT. Puede verificarla utilizando su clave SOL.
            </div>

            {/* Payment History */}
            {showPaymentDetails && payments && payments.length > 0 && (
                <div className="receipt-payment-history" style={{ marginTop: '5mm' }}>
                    <h4>Historial de Pagos</h4>
                    <table className="receipt-payment-table">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Notas</th>
                                <th className="text-right">Monto</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.map((payment, index) => (
                                <tr key={index}>
                                    <td>{formatDate(payment.date)}</td>
                                    <td>{payment.notes || '-'}</td>
                                    <td className="text-right">{formatCurrency(payment.amount, currencySymbol)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    </div>
                )}

            {/* Notes */}
            {notes && (
                <div className="receipt-notes">
                    <strong>Observaciones:</strong> {notes}
                </div>
            )}
        </div>
    );
};

export default ReceiptFooter;
