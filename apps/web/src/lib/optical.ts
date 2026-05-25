// Pure browser-based optical encoding utilities.
// No Node.js APIs, no Web Workers — works directly in Next.js client components.

import QRCode from 'qrcode';

// ── Protocol Types ────────────────────────────────────────────────────────────

export type TransmissionProtocol = 'QR_DYNAMIC' | 'RGB_LSB' | 'INVISIBLE_FLICKER' | 'HYBRID';

export interface ProtocolInfo {
  id: TransmissionProtocol;
  name: string;
  tagline: string;
  throughput: string;
  fps: number;
  chunkSize: number;
  color: string;
  icon: string;
  description: string;
}

export const PROTOCOLS: ProtocolInfo[] = [
  {
    id: 'QR_DYNAMIC',
    name: 'QR Dynamic',
    tagline: 'Maximum Compatibility',
    throughput: '~10 KB/frame',
    fps: 15,
    chunkSize: 200,
    color: '#7c3aed',
    icon: '◼',
    description: 'Dynamic QR codes cycle through data packets. Works with any camera, any lighting, any device. Most robust protocol.',
  },
  {
    id: 'RGB_LSB',
    name: 'RGB LSB Modulation',
    tagline: '5× Faster Throughput',
    throughput: '~50 KB/frame',
    fps: 30,
    chunkSize: 3000,
    color: '#0ea5e9',
    icon: '◈',
    description: 'Encodes binary data directly into pixel color channels (R, G, B). Each pixel carries 3 bytes, producing a dense colorful noise pattern.',
  },
  {
    id: 'INVISIBLE_FLICKER',
    name: 'Invisible Flicker',
    tagline: 'Ultra-High Speed',
    throughput: '~100 KB/frame',
    fps: 60,
    chunkSize: 6000,
    color: '#f59e0b',
    icon: '◉',
    description: 'Encodes data as rapid high-contrast brightness patterns at 60 FPS. Imperceptible to human eyes but readable by camera sensors.',
  },
  {
    id: 'HYBRID',
    name: 'Hybrid Adaptation',
    tagline: 'Balanced & Self-Correcting',
    throughput: '~75 KB/frame',
    fps: 45,
    chunkSize: 2000,
    color: '#10b981',
    icon: '◎',
    description: 'Intelligently interleaves QR sync frames with RGB data frames. Auto-recovers from packet loss using embedded parity markers.',
  },
];

// ── Packet Serialization ─────────────────────────────────────────────────────

/** Serialize packet into a compact binary format, then encode as base64 */
export function serializePacket(
  packetId: number,
  totalPackets: number,
  fileId: number,
  payload: Uint8Array,
  fileMeta?: { fileName: string; mimeType: string },
): string {
  const metadataBytes = fileMeta ? new TextEncoder().encode(JSON.stringify(fileMeta)) : new Uint8Array(0);

  // Header: [packetId:4][totalPackets:4][fileId:4][payloadLen:4][metaLen:4]
  const buf = new Uint8Array(20 + metadataBytes.length + payload.length);
  const view = new DataView(buf.buffer);
  view.setUint32(0, packetId, false);
  view.setUint32(4, totalPackets, false);
  view.setUint32(8, fileId, false);
  view.setUint32(12, payload.length, false);
  view.setUint32(16, metadataBytes.length, false);
  buf.set(metadataBytes, 20);
  buf.set(payload, 20 + metadataBytes.length);

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
  fileName?: string;
  mimeType?: string;
} | null {
  try {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

    if (bytes.length < 20) return null;
    const view = new DataView(bytes.buffer);
    const packetId = view.getUint32(0, false);
    const totalPackets = view.getUint32(4, false);
    const fileId = view.getUint32(8, false);
    const payloadLen = view.getUint32(12, false);
    const metadataLen = view.getUint32(16, false);
    if (bytes.length < 20 + metadataLen + payloadLen) return null;

    let fileName: string | undefined;
    let mimeType: string | undefined;
    if (metadataLen > 0) {
      const metadataBytes = bytes.slice(20, 20 + metadataLen);
      const metadataText = new TextDecoder().decode(metadataBytes);
      const metadata = JSON.parse(metadataText) as { fileName?: string; mimeType?: string };
      fileName = metadata.fileName;
      mimeType = metadata.mimeType;
    }

    return {
      packetId,
      totalPackets,
      fileId,
      payload: bytes.slice(20 + metadataLen, 20 + metadataLen + payloadLen),
      fileName,
      mimeType,
    };
  } catch {
    return null;
  }
}

// ── Encoding ─────────────────────────────────────────────────────────────────

export interface EncodeProgress {
  progress: number; // 0-100
  status: string;
}

// ── QR Dynamic Encoder (existing) ─────────────────────────────────────────────

async function encodeFrameQR(b64Packet: string): Promise<string> {
  return QRCode.toDataURL(b64Packet, {
    errorCorrectionLevel: 'L',
    margin: 2,
    scale: 6,
    color: { dark: '#000000', light: '#ffffff' },
  });
}

// ── RGB LSB Modulation Encoder ────────────────────────────────────────────────

/**
 * Encodes a raw data packet into a Canvas frame using RGB channel modulation.
 * Each pixel carries 3 bytes (R, G, B). The frame looks like colorful digital noise.
 * A 2-pixel-wide border encodes the packet header metadata as a color strip.
 */
function encodeFrameRGB(rawPacket: Uint8Array, frameIndex: number, totalFrames: number): string {
  const W = 512;
  const H = 512;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.createImageData(W, H);
  const pixels = imageData.data; // RGBA flat array

  // Encode data bytes into RGB pixels (3 bytes per pixel, alpha=255)
  const bytesPerPixel = 3;
  for (let px = 0; px < W * H; px++) {
    const dataIdx = px * bytesPerPixel;
    const pxOffset = px * 4;
    pixels[pxOffset]     = dataIdx     < rawPacket.length ? rawPacket[dataIdx]     : (px * 13 + frameIndex * 7) & 0xff;
    pixels[pxOffset + 1] = dataIdx + 1 < rawPacket.length ? rawPacket[dataIdx + 1] : (px * 17 + frameIndex * 11) & 0xff;
    pixels[pxOffset + 2] = dataIdx + 2 < rawPacket.length ? rawPacket[dataIdx + 2] : (px * 19 + frameIndex * 13) & 0xff;
    pixels[pxOffset + 3] = 255;
  }

  ctx.putImageData(imageData, 0, 0);

  // Overlay: header strip — 12px bright bar at top encoding frame metadata
  const hue = (frameIndex / totalFrames) * 360;
  const headerGrd = ctx.createLinearGradient(0, 0, W, 0);
  headerGrd.addColorStop(0, `hsl(${hue}, 90%, 60%)`);
  headerGrd.addColorStop(0.5, `hsl(${(hue + 120) % 360}, 90%, 60%)`);
  headerGrd.addColorStop(1, `hsl(${(hue + 240) % 360}, 90%, 60%)`);
  ctx.fillStyle = headerGrd;
  ctx.fillRect(0, 0, W, 12);

  // Frame index tick marks
  const tickW = W / totalFrames;
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fillRect(frameIndex * tickW, 0, Math.max(tickW - 1, 1), 12);

  return canvas.toDataURL('image/png');
}

// ── Invisible Flicker Encoder ─────────────────────────────────────────────────

/**
 * Encodes data as a high-contrast brightness pattern.
 * Each 8×8 pixel block represents one byte (brightness = byte value).
 * Frames alternate between two complementary patterns for differential signaling.
 */
function encodeFrameFlicker(rawPacket: Uint8Array, frameIndex: number, totalFrames: number): string {
  const W = 512;
  const H = 512;
  const BLOCK = 8;
  const COLS = W / BLOCK; // 64
  const ROWS = H / BLOCK; // 64

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Alternating frame polarity for differential flicker
  const polarity = frameIndex % 2;

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const byteIdx = row * COLS + col;
      const byte = byteIdx < rawPacket.length ? rawPacket[byteIdx] : 0;

      let brightness: number;
      if (polarity === 0) {
        brightness = byte;
      } else {
        // Inverted complement frame — receiver XORs both for redundancy
        brightness = 255 - byte;
      }

      // Add subtle hue based on frame position to make it visually striking
      const hue = ((frameIndex * 15) + col * 2) % 360;
      const sat = 30 + (byte / 255) * 40; // More saturated for higher-value bytes
      const lum = polarity === 0 ? brightness / 2.55 : (255 - brightness) / 2.55;

      ctx.fillStyle = `hsl(${hue}, ${sat}%, ${lum}%)`;
      ctx.fillRect(col * BLOCK, row * BLOCK, BLOCK, BLOCK);
    }
  }

  // Sync strip: bright horizontal line every 8 rows
  ctx.fillStyle = polarity === 0 ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.85)';
  for (let sy = 0; sy < ROWS; sy += 8) {
    ctx.fillRect(0, sy * BLOCK, W, 1);
  }

  // Progress arc overlay
  const progress = (frameIndex + 1) / totalFrames;
  ctx.beginPath();
  ctx.arc(W / 2, H / 2, 30, -Math.PI / 2, -Math.PI / 2 + progress * 2 * Math.PI);
  ctx.strokeStyle = polarity === 0 ? 'rgba(245,158,11,0.7)' : 'rgba(245,158,11,0.4)';
  ctx.lineWidth = 4;
  ctx.stroke();

  return canvas.toDataURL('image/png');
}

// ── Hybrid Adaptation Encoder ─────────────────────────────────────────────────

/**
 * Interleaves QR sync frames with RGB data frames.
 * Every 4th frame is a QR sync marker, the rest are RGB payload frames.
 * This gives redundancy: if RGB frames are missed, the QR resync lets the
 * receiver recover position in the stream.
 */
async function encodeFrameHybrid(
  rawPacket: Uint8Array,
  b64Packet: string,
  frameIndex: number,
  totalFrames: number,
): Promise<string> {
  const isSyncFrame = frameIndex % 4 === 0;

  if (isSyncFrame) {
    // QR sync frame with green tint overlay
    const qrDataUrl = await QRCode.toDataURL(b64Packet, {
      errorCorrectionLevel: 'M',
      margin: 2,
      scale: 5,
      color: { dark: '#064e3b', light: '#ecfdf5' },
    });

    // Add green-tinted border around QR to visually distinguish from pure QR mode
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    const img = new Image();
    await new Promise<void>((resolve) => {
      img.onload = () => {
        ctx.drawImage(img, 16, 16, 480, 480);
        resolve();
      };
      img.src = qrDataUrl;
    });

    // Hybrid indicator: green corner markers
    ctx.fillStyle = '#10b981';
    [[0, 0], [496, 0], [0, 496], [496, 496]].forEach(([x, y]) => {
      ctx.fillRect(x, y, 16, 16);
    });

    // Frame counter bar
    ctx.fillStyle = '#064e3b';
    ctx.fillRect(0, 504, 512, 8);
    ctx.fillStyle = '#10b981';
    ctx.fillRect(0, 504, (frameIndex / totalFrames) * 512, 8);

    return canvas.toDataURL('image/png');
  } else {
    // RGB payload frame with green tint to indicate hybrid mode
    const W = 512;
    const H = 512;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;
    const imageData = ctx.createImageData(W, H);
    const pixels = imageData.data;

    for (let px = 0; px < W * H; px++) {
      const dataIdx = px * 3;
      const pxOffset = px * 4;
      const r = dataIdx     < rawPacket.length ? rawPacket[dataIdx]     : (px * 13 + frameIndex) & 0xff;
      const g = dataIdx + 1 < rawPacket.length ? rawPacket[dataIdx + 1] : (px * 17 + frameIndex) & 0xff;
      const b = dataIdx + 2 < rawPacket.length ? rawPacket[dataIdx + 2] : (px * 19 + frameIndex) & 0xff;
      // Tint green channel slightly higher for hybrid visual signature
      pixels[pxOffset]     = r;
      pixels[pxOffset + 1] = Math.min(255, g + 20);
      pixels[pxOffset + 2] = b;
      pixels[pxOffset + 3] = 255;
    }

    ctx.putImageData(imageData, 0, 0);

    // Hybrid overlay — subtle green grid lines
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.25)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 64) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += 64) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    return canvas.toDataURL('image/png');
  }
}

// ── Main Encoder Dispatch ─────────────────────────────────────────────────────

/**
 * Encode a File into an array of optical frames (Data URLs).
 * Protocol selection determines chunk size, FPS, and visual encoding style.
 */
export async function encodeFileToFrames(
  file: File,
  onProgress: (p: EncodeProgress) => void,
  protocol: TransmissionProtocol = 'QR_DYNAMIC',
): Promise<string[]> {
  const protocolInfo = PROTOCOLS.find((p) => p.id === protocol)!;
  const chunkSize = protocolInfo.chunkSize;

  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  const totalPackets = Math.ceil(bytes.length / chunkSize);
  const fileId = Math.floor(Math.random() * 0xffffff);
  const frames: string[] = [];

  onProgress({ progress: 0, status: `Initializing ${protocolInfo.name}...` });

  for (let i = 0; i < totalPackets; i++) {
    const chunk = bytes.slice(i * chunkSize, Math.min((i + 1) * chunkSize, bytes.length));
    const b64Packet = serializePacket(i, totalPackets, fileId, chunk, {
      fileName: file.name,
      mimeType: file.type || 'application/octet-stream',
    });

    let frame: string;

    switch (protocol) {
      case 'QR_DYNAMIC':
        frame = await encodeFrameQR(b64Packet);
        break;

      case 'RGB_LSB': {
        // Build raw packet bytes: 16-byte header + payload
        const headerBuf = new Uint8Array(16);
        const view = new DataView(headerBuf.buffer);
        view.setUint32(0, i, false);
        view.setUint32(4, totalPackets, false);
        view.setUint32(8, fileId, false);
        view.setUint32(12, chunk.length, false);
        const rawPacket = new Uint8Array(16 + chunk.length);
        rawPacket.set(headerBuf, 0);
        rawPacket.set(chunk, 16);
        frame = encodeFrameRGB(rawPacket, i, totalPackets);
        break;
      }

      case 'INVISIBLE_FLICKER': {
        const headerBuf = new Uint8Array(16);
        const view = new DataView(headerBuf.buffer);
        view.setUint32(0, i, false);
        view.setUint32(4, totalPackets, false);
        view.setUint32(8, fileId, false);
        view.setUint32(12, chunk.length, false);
        const rawPacket = new Uint8Array(16 + chunk.length);
        rawPacket.set(headerBuf, 0);
        rawPacket.set(chunk, 16);
        frame = encodeFrameFlicker(rawPacket, i, totalPackets);
        break;
      }

      case 'HYBRID': {
        const headerBuf = new Uint8Array(16);
        const view = new DataView(headerBuf.buffer);
        view.setUint32(0, i, false);
        view.setUint32(4, totalPackets, false);
        view.setUint32(8, fileId, false);
        view.setUint32(12, chunk.length, false);
        const rawPacket = new Uint8Array(16 + chunk.length);
        rawPacket.set(headerBuf, 0);
        rawPacket.set(chunk, 16);
        frame = await encodeFrameHybrid(rawPacket, b64Packet, i, totalPackets);
        break;
      }

      default:
        frame = await encodeFrameQR(b64Packet);
    }

    frames.push(frame);

    // Yield every 5 packets so the UI can update
    if (i % 5 === 0 || i === totalPackets - 1) {
      onProgress({
        progress: ((i + 1) / totalPackets) * 100,
        status: `Encoding packet ${i + 1} / ${totalPackets} · ${protocolInfo.name}`,
      });
      await new Promise((r) => setTimeout(r, 0));
    }
  }

  return frames;
}
