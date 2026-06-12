import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useCatalogStore = create(
  persist(
    (set) => ({
  config: {
    orientation: 'portrait',
    audience: 'client', // 'client' o 'seller'
    // --- Modo Filtros (por defecto) ---
    selectedBrands: [],
    selectedCategories: [],
    // --- Estrategia de Agrupación ---
    groupingMode: 'by_product', // 'by_product' | 'by_vehicle'
    selectedVehicleMakes: [],   // Lista de marcas de vehículos si el modo es 'by_vehicle'
    // --- Modo SKU (override del universo de datos) ---
    inputMode: 'filters', // 'filters' | 'skus'
    validatedSkus: [],    // SKUs confirmados por el validador
    displayFields: {
      image: false,
      reference: false,
      dimensions: false,
      applications: false,
      price: false
    }
  },
  setConfig: (newConfig) => set((state) => ({
    config: { ...state.config, ...newConfig }
  })),
  toggleField: (field) => set((state) => ({
    config: {
      ...state.config,
      displayFields: {
        ...state.config.displayFields,
        [field]: !state.config.displayFields[field]
      }
    }
  })),
  // Activa el modo SKU con la lista validada
  activateSkuMode: (skus) => set((state) => ({
    config: { ...state.config, inputMode: 'skus', validatedSkus: skus }
  })),
  // Vuelve al modo filtros y limpia los SKUs
  clearSkuMode: () => set((state) => ({
    config: { ...state.config, inputMode: 'filters', validatedSkus: [] }
  })),
}),
{
  name: 'katalog-storage', // name of the item in the storage (must be unique)
}
))
