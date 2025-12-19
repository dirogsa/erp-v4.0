import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { salesQuotesService } from '../services/api';
import { useNotification } from './useNotification';

export const useSalesQuotes = ({ page = 1, limit = 50, search = '', status = '', date_from = '', date_to = '' } = {}) => {
    const queryClient = useQueryClient();
    const { showNotification } = useNotification();

    const {
        data,
        isLoading,
        error,
        refetch
    } = useQuery({
        queryKey: ['sales-quotes', { page, limit, search, status, date_from, date_to }],
        queryFn: async () => {
            try {
                const response = await salesQuotesService.getQuotes(page, limit, search, status, date_from, date_to);
                return response.data;
            } catch (err) {
                console.error('Error fetching sales quotes:', err);
                throw err;
            }
        },
        keepPreviousData: true,
        staleTime: 5 * 60 * 1000,
        onError: (err) => {
            console.error('React Query Error:', err);
            showNotification('Error al cargar cotizaciones', 'error');
        }
    });

    const createMutation = useMutation({
        mutationFn: (quoteData) => salesQuotesService.createQuote(quoteData),
        onSuccess: () => {
            queryClient.invalidateQueries(['sales-quotes']);
            showNotification('Cotización creada exitosamente', 'success');
        },
        onError: (err) => {
            console.error('Error creating sales quote:', err);
            const errorMessage = err.response?.data?.detail || 'Error al crear cotización';
            showNotification(errorMessage, 'error');
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ quoteNumber, data }) => salesQuotesService.updateQuote(quoteNumber, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['sales-quotes']);
            showNotification('Cotización actualizada exitosamente', 'success');
        },
        onError: (err) => {
            console.error('Error updating sales quote:', err);
            const errorMessage = err.response?.data?.detail || 'Error al actualizar cotización';
            showNotification(errorMessage, 'error');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (quoteNumber) => salesQuotesService.deleteQuote(quoteNumber),
        onSuccess: () => {
            queryClient.invalidateQueries(['sales-quotes']);
            showNotification('Cotización eliminada exitosamente', 'success');
        },
        onError: (err) => {
            console.error('Error deleting sales quote:', err);
            const errorMessage = err.response?.data?.detail || 'Error al eliminar cotización';
            showNotification(errorMessage, 'error');
        }
    });

    const convertMutation = useMutation({
        mutationFn: async ({ quoteNumber, preview }) => {
            const response = await salesQuotesService.convertQuote(quoteNumber, preview);
            return response.data;
        },
        onSuccess: (data, variables) => {
            if (variables.preview) return; // Don't invalidate if just preview
            queryClient.invalidateQueries(['sales-quotes']);
            queryClient.invalidateQueries(['sales-orders']);
            showNotification('Cotización convertida exitosamente', 'success');
        },
        onError: (err) => {
            console.error('Error converting sales quote:', err);
            const errorMessage = err.response?.data?.detail || 'Error al convertir cotización';
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
        convertQuote: (quoteNumber, preview = false) => convertMutation.mutateAsync({ quoteNumber, preview })
    };
};
