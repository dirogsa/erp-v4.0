import React from 'react';
import './sunat-receipt.css';
import { formatCurrency, formatDate } from '../../../utils/formatters';

const SunatInvoiceTemplate = ({
    documentType = "FACTURA ELECTRONICA",
    documentNumber,
    internalId,
    documentDate,
    partyInfo,
    items = [],
    totalAmount,
    currency,
    amountInWords = '',
    companyName,
    companyRuc,
    companyAddress
}) => {
    
    const isUSD = currency === 'USD' || currency === 'DOLARES';
    const symbol = isUSD ? '$' : 'S/';
    
    // Calcular IGV (Asumiendo 18% para el mockup, o extrayendo si existe)
    const igvRate = 0.18;
    const subtotal = totalAmount / (1 + igvRate);
    const igvAmount = totalAmount - subtotal;

    return (
        <div className="sunat-receipt-container">
            {/* Cabecera Empresa y RUC */}
            <div className="sunat-header">
                <div className="sunat-company-info">
                    <div className="sunat-company-name">{companyName || 'EMPRESA DEMO S.A.C.'}</div>
                    <div className="sunat-company-address">
                        {companyAddress || 'AV. DEMO 123 - LIMA - LIMA'}
                    </div>
                </div>
                
                <div className="sunat-ruc-box">
                    <div>{documentType}</div>
                    <div style={{ margin: '3mm 0' }}>RUC: {companyRuc || '20000000000'}</div>
                    <div>{documentNumber || internalId}</div>
                </div>
            </div>

            {/* Datos del Cliente */}
            <div className="sunat-customer-details">
                <div className="sunat-detail-row">
                    <div className="sunat-detail-label">Fecha de Emisión</div>
                    <div className="sunat-detail-label" style={{ width: '5mm' }}>:</div>
                    <div className="sunat-detail-value">{formatDate(documentDate)}</div>
                    <div className="sunat-detail-extra">Forma de pago: Contado</div>
                </div>
                <div className="sunat-detail-row">
                    <div className="sunat-detail-label">Señor(es)</div>
                    <div className="sunat-detail-label" style={{ width: '5mm' }}>:</div>
                    <div className="sunat-detail-value">{partyInfo?.name}</div>
                </div>
                <div className="sunat-detail-row">
                    <div className="sunat-detail-label">RUC</div>
                    <div className="sunat-detail-label" style={{ width: '5mm' }}>:</div>
                    <div className="sunat-detail-value">{partyInfo?.ruc}</div>
                </div>
                <div className="sunat-detail-row">
                    <div className="sunat-detail-label">Dirección del Cliente</div>
                    <div className="sunat-detail-label" style={{ width: '5mm' }}>:</div>
                    <div className="sunat-detail-value">{partyInfo?.address}</div>
                </div>
                <div className="sunat-detail-row">
                    <div className="sunat-detail-label">Tipo de Moneda</div>
                    <div className="sunat-detail-label" style={{ width: '5mm' }}>:</div>
                    <div className="sunat-detail-value">{isUSD ? 'DÓLARES AMERICANOS' : 'SOLES'}</div>
                </div>
                <div className="sunat-detail-row">
                    <div className="sunat-detail-label">Observación</div>
                    <div className="sunat-detail-label" style={{ width: '5mm' }}>:</div>
                    <div className="sunat-detail-value"></div>
                </div>
            </div>

            {/* Tabla de Productos */}
            <table className="sunat-items-table">
                <thead>
                    <tr>
                        <th style={{ width: '10%' }}>Cantidad</th>
                        <th style={{ width: '15%' }}>Unidad Medida</th>
                        <th style={{ width: '15%' }}>Código</th>
                        <th style={{ width: '40%' }}>Descripción</th>
                        <th style={{ width: '10%' }}>Valor Unitario</th>
                        <th style={{ width: '10%' }}>ICBPER</th>
                    </tr>
                </thead>
                <tbody style={{ minHeight: '100px' }}>
                    {items.map((item, idx) => (
                        <tr key={idx}>
                            <td className="center-col">{parseFloat(item.quantity).toFixed(2)}</td>
                            <td className="center-col">UNIDAD</td>
                            <td className="center-col">{item.sku || item.product_sku}</td>
                            <td>{item.description || item.product_name}</td>
                            <td className="num-col">{(item.unit_price || 0).toFixed(3)}</td>
                            <td className="num-col">0.00</td>
                        </tr>
                    ))}
                    {/* Filler space if few items */}
                    {items.length < 5 && (
                        <tr>
                            <td colSpan="6" style={{ height: `${(5 - items.length) * 10}mm`, border: 'none', borderLeft: '1px solid #000', borderRight: '1px solid #000' }}></td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* Pie de Totales */}
            <div className="sunat-footer">
                <div className="sunat-amount-words">
                    <div className="free-op">
                        Valor de Venta de Operaciones Gratuitas : {symbol} 0.00
                    </div>
                    <div>
                        SON: {amountInWords || '----------------------------------------'}
                    </div>
                </div>

                <div className="sunat-totals-box">
                    <div className="sunat-total-row">
                        <div className="sunat-total-label">Sub Total Ventas :</div>
                        <div className="sunat-total-value">{symbol} {subtotal.toFixed(2)}</div>
                    </div>
                    <div className="sunat-total-row">
                        <div className="sunat-total-label">Anticipos :</div>
                        <div className="sunat-total-value">{symbol} 0.00</div>
                    </div>
                    <div className="sunat-total-row">
                        <div className="sunat-total-label">Descuentos :</div>
                        <div className="sunat-total-value">{symbol} 0.00</div>
                    </div>
                    <div className="sunat-total-row">
                        <div className="sunat-total-label">Valor Venta :</div>
                        <div className="sunat-total-value">{symbol} {subtotal.toFixed(2)}</div>
                    </div>
                    <div className="sunat-total-row">
                        <div className="sunat-total-label">ISC :</div>
                        <div className="sunat-total-value">{symbol} 0.00</div>
                    </div>
                    <div className="sunat-total-row">
                        <div className="sunat-total-label">IGV :</div>
                        <div className="sunat-total-value">{symbol} {igvAmount.toFixed(2)}</div>
                    </div>
                    <div className="sunat-total-row">
                        <div className="sunat-total-label">ICBPER :</div>
                        <div className="sunat-total-value">{symbol} 0.00</div>
                    </div>
                    <div className="sunat-total-row">
                        <div className="sunat-total-label">Otros Cargos :</div>
                        <div className="sunat-total-value">{symbol} 0.00</div>
                    </div>
                    <div className="sunat-total-row">
                        <div className="sunat-total-label">Otros Tributos :</div>
                        <div className="sunat-total-value">{symbol} 0.00</div>
                    </div>
                    <div className="sunat-total-row">
                        <div className="sunat-total-label">Monto de redondeo :</div>
                        <div className="sunat-total-value">{symbol} 0.00</div>
                    </div>
                    <div className="sunat-total-row" style={{ fontWeight: 'bold' }}>
                        <div className="sunat-total-label">Importe Total :</div>
                        <div className="sunat-total-value" style={{ fontWeight: 'bold' }}>{symbol} {parseFloat(totalAmount).toFixed(2)}</div>
                    </div>
                </div>
            </div>

            <div className="sunat-legal-box">
                Esta es una representación impresa de la factura electrónica, generada en el Sistema de SUNAT. Puede verificarla utilizando su clave SOL.
            </div>
        </div>
    );
};

export default SunatInvoiceTemplate;
