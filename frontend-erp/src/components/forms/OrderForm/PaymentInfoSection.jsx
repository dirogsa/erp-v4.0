import React, { useEffect } from 'react';
import Input from '../../common/Input';

const PaymentInfoSection = ({ value, onChange, totalAmount, readOnly = false }) => {
    // value structure: { type: 'CASH' | 'CREDIT', installments: [] }
    // installment: { date: 'YYYY-MM-DD', amount: 0 }

    const handleTypeChange = (type) => {
        const isCredit = type === 'CREDIT';
        onChange({
            ...value,
            type: type,
            // If switching to credit, default to NO installments (Open Credit)
            // unless they specifically want to define them.
            installments: isCredit ? [] : []
        });
    };

    const toggleInstallments = () => {
        const hasInstallments = value.installments?.length > 0;
        if (hasInstallments) {
            onChange({ ...value, installments: [] });
        } else {
            onChange({ ...value, installments: generateInstallments(1) });
        }
    };

    const generateInstallments = (count) => {
        const newInstallments = [];
        const today = new Date();
        const amountPerInst = totalAmount > 0 ? (totalAmount / count) : 0;

        for (let i = 1; i <= count; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + (i * 30)); // Default 30 days gap
            newInstallments.push({
                number: i,
                date: date.toISOString().split('T')[0],
                amount: parseFloat(amountPerInst.toFixed(2))
            });
        }
        return newInstallments;
    };

    const handleCountChange = (e) => {
        const count = parseInt(e.target.value) || 1;
        if (count < 1) return;
        if (count > 36) return; // Limit
        onChange({
            ...value,
            installments: generateInstallments(count)
        });
    };

    const handleDateChange = (index, newDate) => {
        const newInstallments = [...value.installments];
        newInstallments[index].date = newDate;
        onChange({ ...value, installments: newInstallments });
    };

    // Initialize default if empty
    useEffect(() => {
        if (!value) {
            onChange({ type: 'CASH', installments: [] });
        }
    }, []);

    if (!value) return null;

    return (
        <div style={{
            backgroundColor: '#1e293b',
            padding: '2rem',
            borderRadius: '0.75rem',
            marginTop: '2rem',
            border: '1px solid #334155',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
            <h3 style={{
                color: 'white',
                marginTop: 0,
                marginBottom: '1.5rem',
                fontSize: '1.25rem',
                borderBottom: '1px solid #334155',
                paddingBottom: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
            }}>
                💳 Información de Pago
            </h3>

            {/* Payment Type Selection Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                <div
                    onClick={() => !readOnly && handleTypeChange('CASH')}
                    style={{
                        padding: '1rem',
                        borderRadius: '0.5rem',
                        cursor: readOnly ? 'default' : 'pointer',
                        border: `2px solid ${value.type === 'CASH' ? '#3b82f6' : '#334155'}`,
                        backgroundColor: value.type === 'CASH' ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem'
                    }}
                >
                    <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        border: `2px solid ${value.type === 'CASH' ? '#3b82f6' : '#64748b'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        {value.type === 'CASH' && <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#3b82f6' }} />}
                    </div>
                    <div>
                        <div style={{ color: 'white', fontWeight: 'bold' }}>Pago al Contado</div>
                        <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Efectivo / Transferencia inmediata</div>
                    </div>
                </div>

                <div
                    onClick={() => !readOnly && handleTypeChange('CREDIT')}
                    style={{
                        padding: '1rem',
                        borderRadius: '0.5rem',
                        cursor: readOnly ? 'default' : 'pointer',
                        border: `2px solid ${value.type === 'CREDIT' ? '#3b82f6' : '#334155'}`,
                        backgroundColor: value.type === 'CREDIT' ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem'
                    }}
                >
                    <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        border: `2px solid ${value.type === 'CREDIT' ? '#3b82f6' : '#64748b'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        {value.type === 'CREDIT' && <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#3b82f6' }} />}
                    </div>
                    <div>
                        <div style={{ color: 'white', fontWeight: 'bold' }}>Crédito / Pendiente</div>
                        <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Pago parcial o diferido</div>
                    </div>
                </div>
            </div>

            {value.type === 'CREDIT' && (
                <div style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
                    {/* Toggle for Installments */}
                    <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#e2e8f0', cursor: 'pointer' }}>
                            <div
                                onClick={() => !readOnly && toggleInstallments()}
                                style={{
                                    width: '44px',
                                    height: '24px',
                                    backgroundColor: value.installments?.length > 0 ? '#10b981' : '#475569',
                                    borderRadius: '12px',
                                    position: 'relative',
                                    transition: 'background-color 0.2s ease',
                                    cursor: readOnly ? 'default' : 'pointer'
                                }}
                            >
                                <div style={{
                                    width: '18px',
                                    height: '18px',
                                    backgroundColor: 'white',
                                    borderRadius: '50%',
                                    position: 'absolute',
                                    top: '3px',
                                    left: value.installments?.length > 0 ? '23px' : '3px',
                                    transition: 'left 0.2s ease'
                                }} />
                            </div>
                            <span>Definir cronograma de pagos (Cuotas)</span>
                        </label>
                    </div>

                    {value.installments?.length > 0 ? (
                        <div style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
                            <div style={{ maxWidth: '200px', marginBottom: '1.5rem' }}>
                                <Input
                                    label="Número de Cuotas"
                                    type="number"
                                    min="1"
                                    max="36"
                                    value={value.installments?.length || 1}
                                    onChange={handleCountChange}
                                    disabled={readOnly}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
                                {value.installments?.map((inst, idx) => (
                                    <div key={idx} style={{
                                        backgroundColor: '#0f172a',
                                        padding: '1rem',
                                        borderRadius: '0.5rem',
                                        border: '1px solid #334155',
                                        transition: 'border-color 0.2s ease'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                            <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                                Cuota #{inst.number}
                                            </span>
                                            <span style={{ color: '#3b82f6', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                                {inst.amount?.toFixed(2)}
                                            </span>
                                        </div>
                                        <Input
                                            type="date"
                                            value={inst.date}
                                            onChange={(e) => handleDateChange(idx, e.target.value)}
                                            disabled={readOnly}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div style={{
                            padding: '1rem',
                            backgroundColor: 'rgba(59, 130, 246, 0.05)',
                            borderRadius: '0.5rem',
                            border: '1px dashed #3b82f6',
                            color: '#94a3b8',
                            fontSize: '0.875rem'
                        }}>
                            💡 <strong>Aviso:</strong> El pago se registrará como crédito sin un calendario de cuotas definido. Podrás registrar pagos manuales en cualquier momento desde la sección de facturación.
                        </div>
                    )}
                </div>
            )}
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default PaymentInfoSection;
