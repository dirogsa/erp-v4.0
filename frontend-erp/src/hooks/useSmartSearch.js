import { useQuery } from '@tanstack/react-query';
import { inventoryService } from '../services/api';

export const useSmartSearch = (query) => {
    return useQuery(
        ['smart-search', query],
        async () => {
            if (!query || query.length < 3) return null;
            const response = await inventoryService.smartSearch(query);
            return response.data;
        },
        {
            enabled: !!query && query.length >= 3,
            staleTime: 1000 * 60 * 30, // 30 minutes cache
            retry: 1
        }
    );
};
