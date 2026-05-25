'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { deserializePacket } from '@/lib/optical';

// Dynamically import jsQR only on client side
let jsQRModule: typeof import('jsqr') | null = null;

export function useOpticalReceiver() {
  const [isReceiving, setIsReceiving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [receivedCount, setReceivedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [receivedFile, setReceivedFile] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Internal state refs (not reactive — for use inside processFrame)
  const receivedPackets = useRef<Map<number, Uint8Array>>(new Map());
  const activeFileId = useRef<number>(-1);
  const totalExpectedPackets = useRef<number>(0);
  const isCompleted = useRef(false);

  // Preload jsQR
  useEffect(() => {
    import('jsqr').then((m) => { jsQRModule = m; });
  }, []);

  const processFrame = useCallback((imageData: ImageData) => {
    if (!isReceiving || isCompleted.current || !jsQRModule) return;

    const code = jsQRModule.default(
      imageData.data,
      imageData.width,
      imageData.height,
      { inversionAttempts: 'dontInvert' }
    );

    if (!code?.data) return;

    const packet = deserializePacket(code.data);
    if (!packet) return;

    // Reject packets from a different session
    if (activeFileId.current !== -1 && packet.fileId !== activeFileId.current) return;

    activeFileId.current = packet.fileId;
    totalExpectedPackets.current = packet.totalPackets;

    if (!receivedPackets.current.has(packet.packetId)) {
      receivedPackets.current.set(packet.packetId, packet.payload);
      const count = receivedPackets.current.size;
      const total = totalExpectedPackets.current;

      setReceivedCount(count);
      setTotalCount(total);
      setProgress((count / total) * 100);

      if (count === total) {
        isCompleted.current = true;
        assembleFile(receivedPackets.current, total);
      }
    }
  }, [isReceiving]);

  function assembleFile(packets: Map<number, Uint8Array>, total: number) {
    let totalSize = 0;
    for (const p of packets.values()) totalSize += p.length;

    const result = new Uint8Array(totalSize);
    let offset = 0;
    for (let i = 0; i < total; i++) {
      const p = packets.get(i);
      if (!p) { setError(`Missing packet ${i}`); return; }
      result.set(p, offset);
      offset += p.length;
    }

    const blob = new Blob([result], { type: 'application/octet-stream' });
    setReceivedFile(blob);
    setIsReceiving(false);
  }

  const startReceiving = useCallback(() => {
    receivedPackets.current.clear();
    activeFileId.current = -1;
    totalExpectedPackets.current = 0;
    isCompleted.current = false;

    setIsReceiving(true);
    setProgress(0);
    setReceivedCount(0);
    setTotalCount(0);
    setReceivedFile(null);
    setError(null);
  }, []);

  const reset = useCallback(() => {
    receivedPackets.current.clear();
    activeFileId.current = -1;
    totalExpectedPackets.current = 0;
    isCompleted.current = false;

    setIsReceiving(false);
    setProgress(0);
    setReceivedCount(0);
    setTotalCount(0);
    setReceivedFile(null);
    setError(null);
  }, []);

  return {
    isReceiving,
    progress,
    receivedCount,
    totalCount,
    receivedFile,
    error,
    processFrame,
    startReceiving,
    reset,
  };
}
