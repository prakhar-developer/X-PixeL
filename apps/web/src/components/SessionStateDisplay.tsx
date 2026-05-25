'use client';

import { SessionState } from '@/lib/simulation';
import styles from './SessionStateDisplay.module.css';

interface Props {
  sessionState: SessionState;
  sessionId: string;
  elapsedMs: number;
  progress: number;
}

const STATES: SessionState[] = [
  'IDLE', 'HANDSHAKE', 'READY', 'TRANSFERRING', 'COMPLETED',
];

const STATE_INFO: Record<string, { label: string; color: string; description: string }> = {
  IDLE: { label: 'Idle', color: 'var(--text-muted)', description: 'Awaiting session start' },
  HANDSHAKE: { label: 'Handshake', color: 'var(--warning)', description: '3-way optical sync' },
  READY: { label: 'Ready', color: 'var(--primary)', description: 'Capabilities negotiated' },
  TRANSFERRING: { label: 'Transferring', color: 'var(--accent)', description: 'Optical data stream active' },
  PAUSED: { label: 'Paused', color: 'var(--warning)', description: 'Transfer suspended' },
  COMPLETED: { label: 'Completed', color: 'var(--accent)', description: 'File integrity verified ✓' },
  FAILED: { label: 'Failed', color: 'var(--danger)', description: 'Session error — retry' },
  ABORTED: { label: 'Aborted', color: 'var(--danger)', description: 'Transfer aborted' },
};

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
}

export function SessionStateDisplay({ sessionState, sessionId, elapsedMs, progress }: Props) {
  const info = STATE_INFO[sessionState] || STATE_INFO['IDLE'];
  const currentIdx = STATES.indexOf(
    sessionState === 'PAUSED' ? 'TRANSFERRING' :
    sessionState === 'FAILED' ? 'COMPLETED' :
    sessionState
  );

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div>
          <div className={styles.title}>Session State Machine</div>
          <div className={styles.sessionId} style={{ fontFamily: 'var(--font-mono)' }}>
            {sessionId}
          </div>
        </div>
        <div className={styles.currentState} style={{ color: info.color, borderColor: `${info.color}40` }}>
          {sessionState === 'TRANSFERRING' && <span className={styles.activeIndicator}/>}
          {info.label}
        </div>
      </div>

      {/* State machine flow */}
      <div className={styles.flow}>
        {STATES.map((state, idx) => {
          const si = STATE_INFO[state];
          const isPast = idx < currentIdx;
          const isCurrent = idx === currentIdx;
          const isFuture = idx > currentIdx;

          return (
            <div key={state} className={styles.stateGroup}>
              <div className={`${styles.stateNode} ${isPast ? styles.past : ''} ${isCurrent ? styles.current : ''} ${isFuture ? styles.future : ''}`}
                style={isCurrent ? { borderColor: si.color, background: `${si.color}15`, color: si.color } : {}}>
                {isPast && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
                {(isCurrent || isFuture) && <span className={styles.stateNum}>{idx + 1}</span>}
              </div>
              <div className={styles.stateInfo}>
                <div className={styles.stateName}
                  style={{ color: isCurrent ? si.color : isPast ? 'var(--text-muted)' : 'var(--text-muted)' }}>
                  {si.label}
                </div>
                {isCurrent && <div className={styles.stateDesc}>{si.description}</div>}
              </div>
              {idx < STATES.length - 1 && (
                <div className={`${styles.connector} ${idx < currentIdx ? styles.connectorActive : ''}`}/>
              )}
            </div>
          );
        })}
      </div>

      {/* Stats row */}
      <div className={styles.statsRow}>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Duration</span>
          <span className={styles.statValue} style={{ fontFamily: 'var(--font-mono)' }}>
            {formatDuration(elapsedMs)}
          </span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Progress</span>
          <span className={styles.statValue} style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>
            {(progress * 100).toFixed(1)}%
          </span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Protocol</span>
          <span className={styles.statValue}>X-Pixel v1.0</span>
        </div>
      </div>
    </div>
  );
}
