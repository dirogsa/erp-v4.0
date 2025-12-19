import React from 'react';
import Button from '../../common/Button';

const ReportViewerModal = ({ visible, onClose, title, children }) => {
    if (!visible) return null;

    const handlePrint = () => {
        window.print();
    };

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
            zIndex: 1000,
            padding: '2rem'
        }} className="no-print-overlay">
            <div style={{
                backgroundColor: 'white', // White for paper simulation
                color: 'black',
                borderRadius: '0.5rem',
                width: '90%',
                maxWidth: '1200px',
                height: '90vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}>
                {/* Header Actions */}
                <div style={{
                    padding: '1rem',
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: '#f8fafc'
                }} className="no-print">
                    <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>{title}</h2>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <Button
                            onClick={handlePrint}
                            style={{ backgroundColor: '#0f172a', color: 'white' }}
                        >
                            🖨️ Imprimir / Guardar PDF
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={onClose}
                            style={{ border: '1px solid #cbd5e1' }}
                        >
                            Cerrar
                        </Button>
                    </div>
                </div>

                {/* Report Content - Scrollable Preview */}
                <div style={{
                    flex: 1,
                    overflow: 'auto',
                    padding: '2rem',
                    backgroundColor: 'white'
                }} className="print-content">
                    {/* Print Header (Only visible on print usually, but good for preview too) */}
                    <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{title}</h1>
                        <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                            Generado el {new Date().toLocaleDateString('es-PE')} {new Date().toLocaleTimeString('es-PE')}
                        </div>
                    </div>

                    {children}
                </div>

                /* Global Print Styles */
                <style>{`
                    @media print {
                        /* Hide everything by default */
                        body * {
                            visibility: hidden;
                        }
                        
                        /* But show the print content */
                        .print-content, .print-content * {
                            visibility: visible;
                        }

                        /* Position the print content at top left */
                        .print-content {
                            position: absolute; /* Changed from fixed to absolute to avoid some browser weirdness with scroll */
                            left: 0;
                            top: 0;
                            width: 100%;
                            height: auto;
                            margin: 0;
                            padding: 0 !important; /* Remove padding to let @page margin handle it */
                            background: white;
                            color: black;
                            box-sizing: border-box; /* Ensure padding doesn't increase width */
                            overflow: visible !important;
                        }
                        
                        /* Hide the modal actions header specificially */
                        .no-print {
                            display: none !important;
                        }
                        
                        /* Ensure background graphics (colors) are printed if browser allows */
                        * {
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }

                        @page {
                            margin: 1cm;
                            size: auto;
                        }
                    }
                `}</style>
            </div>
        </div>
    );
};

export default ReportViewerModal;
