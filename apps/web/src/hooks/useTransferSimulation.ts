'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  SimulationState,
  createSimulation,
  stepSimulation,
} from '@/lib/simulation';

export function useTransferSimulation(fileSizeBytes = 10_000_000) {
  const [state, setState] = useState<SimulationState>(() =>
    createSimulation(fileSizeBytes)
  );
  const lastTickRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);
  const runningRef = useRef(false);

  const tick = useCallback((timestamp: number) => {
    if (!runningRef.current) return;

    const delta = lastTickRef.current ? Math.min(timestamp - lastTickRef.current, 100) : 16;
    lastTickRef.current = timestamp;

    setState((prev) => {
      if (!prev.isRunning) return prev;
      return stepSimulation(prev, delta);
    });

    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const start = useCallback(() => {
    setState((prev) => {
      const fresh = prev.sessionState === 'COMPLETED' || prev.sessionState === 'FAILED'
        ? createSimulation(fileSizeBytes)
        : prev;
      return { ...fresh, isRunning: true };
    });
    runningRef.current = true;
    lastTickRef.current = 0;
    rafRef.current = requestAnimationFrame(tick);
  }, [fileSizeBytes, tick]);

  const pause = useCallback(() => {
    runningRef.current = false;
    setState((prev) => ({ ...prev, isRunning: false, sessionState: 'PAUSED' }));
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  const reset = useCallback(() => {
    runningRef.current = false;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setState(createSimulation(fileSizeBytes));
  }, [fileSizeBytes]);

  // Auto-stop when complete
  useEffect(() => {
    if (state.sessionState === 'COMPLETED') {
      runningRef.current = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    }
  }, [state.sessionState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      runningRef.current = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return { state, start, pause, reset };
}
