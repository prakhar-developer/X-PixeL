// Pure browser-based optical encoding utilities.
// No Node.js APIs, no Web Workers — works directly in Next.js client components.

import QRCode from 'qrcode';

// ── Packet Serialization ─────────────────────────────────────────────────────

/** Serialize packet into a compact binary format, then encode as base64 */
export function serializePacket(
  packetId: number,
  totalPackets: number,
  fileId: number,
  payload: Uint8Array,
): string {
  // Header: [packetId:4][totalPackets:4][fileId:4][payloadLen:4] = 16 bytes
  const buf = new Uint8Array(16 + payload.length);
  const view = new DataView(buf.buffer);
  view.setUint32(0, packetId, false);
  view.setUint32(4, totalPackets, false);
  view.setUint32(8, fileId, false);
  view.setUint32(12, payload.length, false);
  buf.set(payload, 16);

  // Convert to base64 for QR encoding
  let binary = '';
  for (let i = 0; i < buf.length; i++) binary += String.fromCharCode(buf[i]);
  return btoa(binary);
}

/** Parse a base64-encoded packet back to its fields */
export function deserializePacket(b64: string): {
  packetId: number;
  totalPackets: number;
  fileId: number;
  payload: Uint8Array;
} | null {
  try {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

    if (bytes.length < 16) return null;
    const view = new DataView(bytes.buffer);
    const packetId = view.getUint32(0, false);
    const totalPackets = view.getUint32(4, false);
    const fileId = view.getUint32(8, false);
    const payloadLen = view.getUint32(12, false);
    if (bytes.length < 16 + payloadLen) return null;

    return { packetId, totalPackets, fileId, payload: bytes.slice(16, 16 + payloadLen) };
  } catch {
    return null;
  }
}

// ── Encoding ─────────────────────────────────────────────────────────────────

export interface EncodeProgress {
  progress: number; // 0-100
  status: string;
}

/**
 * Encode a File into an array of QR code Data URLs.
 * Calls `onProgress` after each batch to update the UI.
 */
export async function encodeFileToFrames(
  file: File,
  onProgress: (p: EncodeProgress) => void,
): Promise<string[]> {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  // 200 bytes/chunk → safe within QR v25-30 capacity with L error correction
  const chunkSize = 200;
  const totalPackets = Math.ceil(bytes.length / chunkSize);
  const fileId = Math.floor(Math.random() * 0xffffff);
  const frames: string[] = [];

  onProgress({ progress: 0, status: 'Starting...' });

  for (let i = 0; i < totalPackets; i++) {
    const chunk = bytes.slice(i * chunkSize, Math.min((i + 1) * chunkSize, bytes.length));
    const b64Packet = serializePacket(i, totalPackets, fileId, chunk);

    const dataUrl = await QRCode.toDataURL(b64Packet, {
      errorCorrectionLevel: 'L',
      margin: 2,
      scale: 6,
      color: { dark: '#000000', light: '#ffffff' },
    });

    frames.push(dataUrl);

    // Yield every 10 packets so UI can update
    if (i % 10 === 0 || i === totalPackets - 1) {
      onProgress({
        progress: ((i + 1) / totalPackets) * 100,
        status: `Encoding ${i + 1} / ${totalPackets}`,
      });
      await new Promise((r) => setTimeout(r, 0));
    }
  }

  return frames;
}
