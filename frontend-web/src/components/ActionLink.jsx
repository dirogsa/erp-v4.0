'use client';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import ProcessingOverlay from './ProcessingOverlay';

export default function ActionLink({ 
  href, 
  children, 
  className, 
  loadingMessage = "Consultando base de datos...", 
  replace = false 
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleClick = (e) => {
    e.preventDefault();
    if (isPending) return;
    
    startTransition(() => {
      if (replace) {
        router.replace(href);
      } else {
        router.push(href);
      }
    });
  };

  return (
    <>
      {isPending && <ProcessingOverlay message={loadingMessage} />}
      <a 
        href={href} 
        onClick={handleClick} 
        className={`${className || ''} ${isPending ? 'opacity-50 pointer-events-none' : ''}`}
      >
        {children}
      </a>
    </>
  );
}
