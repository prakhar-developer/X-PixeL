/**
 * X-Pixel Core — QR Encoder
 * Encodes optical packets into QR code frames (Version 1-40, ECL-H).
 */

import { ControlType, OpticalPacket, TransmissionMode } from '../types';

export interface EncodedQRFrame {
  /** Raw QR image bytes (populated by native qrcode lib in production) */
  qrImage: Buffer;
  packet: OpticalPacket;
  qrVersion: number;
  /** Grid modules per side */
  modules: number;
  /** Max byte capacity at this QR version */
  capacity: number;
  dataLength: number;
  checksum: number;
}

/** QR version → byte capacity table (Error Correction Level H) */
const QR_CAPACITY_H: Record<number, number> = {
  1: 7,  2: 14,  3: 24,  4: 34,  5: 48,  6: 60,  7: 73,  8: 91,  9: 107,
  10: 127, 11: 142, 12: 158, 13: 177, 14: 206, 15: 225, 16: 253,
  17: 283, 18: 313, 19: 341, 20: 385, 21: 406, 22: 442, 23: 464,
  24: 514, 25: 538, 26: 596, 27: 628, 28: 661, 29: 701, 30: 745,
  31: 793, 32: 845, 33: 901, 34: 961, 35: 986, 36: 1054, 37: 1096,
  38: 1142, 39: 1222, 40: 1276,
};

export class QREncoder {
  private readonly errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';

  constructor(ecl: 'L' | 'M' | 'Q' | 'H' = 'H') {
    this.errorCorrectionLevel = ecl;
  }

  /**
   * Encode an optical packet into a QR frame descriptor.
   * Production usage: connect a native qrcode renderer (e.g. `qrcode` npm package).
   */
  async encodePacket(packet: OpticalPacket): Promise<EncodedQRFrame> {
    const serialized = this.serializePacket(packet);
    const version = this.estimateVersion(serialized.length);
    const capacity = this.getCapacity(version);

    if (serialized.length > capacity) {
      throw new Error(`Packet too large for QR v${version} (${serialized.length} > ${capacity})`);
    }

    return {
      // Native qrcode renderer fills this in production
      qrImage: Buffer.alloc(0),
      packet,
      qrVersion: version,
      modules: version * 4 + 17,
      capacity,
      dataLength: serialized.length,
      checksum: this.calculateChecksum(serialized),
    };
  }

  /** Estimate minimum QR version for a given byte count. */
  private estimateVersion(dataSize: number): number {
    for (let v = 1; v <= 40; v++) {
      if (dataSize <= (QR_CAPACITY_H[v] ?? 0)) return v;
    }
    throw new Error(`Data too large for QR (${dataSize} bytes)`);
  }

  private getCapacity(version: number): number {
    return QR_CAPACITY_H[version] ?? 1276;
  }

  private serializePacket(packet: OpticalPacket): Buffer {
    const payloadLen = packet.payload.length;
    const fecLen = packet.fecData.length;
    const totalLen = 4 + 4 + 4 + 1 + 1 + 1 + 4 + payloadLen + fecLen + 8 + 4;

    const buffer = Buffer.alloc(totalLen);
    let offset = 0;

    buffer.writeUInt32BE(packet.packetId, offset); offset += 4;
    buffer.writeUInt32BE(packet.totalPackets, offset); offset += 4;
    buffer.writeUInt32BE(packet.fileId, offset); offset += 4;
    buffer.writeUInt8(packet.mode, offset++);
    buffer.writeUInt8(packet.isControl ? 1 : 0, offset++);
    buffer.writeUInt8(packet.controlType, offset++);
    buffer.writeUInt32BE(payloadLen, offset); offset += 4;

    packet.payload.copy(buffer, offset); offset += payloadLen;
    packet.fecData.copy(buffer, offset); offset += fecLen;

    buffer.writeBigInt64BE(BigInt(packet.timestamp), offset); offset += 8;
    buffer.writeUInt32BE(packet.crc32, offset);

    return buffer;
  }

  private calculateChecksum(data: Buffer): number {
    let checksum = 0;
    for (let i = 0; i < data.length; i++) {
      checksum = ((checksum << 5) - checksum + data[i]) | 0;
    }
    return checksum >>> 0;
  }
}
