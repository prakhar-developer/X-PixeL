/**
 * X-Pixel Core — Public API
 * Barrel export for the entire core package.
 */

// Types
export * from './types';

// Crypto
export { CRCValidator, calculateCRC32, verifyCRC32 } from './crypto/crc32';

// Packet System
export { PacketSystem } from './packet/system';

// Encoding
export { QREncoder } from './encoding/qr';
export type { EncodedQRFrame } from './encoding/qr';

export { RGBEncoder } from './encoding/rgb-encoder';
export type { EncodedRGBFrame } from './encoding/rgb-encoder';

export { RGBDecoder } from './encoding/rgb-decoder';
export type { DecodedRGBResult } from './encoding/rgb-decoder';
