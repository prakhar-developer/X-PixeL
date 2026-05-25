/**
 * X-Pixel CV Pipeline — Selective Repeat Protocol
 * Sliding-window ARQ with per-packet timeout-based retransmission.
 */

export enum PacketStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  FAILED = 'FAILED',
}

export interface SRPacket {
  sequenceNumber: number;
  data: Uint8Array;
  status: PacketStatus;
  retransmitCount: number;
  lastSentTime: number;
  maxRetransmits: number;
}

/**
 * Selective Repeat ARQ
 *
 * Only re-transmits packets for which a NACK (or timeout) is received,
 * unlike Go-Back-N which re-sends the full window.
 * This minimizes bandwidth waste on partially-lossy links.
 */
export class SelectiveRepeatProtocol {
  private readonly windowSize: number;
  private readonly maxRetransmits: number;
  private readonly ackWaitMs: number;
  private readonly packets = new Map<number, SRPacket>();
  private nextSequence = 0;
  private base = 0;

  constructor(windowSize = 32, maxRetransmits = 5, ackWaitMs = 1000) {
    this.windowSize = windowSize;
    this.maxRetransmits = maxRetransmits;
    this.ackWaitMs = ackWaitMs;
  }

  /** Queue a data chunk for transmission. Returns assigned sequence number. */
  queuePacket(data: Uint8Array): number {
    const seqNum = this.nextSequence++;
    this.packets.set(seqNum, {
      sequenceNumber: seqNum,
      data: new Uint8Array(data),
      status: PacketStatus.PENDING,
      retransmitCount: 0,
      lastSentTime: 0,
      maxRetransmits: this.maxRetransmits,
    });
    return seqNum;
  }

  /** Mark a packet as in-flight. */
  markSent(seqNum: number): void {
    const pkt = this.packets.get(seqNum);
    if (pkt) { pkt.status = PacketStatus.SENT; pkt.lastSentTime = Date.now(); }
  }

  /** Acknowledge receipt — advances base if consecutive ACKs allow it. */
  markAcknowledged(seqNum: number): void {
    const pkt = this.packets.get(seqNum);
    if (pkt) pkt.status = PacketStatus.ACKNOWLEDGED;

    // Slide window base forward over consecutive ACKs
    while (this.packets.has(this.base)) {
      const basePkt = this.packets.get(this.base);
      if (basePkt?.status !== PacketStatus.ACKNOWLEDGED) break;
      this.packets.delete(this.base++);
    }
  }

  /**
   * Return packets that have timed out and need retransmission.
   * Marks them as FAILED once max retransmits is exceeded.
   */
  getRetransmitCandidates(): SRPacket[] {
    const now = Date.now();
    return [...this.packets.values()].filter((pkt) => {
      if (pkt.status !== PacketStatus.SENT) return false;
      if (now - pkt.lastSentTime <= this.ackWaitMs) return false;
      if (pkt.retransmitCount >= pkt.maxRetransmits) {
        pkt.status = PacketStatus.FAILED;
        return false;
      }
      return true;
    });
  }

  /** Increment retransmit counter and reset send timer. */
  retransmit(seqNum: number): void {
    const pkt = this.packets.get(seqNum);
    if (!pkt) return;
    pkt.retransmitCount++;
    pkt.lastSentTime = Date.now();
  }

  /** Is the sender within the allowed window? */
  canSendMore(): boolean {
    const inFlight = [...this.packets.values()].filter(
      (p) => p.status === PacketStatus.PENDING || p.status === PacketStatus.SENT
    ).length;
    return inFlight < this.windowSize;
  }

  isComplete(): boolean { return this.packets.size === 0; }

  getWindowStatus() {
    let pending = 0, sent = 0, acked = 0, failed = 0;
    for (const p of this.packets.values()) {
      if (p.status === PacketStatus.PENDING) pending++;
      else if (p.status === PacketStatus.SENT) sent++;
      else if (p.status === PacketStatus.ACKNOWLEDGED) acked++;
      else if (p.status === PacketStatus.FAILED) failed++;
    }
    return { base: this.base, nextSequence: this.nextSequence, pending, sent, acked, failed };
  }
}
