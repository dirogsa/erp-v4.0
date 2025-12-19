import React, { useState, useEffect } from 'react';
import Button from '../../common/Button';
import Input from '../../common/Input';
import Select from '../../common/Select';
import { formatCurrency } from '../../../utils/formatters';

const NoteEmissionModal = ({
    visible,
    invoice,
    onClose,
    onSubmit,
    loading = false
}) => {
    const [type, setType] = useState('CREDIT'); // CREDIT | DEBIT
    const [reason, setReason] = useState('RETURN');
    const [items, setItems] = useState([]);
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (visible && invoice) {
            // Default: Select all items with full quantity
            setItems(invoice.items.map(item => ({
                ...item,
                selected: true,
                return_quantity: item.quantity
            })));
            setType('CREDIT');
            setReason('RETURN');
            setNotes('');
        }
    }, [visible, invoice]);

    if (!visible || !invoice) return null;

    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;
        setItems(newItems);
    };

    const handleToggleItem = (index) => {
        const newItems = [...items];
        newItems[index].selected = !newItems[index].selected;
        setItems(newItems);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const selectedItems = items.filter(i => i.selected);

        if (selectedItems.length === 0) {
            alert("Debe seleccionar al menos un ítem");
            return;
        }

        // Validate quantities
        for (const item of selectedItems) {
            if (item.return_quantity <= 0 || item.return_quantity > item.quantity) {
                alert(`Cantidad inválida para ${item.product_sku}`);
                return;
            }
        }

        const payload = {
            items: selectedItems.map(i => ({
                product_sku: i.product_sku,
                quantity: parseInt(i.return_quantity)
            })),
            reason,
            notes
        };

        onSubmit(invoice.invoice_number, type, payload);
    };

    // Calculate estimated total
    const totalAmount = items
        .filter(i => i.selected)
        .reduce((sum, item) => sum + (item.return_quantity * item.unit_price), 0);

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 1000, padding: '2rem'
        }}>
            <div style={{
                backgroundColor: '#0f172a', borderRadius: '0.5rem',
                width: '100%', maxWidth: '800px',
                maxHeight: '90vh', overflowY: 'auto',
                padding: '2rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}>
                <h2 style={{ color: 'white', marginTop: 0, marginBottom: '1.5rem' }}>
                    Emitir Nota para Factura {invoice.invoice_number}
                </h2>

                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                        <Select
                            label="Tipo de Nota"
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            options={[
                                { value: 'CREDIT', label: 'Nota de Crédito' },
                                { value: 'DEBIT', label: 'Nota de Débito' }
                            ]}
                        />
                        <Select
                            label="Motivo"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            options={type === 'CREDIT' ? [
                                { value: 'RETURN', label: 'Devolución' },
                                { value: 'DISCOUNT', label: 'Descuento' },
                                { value: 'ERROR', label: 'Error / Anulación' }
                            ] : [
                                { value: 'ERROR', label: 'Error' },
                                { value: 'INTEREST', label: 'Intereses' } // Example
                            ]}
                        />
                    </div>

                    <h3 style={{ color: '#e2e8f0', fontSize: '1rem', marginBottom: '1rem' }}>Selección de Ítems</h3>
                    <div style={{
                        backgroundColor: '#1e293b',
                        borderRadius: '0.5rem',
                        overflow: 'hidden',
                        marginBottom: '1.5rem'
                    }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', color: '#e2e8f0' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #334155', textAlign: 'left' }}>
                                    <th style={{ padding: '0.75rem' }}>Sel.</th>
                                    <th style={{ padding: '0.75rem' }}>Producto</th>
                                    <th style={{ padding: '0.75rem' }}>Cant. Orig.</th>
                                    <th style={{ padding: '0.75rem' }}>Cant. Nota</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>Precio Unit.</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid #334155' }}>
                                        <td style={{ padding: '0.75rem' }}>
                                            <input
                                                type="checkbox"
                                                checked={item.selected}
                                                onChange={() => handleToggleItem(idx)}
                                            />
                                        </td>
                                        <td style={{ padding: '0.75rem' }}>{item.product_sku}</td>
                                        <td style={{ padding: '0.75rem' }}>{item.quantity}</td>
                                        <td style={{ padding: '0.75rem' }}>
                                            <input
                                                type="number"
                                                min="1"
                                                max={item.quantity}
                                                value={item.return_quantity}
                                                onChange={(e) => handleItemChange(idx, 'return_quantity', parseInt(e.target.value))}
                                                disabled={!item.selected}
                                                style={{
                                                    width: '60px',
                                                    padding: '0.25rem',
                                                    backgroundColor: '#0f172a',
                                                    border: '1px solid #334155',
                                                    color: 'white',
                                                    borderRadius: '0.25rem'
                                                }}
                                            />
                                        </td>
                                        <td style={{ padding: '0.75rem', textAlign: 'right' }}>{formatCurrency(item.unit_price)}</td>
                                        <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                                            {formatCurrency(item.selected ? item.return_quantity * item.unit_price : 0)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colSpan="5" style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 'bold' }}>Total Estimado:</td>
                                    <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 'bold', color: '#3b82f6' }}>
                                        {formatCurrency(totalAmount)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {type === 'CREDIT' && reason === 'RETURN' && (
                        <div style={{
                            padding: '1rem',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            borderLeft: '4px solid #3b82f6',
                            marginBottom: '1.5rem',
                            color: '#bfdbfe'
                        }}>
                            <strong>Nota:</strong> Al seleccionar "Devolución", los artículos seleccionados reingresarán automáticamente al stock.
                        </div>
                    )}

                    <div style={{ marginBottom: '1.5rem' }}>
                        <Input
                            label="Notas / Observaciones"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                        <Button variant="secondary" onClick={onClose} disabled={loading}>
                            Cancelar
                        </Button>
                        <Button type="submit" variant="primary" disabled={loading}>
                            {loading ? 'Emitiendo...' : 'Emitir Nota'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NoteEmissionModal;
