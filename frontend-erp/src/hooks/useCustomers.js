import { useState, useEffect, useCallback } from 'react';
import { salesService } from '../services/api';
import { useNotification } from './useNotification';

export const useCustomers = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { showNotification } = useNotification();

    const fetchCustomers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await salesService.getCustomers();
            setCustomers(response.data);
        } catch (err) {
            setError(err);
            showNotification('Error al cargar clientes', 'error');
            console.error('Error fetching customers:', err);
        } finally {
            setLoading(false);
        }
    }, [showNotification]);

    const getCustomerByRuc = useCallback(async (ruc) => {
        setLoading(true);
        try {
            const response = await salesService.getCustomerByRuc(ruc);
            return response.data;
        } catch (err) {
            if (err.response?.status !== 404) {
                showNotification('Error al buscar cliente', 'error');
            }
            throw err;
        } finally {
            setLoading(false);
        }
    }, [showNotification]);

    const createCustomer = useCallback(async (customerData) => {
        setLoading(true);
        try {
            const response = await salesService.createCustomer(customerData);
            await fetchCustomers();
            showNotification('Cliente creado exitosamente', 'success');
            return response.data;
        } catch (err) {
            const errorMessage = err.response?.data?.detail || 'Error al crear cliente';
            showNotification(errorMessage, 'error');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [fetchCustomers, showNotification]);

    const updateCustomer = useCallback(async (id, customerData) => {
        setLoading(true);
        try {
            await salesService.updateCustomer(id, customerData);
            await fetchCustomers();
            showNotification('Cliente actualizado exitosamente', 'success');
        } catch (err) {
            const errorMessage = err.response?.data?.detail || 'Error al actualizar cliente';
            showNotification(errorMessage, 'error');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [fetchCustomers, showNotification]);

    const deleteCustomer = useCallback(async (id) => {
        setLoading(true);
        try {
            await salesService.deleteCustomer(id);
            await fetchCustomers();
            showNotification('Cliente eliminado exitosamente', 'success');
        } catch (err) {
            const errorMessage = err.response?.data?.detail || 'Error al eliminar cliente';
            showNotification(errorMessage, 'error');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [fetchCustomers, showNotification]);

    useEffect(() => {
        fetchCustomers();
    }, [fetchCustomers]);

    return {
        customers,
        loading,
        error,
        fetchCustomers,
        getCustomerByRuc,
        createCustomer,
        updateCustomer,
        deleteCustomer
    };
};
