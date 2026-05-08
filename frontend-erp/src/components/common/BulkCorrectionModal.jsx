import React, { useState } from 'react';
import Button from '../common/Button';
import PaymentInfoSection from '../forms/OrderForm/PaymentInfoSection';

const BulkCorrectionModal = ({
    visible,
    onClose,
    onConfirm,
    selectedCount,
    totalAmount = 0, // In bulk, we might not have a single total, but we can use 0 for defaults
    loading = false
}) => {
    const [paymentTerms, setPaymentTerms] = useState({ type: 'CREDIT', installments: [] });

    if (!visible) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 2000,
            padding: '2rem'
        }}>
            <div style={{
                backgroundColor: '#0f172a',
                borderRadius: '0.75rem',
                width: '100%',
                maxWidth: '600px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                border: '1px solid #334155',
                overflow: 'hidden'
            }}>
                <div style={{
                    padding: '1.5rem',
                    borderBottom: '1px solid #334155',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: '#1e293b'
                }}>
                    <h2 style={{ color: 'white', margin: 0, fontSize: '1.25rem' }}>
                        Regularización Financiera Masiva
                    </h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                </div>

                <div style={{ padding: '1.5rem' }}>
                    <div style={{ 
                        backgroundColor: 'rgba(59, 130, 246, 0.1)', 
                        border: '1px solid #3b82f6', 
                        padding: '1rem', 
                        borderRadius: '0.5rem', 
                        marginBottom: '1.5rem',
                        color: '#e2e8f0',
                        fontSize: '0.9rem'
                    }}>
                        ℹ️ Vas a regularizar <strong>{selectedCount}</strong> documentos. 
                        Define a continuación las nuevas condiciones de crédito que se aplicarán a todos los documentos seleccionados.
                    </div>

                    <PaymentInfoSection 
                        value={paymentTerms}
                        onChange={setPaymentTerms}
                        totalAmount={0} // We use 0 as we don't have a single total for bulk
                    />

                    {paymentTerms.installments?.length > 0 && (
                        <div style={{ 
                            marginTop: '1rem', 
                            padding: '0.75rem', 
                            backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                            border: '1px solid #ef4444',
                            borderRadius: '0.4rem',
                            color: '#f87171',
                            fontSize: '0.8rem'
                        }}>
                            ⚠️ <strong>Nota:</strong> Al usar cuotas en modo masivo, el monto de cada cuota se calculará proporcionalmente al total de cada factura individual. Las fechas serán idénticas para todas.
                        </div>
                    )}
                </div>

                <div style={{
                    padding: '1.5rem',
                    backgroundColor: '#1e293b',
                    borderTop: '1px solid #334155',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '1rem'
                }}>
                    <Button variant="secondary" onClick={onClose} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button 
                        variant="primary" 
                        onClick={() => onConfirm(paymentTerms)}
                        disabled={loading}
                    >
                        {loading ? 'Procesando...' : 'Aplicar Regularización'}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default BulkCorrectionModal;
