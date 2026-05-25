import type { Metadata } from 'next';
import './globals.css';
import { Navigation } from '@/components/Navigation';

export const metadata: Metadata = {
  title: 'X-Pixel — Optical Communication Platform',
  description:
    'Transfer files at the speed of light. Ultra-secure offline file transfer using optical signals — no Wi-Fi, Bluetooth, or internet required.',
  keywords: ['optical', 'file transfer', 'offline', 'secure', 'QR', 'RGB modulation'],
  authors: [{ name: 'X-Pixel Technologies' }],
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
      </head>
      <body className="noise">
        <Navigation />
        <main>{children}</main>
      </body>
    </html>
  );
}
