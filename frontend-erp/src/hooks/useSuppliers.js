import { useState, useEffect, useCallback } from 'react';
import { purchasingService } from '../services/api';
import { useNotification } from './useNotification';

export const useSuppliers = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { showNotification } = useNotification();

    const fetchSuppliers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await purchasingService.getSuppliers();
            setSuppliers(response.data);
        } catch (err) {
            setError(err);
            showNotification('Error al cargar proveedores', 'error');
            console.error('Error fetching suppliers:', err);
        } finally {
            setLoading(false);
        }
    }, [showNotification]);

    const createSupplier = useCallback(async (supplierData) => {
        setLoading(true);
        try {
            const response = await purchasingService.createSupplier(supplierData);
            await fetchSuppliers();
            showNotification('Proveedor creado exitosamente', 'success');
            return response.data;
        } catch (err) {
            const errorMessage = err.response?.data?.detail || 'Error al crear proveedor';
            showNotification(errorMessage, 'error');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [fetchSuppliers, showNotification]);

    const updateSupplier = useCallback(async (id, supplierData) => {
        setLoading(true);
        try {
            await purchasingService.updateSupplier(id, supplierData);
            await fetchSuppliers();
            showNotification('Proveedor actualizado exitosamente', 'success');
        } catch (err) {
            const errorMessage = err.response?.data?.detail || 'Error al actualizar proveedor';
            showNotification(errorMessage, 'error');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [fetchSuppliers, showNotification]);

    const deleteSupplier = useCallback(async (id) => {
        setLoading(true);
        try {
            await purchasingService.deleteSupplier(id);
            await fetchSuppliers();
            showNotification('Proveedor eliminado exitosamente', 'success');
        } catch (err) {
            const errorMessage = err.response?.data?.detail || 'Error al eliminar proveedor';
            showNotification(errorMessage, 'error');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [fetchSuppliers, showNotification]);

    useEffect(() => {
        fetchSuppliers();
    }, [fetchSuppliers]);

    return {
        suppliers,
        loading,
        error,
        fetchSuppliers,
        createSupplier,
        updateSupplier,
        deleteSupplier
    };
};
