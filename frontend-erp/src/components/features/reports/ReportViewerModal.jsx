import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import Button from '../../common/Button';

const ReportViewerModal = ({ visible, onClose, title, children }) => {
    const reportRef = useRef(null);

    const reactToPrintFn = useReactToPrint({
        contentRef: reportRef,
        documentTitle: title || 'Reporte',
    });

    const handlePrint = () => {
        if (typeof reactToPrintFn === 'function') {
            reactToPrintFn();
        }
    };

    if (!visible) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999, // Super high to be on top of everything
            padding: '2rem'
        }} className="modal-overlay">
            <div style={{
                backgroundColor: 'white',
                color: 'black',
                borderRadius: '0.5rem',
                width: '90%',
                maxWidth: '1200px',
                height: '95vh', // Slightly taller
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                position: 'relative',
                overflow: 'hidden'
            }} className="modal-container">
                {/* Header Actions - Explicitly on top */}
                <div style={{
                    padding: '1rem',
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: '#f8fafc',
                    zIndex: 100 // Ensure buttons are clickable
                }} className="no-print">
                    <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>{title}</h2>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <Button
                            onClick={handlePrint}
                            style={{ backgroundColor: '#0f172a', color: 'white', cursor: 'pointer' }}
                        >
                            🖨️ Imprimir / Guardar PDF
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={onClose}
                            style={{ border: '1px solid #cbd5e1', cursor: 'pointer' }}
                        >
                            Cerrar
                        </Button>
                    </div>
                </div>

                <div style={{
                    flex: 1,
                    overflow: 'auto',
                    padding: '20px',
                    backgroundColor: '#cbd5e1',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                }} className="preview-container">
                    <div ref={reportRef} className="printable-area" style={{
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        backgroundColor: '#cbd5e1'
                    }}>
                        <div style={{
                            width: '148mm', // A5 Width
                            minHeight: '210mm', // A5 Height
                            backgroundColor: 'white',
                            padding: '10mm 8mm', // Compact padding for A5
                            boxShadow: '0 0 50px rgba(0,0,0,0.2)',
                            margin: '0 auto',
                            borderRadius: '2px',
                            boxSizing: 'border-box',
                            position: 'relative',
                            fontFamily: "'Inter', sans-serif"
                        }} className="print-content">
                            {children}
                        </div>

                        <style>{`
                            @media print {
                                .printable-area {
                                    display: block !important;
                                    width: 100% !important;
                                    background: white !important;
                                }
                                .print-content {
                                    width: 148mm !important;
                                    height: 210mm !important;
                                    margin: 0 !important;
                                    padding: 10mm 8mm !important;
                                    box-shadow: none !important;
                                    background: white !important;
                                }
                                @page {
                                    margin: 0;
                                    size: A5 portrait;
                                }
                                body {
                                    -webkit-print-color-adjust: exact !important;
                                    print-color-adjust: exact !important;
                                }
                                .no-print, .sidebar, .sidebar-toggle, .fab {
                                    display: none !important;
                                }
                            }
                        `}</style>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportViewerModal;
