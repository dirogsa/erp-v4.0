import React, { useEffect } from 'react';
import Input from '../../common/Input';

const PaymentInfoSection = ({ value, onChange, totalAmount }) => {
    // value structure: { type: 'CASH' | 'CREDIT', installments: [] }
    // installment: { date: 'YYYY-MM-DD', amount: 0 }

    const handleTypeChange = (isCredit) => {
        onChange({
            ...value,
            type: isCredit ? 'CREDIT' : 'CASH',
            installments: isCredit ? generateInstallments(1) : []
        });
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
            padding: '1.5rem',
            borderRadius: '0.5rem',
            marginTop: '2rem',
            border: '1px solid #334155'
        }}>
            <h3 style={{ color: 'white', marginTop: 0, marginBottom: '1rem', borderBottom: '1px solid #334155', paddingBottom: '0.5rem' }}>
                Información de Pago
            </h3>

            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '1.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white', cursor: 'pointer' }}>
                    <input
                        type="radio"
                        checked={value.type === 'CASH'}
                        onChange={() => handleTypeChange(false)}
                        style={{ accentColor: '#3b82f6' }}
                    />
                    Pago al Contado / Inmediato
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white', cursor: 'pointer' }}>
                    <input
                        type="radio"
                        checked={value.type === 'CREDIT'}
                        onChange={() => handleTypeChange(true)}
                        style={{ accentColor: '#3b82f6' }}
                    />
                    Crédito / Pendiente
                </label>
            </div>

            {value.type === 'CREDIT' && (
                <div style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
                    <div style={{ maxWidth: '200px', marginBottom: '1rem' }}>
                        <Input
                            label="Número de Cuotas"
                            type="number"
                            min="1"
                            max="36"
                            value={value.installments?.length || 1}
                            onChange={handleCountChange}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                        {value.installments?.map((inst, idx) => (
                            <div key={idx} style={{
                                backgroundColor: '#0f172a',
                                padding: '0.75rem',
                                borderRadius: '0.375rem',
                                border: '1px solid #334155'
                            }}>
                                <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                                    Cuota #{inst.number}
                                </div>
                                <Input
                                    type="date"
                                    value={inst.date}
                                    onChange={(e) => handleDateChange(idx, e.target.value)}
                                />
                                <div style={{ textAlign: 'right', marginTop: '0.25rem', color: '#64748b', fontSize: '0.75rem' }}>
                                    Monto est.: {inst.amount?.toFixed(2)}
                                </div>
                            </div>
                        ))}
                    </div>
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
