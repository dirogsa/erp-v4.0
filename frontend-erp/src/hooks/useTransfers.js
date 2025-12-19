import { useState, useEffect, useCallback } from 'react';
import { inventoryService } from '../services/api';
import { useNotification } from './useNotification';

export const useTransfers = () => {
    const [transfers, setTransfers] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { showNotification } = useNotification();

    const fetchWarehouses = useCallback(async () => {
        try {
            const response = await inventoryService.getWarehouses();
            setWarehouses(response.data);
        } catch (err) {
            console.error('Error fetching warehouses:', err);
        }
    }, []);

    const createTransfer = useCallback(async (transferData) => {
        setLoading(true);
        try {
            const response = await inventoryService.registerTransfer(transferData);

            // Add to local history (simplified, ideally fetch from backend if endpoint exists)
            const newTransfer = {
                date: new Date().toLocaleString(),
                guide: response.data.guide_number,
                warehouse: transferData.target_warehouse_id, // Should map to name
                product: transferData.items[0].sku, // Should map to name
                quantity: transferData.items[0].quantity,
                notes: transferData.notes
            };

            setTransfers(prev => [newTransfer, ...prev]);
            showNotification(`Guía Generada: ${response.data.guide_number}`, 'success');
            return response.data;
        } catch (err) {
            const errorMessage = err.response?.data?.detail || 'Error al registrar transferencia';
            showNotification(errorMessage, 'error');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [showNotification]);

    useEffect(() => {
        fetchWarehouses();
    }, [fetchWarehouses]);

    return {
        transfers,
        warehouses,
        loading,
        error,
        createTransfer
    };
};
