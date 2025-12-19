import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { salesNotesService } from '../services/api';
import { useNotification } from './useNotification';

export const useSalesNotes = ({ page = 1, limit = 50, search = '', type = '', date_from = '', date_to = '' } = {}) => {
    const queryClient = useQueryClient();
    const { showNotification } = useNotification();

    const {
        data,
        isLoading,
        error,
        refetch
    } = useQuery({
        queryKey: ['sales-notes', { page, limit, search, type, date_from, date_to }],
        queryFn: async () => {
            try {
                const response = await salesNotesService.getNotes(page, limit, search, type, date_from, date_to);
                return response.data;
            } catch (err) {
                console.error('Error fetching sales notes:', err);
                throw err;
            }
        },
        keepPreviousData: true,
        staleTime: 5 * 60 * 1000,
        onError: (err) => {
            console.error('React Query Error:', err);
            showNotification('Error al cargar notas', 'error');
        }
    });

    const createNoteMutation = useMutation({
        mutationFn: ({ invoiceNumber, type, data }) => salesNotesService.createNote(invoiceNumber, type, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['sales-notes']);
            showNotification('Nota creada exitosamente', 'success');
        },
        onError: (err) => {
            console.error('Error creating note:', err);
            const errorMessage = err.response?.data?.detail || 'Error al crear nota';
            showNotification(errorMessage, 'error');
        }
    });

    return {
        notes: data?.items || [],
        pagination: {
            total: data?.pages || 1,
            current: data?.page || 1,
            totalItems: data?.total || 0
        },
        loading: isLoading,
        error,
        refetch,
        createNote: (invoiceNumber, type, data) => createNoteMutation.mutateAsync({ invoiceNumber, type, data })
    };
};
