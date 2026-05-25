'use client';

import { useEffect, useRef } from 'react';
import styles from './OpticalWave.module.css';

interface Props {
  isActive?: boolean;
  mode?: 'QR' | 'RGB' | 'FLICKER' | 'HYBRID';
  progress?: number;
}

const MODE_COLORS = {
  QR: '#00f5ff',
  RGB: '#7c3aed',
  FLICKER: '#f59e0b',
  HYBRID: '#10b981',
};

export function OpticalWave({ isActive = false, mode = 'QR', progress = 0 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number | null>(null);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener('resize', resize);

    const color = MODE_COLORS[mode];
    const W = () => canvas.offsetWidth;
    const H = () => canvas.offsetHeight;

    const drawFrame = (t: number) => {
      ctx.clearRect(0, 0, W(), H());
      const w = W(), h = H();

      // Background grid
      ctx.strokeStyle = 'rgba(0,245,255,0.04)';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 32) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      for (let y = 0; y < h; y += 32) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }

      if (!isActive) {
        // Idle state — faint standing wave
        ctx.strokeStyle = 'rgba(0,245,255,0.15)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let x = 0; x <= w; x += 2) {
          const y = h / 2 + Math.sin((x / w) * Math.PI * 4 + t * 0.002) * 10;
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
        return;
      }

      // ─── Active transmission: draw optical wave packets ───────────────────
      const numWaves = mode === 'FLICKER' ? 5 : mode === 'RGB' ? 3 : mode === 'HYBRID' ? 4 : 2;

      for (let wi = 0; wi < numWaves; wi++) {
        const phase = (t * 0.003 + wi * 0.7) % 1;
        const x = phase * w;
        const amp = 30 + wi * 5;
        const freq = 4 + wi * 0.5;

        // Wave trail
        const grad = ctx.createLinearGradient(x - 80, 0, x + 40, 0);
        grad.addColorStop(0, `${color}00`);
        grad.addColorStop(0.3, `${color}40`);
        grad.addColorStop(0.8, `${color}cc`);
        grad.addColorStop(1, `${color}ff`);

        ctx.strokeStyle = grad;
        ctx.lineWidth = 2;
        ctx.shadowColor = color;
        ctx.shadowBlur = 12;

        ctx.beginPath();
        for (let px = Math.max(0, x - 120); px <= Math.min(w, x + 20); px += 2) {
          const localPhase = (px - (x - 100)) / 120;
          const y = h / 2 + Math.sin(localPhase * Math.PI * freq + t * 0.01 * (wi + 1)) * amp * localPhase;
          px === Math.max(0, x - 120) ? ctx.moveTo(px, y) : ctx.lineTo(px, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Leading photon dot
        if (x < w) {
          const dotY = h / 2 + Math.sin(t * 0.01 * (wi + 1)) * amp;
          ctx.beginPath();
          ctx.arc(x, dotY, 4, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.shadowColor = color;
          ctx.shadowBlur = 20;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      // Progress indicator
      ctx.fillStyle = `${color}20`;
      ctx.fillRect(0, h - 3, w * progress, 3);
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      ctx.fillRect(0, h - 3, w * progress, 3);
      ctx.shadowBlur = 0;
    };

    const animate = (timestamp: number) => {
      timeRef.current = timestamp;
      drawFrame(timestamp);
      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resize);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isActive, mode, progress]);

  return (
    <div className={styles.wrapper}>
      {/* Device icons */}
      <div className={styles.device}>
        <div className={styles.deviceScreen}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="5" y="2" width="14" height="20" rx="2"/>
            <line x1="12" y1="18" x2="12" y2="18.01" strokeLinecap="round"/>
          </svg>
          <span>Sender</span>
        </div>
      </div>

      <canvas ref={canvasRef} className={styles.canvas} />

      <div className={styles.device}>
        <div className={`${styles.deviceScreen} ${styles.receiver}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="5" y="2" width="14" height="20" rx="2"/>
            <line x1="12" y1="18" x2="12" y2="18.01" strokeLinecap="round"/>
          </svg>
          <span>Receiver</span>
        </div>
      </div>

      {/* Mode badge */}
      <div className={styles.modeBadge} style={{ borderColor: `${MODE_COLORS[mode]}50`, color: MODE_COLORS[mode] }}>
        {mode} MODE
      </div>
    </div>
  );
}
