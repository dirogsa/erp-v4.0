import { useState, useCallback } from 'react';
import { financeService } from '../services/api';
import { useNotification } from './useNotification';

export const useFinancial = () => {
    const [loading, setLoading] = useState(false);
    const [statement, setStatement] = useState(null);
    const { showNotification } = useNotification();

    const fetchCustomerStatement = useCallback(async (documentNumber) => {
        if (!documentNumber) return;
        setLoading(true);
        try {
            const response = await financeService.getCustomerStatement(documentNumber);
            setStatement(response.data);
            return response.data;
        } catch (error) {
            console.error('Error fetching customer statement:', error);
            showNotification('Error al cargar el estado de cuenta', 'error');
        } finally {
            setLoading(false);
        }
    }, [showNotification]);

    return {
        statement,
        loading,
        fetchCustomerStatement,
        setStatement
    };
};
