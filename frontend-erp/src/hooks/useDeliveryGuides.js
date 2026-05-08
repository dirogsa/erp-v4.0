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

    // Prepare guide mutation
    const prepareGuideMutation = useMutation({
        mutationFn: deliveryService.prepareGuide,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['deliveryGuides'] });
            showNotification('Guía marcada como LISTA para despacho', 'success');
        },
        onError: (error) => {
            showNotification(error.response?.data?.detail || 'Error al preparar guía', 'error');
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
        cancelGuide: cancelGuideMutation.mutateAsync,
        prepareGuide: prepareGuideMutation.mutateAsync,
        
        // Bulk Mutations
        bulkDispatchGuides: async (guideNumbers) => {
            console.log('[HOOK] bulkDispatchGuides called with:', guideNumbers);
            try {
                const res = await deliveryService.bulkDispatchGuides(guideNumbers);
                console.log('[HOOK] API Response:', res.data);
                queryClient.invalidateQueries({ queryKey: ['deliveryGuides'] });
                queryClient.invalidateQueries({ queryKey: ['products'] });
                showNotification(res.data.message, res.data.error_count > 0 ? 'warning' : 'success');
                return res.data;
            } catch (error) {
                console.error('[HOOK] API Error:', error);
                showNotification(error.response?.data?.detail || 'Error en despacho masivo', 'error');
                throw error;
            }
        },
        bulkDeliverGuides: async (guideNumbers, receivedBy = '') => {
            try {
                const res = await deliveryService.bulkDeliverGuides(guideNumbers, receivedBy);
                queryClient.invalidateQueries({ queryKey: ['deliveryGuides'] });
                showNotification(res.data.message, 'success');
                return res.data;
            } catch (error) {
                showNotification(error.response?.data?.detail || 'Error en confirmación masiva', 'error');
                throw error;
            }
        },
        bulkDeleteGuides: async (guideNumbers) => {
            try {
                const res = await deliveryService.bulkDeleteGuides(guideNumbers);
                queryClient.invalidateQueries({ queryKey: ['deliveryGuides'] });
                queryClient.invalidateQueries({ queryKey: ['products'] });
                showNotification(res.data.message, res.data.error_count > 0 ? 'warning' : 'success');
                return res.data;
            } catch (error) {
                showNotification(error.response?.data?.detail || 'Error en anulación masiva', 'error');
                throw error;
            }
        },
        bulkPrepareGuides: async (guideNumbers) => {
            try {
                const res = await deliveryService.bulkPrepareGuides(guideNumbers);
                queryClient.invalidateQueries({ queryKey: ['deliveryGuides'] });
                showNotification(res.data.message, res.data.error_count > 0 ? 'warning' : 'success');
                return res.data;
            } catch (error) {
                showNotification(error.response?.data?.detail || 'Error en preparación masiva', 'error');
                throw error;
            }
        }
    };
};
