import { create } from 'zustand'

export const useCatalogStore = create((set) => ({
  config: {
    orientation: 'portrait',
    audience: 'client', // 'client' o 'seller'
    selectedBrands: [],
    selectedCategories: [],
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
  }))
}))
