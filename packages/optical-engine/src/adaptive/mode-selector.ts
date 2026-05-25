/**
 * X-Pixel Optical Engine — Mode Selector
 * Weighted multi-criteria scoring to pick the optimal transmission mode.
 */

import { EnvironmentSnapshot } from './monitor';

export enum TransmissionMode {
  QR = 'QR',
  RGB = 'RGB',
  FLICKER = 'FLICKER',
  HYBRID = 'HYBRID',
}

export interface ModeCharacteristics {
  mode: TransmissionMode;
  /** Data throughput in KB per frame */
  throughput: number;
  /** Robustness to motion/noise [0-1] */
  robustness: number;
  /** Minimum FPS required */
  fpsRequirement: number;
  /** CPU/GPU thermal load [0-1] */
  thermalLoad: number;
  /** Battery drain factor [0-1] */
  batteryImpact: number;
  /** Frame latency in ms */
  latency: number;
  /** Motion blur tolerance [0-1] */
  motionTolerance: number;
  /** Low-light tolerance [0-1] */
  lightingTolerance: number;
}

export interface ModeSelectionRequest {
  targetThroughput?: number;
  prioritizeSpeed?: boolean;
  prioritizeReliability?: boolean;
  prioritizeBattery?: boolean;
}

export const MODE_CHARACTERISTICS: Record<TransmissionMode, ModeCharacteristics> = {
  [TransmissionMode.QR]: {
    mode: TransmissionMode.QR,
    throughput: 10, robustness: 0.95, fpsRequirement: 15,
    thermalLoad: 0.3, batteryImpact: 0.4, latency: 66,
    motionTolerance: 0.9, lightingTolerance: 0.7,
  },
  [TransmissionMode.RGB]: {
    mode: TransmissionMode.RGB,
    throughput: 50, robustness: 0.7, fpsRequirement: 30,
    thermalLoad: 0.6, batteryImpact: 0.7, latency: 33,
    motionTolerance: 0.6, lightingTolerance: 0.8,
  },
  [TransmissionMode.FLICKER]: {
    mode: TransmissionMode.FLICKER,
    throughput: 100, robustness: 0.5, fpsRequirement: 60,
    thermalLoad: 0.8, batteryImpact: 0.9, latency: 16,
    motionTolerance: 0.3, lightingTolerance: 0.6,
  },
  [TransmissionMode.HYBRID]: {
    mode: TransmissionMode.HYBRID,
    throughput: 75, robustness: 0.8, fpsRequirement: 45,
    thermalLoad: 0.7, batteryImpact: 0.8, latency: 22,
    motionTolerance: 0.7, lightingTolerance: 0.75,
  },
};

export class ModeSelector {
  /** Select the highest-scoring valid mode for the current environment. */
  selectMode(
    metrics: EnvironmentSnapshot,
    request: ModeSelectionRequest = {}
  ): TransmissionMode {
    const candidates = this.getValidModes(metrics);
    if (candidates.length === 0) return TransmissionMode.QR;
    if (candidates.length === 1) return candidates[0];

    return candidates.reduce((best, mode) => {
      return this.scoreMode(mode, metrics, request) >
        this.scoreMode(best, metrics, request)
        ? mode
        : best;
    }, candidates[0]);
  }

  /** Return all modes ranked by score descending. */
  getRankedModes(
    metrics: EnvironmentSnapshot,
    request: ModeSelectionRequest = {}
  ): Array<{ mode: TransmissionMode; score: number }> {
    return this.getValidModes(metrics)
      .map((mode) => ({ mode, score: this.scoreMode(mode, metrics, request) }))
      .sort((a, b) => b.score - a.score);
  }

  getModeCharacteristics(mode: TransmissionMode): ModeCharacteristics {
    return { ...MODE_CHARACTERISTICS[mode] };
  }

  /** Hard constraints — modes that can't run under current conditions are excluded. */
  private getValidModes(metrics: EnvironmentSnapshot): TransmissionMode[] {
    const valid: TransmissionMode[] = [TransmissionMode.QR]; // Always valid

    if (metrics.fps >= 30 && metrics.batteryLevel >= 20) {
      valid.push(TransmissionMode.RGB);
    }
    if (metrics.fps >= 60 && metrics.batteryLevel >= 40 && metrics.thermalState !== 'CRITICAL') {
      valid.push(TransmissionMode.FLICKER);
    }
    if (metrics.fps >= 45 && metrics.batteryLevel >= 25) {
      valid.push(TransmissionMode.HYBRID);
    }
    return valid;
  }

  private scoreMode(
    mode: TransmissionMode,
    metrics: EnvironmentSnapshot,
    req: ModeSelectionRequest
  ): number {
    const c = MODE_CHARACTERISTICS[mode];
    let score = 0;

    // Throughput
    score += req.targetThroughput
      ? Math.max(0, 50 - Math.abs(c.throughput - req.targetThroughput))
      : c.throughput / 2;

    // FPS compatibility
    score += Math.min(1, metrics.fps / c.fpsRequirement) * 20;

    // Robustness vs. error rate
    score += (1 - metrics.errorRate) * c.robustness * 30;

    // Lighting compatibility
    score += (1 - metrics.errorRate) * c.lightingTolerance * 15;

    // Thermal state penalty
    if (metrics.thermalState === 'NORMAL') score += 10;
    else if (metrics.thermalState === 'ELEVATED') score += Math.max(0, 10 - c.thermalLoad * 20);
    else score += Math.max(0, 10 - c.thermalLoad * 40);

    // Battery efficiency
    if (metrics.batteryLevel > 50) score += 10;
    else if (metrics.batteryLevel > 20) score += 5 - c.batteryImpact * 5;
    else score += -10 * c.batteryImpact;

    // Success-rate momentum
    score += metrics.successRate * 20;

    // Preference overrides
    if (req.prioritizeSpeed) score += c.throughput;
    if (req.prioritizeReliability) score += c.robustness * 50;
    if (req.prioritizeBattery) score += (1 - c.batteryImpact) * 50;

    return score;
  }
}
