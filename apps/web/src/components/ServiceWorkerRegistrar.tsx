'use client';

import { useEffect } from 'react';

/**
 * Registers the X-Pixel service worker for offline PWA support.
 * Must be rendered in a Client Component inside the root layout.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    // Register on next tick to not block the initial render
    const timer = setTimeout(() => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((registration) => {
          console.log('[X-Pixel SW] Registered:', registration.scope);

          // Check for updates when the page gains focus
          const handleFocus = () => registration.update();
          window.addEventListener('focus', handleFocus);
          return () => window.removeEventListener('focus', handleFocus);
        })
        .catch((err) => {
          console.warn('[X-Pixel SW] Registration failed:', err);
        });
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return null;
}
