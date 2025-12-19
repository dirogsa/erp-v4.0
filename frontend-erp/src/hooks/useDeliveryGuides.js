import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { deliveryService } from '../services/api';
import { useNotification } from './useNotification';

export const useDeliveryGuides = ({ page = 1, limit = 50, search = '', status = '', guideType = '' } = {}) => {
    const queryClient = useQueryClient();
    const { showNotification } = useNotification();

    // Query for fetching guides
    const { data, isLoading, error } = useQuery({
        queryKey: ['deliveryGuides', page, limit, search, status, guideType],
        queryFn: async () => {
            const response = await deliveryService.getGuides(page, limit, search, status, guideType);
            console.log('Delivery Guides API Response:', response.data);
            return response.data;
        }
    });

    // Create guide mutation
    const createGuideMutation = useMutation({
        mutationFn: deliveryService.createGuide,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['deliveryGuides'] });
            queryClient.invalidateQueries({ queryKey: ['salesInvoices'] });
            showNotification('Guía creada exitosamente', 'success');
        },
        onError: (error) => {
            showNotification(error.response?.data?.detail || 'Error al crear guía', 'error');
        }
    });

    // Dispatch guide mutation
    const dispatchGuideMutation = useMutation({
        mutationFn: deliveryService.dispatchGuide,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['deliveryGuides'] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
            showNotification('Guía despachada - Stock actualizado', 'success');
        },
        onError: (error) => {
            showNotification(error.response?.data?.detail || 'Error al despachar guía', 'error');
        }
    });

    // Deliver guide mutation
    const deliverGuideMutation = useMutation({
        mutationFn: ({ guideNumber, receivedBy }) => deliveryService.deliverGuide(guideNumber, receivedBy),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['deliveryGuides'] });
            showNotification('Entrega confirmada', 'success');
        },
        onError: (error) => {
            showNotification(error.response?.data?.detail || 'Error al confirmar entrega', 'error');
        }
    });

    // Cancel guide mutation
    const cancelGuideMutation = useMutation({
        mutationFn: deliveryService.cancelGuide,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['deliveryGuides'] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
            showNotification('Guía anulada - Stock restaurado', 'success');
        },
        onError: (error) => {
            showNotification(error.response?.data?.detail || 'Error al anular guía', 'error');
        }
    });

    return {
        guides: data?.items || [],
        pagination: {
            total: data?.total || 0,
            page: data?.page || 1,
            pages: data?.pages || 0,
            size: data?.size || limit
        },
        loading: isLoading,
        error,
        createGuide: createGuideMutation.mutateAsync,
        dispatchGuide: dispatchGuideMutation.mutateAsync,
        deliverGuide: (guideNumber, receivedBy) => deliverGuideMutation.mutateAsync({ guideNumber, receivedBy }),
        cancelGuide: cancelGuideMutation.mutateAsync
    };
};
