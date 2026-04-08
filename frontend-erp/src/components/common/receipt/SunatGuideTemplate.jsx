import React from 'react';
import './sunat-receipt.css';
import { formatDate } from '../../../utils/formatters';

const SunatGuideTemplate = ({
    guideNumber,
    sunatNumber,
    issueDate,
    partyInfo,
    items = [],
    companyName,
    companyRuc,
    companyAddress,
    relatedInvoice,
    vehiclePlate,
    driverName
}) => {
    
    // Calcular peso bruto
    const totalWeightGrams = items.reduce((sum, item) => sum + ((item.weight_g || 0) * item.quantity), 0);
    const totalWeightKg = (totalWeightGrams / 1000).toFixed(2);

    return (
        <div className="sunat-receipt-container" style={{ fontSize: '10px' }}>
            {/* Cabecera Empresa y RUC */}
            <div className="sunat-header" style={{ alignItems: 'center' }}>
                <div style={{ width: '30mm', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="sunat-qr-code"></div> {/* Mockup de QR */}
                </div>
                <div className="sunat-company-info" style={{ paddingLeft: '5mm' }}>
                    <div className="sunat-company-name" style={{ fontSize: '14px' }}>{companyName || 'EMPRESA DEMO S.A.C.'}</div>
                </div>
                
                <div className="sunat-ruc-box" style={{ fontSize: '14px', minWidth: '60mm', padding: '3mm' }}>
                    <div style={{ margin: '1mm 0' }}>RUC N° {companyRuc || '20000000000'}</div>
                    <div style={{ fontSize: '12px', margin: '2mm 0', lineHeight: '1.2' }}>GUÍA DE REMISIÓN ELECTRÓNICA<br/>REMITENTE</div>
                    <div>N° {sunatNumber || guideNumber}</div>
                </div>
            </div>

            {/* Datos Principales */}
            <div style={{ marginBottom: '4mm', fontWeight: 'bold' }}>
                Fecha y hora de emisión : {formatDate(issueDate)}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5mm', marginBottom: '4mm' }}>
                <div>
                    <span style={{ fontWeight: 'bold' }}>Fecha de inicio de Traslado :</span> {formatDate(issueDate).split(' ')[0]}
                </div>
                <div>
                    <span style={{ fontWeight: 'bold' }}>Punto de Partida :</span> {companyAddress || 'AV. LOS ALAMOS 123'}
                </div>
                <div>
                    <span style={{ fontWeight: 'bold' }}>Motivo de Traslado :</span> Venta
                </div>
                <div>
                    <span style={{ fontWeight: 'bold' }}>Punto de llegada :</span> {partyInfo?.address || '-'}
                </div>
            </div>

            <div style={{ marginBottom: '2mm' }}>
                <span style={{ fontWeight: 'bold' }}>Datos del Destinatario :</span> {partyInfo?.name} - REGISTRO ÚNICO DE CONTRIBUYENTES N° {partyInfo?.ruc}
            </div>

            <div style={{ marginBottom: '2mm' }}>
                <span style={{ fontWeight: 'bold' }}>Documentos Relacionados:</span>
                <br/>
                {relatedInvoice ? `Factura N° ${relatedInvoice} - RUC N° ${partyInfo?.ruc}` : 'Ninguno'}
            </div>

            <div style={{ fontWeight: 'bold', marginBottom: '2mm', marginTop: '4mm' }}>
                Bienes por transportar:
            </div>

            {/* Tabla de Productos */}
            <table className="sunat-items-table" style={{ fontSize: '9px' }}>
                <thead>
                    <tr style={{ backgroundColor: '#e2e2e2' }}>
                        <th style={{ width: '4%' }}>N°</th>
                        <th style={{ width: '8%' }}>Bien<br/>normalizado</th>
                        <th style={{ width: '12%' }}>Código de<br/>Bien</th>
                        <th style={{ width: '12%' }}>Código<br/>producto<br/>SUNAT</th>
                        <th style={{ width: '12%' }}>Partida<br/>arancelaria</th>
                        <th style={{ width: '12%' }}>Código<br/>GTIN</th>
                        <th style={{ width: '25%' }}>Descripción Detallada</th>
                        <th style={{ width: '10%' }}>Unidad de<br/>medida</th>
                        <th style={{ width: '5%' }}>Cantidad</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, idx) => (
                        <tr key={idx}>
                            <td className="center-col">{idx + 1}</td>
                            <td className="center-col">NO</td>
                            <td className="center-col">{item.sku || item.product_sku}</td>
                            <td className="center-col">-</td>
                            <td className="center-col">-</td>
                            <td className="center-col">-</td>
                            <td>{item.description || item.product_name}</td>
                            <td className="center-col">UNIDAD (NIU)</td>
                            <td className="num-col">{parseFloat(item.quantity).toFixed(2)}</td>
                        </tr>
                    ))}
                    {items.length === 0 && (
                        <tr>
                            <td colSpan="9" style={{ textAlign: 'center' }}>No existen bienes registrados</td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* Traslado Info */}
            <div style={{ marginTop: '5mm', lineHeight: '1.8' }}>
                <div>Unidad de Medida del Peso Bruto: KGM</div>
                <div>Peso Bruto total de la carga: {totalWeightKg}</div>
                
                <div style={{ fontWeight: 'bold', marginTop: '4mm' }}>Datos del traslado:</div>
                <div>Modalidad de Traslado: {vehiclePlate || driverName ? 'Público/Privado' : 'Privado'}</div>
                <div>Indicador de transbordo programado: NO</div>
                <div>Indicador de traslado en vehículos de categoría M1 o L: SI</div>
                {vehiclePlate && (
                    <div>Placa de vehículo: {vehiclePlate}</div>
                )}
                {driverName && (
                    <div>Conductor: {driverName}</div>
                )}
            </div>
        </div>
    );
};

export default SunatGuideTemplate;
