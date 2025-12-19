import React from 'react';
import { formatCurrency, formatDate } from '../../../utils/formatters';

const ReceiptFooter = ({
    totalAmount,
    amountPaid = 0,
    payments = [],
    notes,
    showPaymentDetails = false,
    paymentTerms = null
}) => {
    const pendingAmount = totalAmount - amountPaid;

    // Cálculo de IGV (18%) - El total ya incluye IGV
    // Fórmula: IGV = Total * 18 / 118
    const igv = totalAmount * 18 / 118;
    const subtotal = totalAmount - igv;

    return (
        <div>
            {/* Totals Section con desglose de IGV */}
            <div className="receipt-totals">
                <div className="receipt-total-row">
                    <span className="receipt-total-label">Subtotal (sin IGV):</span>
                    <span className="receipt-total-value">{formatCurrency(subtotal)}</span>
                </div>
                <div className="receipt-total-row">
                    <span className="receipt-total-label">IGV (18%):</span>
                    <span className="receipt-total-value">{formatCurrency(igv)}</span>
                </div>
                <div className="receipt-total-row grand-total" style={{
                    borderTop: '2px solid #333',
                    paddingTop: '8px',
                    marginTop: '8px',
                    fontWeight: 'bold',
                    fontSize: '14px'
                }}>
                    <span className="receipt-total-label">TOTAL:</span>
                    <span className="receipt-total-value">{formatCurrency(totalAmount)}</span>
                </div>

                {showPaymentDetails && (
                    <>
                        <div className="receipt-total-row" style={{ marginTop: '10px' }}>
                            <span className="receipt-total-label">Pagado:</span>
                            <span className="receipt-total-value">{formatCurrency(amountPaid)}</span>
                        </div>
                        <div className="receipt-total-row" style={{ color: pendingAmount > 0 ? '#dc2626' : '#059669' }}>
                            <span className="receipt-total-label">
                                {pendingAmount > 0 ? 'Pendiente:' : 'Cancelado'}
                            </span>
                            <span className="receipt-total-value">{formatCurrency(Math.abs(pendingAmount))}</span>
                        </div>
                    </>
                )}
            </div>

            {/* Payment History */}
            {showPaymentDetails && payments && payments.length > 0 && (
                <div className="receipt-payment-history">
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
                                    <td className="text-right">{formatCurrency(payment.amount)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Payment Terms (Crédito/Cuotas) */}
            {paymentTerms && paymentTerms.type === 'CREDIT' && paymentTerms.installments && paymentTerms.installments.length > 0 && (
                <div className="receipt-payment-history" style={{ marginTop: '15px' }}>
                    <h4>Cronograma de Pagos (Crédito)</h4>
                    <table className="receipt-payment-table">
                        <thead>
                            <tr>
                                <th>Cuota</th>
                                <th>Vencimiento</th>
                                <th className="text-right">Monto</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paymentTerms.installments.map((inst, index) => (
                                <tr key={index}>
                                    <td>#{inst.number || index + 1}</td>
                                    <td>{formatDate(inst.date)}</td>
                                    <td className="text-right">{formatCurrency(inst.amount)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Notes */}
            {notes && (
                <div className="receipt-notes">
                    <strong>Notas:</strong> {notes}
                </div>
            )}
        </div>
    );
};

export default ReceiptFooter;
