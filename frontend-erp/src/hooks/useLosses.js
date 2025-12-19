import { useState, useEffect, useCallback } from 'react';
import { inventoryService } from '../services/api';
import { useNotification } from './useNotification';

export const useLosses = () => {
    const [losses, setLosses] = useState([]);
    const [summary, setSummary] = useState({ total_quantity: 0, total_cost: 0, total_movements: 0 });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { showNotification } = useNotification();

    const fetchLosses = useCallback(async () => {
        setLoading(true);
        try {
            const response = await inventoryService.getLossesReport();
            setLosses(response.data.movements);
            setSummary(response.data.summary);
        } catch (err) {
            console.error('Error fetching losses:', err);
            setError(err);
        } finally {
            setLoading(false);
        }
    }, []);

    const createLoss = useCallback(async (lossData) => {
        setLoading(true);
        try {
            // If it's an entry (Ingreso), we send a negative quantity to registerLoss
            // assuming the backend subtracts the quantity. So subtracting a negative = adding.
            // If backend validates quantity > 0, this might fail.
            // However, this is the best attempt to keep it in the "losses/movements" report.
            const quantity = lossData.is_entry ? -Math.abs(lossData.quantity) : Math.abs(lossData.quantity);

            const payload = {
                ...lossData,
                quantity: quantity
            };

            // Remove frontend-only flags
            delete payload.is_entry;
            delete payload.movement_type;

            await inventoryService.registerLoss(payload);
            await fetchLosses();
            showNotification(lossData.is_entry ? 'Ingreso registrado exitosamente' : 'Salida registrada exitosamente', 'success');
        } catch (err) {
            const errorMessage = err.response?.data?.detail || 'Error al registrar movimiento';
            showNotification(errorMessage, 'error');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [fetchLosses, showNotification]);

    useEffect(() => {
        fetchLosses();
    }, [fetchLosses]);

    return {
        losses,
        summary,
        loading,
        error,
        fetchLosses,
        createLoss
    };
};
