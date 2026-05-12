import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { purchasingService } from '../services/api';
import { useNotification } from './useNotification';

export const usePurchaseInvoices = ({ page = 1, limit = 50, search = '', payment_status = '', date_from = '', date_to = '', is_confirmed = null } = {}) => {
    const [invoices, setInvoices] = useState([]);
    const [pagination, setPagination] = useState({ current: 1, total: 1, totalItems: 0 });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const queryClient = useQueryClient();
    const { showNotification } = useNotification();

    const fetchInvoices = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await purchasingService.getInvoices(page, limit, search, payment_status, date_from, date_to, is_confirmed);
            // Extract items from paginated response
            setInvoices(response.data.items || []);
            setPagination({
                current: response.data.page || 1,
                total: response.data.pages || 1,
                totalItems: response.data.total || 0
            });
        } catch (err) {
            setError(err);
            showNotification('Error al cargar facturas de compra', 'error');
            console.error('Error fetching purchase invoices:', err);
        } finally {
            setLoading(false);
        }
    }, [showNotification, page, limit, search, payment_status, date_from, date_to, is_confirmed]);

    const createInvoice = useCallback(async (invoiceData) => {
        setLoading(true);
        try {
            const response = await purchasingService.createInvoice(invoiceData);
            await fetchInvoices();
            // Invalidate purchase orders cache
            queryClient.invalidateQueries(['purchase-orders']);
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
            // Invalidate purchase orders cache
            queryClient.invalidateQueries(['purchase-orders']);
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
        pagination,
        loading,
        error,
        fetchInvoices,
        createInvoice,
        registerPayment,
        registerReception,
        deleteInvoice
    };
};
