'use client';
import { useState } from 'react';

export default function ImageWithFallback({ 
  src, 
  alt, 
  className, 
  fallbackType = 'hide', // 'hide' | 'text'
  fallbackText = '' 
}) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    if (fallbackType === 'text') {
      return (
        <span className="text-5xl md:text-7xl font-black text-white/20 tracking-tighter">
          {fallbackText}
        </span>
      );
    }
    return null; // Oculta la imagen si falla y es de tipo 'hide'
  }

  return (
    <img 
      src={src} 
      alt={alt} 
      className={className} 
      onError={() => setHasError(true)} 
    />
  );
}
