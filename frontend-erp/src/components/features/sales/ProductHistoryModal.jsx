import React, { useState, useEffect } from 'react';
import { salesService } from '../../../services/api';
import Table from '../../common/Table';
import { formatCurrency, formatDate } from '../../../utils/formatters';

const ProductHistoryModal = ({ sku, productName, visible, onClose }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (visible && sku) {
            fetchHistory();
        }
    }, [visible, sku]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const response = await salesService.getProductHistory(sku);
            setHistory(response.data);
        } catch (error) {
            console.error("Error fetching product history:", error);
        } finally {
            setLoading(false);
        }
    };

    if (!visible) return null;

    const columns = [
        { label: 'Fecha', key: 'date', render: (val) => formatDate(val) },
        { label: 'Cliente', key: 'customer_name' },
        { label: 'Cant.', key: 'quantity', align: 'center' },
        { label: 'Precio Unit.', key: 'unit_price', align: 'right', render: (val) => formatCurrency(val) }
    ];

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
                maxWidth: '600px',
                maxHeight: '80vh',
                overflowY: 'auto',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                border: '1px solid #334155'
            }}>
                <div style={{
                    padding: '1.5rem',
                    borderBottom: '1px solid #334155',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div>
                        <h3 style={{ color: 'white', margin: 0, fontSize: '1.1rem' }}>Historial de Ventas</h3>
                        <p style={{ color: '#94a3b8', margin: '0.25rem 0 0 0', fontSize: '0.875rem' }}>
                            {productName} ({sku})
                        </p>
                    </div>
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
                    <Table
                        columns={columns}
                        data={history}
                        loading={loading}
                        emptyMessage="No hay ventas registradas para este producto"
                    />
                </div>
            </div>
        </div>
    );
};

export default ProductHistoryModal;
