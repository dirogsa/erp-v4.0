import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryService } from '../services/api';
import { useNotification } from './useNotification';

export const useProducts = ({ page = 1, limit = 50, search = '', category = '' } = {}) => {
    const queryClient = useQueryClient();
    const { showNotification } = useNotification();

    const {
        data,
        isLoading,
        error,
        refetch
    } = useQuery({
        queryKey: ['products', { page, limit, search, category }],
        queryFn: async () => {
            const response = await inventoryService.getProducts(page, limit, search, category);
            return response.data;
        },
        placeholderData: (previousData) => previousData, // React Query v5 replacement for keepPreviousData
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    const createMutation = useMutation({
        mutationFn: ({ productData, initialStock }) => inventoryService.createProduct(productData, initialStock),
        onSuccess: () => {
            queryClient.invalidateQueries(['products']);
            showNotification('Producto creado exitosamente', 'success');
        },
        onError: (err) => {
            console.error('Error creating product:', err);
            const errorMessage = err.response?.data?.detail || 'Error al crear producto';
            showNotification(errorMessage, 'error');
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ sku, productData, newStock }) => inventoryService.updateProduct(sku, productData, newStock),
        onSuccess: () => {
            queryClient.invalidateQueries(['products']);
            showNotification('Producto actualizado exitosamente', 'success');
        },
        onError: (err) => {
            console.error('Error updating product:', err);
            const errorMessage = err.response?.data?.detail || 'Error al actualizar producto';
            showNotification(errorMessage, 'error');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (sku) => inventoryService.deleteProduct(sku),
        onSuccess: () => {
            queryClient.invalidateQueries(['products']);
            showNotification('Producto eliminado exitosamente', 'success');
        },
        onError: (err) => {
            console.error('Error deleting product:', err);
            const errorMessage = err.response?.data?.detail || 'Error al eliminar producto';
            showNotification(errorMessage, 'error');
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
        refetch,
        createProduct: (data, initialStock) => createMutation.mutateAsync({ productData: data, initialStock }),
        updateProduct: (sku, data, newStock) => updateMutation.mutateAsync({ sku, productData: data, newStock }),
        deleteProduct: (sku) => deleteMutation.mutateAsync(sku)
    };
};
