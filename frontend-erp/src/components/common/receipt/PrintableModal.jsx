import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import Button from '../Button';
import './receipt.css';

const PrintableModal = ({
    visible,
    onClose,
    children,
    title = "Recibo"
}) => {
    const receiptRef = useRef(null);

    const handlePrint = useReactToPrint({
        contentRef: receiptRef,
        documentTitle: title,
        pageStyle: `
            @page {
                size: A5;
                margin: 10mm;
            }
        `
    });

    if (!visible) return null;

    return (
        <div style={{
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
            <div style={{
                backgroundColor: '#f8f9fa',
                borderRadius: '0.5rem',
                width: '100%',
                maxWidth: '210mm',
                maxHeight: '90vh',
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
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
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
                <div className="receipt-preview" style={{ padding: '2rem' }}>
                    <div ref={receiptRef}>
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrintableModal;
