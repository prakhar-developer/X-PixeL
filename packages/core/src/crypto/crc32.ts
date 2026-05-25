/**
 * X-Pixel Core — CRC-32 Validator
 * Hardware-polynomial CRC for packet integrity verification.
 */

export class CRCValidator {
  private readonly crcTable: Uint32Array;

  constructor() {
    this.crcTable = this.generateCRCTable();
  }

  /**
   * Calculate CRC-32 checksum using IEEE 802.3 polynomial (0xEDB88320).
   */
  calculateCRC32(data: Buffer | Uint8Array): number {
    let crc = 0xffffffff;
    for (let i = 0; i < data.length; i++) {
      const byte = data[i];
      const index = (crc ^ byte) & 0xff;
      crc = (crc >>> 8) ^ this.crcTable[index];
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  /**
   * Validate data against an expected CRC-32 checksum.
   */
  validateCRC32(data: Buffer | Uint8Array, expectedCrc: number): boolean {
    return this.calculateCRC32(data) === expectedCrc;
  }

  /**
   * Validate a packet buffer where the last 4 bytes are the embedded CRC.
   */
  validatePacketWithEmbeddedCRC(packet: Buffer): boolean {
    if (packet.length < 4) return false;
    const dataLength = packet.length - 4;
    const data = packet.subarray(0, dataLength);
    const expectedCrc = packet.readUInt32BE(dataLength);
    return this.validateCRC32(data, expectedCrc);
  }

  /**
   * Append a 4-byte CRC-32 checksum to data, returning a new buffer.
   */
  appendCRC32(data: Buffer | Uint8Array): Buffer {
    const crc = this.calculateCRC32(data);
    const buffer = Buffer.alloc(data.length + 4);
    Buffer.from(data).copy(buffer, 0);
    buffer.writeUInt32BE(crc, data.length);
    return buffer;
  }

  private generateCRCTable(): Uint32Array {
    const table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      }
      table[i] = c >>> 0;
    }
    return table;
  }
}

/** Functional helper — standalone CRC-32 calculation. */
export function calculateCRC32(data: Uint8Array): number {
  return new CRCValidator().calculateCRC32(data);
}

/** Functional helper — verify CRC-32 checksum. */
export function verifyCRC32(data: Uint8Array, checksum: number): boolean {
  return new CRCValidator().validateCRC32(data, checksum);
}
