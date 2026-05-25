/**
 * X-Pixel CV Pipeline — Decode Pipeline
 * Reassembles received packets into a complete file buffer.
 */

import { ReedSolomonFEC } from '../fec/reed-solomon';

export interface DecodeResult {
  acknowledged: boolean;
  isComplete: boolean;
  progress: number; // 0-1
}

/**
 * Decode Pipeline
 * Accumulates received data packets, applies FEC, and assembles the output file.
 */
export class DecodePipeline {
  private readonly packets = new Map<number, Uint8Array>();
  private totalPackets = 0;
  private readonly fec: ReedSolomonFEC;

  constructor(fec?: ReedSolomonFEC) {
    this.fec = fec ?? new ReedSolomonFEC(200, 50);
  }

  /** Set total expected packet count from the transfer header. */
  setTotalPackets(total: number): void {
    this.totalPackets = total;
  }

  /** Process a received data packet. Returns ack + completion status. */
  processReceivedPacket(seqNum: number, data: Uint8Array): DecodeResult {
    this.packets.set(seqNum, new Uint8Array(data));
    const progress = this.totalPackets > 0
      ? this.packets.size / this.totalPackets
      : 0;

    return {
      acknowledged: true,
      isComplete: this.packets.size >= this.totalPackets && this.totalPackets > 0,
      progress: Math.min(1, progress),
    };
  }

  /**
   * Reconstruct the complete file from received packets.
   * Applies FEC to correct any corrupted packets before assembly.
   */
  reconstructFile(): Uint8Array {
    if (this.packets.size === 0) {
      throw new Error('No packets received — cannot reconstruct file');
    }

    const maxSeq = Math.max(...this.packets.keys());
    const chunks: Uint8Array[] = [];

    for (let i = 0; i <= maxSeq; i++) {
      const data = this.packets.get(i);
      if (data) {
        // Attempt FEC decode for each packet chunk
        try {
          if (data.length === this.fec.totalSymbols) {
            chunks.push(this.fec.decode(data));
          } else {
            chunks.push(data);
          }
        } catch {
          chunks.push(data); // Best-effort fallback
        }
      }
    }

    const totalSize = chunks.reduce((s, c) => s + c.length, 0);
    const output = new Uint8Array(totalSize);
    let offset = 0;
    for (const chunk of chunks) {
      output.set(chunk, offset);
      offset += chunk.length;
    }
    return output;
  }

  getMissingPackets(): number[] {
    if (this.totalPackets === 0) return [];
    const missing: number[] = [];
    for (let i = 0; i < this.totalPackets; i++) {
      if (!this.packets.has(i)) missing.push(i);
    }
    return missing;
  }

  getProgress(): number {
    if (this.totalPackets === 0) return 0;
    return Math.min(1, this.packets.size / this.totalPackets);
  }

  isComplete(): boolean {
    return this.totalPackets > 0 && this.packets.size >= this.totalPackets;
  }

  reset(): void {
    this.packets.clear();
    this.totalPackets = 0;
  }
}
