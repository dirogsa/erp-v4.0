import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { salesService } from '../services/api';
import { useNotification } from './useNotification';

export const useSalesOrders = ({ page = 1, limit = 50, search = '', status = '', date_from = '', date_to = '' } = {}) => {
    const queryClient = useQueryClient();
    const { showNotification } = useNotification();

    const {
        data,
        isLoading,
        error,
        refetch
    } = useQuery({
        queryKey: ['sales-orders', { page, limit, search, status, date_from, date_to }],
        queryFn: async () => {
            try {
                const response = await salesService.getSales(page, limit, search, status, date_from, date_to);

                return response.data;
            } catch (err) {
                console.error('Error fetching sales orders:', err);
                throw err;
            }
        },
        keepPreviousData: true,
        staleTime: 5 * 60 * 1000,
        onError: (err) => {
            console.error('React Query Error:', err);
            showNotification('Error al cargar órdenes de venta', 'error');
        }
    });

    const createMutation = useMutation({
        mutationFn: (orderData) => salesService.createOrder(orderData),
        onSuccess: () => {
            queryClient.invalidateQueries(['sales-orders']);
            showNotification('Orden de venta creada exitosamente', 'success');
        },
        onError: (err) => {
            console.error('Error creating sales order:', err);
            const errorMessage = err.response?.data?.detail || 'Error al crear orden de venta';
            showNotification(errorMessage, 'error');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (orderNumber) => salesService.deleteOrder(orderNumber),
        onSuccess: () => {
            queryClient.invalidateQueries(['sales-orders']);
            showNotification('Orden de venta eliminada exitosamente', 'success');
        },
        onError: (err) => {
            console.error('Error deleting sales order:', err);
            const errorMessage = err.response?.data?.detail || 'Error al eliminar orden de venta';
            showNotification(errorMessage, 'error');
        }
    });

    const convertMutation = useMutation({
        mutationFn: (orderNumber) => salesService.convertBackorder(orderNumber),
        onSuccess: (response) => {
            queryClient.invalidateQueries(['sales-orders']);
            showNotification(response.data.message || 'Backorder convertido exitosamente', 'success');
        },
        onError: (err) => {
            console.error('Error converting backorder:', err);
            const errorMessage = err.response?.data?.detail || 'Error al convertir backorder';
            showNotification(errorMessage, 'error');
        }
    });

    return {
        orders: data?.items || [],
        pagination: {
            total: data?.pages || 1,
            current: data?.page || 1,
            totalItems: data?.total || 0
        },
        loading: isLoading,
        error,
        refetch,
        createOrder: (data) => createMutation.mutateAsync(data),
        deleteOrder: (orderNumber) => deleteMutation.mutateAsync(orderNumber),
        convertBackorder: (orderNumber) => convertMutation.mutateAsync(orderNumber)
    };
};
