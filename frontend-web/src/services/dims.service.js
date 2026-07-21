const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const DIMSService = {
    /**
     * Llama al motor DIMS en el backend para obtener alternativas dimensionales
     * @param {string} sku - El código del producto exacto
     * @param {string} flexibility - Nivel de flexibilidad ('high', 'medium', 'low')
     */
    async getAlternatives(sku, flexibility = 'high') {
        try {
            const res = await fetch(`${API_BASE}/api/v1/dims/${encodeURIComponent(sku)}/alternatives?flexibility=${flexibility}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!res.ok) {
                if (res.status === 404) return { dimensional_similarities: [] };
                throw new Error(`DIMS Engine Error: ${res.status}`);
            }
            
            return await res.json();
        } catch (error) {
            console.error('[DIMS Service] Error fetching alternatives:', error);
            // Fallback graceful para no romper la UI si el motor falla
            return { dimensional_similarities: [] };
        }
    }
};
