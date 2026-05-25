'use client';

import { useState, useCallback } from 'react';
import { encodeFileToFrames, TransmissionProtocol, PROTOCOLS } from '@/lib/optical';

export function useOpticalSender() {
  const [isEncoding, setIsEncoding] = useState(false);
  const [encodeProgress, setEncodeProgress] = useState(0);
  const [encodeStatus, setEncodeStatus] = useState('');
  const [frames, setFrames] = useState<string[]>([]);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [activeProtocol, setActiveProtocol] = useState<TransmissionProtocol>('QR_DYNAMIC');

  const sendFile = useCallback(async (file: File, protocol: TransmissionProtocol = 'QR_DYNAMIC') => {
    setActiveProtocol(protocol);
    setIsEncoding(true);
    setEncodeProgress(0);
    setFrames([]);
    setIsBroadcasting(false);

    try {
      const result = await encodeFileToFrames(file, ({ progress, status }) => {
        setEncodeProgress(progress);
        setEncodeStatus(status);
      }, protocol);
      setFrames(result);
    } catch (err) {
      console.error('Encoding failed:', err);
    } finally {
      setIsEncoding(false);
    }
  }, []);

  const toggleBroadcast = useCallback(() => {
    setIsBroadcasting((prev) => !prev);
  }, []);

  const reset = useCallback(() => {
    setIsBroadcasting(false);
    setIsEncoding(false);
    setEncodeProgress(0);
    setEncodeStatus('');
    setFrames([]);
    setActiveProtocol('QR_DYNAMIC');
  }, []);

  // Derive FPS from the active protocol
  const activeFps = PROTOCOLS.find((p) => p.id === activeProtocol)?.fps ?? 15;

  return {
    sendFile,
    toggleBroadcast,
    reset,
    isEncoding,
    encodeProgress,
    encodeStatus,
    frames,
    isBroadcasting,
    activeProtocol,
    activeFps,
  };
}
