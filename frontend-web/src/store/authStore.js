import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      token: null,

      login: (userData, token) => {
        set({ isAuthenticated: true, user: userData, token });
      },

      logout: () => {
        set({ isAuthenticated: false, user: null, token: null });
        // Aquí opcionalmente limpiaríamos cartStore si se requiere, pero usualmente 
        // en B2B si cierras sesión limpias el carrito de sesión.
      },
    }),
    {
      name: 'dirogsa-auth-storage', // Guarda sesión en localStorage
    }
  )
);
