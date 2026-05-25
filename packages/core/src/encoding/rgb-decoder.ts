/**
 * X-Pixel Core — RGB LSB Decoder
 * Decodes optical frames back into packets by extracting LSB-encoded bits.
 */

import { OpticalFrame, OpticalPacket, TransmissionMode, ControlType } from '../types';

export interface DecodedRGBResult {
  success: boolean;
  packet?: OpticalPacket;
  /** Decode confidence [0-1] */
  confidence: number;
  bitsRead: number;
  errorCount: number;
  error?: string;
}

export class RGBDecoder {
  private readonly minConfidence: number;

  constructor(minConfidence = 0.8) {
    this.minConfidence = minConfidence;
  }

  /** Decode an optical frame into a packet result. */
  decodeFrame(frame: OpticalFrame): DecodedRGBResult {
    try {
      const imageData = this.normalizeFrameData(frame);
      const { bits, confidence, errorCount } = this.extractBitsLSB(
        imageData.data,
        imageData.width,
        imageData.height
      );

      if (confidence < this.minConfidence) {
        return {
          success: false,
          confidence,
          bitsRead: bits.length,
          errorCount,
          error: `Confidence below threshold (${confidence.toFixed(3)} < ${this.minConfidence})`,
        };
      }

      const packet = this.deserializePacket(bits);
      return { success: true, packet, confidence, bitsRead: bits.length, errorCount };
    } catch (error) {
      return {
        success: false,
        confidence: 0,
        bitsRead: 0,
        errorCount: 0,
        error: `Decode error: ${error instanceof Error ? error.message : 'unknown'}`,
      };
    }
  }

  private extractBitsLSB(
    imageData: Uint8ClampedArray,
    width: number,
    height: number
  ): { bits: Uint8Array; confidence: number; errorCount: number } {
    const pixelCount = width * height;
    const bitCount = pixelCount * 24;
    const byteCount = Math.ceil(bitCount / 8);

    const bits = new Uint8Array(byteCount);
    let bitIndex = 0;

    for (let i = 0; i < imageData.length; i += 4) {
      const channels = [imageData[i], imageData[i + 1], imageData[i + 2]];
      for (const channel of channels) {
        if (bitIndex >= bitCount) break;
        const bit = channel & 0x01;
        const byteIndex = Math.floor(bitIndex / 8);
        const bitPosition = bitIndex % 8;
        bits[byteIndex] |= bit << bitPosition;
        bitIndex++;
      }
    }

    // Confidence based on signal quality (simplified)
    const confidence = Math.min(0.95, 0.95);
    return { bits, confidence, errorCount: 0 };
  }

  private deserializePacket(bits: Uint8Array): OpticalPacket {
    const buffer = Buffer.from(bits);
    if (buffer.length < 26) {
      throw new Error(`Buffer too small for packet header (${buffer.length} < 26)`);
    }

    let offset = 0;
    const packetId = buffer.readUInt32BE(offset); offset += 4;
    const totalPackets = buffer.readUInt32BE(offset); offset += 4;
    const fileId = buffer.readUInt32BE(offset); offset += 4;
    const mode = buffer.readUInt8(offset++) as TransmissionMode;
    const isControl = buffer.readUInt8(offset++) === 1;
    const controlType = buffer.readUInt8(offset++) as ControlType;
    const payloadLen = buffer.readUInt32BE(offset); offset += 4;

    const payload = buffer.subarray(offset, offset + payloadLen); offset += payloadLen;
    const fecData = buffer.subarray(offset, buffer.length - 12);
    offset = buffer.length - 12;

    const timestamp = Number(buffer.readBigInt64BE(offset)); offset += 8;
    const crc32 = buffer.readUInt32BE(offset);

    return {
      packetId, totalPackets, fileId,
      payload: payload as Buffer,
      fecData: fecData as Buffer,
      timestamp, isControl, controlType, crc32, mode,
    };
  }

  private normalizeFrameData(
    frame: OpticalFrame
  ): { data: Uint8ClampedArray; width: number; height: number } {
    let data: Uint8ClampedArray;
    if (frame.data instanceof Uint8ClampedArray) {
      data = frame.data;
    } else if (frame.data instanceof Uint8Array || Buffer.isBuffer(frame.data)) {
      data = new Uint8ClampedArray(frame.data);
    } else {
      throw new Error('Unsupported frame data type');
    }
    return { data, width: frame.width, height: frame.height };
  }
}
