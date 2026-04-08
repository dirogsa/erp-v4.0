import React, { useState } from 'react';
import PrintableModal from '../../common/receipt/PrintableModal';
import { formatDate } from '../../../utils/formatters';
import { COMPANY_INFO } from '../../../config/company';
import DualReceiptWrapper from '../../common/receipt/DualReceiptWrapper';
import SunatGuideTemplate from '../../common/receipt/SunatGuideTemplate';

const DeliveryGuideReceipt = ({
    visible,
    onClose,
    guide
}) => {
    const [printFormat, setPrintFormat] = useState('A5_SINGLE');

    if (!visible || !guide) return null;

    const renderContent = () => {
        if (printFormat === 'SUNAT') {
            return (
                <SunatGuideTemplate
                    guideNumber={guide.guide_number}
                    sunatNumber={guide.sunat_number}
                    issueDate={guide.issue_date}
                    partyInfo={{
                        name: guide.customer_name,
                        ruc: guide.customer_ruc,
                        address: guide.delivery_address
                    }}
                    items={guide.items || []}
                    companyName={guide.issuer_info?.name || COMPANY_INFO.name}
                    companyRuc={guide.issuer_info?.ruc || COMPANY_INFO.ruc}
                    companyAddress={guide.issuer_info?.address || COMPANY_INFO.address}
                    relatedInvoice={guide.invoice_number}
                    vehiclePlate={guide.vehicle_plate}
                    driverName={guide.driver_name}
                />
            );
        }

        // Legacy A5/Dual layout
        return (
            <DualReceiptWrapper format={printFormat}>
                <div className="receipt-content">
                    <div className="receipt-header">
                        <h1>{guide.issuer_info?.name || COMPANY_INFO.name}</h1>
                        <h3>GUÍA DE REMISIÓN</h3>
                        <div className="company-info">RUC: {guide.issuer_info?.ruc || COMPANY_INFO.ruc}</div>
                        <div className="company-info">{guide.issuer_info?.address || COMPANY_INFO.address}</div>
                        <div style={{ fontWeight: 'bold', fontSize: '14px', marginTop: '5px' }}>
                            {guide.sunat_number}
                        </div>
                        <div style={{ fontSize: '10px', color: '#666' }}>Ref: {guide.guide_number}</div>
                    </div>

                    <div className="receipt-document-info">
                        <div><strong>Fecha:</strong> {formatDate(guide.issue_date)}</div>
                        <div><strong>Factura Ref:</strong> {guide.invoice_number || '-'}</div>
                    </div>

                    <div style={{ background: '#f5f5f5', padding: '5px', borderRadius: '4px', marginBottom: '10px', fontSize: '10px' }}>
                        <strong>DESTINATARIO:</strong><br />
                        {guide.customer_name}<br />
                        RUC: {guide.customer_ruc || '-'}<br />
                        {guide.delivery_address}
                    </div>

                    {(guide.vehicle_plate || guide.driver_name) && (
                        <div style={{ background: '#e8f4fd', padding: '5px', borderRadius: '4px', marginBottom: '10px', fontSize: '10px' }}>
                            <strong>TRANSPORTE:</strong><br />
                            Placa: {guide.vehicle_plate || '-'} | Chofer: {guide.driver_name || '-'}
                        </div>
                    )}

                    <table className="receipt-items-table">
                        <thead>
                            <tr>
                                <th>SKU</th>
                                <th>Descripción</th>
                                <th className="text-center">Cant.</th>
                                <th className="text-right">Peso (g)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {guide.items?.map((item, index) => (
                                <tr key={index}>
                                    <td>{item.sku}</td>
                                    <td>{item.product_name}</td>
                                    <td className="text-center">{item.quantity}</td>
                                    <td className="text-right">{(item.weight_g || 0) * item.quantity}g</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colSpan="2"></td>
                                <td className="text-center" style={{ fontWeight: 'bold' }}>Total:</td>
                                <td className="text-right" style={{ fontWeight: 'bold' }}>
                                    {guide.items?.reduce((sum, item) => sum + ((item.weight_g || 0) * item.quantity), 0)}g
                                </td>
                            </tr>
                        </tfoot>
                    </table>

                    {guide.notes && (
                        <div style={{ fontSize: '10px', fontStyle: 'italic', marginBottom: '10px' }}>
                            Nota: {guide.notes}
                        </div>
                    )}

                    <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                        <div style={{ borderTop: '1px solid #000', width: '40%', textAlign: 'center', paddingTop: '5px' }}>
                            Entregado por
                        </div>
                        <div style={{ borderTop: '1px solid #000', width: '40%', textAlign: 'center', paddingTop: '5px' }}>
                            Recibido por: {guide.received_by || ''}
                        </div>
                    </div>
                </div>
            </DualReceiptWrapper>
        );
    };

    return (
        <PrintableModal
            visible={visible}
            onClose={onClose}
            title={`Guía de Remisión ${guide.sunat_number || guide.guide_number}`}
            onFormatChange={setPrintFormat}
        >
            {renderContent()}
        </PrintableModal>
    );
};

export default DeliveryGuideReceipt;
