/**
 * X-Pixel Core — Packet System
 * Sliding-window queue with retry logic and CRC integrity.
 */

import { CRCValidator } from '../crypto/crc32';
import {
  ControlType,
  OpticalPacket,
  PacketQueueItem,
  PacketStatus,
  PacketSystemConfig,
  TransmissionMode,
} from '../types';

export class PacketSystem {
  private readonly config: PacketSystemConfig;
  private readonly queue: Map<number, PacketQueueItem> = new Map();
  private readonly crcValidator: CRCValidator;
  private nextPacketId: number = 0;

  constructor(config: Partial<PacketSystemConfig> = {}) {
    this.config = {
      maxQueueSize: 1000,
      maxPacketSize: 2048,
      windowSize: 64,
      timeoutMs: 5000,
      retryCount: 3,
      ...config,
    };
    this.crcValidator = new CRCValidator();
  }

  /** Create a new optical packet with CRC and FEC placeholder. */
  createPacket(
    fileId: number,
    payload: Buffer,
    totalPackets: number,
    mode: TransmissionMode = TransmissionMode.QR_DYNAMIC,
    isControl = false,
    controlType: ControlType = ControlType.SYNC_REQUEST
  ): OpticalPacket {
    if (payload.length > this.config.maxPacketSize) {
      throw new Error(`Payload too large (${payload.length} > ${this.config.maxPacketSize})`);
    }

    const packetId = this.nextPacketId++;
    // FEC data = 20% redundancy placeholder (Phase 3 replaces with RS)
    const fecData = Buffer.alloc(Math.ceil(payload.length * 0.2));

    const packet: OpticalPacket = {
      packetId,
      totalPackets,
      fileId,
      payload,
      fecData,
      timestamp: Date.now(),
      isControl,
      controlType,
      crc32: 0,
      mode,
    };

    const serialized = this.serializeForCRC(packet);
    packet.crc32 = this.crcValidator.calculateCRC32(serialized);
    return packet;
  }

  /** Enqueue a packet for transmission. Returns false if queue is full. */
  enqueue(packet: OpticalPacket): boolean {
    if (this.queue.size >= this.config.maxQueueSize) return false;
    this.queue.set(packet.packetId, {
      packet,
      status: PacketStatus.PENDING,
      createdAt: Date.now(),
      transmissionCount: 0,
    });
    return true;
  }

  /** Pop the next pending packet within the sliding window. */
  getNextPacket(): OpticalPacket | null {
    const inFlightCount = Array.from(this.queue.values()).filter(
      (item) =>
        item.status === PacketStatus.TRANSMITTED || item.status === PacketStatus.ACKNOWLEDGED
    ).length;

    if (inFlightCount >= this.config.windowSize) return null;

    for (const [, item] of this.queue) {
      if (item.status === PacketStatus.PENDING) {
        item.status = PacketStatus.TRANSMITTED;
        item.transmissionCount++;
        item.lastTransmitTime = Date.now();
        return item.packet;
      }
    }
    return null;
  }

  /** Mark a packet as acknowledged by its ID. */
  acknowledge(packetId: number): boolean {
    const item = this.queue.get(packetId);
    if (!item) return false;
    item.status = PacketStatus.ACKNOWLEDGED;
    return true;
  }

  /** Mark a packet as lost — re-queues if under retry limit. */
  markLost(packetId: number): boolean {
    const item = this.queue.get(packetId);
    if (!item) return false;

    if (item.transmissionCount >= this.config.retryCount) {
      item.status = PacketStatus.LOST;
      return false;
    }
    item.status = PacketStatus.RECOVERING;
    return true;
  }

  /** Get queue statistics. */
  getStats() {
    let pending = 0, transmitted = 0, acknowledged = 0, lost = 0;
    for (const item of this.queue.values()) {
      switch (item.status) {
        case PacketStatus.PENDING: pending++; break;
        case PacketStatus.TRANSMITTED: transmitted++; break;
        case PacketStatus.ACKNOWLEDGED: acknowledged++; break;
        case PacketStatus.LOST: lost++; break;
      }
    }
    return {
      totalPackets: this.queue.size,
      pendingPackets: pending,
      transmittedPackets: transmitted,
      acknowledgedPackets: acknowledged,
      lostPackets: lost,
      queueUtilization: this.queue.size / this.config.maxQueueSize,
    };
  }

  /** Reset queue and packet counter. */
  clear(): void {
    this.queue.clear();
    this.nextPacketId = 0;
  }

  private serializeForCRC(packet: OpticalPacket): Buffer {
    const payloadLen = packet.payload.length;
    const fecLen = packet.fecData.length;
    const totalLen = 4 + 4 + 4 + 1 + 1 + 1 + 4 + payloadLen + fecLen + 8;

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
    buffer.writeBigInt64BE(BigInt(packet.timestamp), offset);

    return buffer;
  }
}
