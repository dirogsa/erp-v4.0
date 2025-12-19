import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { priceService } from '../services/api';
import { useNotification } from './useNotification';

export const usePrices = ({ page = 1, limit = 50, search = '' } = {}) => {
    const queryClient = useQueryClient();
    const { showNotification } = useNotification();

    const { data, isLoading, error } = useQuery({
        queryKey: ['prices', page, limit, search],
        queryFn: async () => {
            const response = await priceService.getProductsWithPrices(page, limit, search);
            return response.data;
        }
    });

    const updatePriceMutation = useMutation({
        mutationFn: ({ sku, priceData }) => priceService.updatePrice(sku, priceData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['prices'] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
            showNotification('Precio actualizado correctamente', 'success');
        },
        onError: (error) => {
            showNotification(error.response?.data?.detail || 'Error al actualizar precio', 'error');
        }
    });

    const importCsvMutation = useMutation({
        mutationFn: ({ file, reason }) => priceService.importCsv(file, reason),
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: ['prices'] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
            const { updated, errors } = response.data;
            showNotification(`${updated} precios actualizados. ${errors.length} errores.`,
                errors.length > 0 ? 'warning' : 'success');
        },
        onError: (error) => {
            showNotification(error.response?.data?.detail || 'Error al importar CSV', 'error');
        }
    });

    return {
        products: data?.items || [],
        pagination: {
            total: data?.pages || 1,
            current: data?.page || 1,
            totalItems: data?.total || 0
        },
        loading: isLoading,
        error,
        updatePrice: (sku, priceData) => updatePriceMutation.mutateAsync({ sku, priceData }),
        importCsv: (file, reason) => importCsvMutation.mutateAsync({ file, reason }),
        isUpdating: updatePriceMutation.isPending,
        isImporting: importCsvMutation.isPending
    };
};

export const usePriceHistory = (sku) => {
    const { data, isLoading } = useQuery({
        queryKey: ['priceHistory', sku],
        queryFn: async () => {
            if (!sku) return [];
            const response = await priceService.getHistory(sku);
            return response.data;
        },
        enabled: !!sku
    });

    return {
        history: data || [],
        loading: isLoading
    };
};
