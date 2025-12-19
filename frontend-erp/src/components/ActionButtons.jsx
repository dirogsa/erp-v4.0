import React from 'react';

const ActionButtons = ({ onView, onEdit, onDelete, onInvoice, onPayment }) => {
    return (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
            {onView && (
                <button
                    onClick={onView}
                    title="Ver Detalles"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}
                >
                    👁️
                </button>
            )}
            {onInvoice && (
                <button
                    onClick={onInvoice}
                    title="Registrar Factura"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}
                >
                    📄
                </button>
            )}
            {onPayment && (
                <button
                    onClick={onPayment}
                    title="Registrar Pago"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}
                >
                    💰
                </button>
            )}
            {onEdit && (
                <button
                    onClick={onEdit}
                    title="Editar"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}
                >
                    ✏️
                </button>
            )}
            {onDelete && (
                <button
                    onClick={onDelete}
                    title="Eliminar"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}
                >
                    🗑️
                </button>
            )}
        </div>
    );
};

export default ActionButtons;
