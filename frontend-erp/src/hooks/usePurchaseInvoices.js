import { useState, useEffect, useCallback } from 'react';
import { purchasingService } from '../services/api';
import { useNotification } from './useNotification';

export const usePurchaseInvoices = () => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { showNotification } = useNotification();

    const fetchInvoices = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await purchasingService.getInvoices();
            // Extract items from paginated response
            setInvoices(response.data.items || []);
        } catch (err) {
            setError(err);
            showNotification('Error al cargar facturas de compra', 'error');
            console.error('Error fetching purchase invoices:', err);
        } finally {
            setLoading(false);
        }
    }, [showNotification]);

    const createInvoice = useCallback(async (invoiceData) => {
        setLoading(true);
        try {
            const response = await purchasingService.createInvoice(invoiceData);
            await fetchInvoices();
            showNotification('Factura de compra registrada exitosamente', 'success');
            return response.data;
        } catch (err) {
            const errorMessage = err.response?.data?.detail || 'Error al registrar factura';
            showNotification(errorMessage, 'error');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [fetchInvoices, showNotification]);

    const registerPayment = useCallback(async (invoiceNumber, paymentData) => {
        setLoading(true);
        try {
            await purchasingService.registerPayment(invoiceNumber, paymentData);
            await fetchInvoices();
            showNotification('Pago registrado exitosamente', 'success');
        } catch (err) {
            const errorMessage = err.response?.data?.detail || 'Error al registrar pago';
            showNotification(errorMessage, 'error');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [fetchInvoices, showNotification]);

    const registerReception = useCallback(async (invoiceNumber, receptionData) => {
        setLoading(true);
        try {
            await purchasingService.registerReception(invoiceNumber, receptionData);
            await fetchInvoices();
            showNotification('Recepción de mercadería registrada exitosamente', 'success');
        } catch (err) {
            const errorMessage = err.response?.data?.detail || 'Error al registrar recepción';
            showNotification(errorMessage, 'error');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [fetchInvoices, showNotification]);

    const deleteInvoice = useCallback(async (invoiceNumber) => {
        setLoading(true);
        try {
            await purchasingService.deleteInvoice(invoiceNumber);
            await fetchInvoices();
            showNotification('Factura de compra eliminada exitosamente', 'success');
        } catch (err) {
            const errorMessage = err.response?.data?.detail || 'Error al eliminar factura';
            showNotification(errorMessage, 'error');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [fetchInvoices, showNotification]);

    useEffect(() => {
        fetchInvoices();
    }, [fetchInvoices]);

    return {
        invoices,
        loading,
        error,
        fetchInvoices,
        createInvoice,
        registerPayment,
        registerReception,
        deleteInvoice
    };
};
