import type { Metadata } from 'next';
import './globals.css';
import { Navigation } from '@/components/Navigation';
import { ServiceWorkerRegistrar } from '@/components/ServiceWorkerRegistrar';

export const metadata: Metadata = {
  title: 'X-Pixel — Optical Communication Platform',
  description:
    'Transfer files at the speed of light. Ultra-secure offline file transfer using optical signals — no Wi-Fi, Bluetooth, or internet required.',
  keywords: ['optical', 'file transfer', 'offline', 'secure', 'QR', 'RGB modulation', 'PWA'],
  authors: [{ name: 'X-Pixel Technologies' }],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'X-Pixel',
  },
  openGraph: {
    title: 'X-Pixel — Optical Communication Platform',
    description: 'Transfer files at the speed of light using only screens and cameras.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* PWA */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#7c3aed" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="X-Pixel" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icons/icon-512.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icons/icon-512.png" />
        {/* Viewport for PWA / mobile install */}
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body className="noise">
        <ServiceWorkerRegistrar />
        <Navigation />
        <main>{children}</main>
      </body>
    </html>
  );
}
