'use client';

import { useTransferSimulation } from '@/hooks/useTransferSimulation';
import { OpticalWave } from '@/components/OpticalWave';
import { MetricsGrid } from '@/components/MetricsGrid';
import { PacketFlow } from '@/components/PacketFlow';
import { SessionStateDisplay } from '@/components/SessionStateDisplay';
import styles from './page.module.css';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function DashboardPage() {
  const { state, start, pause, reset } = useTransferSimulation(10_000_000);
  const { metrics, adaptive, windowPackets, sessionState, transferLog } = state;

  const isRunning = state.isRunning;
  const isComplete = sessionState === 'COMPLETED';

  return (
    <div className={styles.page}>
      {/* ─── Header ──────────────────────────────────────────────────────────── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerTitle}>
            <h1 className={styles.title}>Mission Control</h1>
            <p className={styles.subtitle}>X-Pixel Optical Communication Platform · Live Simulation</p>
          </div>
        </div>

        <div className={styles.headerRight}>
          {/* Mode indicator */}
          <div className={styles.modeIndicator}>
            <div className={styles.modeIcon}
              style={{ background: { QR: 'var(--primary-glow)', RGB: 'var(--secondary-glow)', FLICKER: 'rgba(245,158,11,0.2)', HYBRID: 'var(--accent-glow)' }[adaptive.currentMode] }}>
              {adaptive.currentMode}
            </div>
            <div>
              <div className={styles.modeLabel}>Active Mode</div>
              <div className={styles.modeConf}>{(adaptive.confidence * 100).toFixed(0)}% confidence</div>
            </div>
          </div>

          {/* Controls */}
          <div className={styles.controls}>
            {!isRunning && !isComplete && (
              <button className="btn btn-primary" onClick={start} id="dashboard-start-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                Start Transfer
              </button>
            )}
            {isRunning && (
              <button className="btn btn-ghost" onClick={pause} id="dashboard-pause-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                Pause
              </button>
            )}
            {(sessionState === 'PAUSED' || isComplete) && (
              <>
                {!isComplete && (
                  <button className="btn btn-primary" onClick={start} id="dashboard-resume-btn">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    Resume
                  </button>
                )}
                <button className="btn btn-ghost" onClick={reset} id="dashboard-reset-btn">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                  Reset
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ─── Progress Bar ─────────────────────────────────────────────────────── */}
      <div className={styles.progressSection}>
        <div className={styles.progressHeader}>
          <div className={styles.progressInfo}>
            <span className={styles.progressLabel}>Transfer Progress</span>
            <span className={styles.progressBytes}>
              {formatBytes(state.bytesTransferred)} / {formatBytes(state.fileSize)}
            </span>
          </div>
          <div className={styles.progressPct}
            style={{ color: isComplete ? 'var(--accent)' : 'var(--primary)' }}>
            {(state.progress * 100).toFixed(1)}%
          </div>
        </div>
        <div className={styles.bigProgressBar}>
          <div
            className={styles.bigProgressFill}
            style={{
              width: `${state.progress * 100}%`,
              background: isComplete
                ? 'linear-gradient(90deg, var(--accent), #10b981)'
                : 'linear-gradient(90deg, var(--primary), var(--secondary))',
            }}
          />
        </div>
        <div className={styles.progressStats}>
          <span>Packets: {state.packetsAcked} / {state.packetsTotal} ACK'd</span>
          <span>Lost: {state.packetsLost}</span>
          <span>Elapsed: {state.elapsedMs > 0 ? `${(state.elapsedMs / 1000).toFixed(1)}s` : '—'}</span>
          <span>ETA: {state.isRunning && metrics.throughputKbps > 0
            ? `${(((state.fileSize - state.bytesTransferred) / 1024) / metrics.throughputKbps).toFixed(1)}s`
            : '—'}
          </span>
        </div>
      </div>

      {/* ─── Optical Wave ─────────────────────────────────────────────────────── */}
      <div className={styles.waveSection}>
        <OpticalWave
          isActive={isRunning}
          mode={adaptive.currentMode}
          progress={state.progress}
        />
      </div>

      {/* ─── Metrics Grid ─────────────────────────────────────────────────────── */}
      <div className={styles.metricsSection}>
        <div className={styles.sectionLabel}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          Real-time Telemetry
        </div>
        <MetricsGrid metrics={metrics} adaptive={adaptive} />
      </div>

      {/* ─── Bottom Row ───────────────────────────────────────────────────────── */}
      <div className={styles.bottomRow}>
        {/* Session State */}
        <div className={styles.bottomLeft}>
          <div className={styles.sectionLabel}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            Session State Machine
          </div>
          <SessionStateDisplay
            sessionState={sessionState}
            sessionId={state.sessionId}
            elapsedMs={state.elapsedMs}
            progress={state.progress}
          />
        </div>

        {/* Transfer Log */}
        <div className={styles.bottomRight}>
          <div className={styles.sectionLabel}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            Transmission Log
          </div>
          <div className={styles.logPanel}>
            {transferLog.length === 0 ? (
              <div className={styles.logEmpty}>No events yet — start a transfer</div>
            ) : (
              [...transferLog].reverse().map((entry, i) => (
                <div key={i} className={styles.logEntry}>
                  <span className={styles.logTime} style={{ fontFamily: 'var(--font-mono)' }}>
                    {String(transferLog.length - i).padStart(3, '0')}
                  </span>
                  <span className={styles.logMsg}
                    style={{ color: entry.includes('✓') ? 'var(--accent)' : entry.includes('ERROR') || entry.includes('THERMAL') ? 'var(--warning)' : 'var(--text-secondary)' }}>
                    {entry}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ─── Packet Flow ──────────────────────────────────────────────────────── */}
      <div className={styles.packetSection}>
        <div className={styles.sectionLabel}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          Sliding Window Packet Flow
        </div>
        <PacketFlow
          packets={windowPackets}
          windowBase={state.packetsAcked}
          packetsAcked={state.packetsAcked}
          packetsTotal={state.packetsTotal}
        />
      </div>

      {/* ─── Adaptive Engine Recommendations ─────────────────────────────────── */}
      <div className={styles.adaptiveSection}>
        <div className={styles.sectionLabel}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>
          Adaptive Engine Recommendations
        </div>
        <div className={styles.adaptiveGrid}>
          {[
            { label: 'Optimal Mode', value: adaptive.currentMode, color: 'var(--primary)', mono: true },
            { label: 'Frame Rate', value: `${adaptive.frameRate} FPS`, color: 'var(--text-primary)' },
            { label: 'Payload Size', value: `${(adaptive.payloadSize / 1024).toFixed(1)} KB`, color: 'var(--text-primary)' },
            { label: 'FEC Strength', value: `RS(${adaptive.fecN}, ${adaptive.fecK})`, color: 'var(--secondary)', mono: true },
            { label: 'Trend', value: adaptive.trend, color: { IMPROVING: 'var(--accent)', STABLE: 'var(--text-secondary)', DEGRADING: 'var(--danger)' }[adaptive.trend] },
            { label: 'Pending Switch', value: adaptive.pendingMode || 'None', color: adaptive.pendingMode ? 'var(--warning)' : 'var(--text-muted)', mono: !!adaptive.pendingMode },
          ].map((item) => (
            <div key={item.label} className={styles.adaptiveCard}>
              <div className={styles.adaptiveLabel}>{item.label}</div>
              <div className={styles.adaptiveValue}
                style={{ color: item.color, fontFamily: item.mono ? 'var(--font-mono)' : 'var(--font)' }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
