import React from 'react';
import Select from '../../common/Select';
import Input from '../../common/Input';
import { PAYMENT_STATUS } from '../../../utils/constants';

const PaymentSection = ({
    value,
    onChange,
    totalAmount,
    readOnly = false
}) => {
    const paymentMethods = [
        { value: 'CASH', label: 'Efectivo' },
        { value: 'TRANSFER', label: 'Transferencia' },
        { value: 'CREDIT_CARD', label: 'Tarjeta de Crédito' },
        { value: 'CHECK', label: 'Cheque' }
    ];

    const paymentStatuses = [
        { value: PAYMENT_STATUS.PENDING, label: 'Pendiente' },
        { value: PAYMENT_STATUS.PARTIAL, label: 'Parcial' },
        { value: PAYMENT_STATUS.PAID, label: 'Pagado' }
    ];

    const handleChange = (field, newVal) => {
        onChange({
            ...value,
            [field]: newVal
        });
    };

    return (
        <div style={{
            padding: '1.5rem',
            backgroundColor: '#1e293b',
            borderRadius: '0.5rem',
            marginTop: '1.5rem'
        }}>
            <h3 style={{ marginBottom: '1rem', color: '#e2e8f0', fontSize: '1.1rem' }}>
                Información de Pago
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <Select
                    label="Estado de Pago"
                    value={value.payment_status || PAYMENT_STATUS.PENDING}
                    onChange={(e) => handleChange('payment_status', e.target.value)}
                    options={paymentStatuses}
                    disabled={readOnly}
                />

                <Select
                    label="Método de Pago"
                    value={value.payment_method || ''}
                    onChange={(e) => handleChange('payment_method', e.target.value)}
                    options={paymentMethods}
                    disabled={readOnly}
                />

                {(value.payment_status === PAYMENT_STATUS.PAID || value.payment_status === PAYMENT_STATUS.PARTIAL) && (
                    <>
                        <Input
                            label="Monto Pagado"
                            type="number"
                            value={value.amount_paid || ''}
                            onChange={(e) => handleChange('amount_paid', parseFloat(e.target.value))}
                            max={totalAmount}
                            disabled={readOnly}
                        />
                        <Input
                            label="Fecha de Pago"
                            type="date"
                            value={value.payment_date ? new Date(value.payment_date).toISOString().split('T')[0] : ''}
                            onChange={(e) => handleChange('payment_date', e.target.value)}
                            disabled={readOnly}
                        />
                    </>
                )}
            </div>
        </div>
    );
};

export default PaymentSection;
