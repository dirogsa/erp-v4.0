import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { purchaseQuotesService } from '../services/api';
import { useNotification } from './useNotification';

export const usePurchaseQuotes = ({ page = 1, limit = 50, search = '', status = '', date_from = '', date_to = '' } = {}) => {
    const queryClient = useQueryClient();
    const { showNotification } = useNotification();

    const {
        data,
        isLoading,
        error,
        refetch
    } = useQuery({
        queryKey: ['purchase-quotes', { page, limit, search, status, date_from, date_to }],
        queryFn: async () => {
            try {
                const response = await purchaseQuotesService.getQuotes(page, limit, search, status, date_from, date_to);
                return response.data;
            } catch (err) {
                console.error('Error fetching purchase quotes:', err);
                throw err;
            }
        },
        keepPreviousData: true,
        staleTime: 5 * 60 * 1000,
        onError: (err) => {
            console.error('React Query Error:', err);
            showNotification('Error al cargar solicitudes', 'error');
        }
    });

    const createMutation = useMutation({
        mutationFn: (quoteData) => purchaseQuotesService.createQuote(quoteData),
        onSuccess: () => {
            queryClient.invalidateQueries(['purchase-quotes']);
            showNotification('Solicitud creada exitosamente', 'success');
        },
        onError: (err) => {
            console.error('Error creating purchase quote:', err);
            const errorMessage = err.response?.data?.detail || 'Error al crear solicitud';
            showNotification(errorMessage, 'error');
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ quoteNumber, data }) => purchaseQuotesService.updateQuote(quoteNumber, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['purchase-quotes']);
            showNotification('Solicitud actualizada exitosamente', 'success');
        },
        onError: (err) => {
            console.error('Error updating purchase quote:', err);
            const errorMessage = err.response?.data?.detail || 'Error al actualizar solicitud';
            showNotification(errorMessage, 'error');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (quoteNumber) => purchaseQuotesService.deleteQuote(quoteNumber),
        onSuccess: () => {
            queryClient.invalidateQueries(['purchase-quotes']);
            showNotification('Solicitud eliminada exitosamente', 'success');
        },
        onError: (err) => {
            console.error('Error deleting purchase quote:', err);
            const errorMessage = err.response?.data?.detail || 'Error al eliminar solicitud';
            showNotification(errorMessage, 'error');
        }
    });

    const convertMutation = useMutation({
        mutationFn: (quoteNumber) => purchaseQuotesService.convertQuote(quoteNumber),
        onSuccess: () => {
            queryClient.invalidateQueries(['purchase-quotes']);
            queryClient.invalidateQueries(['purchase-orders']);
            showNotification('Cotización convertida en Orden exitosamente', 'success');
        },
        onError: (err) => {
            console.error('Error converting purchase quote:', err);
            const errorMessage = err.response?.data?.detail || 'Error al convertir solicitud';
            showNotification(errorMessage, 'error');
        }
    });

    return {
        quotes: data?.items || [],
        pagination: {
            total: data?.pages || 1,
            current: data?.page || 1,
            totalItems: data?.total || 0
        },
        loading: isLoading,
        error,
        refetch,
        createQuote: (data) => createMutation.mutateAsync(data),
        updateQuote: (quoteNumber, data) => updateMutation.mutateAsync({ quoteNumber, data }),
        deleteQuote: (quoteNumber) => deleteMutation.mutateAsync(quoteNumber),
        convertQuote: (quoteNumber) => convertMutation.mutateAsync(quoteNumber)
    };
};
