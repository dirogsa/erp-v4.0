import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { salesService } from '../services/api';
import { useNotification } from './useNotification';

export const useSalesInvoices = ({ page = 1, limit = 50, search = '', payment_status = '', date_from = '', date_to = '', is_confirmed = null } = {}) => {
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
            const response = await salesService.getInvoices(page, limit, search, payment_status, date_from, date_to, is_confirmed);
            // Extract items from paginated response
            setInvoices(response.data.items || []);
            setPagination({
                current: response.data.page || 1,
                total: response.data.pages || 1,
                totalItems: response.data.total || 0
            });
        } catch (err) {
            setError(err);
            showNotification('Error al cargar facturas de venta', 'error');
            console.error('Error fetching sales invoices:', err);
        } finally {
            setLoading(false);
        }
    }, [showNotification, page, limit, search, payment_status, date_from, date_to, is_confirmed]);

    const createInvoice = useCallback(async (invoiceData) => {
        setLoading(true);
        try {
            const response = await salesService.createInvoice(invoiceData);
            await fetchInvoices();
            // Invalidate sales orders cache to reflect new status
            queryClient.invalidateQueries(['sales-orders']);
            showNotification('Factura registrada exitosamente', 'success');
            return response.data;
        } catch (err) {
            // Handle validation errors from FastAPI (422 errors)
            let errorMessage = 'Error al registrar factura';

            if (err.response?.data?.detail) {
                const detail = err.response.data.detail;

                // FastAPI validation errors come as an array
                if (Array.isArray(detail)) {
                    errorMessage = detail.map(e => `${e.loc.join('.')}: ${e.msg}`).join(', ');
                } else if (typeof detail === 'string') {
                    errorMessage = detail;
                }
            }

            showNotification(errorMessage, 'error');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [fetchInvoices, showNotification]);

    const registerPayment = useCallback(async (invoiceNumber, paymentData) => {
        setLoading(true);
        try {
            await salesService.registerPayment(invoiceNumber, paymentData);
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

    const createDispatchGuide = useCallback(async (invoiceNumber, guideData) => {
        setLoading(true);
        try {
            await salesService.createDispatchGuide(invoiceNumber, guideData);
            await fetchInvoices();
            showNotification('Guía de despacho generada exitosamente', 'success');
        } catch (err) {
            const errorMessage = err.response?.data?.detail || 'Error al generar guía de despacho';
            showNotification(errorMessage, 'error');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [fetchInvoices, showNotification]);

    const deleteInvoice = useCallback(async (invoiceNumber) => {
        setLoading(true);
        try {
            await salesService.deleteInvoice(invoiceNumber);
            await fetchInvoices();
            // Critical: Invalidate sales orders so they revert to PENDING/PARTIAL in UI
            queryClient.invalidateQueries(['sales-orders']);
            showNotification('Factura eliminada exitosamente', 'success');
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
        createDispatchGuide,
        deleteInvoice
    };
};
