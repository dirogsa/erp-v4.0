/**
 * @file authStore.js
 * @description Estado global de autenticación — Portal Mayorista B2B (Zustand).
 *
 * ARQUITECTURA:
 * Este store solo gestiona el ESTADO en memoria (quién está logueado).
 * Toda la lógica de comunicación con el backend (HTTP, validación de tokens,
 * comprobación de roles) reside exclusivamente en auth.service.js.
 * Los componentes de UI consumen este store para reaccionar a cambios de sesión.
 */
import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  isAuthenticated: false,
  user: null,
  token: null,

  /**
   * Establece el estado de sesión autenticada.
   * Llamado por auth.service.js tras un login exitoso.
   *
   * @param {object} userData - Perfil completo del usuario.
   * @param {string} token - JWT Bearer token.
   */
  login: (userData, token) => {
    set({ isAuthenticated: true, user: userData, token });
  },

  /**
   * Limpia el estado de sesión.
   * Llamado por auth.service.js durante el logout o expiración.
   */
  logout: () => {
    set({ isAuthenticated: false, user: null, token: null });
  },
}));
