/**
 * X-Pixel Optical Engine — Adaptive Optical Engine
 * Orchestrates mode selection, FEC tuning, and bitrate adaptation in one control loop.
 */

import { EnvironmentMonitor, EnvironmentSnapshot } from './monitor';
import { ModeSelector, TransmissionMode } from './mode-selector';
import { AdaptiveFECController, FECConfig } from './fec-controller';
import { AdaptiveBitrateController, BitrateSettings } from './bitrate-controller';

export interface AdaptiveEngineConfig {
  /** How often to re-evaluate mode selection (ms) */
  updateIntervalMs: number;
  /** Frames of stability required before committing to a mode change */
  modeStabilityWindow: number;
  prioritizeSpeed?: boolean;
  prioritizeReliability?: boolean;
  prioritizeBattery?: boolean;
}

export interface AdaptiveEngineState {
  currentMode: TransmissionMode;
  pendingMode: TransmissionMode | null;
  modeChangeCountdown: number;
  metrics: EnvironmentSnapshot;
  averageMetrics: EnvironmentSnapshot;
  fecConfig: FECConfig;
  bitrateConfig: BitrateSettings;
  trend: 'IMPROVING' | 'STABLE' | 'DEGRADING';
  /** Confidence in the current mode selection [0-1] */
  confidence: number;
}

/**
 * Main Adaptive Optical Engine
 * Runs a 1-second adaptation loop that jointly optimizes:
 * — Transmission mode (QR / RGB / FLICKER / HYBRID)
 * — FEC strength (Reed-Solomon N, K)
 * — Bitrate (payload size + frame rate)
 */
export class AdaptiveOpticalEngine {
  private readonly monitor: EnvironmentMonitor;
  private readonly selector: ModeSelector;
  private readonly fecController: AdaptiveFECController;
  private readonly bitrateController: AdaptiveBitrateController;
  private readonly config: AdaptiveEngineConfig;
  private state: AdaptiveEngineState;
  private lastUpdateTime = 0;

  constructor(config: Partial<AdaptiveEngineConfig> = {}) {
    this.config = {
      updateIntervalMs: 1000,
      modeStabilityWindow: 30,
      ...config,
    };

    this.monitor = new EnvironmentMonitor();
    this.selector = new ModeSelector();
    this.fecController = new AdaptiveFECController();
    this.bitrateController = new AdaptiveBitrateController();

    const initialMetrics = this.monitor.getMetrics();
    this.state = {
      currentMode: TransmissionMode.QR,
      pendingMode: null,
      modeChangeCountdown: 0,
      metrics: initialMetrics,
      averageMetrics: initialMetrics,
      fecConfig: { n: 250, k: 200 },
      bitrateConfig: { frameRate: 60, payloadSize: 4096, actualBitrate: 245 },
      trend: 'STABLE',
      confidence: 0.8,
    };
  }

  /** Feed new environmental measurements — triggers adaptation if interval elapsed. */
  updateEnvironment(metrics: Partial<EnvironmentSnapshot>): void {
    this.monitor.updateMetrics(metrics);
    this.maybeAdapt();
  }

  getState(): AdaptiveEngineState { return { ...this.state }; }

  /** Get fully resolved transmission recommendations for the current tick. */
  getRecommendations() {
    return {
      mode: this.state.currentMode,
      fecN: this.state.fecConfig.n,
      fecK: this.state.fecConfig.k,
      frameRate: this.state.bitrateConfig.frameRate,
      payloadSize: this.state.bitrateConfig.payloadSize,
      estimatedThroughput: this.state.bitrateConfig.actualBitrate,
    };
  }

  /** Get all modes ranked by suitability for current conditions. */
  getRankedModes() {
    return this.selector.getRankedModes(this.state.averageMetrics, {
      prioritizeSpeed: this.config.prioritizeSpeed,
      prioritizeReliability: this.config.prioritizeReliability,
      prioritizeBattery: this.config.prioritizeBattery,
    }).map((item) => ({
      ...item,
      characteristics: this.selector.getModeCharacteristics(item.mode),
    }));
  }

  private maybeAdapt(): void {
    const now = Date.now();
    if (now - this.lastUpdateTime < this.config.updateIntervalMs) return;
    this.lastUpdateTime = now;
    this.performAdaptation();
  }

  private performAdaptation(): void {
    const metrics = this.monitor.getMetrics();
    const averageMetrics = this.monitor.getAverageMetrics(5000);
    const trend = this.monitor.getTrend();

    this.state.metrics = metrics;
    this.state.averageMetrics = averageMetrics;
    this.state.trend = trend;

    const selectedMode = this.selector.selectMode(averageMetrics, {
      prioritizeSpeed: this.config.prioritizeSpeed,
      prioritizeReliability: this.config.prioritizeReliability,
      prioritizeBattery: this.config.prioritizeBattery,
    });

    // Mode stability: require N consecutive agreements before switching
    if (selectedMode !== this.state.currentMode) {
      if (this.state.pendingMode === selectedMode) {
        this.state.modeChangeCountdown--;
        if (this.state.modeChangeCountdown <= 0) {
          this.state.currentMode = selectedMode;
          this.state.pendingMode = null;
        }
      } else {
        this.state.pendingMode = selectedMode;
        this.state.modeChangeCountdown = this.config.modeStabilityWindow;
      }
    } else {
      this.state.pendingMode = null;
      this.state.modeChangeCountdown = 0;
    }

    this.state.fecConfig = this.fecController.getConfiguration(
      metrics.errorRate,
      metrics.successRate
    );
    this.state.bitrateConfig = this.bitrateController.calculateSettings(metrics.fps);
    this.state.confidence = metrics.successRate;
  }
}

export default AdaptiveOpticalEngine;
