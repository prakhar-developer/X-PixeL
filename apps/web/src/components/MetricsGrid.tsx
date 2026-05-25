'use client';

import { TransferMetrics, AdaptiveState } from '@/lib/simulation';
import styles from './MetricsGrid.module.css';

interface Props {
  metrics: TransferMetrics;
  adaptive: AdaptiveState;
}

const MODE_COLORS = {
  QR: 'var(--primary)',
  RGB: 'var(--secondary)',
  FLICKER: 'var(--warning)',
  HYBRID: 'var(--accent)',
};

function MetricCard({
  label, value, unit, color, sublabel, progress,
}: {
  label: string; value: string | number; unit?: string;
  color?: string; sublabel?: string; progress?: number;
}) {
  return (
    <div className={styles.card}>
      <div className={styles.label}>{label}</div>
      <div className={styles.valueRow}>
        <span className={styles.value} style={{ color: color || 'var(--text-primary)' }}>
          {value}
        </span>
        {unit && <span className={styles.unit}>{unit}</span>}
      </div>
      {sublabel && <div className={styles.sublabel}>{sublabel}</div>}
      {progress !== undefined && (
        <div className="progress-bar" style={{ marginTop: 8 }}>
          <div
            className="progress-bar-fill"
            style={{
              width: `${progress * 100}%`,
              background: `linear-gradient(90deg, ${color || 'var(--primary)'}, transparent)`,
            }}
          />
        </div>
      )}
    </div>
  );
}

export function MetricsGrid({ metrics, adaptive }: Props) {
  const thermalColor =
    metrics.thermalState === 'CRITICAL'
      ? 'var(--danger)'
      : metrics.thermalState === 'ELEVATED'
      ? 'var(--warning)'
      : 'var(--accent)';

  const signalColor =
    metrics.signalQuality > 80
      ? 'var(--accent)'
      : metrics.signalQuality > 50
      ? 'var(--warning)'
      : 'var(--danger)';

  const trendIcon = { IMPROVING: '↑', STABLE: '→', DEGRADING: '↓' }[adaptive.trend];

  return (
    <div className={styles.grid}>
      <MetricCard
        label="Frame Rate"
        value={metrics.fps.toFixed(0)}
        unit="FPS"
        color="var(--primary)"
        sublabel="Adaptive target"
        progress={metrics.fps / 120}
      />
      <MetricCard
        label="Thermal"
        value={metrics.thermalTemp.toFixed(1)}
        unit="°C"
        color={thermalColor}
        sublabel={metrics.thermalState}
        progress={metrics.thermalTemp / 80}
      />
      <MetricCard
        label="Battery"
        value={metrics.batteryLevel.toFixed(0)}
        unit="%"
        color={metrics.batteryLevel > 30 ? 'var(--accent)' : 'var(--danger)'}
        sublabel={metrics.batteryLevel > 30 ? 'Healthy' : 'Low power mode'}
        progress={metrics.batteryLevel / 100}
      />
      <MetricCard
        label="Throughput"
        value={metrics.throughputKbps > 999
          ? (metrics.throughputKbps / 1000).toFixed(1)
          : metrics.throughputKbps.toFixed(0)
        }
        unit={metrics.throughputKbps > 999 ? 'MB/s' : 'KB/s'}
        color="var(--primary)"
        sublabel={`${adaptive.currentMode} mode`}
        progress={Math.min(1, metrics.throughputKbps / 6000)}
      />
      <MetricCard
        label="Signal Quality"
        value={metrics.signalQuality}
        unit="%"
        color={signalColor}
        sublabel={`Error rate ${(metrics.errorRate * 100).toFixed(1)}%`}
        progress={metrics.signalQuality / 100}
      />
      <MetricCard
        label="Success Rate"
        value={(metrics.successRate * 100).toFixed(1)}
        unit="%"
        color={metrics.successRate > 0.95 ? 'var(--accent)' : 'var(--warning)'}
        sublabel={`Trend ${trendIcon}`}
        progress={metrics.successRate}
      />
      <MetricCard
        label="FEC Code Rate"
        value={`${adaptive.fecK}/${adaptive.fecN}`}
        color="var(--secondary)"
        sublabel={`${Math.floor((adaptive.fecN - adaptive.fecK) / 2)} errors correctable`}
        progress={adaptive.fecK / adaptive.fecN}
      />
      <MetricCard
        label="Mode Confidence"
        value={(adaptive.confidence * 100).toFixed(0)}
        unit="%"
        color={MODE_COLORS[adaptive.currentMode]}
        sublabel={`Trend: ${adaptive.trend}`}
        progress={adaptive.confidence}
      />
    </div>
  );
}
