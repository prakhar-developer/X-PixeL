'use client';

import { PacketState } from '@/lib/simulation';
import styles from './PacketFlow.module.css';

interface Props {
  packets: PacketState[];
  windowBase: number;
  packetsAcked: number;
  packetsTotal: number;
}

const STATUS_COLORS: Record<PacketState['status'], string> = {
  PENDING: 'var(--border)',
  SENT: 'var(--primary)',
  ACKNOWLEDGED: 'var(--accent)',
  LOST: 'var(--danger)',
};

const STATUS_LABEL: Record<PacketState['status'], string> = {
  PENDING: 'PENDING',
  SENT: 'IN FLIGHT',
  ACKNOWLEDGED: 'ACK',
  LOST: 'LOST',
};

export function PacketFlow({ packets, windowBase, packetsAcked, packetsTotal }: Props) {

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div className={styles.title}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
          </svg>
          Sliding Window ARQ
        </div>
        <div className={styles.stats}>
          <span className={styles.stat}>
            <span className={styles.statDot} style={{ background: 'var(--accent)' }}/>
            {packetsAcked} ACK'd
          </span>
          <span className={styles.stat}>
            <span className={styles.statDot} style={{ background: 'var(--primary)' }}/>
            {packetsTotal - packetsAcked} remaining
          </span>
        </div>
      </div>

      {/* Packet grid */}
      <div className={styles.grid}>
        {packets.map((pkt) => (
          <div
            key={pkt.id}
            className={`${styles.packet} ${styles[pkt.status.toLowerCase()]}`}
            title={`Packet #${pkt.id} — ${STATUS_LABEL[pkt.status]}${pkt.retransmits > 0 ? ` (${pkt.retransmits} retx)` : ''}`}
            style={{
              '--pkt-color': STATUS_COLORS[pkt.status],
              animationDelay: `${(pkt.id % 8) * 50}ms`,
            } as React.CSSProperties}
          >
            <span className={styles.packetId}>{pkt.id % 100}</span>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className={styles.legend}>
        {Object.entries(STATUS_LABEL).map(([status, label]) => (
          <div key={status} className={styles.legendItem}>
            <span
              className={styles.legendDot}
              style={{ background: STATUS_COLORS[status as PacketState['status']] }}
            />
            <span className={styles.legendLabel}>{label}</span>
          </div>
        ))}
      </div>

      {/* Protocol info */}
      <div className={styles.protocolInfo}>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>Protocol</span>
          <span className={styles.infoValue}>Selective Repeat ARQ</span>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>Window Size</span>
          <span className={styles.infoValue}>32 packets</span>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>Base Ptr</span>
          <span className={styles.infoValue} style={{ color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>
            #{windowBase}
          </span>
        </div>
      </div>
    </div>
  );
}
