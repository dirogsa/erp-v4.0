import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useCatalogStore = create(
  persist(
    (set) => ({
  config: {
    orientation: 'portrait',
    audience: 'client', // 'client' o 'seller'
    // --- Modo Filtros (por defecto) ---
    selectedBrands: [], // Mantenido por retrocompatibilidad/referencia
    selectedCategories: [], // Mantenido por retrocompatibilidad/referencia
    brandCategoryFilters: {}, // { "WIX": ["cat_id1", "cat_id2"] }
    // --- Estrategia de Construcción ---
    catalogStrategy: 'by_category', // 'by_category' | 'by_vehicle'
    selectedVehicleMakes: [],   // Lista de marcas de vehículos si el modo es 'by_vehicle'
    // --- Modo SKU (override del universo de datos) ---
    inputMode: 'filters', // 'filters' | 'skus'
    validatedSkus: [],    // SKUs confirmados por el validador
    displayFields: {
      image: false,
      reference: false,
      dimensions: false,
      applications: false,
      price: false,
      packaging: false
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
  toggleBrandFilter: (brandName, allCategoryIds) => set((state) => {
    const filters = { ...state.config.brandCategoryFilters };
    if (filters[brandName] !== undefined) {
      delete filters[brandName]; // Desmarcar marca
    } else {
      filters[brandName] = allCategoryIds; // Marcar marca y todas sus categorías por defecto
    }
    return { config: { ...state.config, brandCategoryFilters: filters } };
  }),
  toggleCategoryFilter: (brandName, catId) => set((state) => {
    const filters = { ...state.config.brandCategoryFilters };
    if (!filters[brandName]) return state; // Si la marca no está seleccionada, no hacer nada

    const catIndex = filters[brandName].indexOf(catId);
    if (catIndex >= 0) {
      filters[brandName] = filters[brandName].filter(id => id !== catId);
    } else {
      filters[brandName] = [...filters[brandName], catId];
    }
    return { config: { ...state.config, brandCategoryFilters: filters } };
  }),
  setAllBrandsFilter: (filterTree, selectAll) => set((state) => {
    const filters = {};
    if (selectAll) {
      filterTree.forEach(node => {
        filters[node.brand] = node.categories.map(c => c.id);
      });
    }
    return { config: { ...state.config, brandCategoryFilters: filters } };
  }),
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
