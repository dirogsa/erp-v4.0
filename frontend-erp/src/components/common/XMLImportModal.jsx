import React, { useState } from 'react';
import Button from './Button';
import { parseUBLXml } from '../../utils/ublParser';
import { formatCurrency } from '../../utils/formatters';

const XMLImportModal = ({ visible, onClose, onConfirm, type = 'PURCHASE' }) => {
    const [fileData, setFileData] = useState(null);
    const [error, setError] = useState('');

    if (!visible) return null;

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const xmlString = event.target.result;
                const parsed = parseUBLXml(xmlString);
                setFileData(parsed);
                setError('');
            } catch (err) {
                console.error(err);
                setError('No se pudo procesar el archivo XML. Asegúrese de que sea un formato UBL 2.1 válido.');
            }
        };
        reader.readAsText(file);
    };

    const handleConfirm = () => {
        if (fileData) {
            onConfirm(fileData);
            setFileData(null);
            onClose();
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 1100, padding: '2rem'
        }}>
            <div style={{
                backgroundColor: 'white', borderRadius: '0.75rem',
                width: '100%', maxWidth: '700px',
                maxHeight: '90vh', overflowY: 'auto',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                display: 'flex', flexDirection: 'column'
            }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: '#1e293b' }}>
                        Importar desde XML (SUNAT)
                    </h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>×</button>
                </div>

                <div style={{ padding: '1.5rem' }}>
                    {!fileData ? (
                        <div style={{
                            border: '2px dashed #cbd5e1',
                            borderRadius: '1rem',
                            padding: '3rem 2rem',
                            textAlign: 'center',
                            cursor: 'pointer',
                            backgroundColor: '#f8fafc',
                            transition: 'all 0.2s'
                        }} onMouseOver={e => e.currentTarget.style.borderColor = '#3b82f6'} onMouseOut={e => e.currentTarget.style.borderColor = '#cbd5e1'}>
                            <input
                                type="file"
                                accept=".xml"
                                onChange={handleFileUpload}
                                style={{ display: 'none' }}
                                id="xml-upload"
                            />
                            <label htmlFor="xml-upload" style={{ cursor: 'pointer' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📄</div>
                                <div style={{ fontWeight: '700', color: '#334155', fontSize: '1.1rem' }}>Seleccionar archivo XML</div>
                                <div style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.5rem' }}>Soporta formato UBL 2.1 (SUNAT)</div>
                            </label>
                            {error && <div style={{ color: '#ef4444', marginTop: '1rem', fontWeight: '600' }}>{error}</div>}
                        </div>
                    ) : (
                        <div>
                            {/* Preview Table */}
                            <div style={{ backgroundColor: '#f1f5f9', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' }}>Proveedor / Emisor</div>
                                        <div style={{ fontWeight: '700', color: '#1e293b' }}>{fileData.supplier.name}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#475569' }}>RUC: {fileData.supplier.ruc}</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' }}>Documento Detectado</div>
                                        <div style={{ fontWeight: '700', color: '#1e293b' }}>Factura {fileData.document_number}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#475569' }}>Fecha: {fileData.date}</div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                    <thead style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                        <tr>
                                            <th style={{ textAlign: 'left', padding: '0.75rem' }}>Producto</th>
                                            <th style={{ textAlign: 'center', padding: '0.75rem' }}>Cant.</th>
                                            <th style={{ textAlign: 'right', padding: '0.75rem' }}>P. Unit.</th>
                                            <th style={{ textAlign: 'right', padding: '0.75rem' }}>Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {fileData.items.map((item, idx) => (
                                            <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <td style={{ padding: '0.75rem' }}>
                                                    <div style={{ fontWeight: '600' }}>{item.product_name}</div>
                                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Cod: {item.product_sku}</div>
                                                </td>
                                                <td style={{ textAlign: 'center', padding: '0.75rem' }}>{item.quantity}</td>
                                                <td style={{ textAlign: 'right', padding: '0.75rem' }}>{formatCurrency(item.unit_price)}</td>
                                                <td style={{ textAlign: 'right', padding: '0.75rem', fontWeight: '700' }}>{formatCurrency(item.subtotal)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr style={{ borderTop: '2px solid #e2e8f0' }}>
                                            <td colSpan="3" style={{ textAlign: 'right', padding: '1rem', fontWeight: '800' }}>TOTAL DETECTADO:</td>
                                            <td style={{ textAlign: 'right', padding: '1rem', fontWeight: '900', fontSize: '1.1rem', color: '#0f172a' }}>
                                                {formatCurrency(fileData.total_amount)}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                <div style={{ padding: '1.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '1rem', backgroundColor: '#f8fafc', borderBottomLeftRadius: '0.75rem', borderBottomRightRadius: '0.75rem' }}>
                    <Button variant="secondary" onClick={() => { setFileData(null); onClose(); }}>
                        Cancelar
                    </Button>
                    {fileData && (
                        <Button variant="primary" onClick={handleConfirm}>
                            Generar Cotización de {type === 'PURCHASE' ? 'Compra' : 'Venta'}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default XMLImportModal;
