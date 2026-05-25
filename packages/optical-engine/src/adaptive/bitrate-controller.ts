/**
 * X-Pixel Optical Engine — Adaptive Bitrate Controller
 * Adjusts payload size and frame rate to hit target throughput under current conditions.
 */

export interface BitrateSettings {
  frameRate: number;
  payloadSize: number;
  /** Actual computed throughput in KB/s */
  actualBitrate: number;
}

export class AdaptiveBitrateController {
  private currentBitrate: number;
  private readonly minFrameRate: number;
  private readonly maxFrameRate: number;
  private readonly minPayloadSize: number;
  private readonly maxPayloadSize: number;

  constructor({
    initialBitrate = 1000,
    minFrameRate = 15,
    maxFrameRate = 120,
    minPayloadSize = 512,
    maxPayloadSize = 65536,
  } = {}) {
    this.currentBitrate = initialBitrate;
    this.minFrameRate = minFrameRate;
    this.maxFrameRate = maxFrameRate;
    this.minPayloadSize = minPayloadSize;
    this.maxPayloadSize = maxPayloadSize;
  }

  /** Compute frame-rate + payload-size pair to achieve target bitrate. */
  calculateSettings(
    availableFPS: number,
    targetBitrate: number = this.currentBitrate
  ): BitrateSettings {
    const frameRate = Math.max(
      this.minFrameRate,
      Math.min(availableFPS, this.maxFrameRate)
    );

    const payloadSize = Math.max(
      this.minPayloadSize,
      Math.min(this.maxPayloadSize, Math.floor((targetBitrate * 1000) / frameRate))
    );

    return {
      frameRate,
      payloadSize,
      actualBitrate: (payloadSize * frameRate) / 1000,
    };
  }

  /**
   * Adjust the tracked bitrate based on link conditions.
   * Uses additive-increase multiplicative-decrease (AIMD) logic.
   */
  adjustForConditions(successRate: number, errorRate: number): number {
    if (errorRate > 0.1) {
      this.currentBitrate = Math.max(100, this.currentBitrate * 0.8);
    } else if (successRate > 0.98) {
      this.currentBitrate = Math.min(2000, this.currentBitrate * 1.1);
    }
    return this.currentBitrate;
  }

  getCurrentBitrate(): number { return this.currentBitrate; }
}
