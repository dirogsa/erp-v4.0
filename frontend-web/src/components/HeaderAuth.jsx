'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { UserIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/auth.service';

export default function HeaderAuth() {
  const { isAuthenticated, user, login, logout } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Restaurar sesión al cargar la app
    authService.restoreSession().then((session) => {
      if (session) {
        login(session.user, session.token);
      }
    });
  }, [login]);

  const handleLogout = () => {
    authService.logout();
    logout();
    window.location.href = '/login'; // Forzar recarga limpia
  };

  // Evitar hydration mismatch (el servidor no sabe si estás logueado en sessionStorage)
  if (!mounted) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-brand-primary/30 bg-brand-primary/10 text-brand-primary h-[42px] animate-pulse w-32" />
    );
  }

  if (isAuthenticated && user) {
    return (
      <div className="flex items-center gap-3">
        {/* Etiqueta de usuario */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5">
          <div className="w-6 h-6 rounded-full bg-brand-primary flex items-center justify-center text-[#0A0A0B] text-xs font-black uppercase">
            {user.username?.charAt(0) || user.full_name?.charAt(0) || 'U'}
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-white/90 leading-tight">
              {user.username || user.full_name}
            </span>
            <span className="text-[9px] text-brand-primary font-bold uppercase tracking-widest leading-none">
              {user.role === 'SUPERADMIN' ? 'Admin' : 'Socio B2B'}
            </span>
          </div>
        </div>
        
        {/* Botón Logout */}
        <button 
          onClick={handleLogout}
          className="p-2 rounded-xl text-white/50 hover:text-red-400 hover:bg-red-400/10 transition-colors"
          title="Cerrar Sesión"
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <Link 
      href="/login" 
      className="flex items-center gap-2 px-4 py-2 rounded-xl border border-brand-primary/30 bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20 transition-colors" 
      aria-label="Acceso Mayorista"
    >
      <UserIcon className="h-5 w-5" />
      <span className="text-sm font-bold">Portal Mayorista</span>
    </Link>
  );
}
