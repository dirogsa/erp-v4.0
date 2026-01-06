import React, { useRef, useState } from 'react';
import { useReactToPrint } from 'react-to-print';
import Button from '../Button';
import './receipt.css';

const PrintableModal = ({
    visible,
    onClose,
    children,
    title = "Recibo"
}) => {
    const [printFormat, setPrintFormat] = useState('A4_DUAL'); // 'A4_DUAL' or 'A5_SINGLE'
    const receiptRef = useRef(null);

    const handlePrint = useReactToPrint({
        contentRef: receiptRef,
        documentTitle: title,
        pageStyle: `
            @page {
                size: landscape !important;
                margin: 0 !important;
            }
            @media print {
                body {
                    -webkit-print-color-adjust: exact;
                }
            }
        `
    });

    if (!visible) return null;

    return (
        <div className="modal-overlay" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            padding: '2rem'
        }}>
            <div className="modal-container" style={{
                backgroundColor: '#f8f9fa',
                borderRadius: '0.5rem',
                width: '95%',
                maxWidth: '320mm',
                maxHeight: '95vh',
                overflowY: 'auto',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                display: 'flex',
                flexDirection: 'column'
            }}>
                {/* Header with buttons */}
                <div className="no-print" style={{
                    padding: '1rem 1.5rem',
                    borderBottom: '1px solid #dee2e6',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: '#0f172a',
                    borderTopLeftRadius: '0.5rem',
                    borderTopRightRadius: '0.5rem',
                    position: 'sticky',
                    top: 0,
                    zIndex: 10
                }}>
                    <h2 style={{ color: 'white', margin: 0, fontSize: '1.25rem' }}>
                        {title}
                    </h2>
                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                        {/* Format Toggle - Premium Look */}
                        <div style={{
                            display: 'flex',
                            backgroundColor: '#1e293b',
                            padding: '3px',
                            borderRadius: '20px',
                            border: '1px solid #334155'
                        }}>
                            <button
                                onClick={() => setPrintFormat('A4_DUAL')}
                                style={{
                                    padding: '5px 15px',
                                    borderRadius: '17px',
                                    border: 'none',
                                    fontSize: '0.75rem',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    backgroundColor: printFormat === 'A4_DUAL' ? '#3b82f6' : 'transparent',
                                    color: printFormat === 'A4_DUAL' ? 'white' : '#94a3b8'
                                }}
                            >
                                A4 (2 Copias)
                            </button>
                            <button
                                onClick={() => setPrintFormat('A5_SINGLE')}
                                style={{
                                    padding: '5px 15px',
                                    borderRadius: '17px',
                                    border: 'none',
                                    fontSize: '0.75rem',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    backgroundColor: printFormat === 'A5_SINGLE' ? '#3b82f6' : 'transparent',
                                    color: printFormat === 'A5_SINGLE' ? 'white' : '#94a3b8'
                                }}
                            >
                                A5 (1 Copia)
                            </button>
                        </div>

                        <Button onClick={handlePrint} variant="success">
                            🖨️ Imprimir / PDF
                        </Button>
                        <button
                            onClick={onClose}
                            className="modal-close"
                            style={{
                                background: 'none',
                                border: 'none',
                                color: '#94a3b8',
                                fontSize: '1.5rem',
                                cursor: 'pointer',
                                padding: '0 0.5rem'
                            }}
                        >
                            ×
                        </button>
                    </div>
                </div>

                {/* Receipt content */}
                <div className="receipt-preview" style={{
                    padding: '2rem',
                    display: 'flex',
                    justifyContent: 'center',
                    backgroundColor: '#e2e8f0'
                }}>
                    <div ref={receiptRef}>
                        {React.Children.map(children, child => {
                            if (React.isValidElement(child)) {
                                return React.cloneElement(child, { format: printFormat });
                            }
                            return child;
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrintableModal;
