/**
 * @file auth.service.js
 * @description Capa de Servicio de Autenticación — Portal Mayorista B2B.
 *
 * ARQUITECTURA:
 * Este módulo es el punto único de verdad (Single Source of Truth) para
 * toda operación de autenticación en el portal web. Los componentes de UI
 * (páginas, formularios) NUNCA deben realizar llamadas HTTP al backend
 * directamente. Deben consumir este servicio.
 *
 * Este patrón es el mismo que usa el frontend-erp en sus servicios y
 * garantiza que cualquier cambio en el API de autenticación (URL, headers,
 * manejo de errores) solo requiera modificar este archivo.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Roles del sistema con permiso de acceder al Portal Mayorista B2B.
 * Centralizado aquí para ser mantenible: cualquier cambio de roles
 * se realiza en este único lugar.
 */
const B2B_ALLOWED_ROLES = new Set(['CUSTOMER_B2B', 'SUPERADMIN', 'ADMIN']);

/**
 * Realiza la llamada HTTP al endpoint de login del backend.
 * Gestiona errores de red y los traduce a mensajes comprensibles para el usuario.
 *
 * @param {string} username - Nombre de usuario o email.
 * @param {string} password - Contraseña en texto plano (se encripta en tránsito por HTTPS).
 * @returns {Promise<{access_token: string, token_type: string}>}
 * @throws {Error} Con mensaje legible para el usuario.
 */
async function _fetchToken(username, password) {
  let res;
  try {
    res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
  } catch {
    // Error de red: el servidor no es alcanzable (backend apagado, sin internet)
    throw new Error('No se pudo conectar al servidor. Verifica tu conexión a internet.');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    // El backend retorna el mensaje de error en el campo 'detail' (FastAPI estándar)
    throw new Error(body.detail || 'Credenciales incorrectas. Verifica tu usuario y contraseña.');
  }

  return res.json();
}

/**
 * Obtiene el perfil completo del usuario autenticado.
 * Requiere el token JWT para la petición.
 *
 * @param {string} token - Bearer token JWT.
 * @returns {Promise<object>} - Perfil del usuario (rol, nombre, etc.)
 * @throws {Error} Si el token es inválido o expiró.
 */
async function _fetchUserProfile(token) {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error('Sesión inválida o expirada. Por favor, inicia sesión de nuevo.');
  }

  return res.json();
}

/**
 * Servicio principal de autenticación para el Portal B2B.
 */
export const authService = {

  /**
   * Inicia sesión de un usuario en el portal mayorista.
   *
   * Flujo:
   * 1. Obtiene el token JWT del backend con las credenciales.
   * 2. Obtiene el perfil completo del usuario para verificar el Rol.
   * 3. Valida que el rol tenga permiso de acceso B2B.
   * 4. Persiste el token en sessionStorage (más seguro que localStorage para sesiones web).
   *
   * @param {string} username - Usuario o email.
   * @param {string} password - Contraseña.
   * @returns {Promise<{user: object, token: string}>} - Perfil autenticado y token.
   * @throws {Error} Con mensaje legible para el usuario en cualquier fallo.
   */
  async login(username, password) {
    // Paso 1: Autenticar credenciales y obtener token
    const { access_token } = await _fetchToken(username, password);

    // Paso 2: Obtener perfil completo para validar roles
    const user = await _fetchUserProfile(access_token);

    // Paso 3: Validar acceso B2B — El guardián de seguridad del portal
    if (!B2B_ALLOWED_ROLES.has(user.role)) {
      throw new Error(
        'Acceso denegado. Esta cuenta no tiene permisos del Portal Mayorista. ' +
        'Si crees que es un error, contacta a tu asesor de cuenta.'
      );
    }

    // Paso 4: Persistir sesión de forma segura
    // sessionStorage expira al cerrar el tab (más seguro para un portal B2B que localStorage)
    sessionStorage.setItem('b2b_token', access_token);

    return { user, token: access_token };
  },

  /**
   * Recupera la sesión activa desde sessionStorage si existe.
   * Llamado en el montaje de la aplicación para rehidratar el estado global.
   *
   * @returns {Promise<{user: object, token: string} | null>}
   */
  async restoreSession() {
    const token = sessionStorage.getItem('b2b_token');
    if (!token) return null;

    try {
      const user = await _fetchUserProfile(token);
      // Revalidar rol en cada restauración de sesión (por si fue revocado desde el ERP)
      if (!B2B_ALLOWED_ROLES.has(user.role)) {
        this.logout();
        return null;
      }
      return { user, token };
    } catch {
      // Token expirado o inválido: limpiar sesión silenciosamente
      this.logout();
      return null;
    }
  },

  /**
   * Cierra la sesión activa y limpia todo dato de sesión local.
   */
  logout() {
    sessionStorage.removeItem('b2b_token');
  },
};
