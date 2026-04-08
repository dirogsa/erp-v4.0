import React, { useState } from 'react';
import Button from './Button';
import { parseUBLXml } from '../../utils/ublParser';
import { formatCurrency } from '../../utils/formatters';

const XMLImportModal = ({ visible, onClose, onConfirm, type = 'PURCHASE' }) => {
    const [batchData, setBatchData] = useState([]);
    const [isParsing, setIsParsing] = useState(false);
    const [error, setError] = useState('');

    if (!visible) return null;

    const handleFileUpload = async (e) => {
        const selectedFiles = Array.from(e.target.files);
        if (selectedFiles.length === 0) return;

        setIsParsing(true);
        setError('');
        const results = [];

        for (const file of selectedFiles) {
            try {
                const text = await file.text();
                const parsed = parseUBLXml(text);
                results.push({
                    ...parsed,
                    _fileName: file.name
                });
            } catch (err) {
                console.error(`Error parsing ${file.name}:`, err);
            }
        }

        if (results.length > 0) {
            setBatchData(prev => [...prev, ...results]);
        } else {
            setError('No se pudo procesar ningún archivo XML válido.');
        }
        setIsParsing(false);
    };

    const handleConfirm = () => {
        if (batchData.length > 0) {
            onConfirm(batchData);
            setBatchData([]);
            onClose();
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(4px)',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 1100, padding: '2rem'
        }}>
            <div style={{
                backgroundColor: '#1e293b',
                borderRadius: '1.25rem',
                border: '1px solid #334155',
                width: '100%', maxWidth: '750px',
                maxHeight: '90vh', overflowY: 'auto',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                display: 'flex', flexDirection: 'column',
                color: '#e2e8f0'
            }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: 'white' }}>
                        Importación Masiva XML (SUNAT)
                    </h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#94a3b8' }}>×</button>
                </div>

                <div style={{ padding: '1.5rem' }}>
                    {batchData.length === 0 ? (
                        <div style={{
                            border: '2px dashed #334155',
                            borderRadius: '1.25rem',
                            padding: '3.5rem 2rem',
                            textAlign: 'center',
                            cursor: 'pointer',
                            backgroundColor: '#0f172a',
                            transition: 'all 0.3s'
                        }}
                            onMouseOver={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.backgroundColor = '#1e293b'; }}
                            onMouseOut={e => { e.currentTarget.style.borderColor = '#334155'; e.currentTarget.style.backgroundColor = '#0f172a'; }}
                            onClick={() => document.getElementById('xml-upload').click()}>
                            <input
                                type="file"
                                accept=".xml"
                                multiple
                                onChange={handleFileUpload}
                                style={{ display: 'none' }}
                                id="xml-upload"
                            />
                            <div style={{ fontSize: '3.5rem', marginBottom: '1.25rem' }}>🧾</div>
                            <div style={{ fontWeight: '700', color: 'white', fontSize: '1.2rem' }}>Selecciona múltiples Facturas XML</div>
                            <div style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.6rem' }}>Arrastra archivos o haz clic para buscar</div>
                            {isParsing && <div style={{ color: '#3b82f6', marginTop: '1rem', fontWeight: 'bold' }}>Procesando...</div>}
                            {error && <div style={{ color: '#f87171', marginTop: '1.5rem', fontWeight: '600', background: '#450a0a', padding: '0.5rem', borderRadius: '0.5rem', fontSize: '0.85rem' }}>{error}</div>}
                        </div>
                    ) : (
                        <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                                    {batchData.length} documento(s) listos para procesar
                                </span>
                                <button
                                    onClick={() => setBatchData([])}
                                    style={{ background: 'none', border: 'none', color: '#f87171', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}
                                >
                                    Limpiar todo
                                </button>
                            </div>

                            <div style={{
                                background: '#0f172a',
                                borderRadius: '1rem',
                                border: '1px solid #334155',
                                overflow: 'hidden',
                                maxHeight: '400px',
                                overflowY: 'auto'
                            }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                    <thead style={{ position: 'sticky', top: 0, backgroundColor: '#1e293b', borderBottom: '1px solid #334155', color: '#94a3b8', zIndex: 1 }}>
                                        <tr>
                                            <th style={{ textAlign: 'left', padding: '1rem' }}>Factura / RUC</th>
                                            <th style={{ textAlign: 'center', padding: '1rem' }}>Fecha Emisión</th>
                                            <th style={{ textAlign: 'right', padding: '1rem' }}>Total</th>
                                            <th style={{ textAlign: 'center', padding: '1rem' }}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {batchData.map((doc, idx) => (
                                            <tr key={idx} style={{ borderBottom: '1px solid #1e293b' }}>
                                                <td style={{ padding: '0.85rem 1rem' }}>
                                                    <div style={{ fontWeight: '700', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        {doc.document_number}
                                                        {doc.document_type === 'CREDIT_NOTE' && (
                                                            <span style={{ backgroundColor: '#ef4444', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem' }}>NOTA DE CRÉDITO</span>
                                                        )}
                                                    </div>
                                                    {doc.document_type === 'CREDIT_NOTE' && doc.related_document && (
                                                        <div style={{ fontSize: '0.75rem', color: '#fca5a5', marginTop: '2px' }}>Aplica a: {doc.related_document}</div>
                                                    )}
                                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{doc.supplier.name} ({doc.supplier.ruc})</div>
                                                </td>
                                                <td style={{ textAlign: 'center', padding: '1rem', color: '#cbd5e1' }}>{doc.date}</td>
                                                <td style={{ textAlign: 'right', padding: '1rem', fontWeight: '800', color: doc.document_type === 'CREDIT_NOTE' ? '#ef4444' : (doc.currency === 'USD' || doc.currency === 'DOLARES' ? '#60a5fa' : '#34d399') }}>
                                                    {doc.document_type === 'CREDIT_NOTE' ? '-' : ''}
                                                    {formatCurrency(doc.total_amount, (doc.currency === 'USD' || doc.currency === 'DOLARES') ? '$' : 'S/')}
                                                </td>
                                                <td style={{ textAlign: 'center', padding: '1rem' }}>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setBatchData(prev => prev.filter((_, i) => i !== idx)); }}
                                                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.2rem' }}
                                                    >
                                                        ×
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div style={{
                                marginTop: '1.5rem',
                                padding: '1.25rem',
                                background: '#0f172a',
                                borderRadius: '1rem',
                                border: '1px solid #334155',
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                gap: '1.5rem'
                            }}>
                                {batchData.some(d => !(d.currency === 'USD' || d.currency === 'DOLARES')) && (
                                    <div>
                                        <div style={{ color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Total en Soles (PEN)</div>
                                        <div style={{ color: '#10b981', fontSize: '1.5rem', fontWeight: '900' }}>
                                            {formatCurrency(batchData.filter(d => !(d.currency === 'USD' || d.currency === 'DOLARES')).reduce((sum, d) => sum + d.total_amount, 0), 'S/')}
                                        </div>
                                    </div>
                                )}
                                
                                {batchData.some(d => (d.currency === 'USD' || d.currency === 'DOLARES')) && (
                                    <div style={{ borderLeft: '1px solid #1e293b', paddingLeft: '1.5rem' }}>
                                        <div style={{ color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Total en Dólares (USD)</div>
                                        <div style={{ color: '#3b82f6', fontSize: '1.5rem', fontWeight: '900' }}>
                                            {formatCurrency(batchData.filter(d => (d.currency === 'USD' || d.currency === 'DOLARES')).reduce((sum, d) => sum + d.total_amount, 0), '$')}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div style={{
                    padding: '1.5rem',
                    borderTop: '1px solid #334155',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '1rem',
                    backgroundColor: '#1e293b',
                    borderBottomLeftRadius: '1.25rem',
                    borderBottomRightRadius: '1.25rem'
                }}>
                    <Button variant="secondary" onClick={() => { setBatchData([]); onClose(); }} style={{ background: '#334155', border: 'none', color: '#e2e8f0' }}>
                        Cancelar
                    </Button>
                    {batchData.length > 0 && (
                        <Button variant="primary" onClick={handleConfirm} style={{ background: '#2563eb', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)' }}>
                            Importar {batchData.length} Documentos
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default XMLImportModal;
