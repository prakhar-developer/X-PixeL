/**
 * X-Pixel Optical Engine — Environment Monitor
 * Real-time sensor metric collection and trend analysis.
 */

export interface EnvironmentSnapshot {
  timestamp: number;
  fps: number;
  thermalState: 'NORMAL' | 'ELEVATED' | 'CRITICAL';
  thermalTemp: number;     // Celsius
  batteryLevel: number;    // 0-100
  batteryHealth: 'GOOD' | 'DEGRADED' | 'CRITICAL';
  lighting: 'BRIGHT' | 'NORMAL' | 'LOW' | 'VERY_LOW';
  lightingLux: number;
  signalQuality: number;   // 0-100
  errorRate: number;       // 0-1
  successRate: number;     // 0-1
  packetLossRate: number;  // 0-1
}

/**
 * Real-time environment monitoring with sliding-window averaging.
 * Feeds the ModeSelector with up-to-date transmission conditions.
 */
export class EnvironmentMonitor {
  private currentMetrics: EnvironmentSnapshot;
  private readonly metricsHistory: EnvironmentSnapshot[] = [];
  private readonly maxHistorySize: number;

  constructor(maxHistorySize = 100) {
    this.maxHistorySize = maxHistorySize;
    this.currentMetrics = this.defaultMetrics();
  }

  /** Update one or more metrics fields. Automatically timestamps. */
  updateMetrics(partial: Partial<EnvironmentSnapshot>): void {
    this.currentMetrics = {
      ...this.currentMetrics,
      ...partial,
      timestamp: Date.now(),
    };
    this.metricsHistory.push({ ...this.currentMetrics });
    if (this.metricsHistory.length > this.maxHistorySize) {
      this.metricsHistory.shift();
    }
  }

  getMetrics(): EnvironmentSnapshot {
    return { ...this.currentMetrics };
  }

  /**
   * Compute sliding-window average over the last `timeWindowMs` milliseconds.
   * Returns current snapshot if no history exists.
   */
  getAverageMetrics(timeWindowMs = 5000): EnvironmentSnapshot {
    const now = Date.now();
    const window = this.metricsHistory.filter((m) => now - m.timestamp <= timeWindowMs);
    if (window.length === 0) return this.currentMetrics;

    const avg = (field: keyof EnvironmentSnapshot) =>
      window.reduce((s, m) => s + (m[field] as number), 0) / window.length;

    const mode = <T>(arr: T[]): T => {
      const counts = new Map<T, number>();
      for (const v of arr) counts.set(v, (counts.get(v) ?? 0) + 1);
      return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
    };

    return {
      timestamp: now,
      fps: avg('fps'),
      thermalState: mode(window.map((m) => m.thermalState)),
      thermalTemp: avg('thermalTemp'),
      batteryLevel: avg('batteryLevel'),
      batteryHealth: mode(window.map((m) => m.batteryHealth)),
      lighting: mode(window.map((m) => m.lighting)),
      lightingLux: avg('lightingLux'),
      signalQuality: avg('signalQuality'),
      errorRate: avg('errorRate'),
      successRate: avg('successRate'),
      packetLossRate: avg('packetLossRate'),
    };
  }

  /** Returns overall trend based on success-rate delta over last 20 samples. */
  getTrend(): 'IMPROVING' | 'STABLE' | 'DEGRADING' {
    const recent = this.metricsHistory.slice(-10);
    const older = this.metricsHistory.slice(-20, -10);
    if (recent.length === 0 || older.length === 0) return 'STABLE';

    const avgSuccess = (arr: EnvironmentSnapshot[]) =>
      arr.reduce((s, m) => s + m.successRate, 0) / arr.length;

    const delta = avgSuccess(recent) - avgSuccess(older);
    if (delta > 0.05) return 'IMPROVING';
    if (delta < -0.05) return 'DEGRADING';
    return 'STABLE';
  }

  getHistory(): EnvironmentSnapshot[] { return [...this.metricsHistory]; }

  private defaultMetrics(): EnvironmentSnapshot {
    return {
      timestamp: Date.now(),
      fps: 60,
      thermalState: 'NORMAL',
      thermalTemp: 35,
      batteryLevel: 100,
      batteryHealth: 'GOOD',
      lighting: 'NORMAL',
      lightingLux: 500,
      signalQuality: 100,
      errorRate: 0,
      successRate: 1,
      packetLossRate: 0,
    };
  }
}
