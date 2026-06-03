import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (product, quantity = 1) => {
        set((state) => {
          const existingItem = state.items.find(item => item.sku === product.sku);
          if (existingItem) {
            return {
              items: state.items.map(item =>
                item.sku === product.sku
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              ),
            };
          }
          return { items: [...state.items, { ...product, quantity }] };
        });
      },

      updateQuantity: (sku, quantity) => {
        set((state) => ({
          items: state.items.map(item =>
            item.sku === sku ? { ...item, quantity } : item
          ),
        }));
      },

      removeItem: (sku) => {
        set((state) => ({
          items: state.items.filter(item => item.sku !== sku),
        }));
      },

      clearCart: () => {
        set({ items: [] });
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getTotalPrice: () => {
        // Asume que todos los productos están en PEN para este cálculo básico,
        // o que el frontend manejará la conversión después si hay USD.
        return get().items.reduce((total, item) => total + (item.price || 0) * item.quantity, 0);
      }
    }),
    {
      name: 'dirogsa-cart-storage', // nombre de la clave en localStorage
    }
  )
);
