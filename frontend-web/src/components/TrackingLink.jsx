'use client';

import React from 'react';
import Link from 'next/link';
import { trackEvent } from '@/lib/tracking';

/**
 * TrackingLink: Componente Arquitectónico B2B
 * 
 * Permite inyectar eventos de conversión (telemetría) en Server Components
 * sin tener que usar 'use client' en todo el layout o página, manteniendo 
 * un SEO perfecto y cero bloqueos de hidratación.
 *
 * @param {string} href - Ruta de destino (interna o externa).
 * @param {string} eventName - Nombre del evento en DataLayer (ej: 'whatsapp_click').
 * @param {object} payload - Metadatos del evento.
 * @param {boolean} external - Si es true, usa <a> normal con target="_blank".
 */
export default function TrackingLink({
  href,
  eventName,
  payload = {},
  external = false,
  className = '',
  children,
  onClick,
  ...props
}) {
  const handleClick = (e) => {
    // 1. Disparar el tracking al DataLayer
    if (eventName) {
      trackEvent(eventName, payload);
    }
    
    // 2. Disparar Meta Pixel TrackCustom si existe (Remarketing)
    if (typeof window !== 'undefined' && window.fbq && eventName) {
      window.fbq('trackCustom', eventName, payload);
    }

    // 3. Ejecutar onClick original si existe
    if (onClick) {
      onClick(e);
    }
  };

  if (external) {
    return (
      <a
        href={href}
        className={className}
        onClick={handleClick}
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={className} onClick={handleClick} {...props}>
      {children}
    </Link>
  );
}
