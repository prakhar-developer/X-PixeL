'use client';

import { useState, useCallback, useRef } from 'react';
import { encodeFileToFrames } from '@/lib/optical';

export function useOpticalSender() {
  const [isEncoding, setIsEncoding] = useState(false);
  const [encodeProgress, setEncodeProgress] = useState(0);
  const [encodeStatus, setEncodeStatus] = useState('');
  const [frames, setFrames] = useState<string[]>([]);
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const sendFile = useCallback(async (file: File) => {
    setIsEncoding(true);
    setEncodeProgress(0);
    setFrames([]);
    setIsBroadcasting(false);

    try {
      const result = await encodeFileToFrames(file, ({ progress, status }) => {
        setEncodeProgress(progress);
        setEncodeStatus(status);
      });
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
  }, []);

  return {
    sendFile,
    toggleBroadcast,
    reset,
    isEncoding,
    encodeProgress,
    encodeStatus,
    frames,
    isBroadcasting,
  };
}
