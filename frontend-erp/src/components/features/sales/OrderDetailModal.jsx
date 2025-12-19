import React from 'react';
import OrderForm from '../../forms/OrderForm';

const OrderDetailModal = ({
    order,
    onClose,
    visible
}) => {
    if (!visible || !order) return null;

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
                backgroundColor: '#0f172a',
                borderRadius: '0.5rem',
                width: '100%',
                maxWidth: '900px',
                maxHeight: '90vh',
                overflowY: 'auto',
                position: 'relative',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}>
                <div style={{
                    padding: '1.5rem',
                    borderBottom: '1px solid #334155',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    position: 'sticky',
                    top: 0,
                    backgroundColor: '#0f172a',
                    zIndex: 10
                }}>
                    <h2 style={{ color: 'white', margin: 0 }}>
                        Orden {order.order_number}
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#94a3b8',
                            fontSize: '1.5rem',
                            cursor: 'pointer'
                        }}
                    >
                        ×
                    </button>
                </div>

                <div style={{ padding: '1.5rem' }}>
                    <OrderForm
                        initialData={order}
                        readOnly={true}
                        onCancel={onClose}
                    />
                </div>
            </div>
        </div>
    );
};

export default OrderDetailModal;
