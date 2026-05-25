'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { deserializePacket } from '@/lib/optical';

// Dynamically import jsQR only on client side
let jsQRModule: typeof import('jsqr') | null = null;

function decodeRgbPacket(imageData: ImageData) {
  const source = imageData.data;
  const rgbBytes = new Uint8Array((source.length / 4) * 3);

  for (let srcIndex = 0, dstIndex = 0; srcIndex < source.length; srcIndex += 4) {
    rgbBytes[dstIndex++] = source[srcIndex];
    rgbBytes[dstIndex++] = source[srcIndex + 1];
    rgbBytes[dstIndex++] = source[srcIndex + 2];
  }

  if (rgbBytes.length < 20) return null;

  const view = new DataView(rgbBytes.buffer, rgbBytes.byteOffset, rgbBytes.byteLength);
  const packetId = view.getUint32(0, false);
  const totalPackets = view.getUint32(4, false);
  const fileId = view.getUint32(8, false);
  const payloadLen = view.getUint32(12, false);
  const metadataLen = view.getUint32(16, false);

  if (totalPackets === 0 || totalPackets > 100000) return null;
  if (payloadLen === 0 || payloadLen > rgbBytes.length) return null;
  if (metadataLen > rgbBytes.length) return null;

  const packetSize = 20 + metadataLen + payloadLen;
  if (packetSize > rgbBytes.length) return null;

  let fileName: string | undefined;
  let mimeType: string | undefined;

  if (metadataLen > 0) {
    try {
      const metadataBytes = rgbBytes.slice(20, 20 + metadataLen);
      const metadataText = new TextDecoder().decode(metadataBytes);
      const metadata = JSON.parse(metadataText) as { fileName?: string; mimeType?: string };
      fileName = metadata.fileName;
      mimeType = metadata.mimeType;
    } catch {
      return null;
    }
  }

  return {
    packetId,
    totalPackets,
    fileId,
    payload: rgbBytes.slice(20 + metadataLen, 20 + metadataLen + payloadLen),
    fileName,
    mimeType,
  };
}

export function useOpticalReceiver() {
  const [isReceiving, setIsReceiving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [receivedCount, setReceivedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [receivedFile, setReceivedFile] = useState<Blob | null>(null);
  const [receivedFileName, setReceivedFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Internal state refs (not reactive — for use inside processFrame)
  const receivedPackets = useRef<Map<number, Uint8Array>>(new Map());
  const activeFileId = useRef<number>(-1);
  const totalExpectedPackets = useRef<number>(0);
  const isCompleted = useRef(false);
  const receivedFileNameRef = useRef<string | null>(null);
  const receivedMimeTypeRef = useRef<string>('application/octet-stream');

  // Preload jsQR
  useEffect(() => {
    import('jsqr').then((m) => { jsQRModule = m; });
  }, []);

  const processFrame = useCallback((imageData: ImageData) => {
    if (!isReceiving || isCompleted.current) return;

    let packet = null as ReturnType<typeof deserializePacket> | ReturnType<typeof decodeRgbPacket>;

    if (jsQRModule) {
      const code = jsQRModule.default(
        imageData.data,
        imageData.width,
        imageData.height,
        { inversionAttempts: 'dontInvert' }
      );

      if (code?.data) {
        packet = deserializePacket(code.data);
      }
    }

    if (!packet) {
      packet = decodeRgbPacket(imageData);
    }

    if (!packet) return;

    // Reject packets from a different session
    if (activeFileId.current !== -1 && packet.fileId !== activeFileId.current) return;

    activeFileId.current = packet.fileId;
    totalExpectedPackets.current = packet.totalPackets;

    if (!receivedPackets.current.has(packet.packetId)) {
      receivedPackets.current.set(packet.packetId, packet.payload);
      if (packet.fileName) {
        receivedFileNameRef.current = packet.fileName;
        setReceivedFileName(packet.fileName);
      }
      if (packet.mimeType) {
        receivedMimeTypeRef.current = packet.mimeType;
      }
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

    const blob = new Blob([result], { type: receivedMimeTypeRef.current || 'application/octet-stream' });
    setReceivedFile(blob);
    setIsReceiving(false);
  }

  const startReceiving = useCallback(() => {
    receivedPackets.current.clear();
    activeFileId.current = -1;
    totalExpectedPackets.current = 0;
    isCompleted.current = false;
    receivedFileNameRef.current = null;
    receivedMimeTypeRef.current = 'application/octet-stream';

    setIsReceiving(true);
    setProgress(0);
    setReceivedCount(0);
    setTotalCount(0);
    setReceivedFile(null);
    setReceivedFileName(null);
    setError(null);
  }, []);

  const reset = useCallback(() => {
    receivedPackets.current.clear();
    activeFileId.current = -1;
    totalExpectedPackets.current = 0;
    isCompleted.current = false;
    receivedFileNameRef.current = null;
    receivedMimeTypeRef.current = 'application/octet-stream';

    setIsReceiving(false);
    setProgress(0);
    setReceivedCount(0);
    setTotalCount(0);
    setReceivedFile(null);
    setReceivedFileName(null);
    setError(null);
  }, []);

  return {
    isReceiving,
    progress,
    receivedCount,
    totalCount,
    receivedFile,
    receivedFileName,
    error,
    processFrame,
    startReceiving,
    reset,
  };
}
