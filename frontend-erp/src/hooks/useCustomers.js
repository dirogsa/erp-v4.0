import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { salesService } from '../services/api';

export const useCustomers = () => {
    const queryClient = useQueryClient();

    // 1. Fetch de clientes (Query)
    const { 
        data: customers = [], 
        isLoading: loading, 
        error,
        refetch: fetchCustomers 
    } = useQuery({
        queryKey: ['customers'],
        queryFn: async () => {
            const response = await salesService.getCustomers();
            return response.data;
        }
    });

    // Búsqueda por RUC (suele ser al vuelo, no siempre cacheable globalmente)
    const getCustomerByRuc = async (ruc) => {
        try {
            const response = await salesService.getCustomerByRuc(ruc);
            return response.data;
        } catch (err) {
            // El error 404 es esperado cuando el RUC es nuevo
            if (err.response?.status === 404) {
                 return null;
            }
            throw err;
        }
    };

    // 2. Mutaciones con caché global de notificaciones
    const createMutation = useMutation({
        mutationFn: salesService.createCustomer,
        meta: { method: 'POST' }, // El MutationCache leerá esto
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => salesService.updateCustomer(id, data),
        meta: { method: 'PUT' },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: salesService.deleteCustomer,
        meta: { 
            method: 'DELETE',
            requireAcknowledgment: true // Exige Modal Bloqueante según el Enfoque Híbrido
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
        }
    });

    const isCreating = createMutation.isPending;
    const isUpdating = updateMutation.isPending;
    const isDeleting = deleteMutation.isPending;
    
    // Combinar estados de carga para mantener retrocompatibilidad con el UI actual
    const isWorking = loading || isCreating || isUpdating || isDeleting;

    return {
        customers,
        loading: isWorking,
        error,
        fetchCustomers,
        getCustomerByRuc,
        
        createCustomer: createMutation.mutateAsync,
        updateCustomer: updateMutation.mutateAsync,
        deleteCustomer: deleteMutation.mutateAsync,

        isCreating,
        isUpdating,
        isDeleting
    };
};
