/**
 * X-Pixel Core — RGB LSB Encoder
 * Encodes optical packets by modulating the least-significant bit of RGB channels.
 */

import { OpticalPacket } from '../types';

export interface EncodedRGBFrame {
  /** RGBA pixel buffer (width * height * 4 bytes) */
  imageBuffer: Buffer;
  packet: OpticalPacket;
  width: number;
  height: number;
  /** Total bits available in this frame */
  bitsPerFrame: number;
  /** Decode confidence estimate [0-1] */
  confidence: number;
}

export class RGBEncoder {
  /** Default background: near-black (#0a0f1a) to minimize perceptual distortion */
  private static readonly BG = { r: 0x0a, g: 0x0f, b: 0x1a };

  /**
   * Encode an optical packet into an RGBA frame buffer via LSB modulation.
   * @param frameWidth  Frame width in pixels (default 1920)
   * @param frameHeight Frame height in pixels (default 1080)
   */
  encodePacket(
    packet: OpticalPacket,
    frameWidth = 1920,
    frameHeight = 1080
  ): EncodedRGBFrame {
    const pixelCount = frameWidth * frameHeight;
    const bitsAvailable = pixelCount * 24; // 3 channels × 8 bits, only LSB used

    const serialized = this.serializePacket(packet);
    const bitsNeeded = serialized.length * 8;

    if (bitsNeeded > bitsAvailable) {
      throw new Error(`Packet too large for frame (${bitsNeeded} bits > ${bitsAvailable} bits)`);
    }

    const imageBuffer = Buffer.alloc(pixelCount * 4);
    this.fillBackground(imageBuffer, pixelCount);
    this.encodeBitsLSB(imageBuffer, serialized, frameWidth, frameHeight);

    return {
      imageBuffer,
      packet,
      width: frameWidth,
      height: frameHeight,
      bitsPerFrame: bitsAvailable,
      confidence: 0.95,
    };
  }

  private fillBackground(buffer: Buffer, pixelCount: number): void {
    for (let i = 0; i < pixelCount; i++) {
      const idx = i * 4;
      buffer[idx] = RGBEncoder.BG.r;
      buffer[idx + 1] = RGBEncoder.BG.g;
      buffer[idx + 2] = RGBEncoder.BG.b;
      buffer[idx + 3] = 0xff;
    }
  }

  private encodeBitsLSB(
    imageBuffer: Buffer,
    data: Buffer,
    frameWidth: number,
    frameHeight: number
  ): void {
    let bitIndex = 0;
    for (let i = 0; i < data.length && bitIndex < frameWidth * frameHeight * 24; i++) {
      const byte = data[i];
      for (let b = 0; b < 8; b++) {
        const bit = (byte >> b) & 1;
        const pixelIndex = Math.floor(bitIndex / 24);
        if (pixelIndex >= frameWidth * frameHeight) break;

        const pixelOffset = pixelIndex * 4;
        const channelIndex = Math.floor((bitIndex % 24) / 8);

        if (bit === 1) {
          imageBuffer[pixelOffset + channelIndex] |= 0x01;
        } else {
          imageBuffer[pixelOffset + channelIndex] &= 0xfe;
        }
        bitIndex++;
      }
    }
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
}
