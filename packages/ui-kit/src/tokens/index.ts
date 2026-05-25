/**
 * X-Pixel UI Kit — Design Tokens
 * Canonical color palette, typography, animation, and spacing system.
 */

export const COLORS = {
  // Base
  background: '#050508',
  surface: '#0d0d1a',
  panel: '#111128',
  border: 'rgba(0, 245, 255, 0.12)',
  borderHover: 'rgba(0, 245, 255, 0.35)',

  // Primary (Cyan Neon)
  primary: '#00f5ff',
  primaryDim: '#00c4cc',
  primaryGlow: 'rgba(0, 245, 255, 0.2)',

  // Secondary (Electric Purple)
  secondary: '#7c3aed',
  secondaryDim: '#5b21b6',
  secondaryGlow: 'rgba(124, 58, 237, 0.2)',

  // Accent (Emerald)
  accent: '#10b981',
  accentDim: '#059669',
  accentGlow: 'rgba(16, 185, 129, 0.2)',

  // Status
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  dangerGlow: 'rgba(239, 68, 68, 0.2)',

  // Text
  textPrimary: '#e2e8f0',
  textSecondary: '#94a3b8',
  textMuted: '#475569',
  textInverse: '#050508',
} as const;

export const GRADIENTS = {
  primaryGlow: 'linear-gradient(135deg, rgba(0,245,255,0.15) 0%, rgba(124,58,237,0.15) 100%)',
  heroBg: 'radial-gradient(ellipse at 50% 0%, rgba(0,245,255,0.08) 0%, #050508 70%)',
  panelBg: 'linear-gradient(135deg, rgba(17,17,40,0.9) 0%, rgba(13,13,26,0.95) 100%)',
  primaryButton: 'linear-gradient(135deg, #00f5ff 0%, #7c3aed 100%)',
  accentButton: 'linear-gradient(135deg, #10b981 0%, #00f5ff 100%)',
  textGradient: 'linear-gradient(135deg, #00f5ff 0%, #7c3aed 50%, #10b981 100%)',
} as const;

export const TYPOGRAPHY = {
  fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif",
  fontMono: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
  sizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
    '6xl': '3.75rem',
  },
  weights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
} as const;

export const ANIMATIONS = {
  fast: '150ms',
  normal: '300ms',
  slow: '500ms',
  easing: {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    smooth: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  },
} as const;

export const SPACING = {
  px: '1px',
  0.5: '0.125rem',
  1: '0.25rem',
  2: '0.5rem',
  3: '0.75rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  8: '2rem',
  10: '2.5rem',
  12: '3rem',
  16: '4rem',
  20: '5rem',
  24: '6rem',
} as const;

export const SHADOWS = {
  glow: '0 0 20px rgba(0, 245, 255, 0.3)',
  glowPurple: '0 0 20px rgba(124, 58, 237, 0.3)',
  panel: '0 8px 32px rgba(0, 0, 0, 0.4)',
  card: '0 4px 16px rgba(0, 0, 0, 0.3)',
} as const;
