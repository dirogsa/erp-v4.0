'use client';

/**
 * @file page.js (Login)
 * @description Página de inicio de sesión del Portal Mayorista B2B.
 *
 * ARQUITECTURA:
 * Este componente es pura UI. No contiene lógica de negocio ni llamadas HTTP.
 * Toda la autenticación está delegada a auth.service.js (Single Source of Truth).
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/authStore';

export default function LoginPage() {
  const router = useRouter();
  const { login: setAuthState } = useAuthStore();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // El servicio maneja: HTTP, validación de rol, y persistencia del token.
      const { user, token } = await authService.login(username, password);

      // Actualizar el estado global de la aplicación.
      setAuthState(user, token);

      // Redirigir al inicio (Home) tras login exitoso.
      router.push('/');
    } catch (err) {
      // El servicio ya retorna mensajes legibles para el usuario.
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center p-5 relative overflow-hidden">

      {/* Glow ambiental de fondo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-primary/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="card-premium w-full max-w-md relative z-10 space-y-8 p-8">

        {/* Encabezado */}
        <div className="text-center space-y-2">
          <div
            className="h-16 w-16 mx-auto rounded-[2rem] flex items-center justify-center mb-4"
            style={{ background: 'var(--brand-primary-dim)', border: '1px solid rgba(16,185,129,0.2)' }}
          >
            <svg className="h-8 w-8" style={{ color: 'var(--brand-primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tighter uppercase">Portal B2B</h1>
          <p className="text-sm" style={{ color: 'var(--brand-text-muted)' }}>
            Acceso exclusivo para distribuidores
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-1">
            <label
              htmlFor="login-username"
              className="text-[10px] font-black uppercase tracking-widest pl-1"
              style={{ color: 'var(--brand-text-dim)' }}
            >
              Usuario
            </label>
            <input
              id="login-username"
              type="text"
              required
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="tech-input w-full h-12 rounded-xl px-4 text-sm font-bold text-white placeholder-brand-text-dim/50"
              placeholder="Ingresa tu usuario"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="login-password"
              className="text-[10px] font-black uppercase tracking-widest pl-1"
              style={{ color: 'var(--brand-text-dim)' }}
            >
              Contraseña
            </label>
            <input
              id="login-password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="tech-input w-full h-12 rounded-xl px-4 text-sm font-bold text-white placeholder-brand-text-dim/50"
              placeholder="••••••••"
            />
          </div>

          {/* Mensaje de error */}
          {error && (
            <div
              className="px-4 py-3 rounded-xl text-sm font-bold leading-relaxed"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#FCA5A5' }}
              role="alert"
            >
              {error}
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2"
              style={{
                background: 'var(--brand-primary)',
                color: '#0A0A0B',
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 border-2 border-[#0A0A0B]/20 border-t-[#0A0A0B] rounded-full animate-spin" />
                  Verificando...
                </>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </div>
        </form>

        {/* Footer del card */}
        <div className="text-center pt-4" style={{ borderTop: '1px solid var(--brand-border)' }}>
          <p className="text-xs" style={{ color: 'var(--brand-text-dim)' }}>
            ¿Aún no eres cliente?{' '}
            <Link href="/solicitar-acceso" className="font-bold hover:underline" style={{ color: 'var(--brand-primary)' }}>
              Solicita acceso mayorista
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
