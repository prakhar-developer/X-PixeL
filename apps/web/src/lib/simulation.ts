/**
 * X-Pixel Web — Transfer Simulation Engine
 * Browser-safe simulation of the Phase 1–4 optical transmission logic.
 */

export type TransmissionMode = 'QR' | 'RGB' | 'FLICKER' | 'HYBRID';
export type SessionState = 'IDLE' | 'HANDSHAKE' | 'READY' | 'TRANSFERRING' | 'PAUSED' | 'COMPLETED' | 'FAILED';
export type ThermalState = 'NORMAL' | 'ELEVATED' | 'CRITICAL';

export interface PacketState {
  id: number;
  status: 'PENDING' | 'SENT' | 'ACKNOWLEDGED' | 'LOST';
  retransmits: number;
}

export interface TransferMetrics {
  fps: number;
  thermalState: ThermalState;
  thermalTemp: number;
  batteryLevel: number;
  signalQuality: number;
  errorRate: number;
  successRate: number;
  packetLossRate: number;
  throughputKbps: number;
  latencyMs: number;
}

export interface AdaptiveState {
  currentMode: TransmissionMode;
  pendingMode: TransmissionMode | null;
  fecN: number;
  fecK: number;
  frameRate: number;
  payloadSize: number;
  confidence: number;
  trend: 'IMPROVING' | 'STABLE' | 'DEGRADING';
}

export interface SimulationState {
  sessionState: SessionState;
  sessionId: string;
  fileSize: number;      // bytes
  bytesTransferred: number;
  packetsTotal: number;
  packetsAcked: number;
  packetsLost: number;
  progress: number;      // 0-1
  elapsedMs: number;
  metrics: TransferMetrics;
  adaptive: AdaptiveState;
  windowPackets: PacketState[];
  transferLog: string[];
  isRunning: boolean;
}

function selectMode(metrics: TransferMetrics): TransmissionMode {
  if (metrics.fps >= 60 && metrics.batteryLevel >= 40 && metrics.thermalState !== 'CRITICAL') {
    return 'FLICKER';
  }
  if (metrics.fps >= 45 && metrics.batteryLevel >= 25) return 'HYBRID';
  if (metrics.fps >= 30 && metrics.batteryLevel >= 20) return 'RGB';
  return 'QR';
}

function getFECConfig(successRate: number): { n: number; k: number } {
  if (successRate > 0.99) return { n: 250, k: 225 };
  if (successRate > 0.95) return { n: 250, k: 212 };
  if (successRate > 0.90) return { n: 250, k: 187 };
  if (successRate > 0.80) return { n: 250, k: 162 };
  return { n: 250, k: 125 };
}

function throughputForMode(mode: TransmissionMode, fps: number): number {
  const kbPerFrame: Record<TransmissionMode, number> = {
    QR: 10, RGB: 50, HYBRID: 75, FLICKER: 100,
  };
  return kbPerFrame[mode] * fps;
}

export function createSimulation(fileSizeBytes = 10_000_000): SimulationState {
  const packetSize = 2048;
  const packetsTotal = Math.ceil(fileSizeBytes / packetSize);
  const fec = getFECConfig(1.0);

  return {
    sessionState: 'IDLE',
    sessionId: `sess_${Date.now().toString(36)}`,
    fileSize: fileSizeBytes,
    bytesTransferred: 0,
    packetsTotal,
    packetsAcked: 0,
    packetsLost: 0,
    progress: 0,
    elapsedMs: 0,
    isRunning: false,
    metrics: {
      fps: 60,
      thermalState: 'NORMAL',
      thermalTemp: 35,
      batteryLevel: 85,
      signalQuality: 95,
      errorRate: 0.02,
      successRate: 0.98,
      packetLossRate: 0.02,
      throughputKbps: 0,
      latencyMs: 33,
    },
    adaptive: {
      currentMode: 'QR',
      pendingMode: null,
      fecN: fec.n,
      fecK: fec.k,
      frameRate: 60,
      payloadSize: 4096,
      confidence: 0.9,
      trend: 'STABLE',
    },
    windowPackets: Array.from({ length: 32 }, (_, i) => ({
      id: i,
      status: 'PENDING' as const,
      retransmits: 0,
    })),
    transferLog: ['[INIT] Simulation created'],
  };
}

export function stepSimulation(state: SimulationState, deltaMs: number): SimulationState {
  if (!state.isRunning) return state;

  const s = { ...state };
  s.elapsedMs += deltaMs;

  // State machine transitions
  if (s.sessionState === 'IDLE') {
    s.sessionState = 'HANDSHAKE';
    s.transferLog = [...s.transferLog, `[HANDSHAKE] Initiating 3-way optical sync...`];
    return s;
  }

  if (s.sessionState === 'HANDSHAKE') {
    if (s.elapsedMs > 800) {
      s.sessionState = 'READY';
      s.transferLog = [...s.transferLog, '[HANDSHAKE] ✓ Sync confirmed — capabilities negotiated'];
    }
    return s;
  }

  if (s.sessionState === 'READY') {
    s.sessionState = 'TRANSFERRING';
    s.transferLog = [...s.transferLog, '[TRANSFER] Starting optical data transmission...'];
    return s;
  }

  if (s.sessionState === 'TRANSFERRING') {
    // Drift metrics over time for realism
    const noise = (Math.random() - 0.5) * 0.04;
    const m = { ...s.metrics };
    m.successRate = Math.max(0.7, Math.min(0.99, m.successRate + noise));
    m.errorRate = 1 - m.successRate;
    m.packetLossRate = m.errorRate * 0.5;
    m.batteryLevel = Math.max(5, m.batteryLevel - (deltaMs / 60000));
    m.thermalTemp = Math.min(65, 35 + (s.elapsedMs / 10000));
    m.thermalState = m.thermalTemp > 55 ? 'CRITICAL' : m.thermalTemp > 45 ? 'ELEVATED' : 'NORMAL';
    m.fps = Math.max(30, 60 - (m.thermalState === 'CRITICAL' ? 15 : 0));
    m.signalQuality = Math.round(m.successRate * 100);

    // Adaptive mode selection
    const selectedMode = selectMode(m);
    m.throughputKbps = throughputForMode(selectedMode, m.fps);
    m.latencyMs = Math.round(1000 / m.fps);

    const fec = getFECConfig(m.successRate);
    const trend = noise > 0.01 ? 'IMPROVING' : noise < -0.01 ? 'DEGRADING' : 'STABLE';

    const a: AdaptiveState = {
      currentMode: selectedMode,
      pendingMode: selectedMode !== s.adaptive.currentMode ? selectedMode : null,
      fecN: fec.n,
      fecK: fec.k,
      frameRate: m.fps,
      payloadSize: Math.floor((m.throughputKbps * 1000) / m.fps),
      confidence: m.successRate,
      trend,
    };

    // Packet transfer
    const batchBytes = Math.floor((m.throughputKbps * 1000 * deltaMs) / 1000);
    const newBytesTransferred = Math.min(s.fileSize, s.bytesTransferred + batchBytes);
    const packetsDone = Math.floor(newBytesTransferred / (s.fileSize / s.packetsTotal));
    const newAcked = Math.min(s.packetsTotal, Math.floor(packetsDone * m.successRate));
    const newLost = Math.min(s.packetsTotal - newAcked, Math.floor(packetsDone * m.packetLossRate));

    // Slide window packets display
    const windowPackets = Array.from({ length: 32 }, (_, i) => {
      const globalId = Math.max(0, newAcked - 16) + i;
      let status: PacketState['status'] = 'PENDING';
      if (globalId < newAcked) status = 'ACKNOWLEDGED';
      else if (globalId < newAcked + 8) status = 'SENT';
      if (Math.random() < m.packetLossRate * 0.3 && status === 'SENT') status = 'LOST';
      return { id: globalId, status, retransmits: status === 'LOST' ? 1 : 0 };
    });

    // Log occasional events
    const logs = [...s.transferLog];
    if (selectedMode !== s.adaptive.currentMode) {
      logs.push(`[ADAPT] Mode switch: ${s.adaptive.currentMode} → ${selectedMode}`);
    }
    if (m.thermalState === 'ELEVATED' && s.metrics.thermalState === 'NORMAL') {
      logs.push(`[THERMAL] Elevated temp detected — reducing frame rate`);
    }
    if (logs.length > 50) logs.splice(0, logs.length - 50);

    const progress = newBytesTransferred / s.fileSize;
    const isComplete = progress >= 1;

    return {
      ...s,
      metrics: m,
      adaptive: a,
      bytesTransferred: newBytesTransferred,
      packetsAcked: newAcked,
      packetsLost: newLost,
      progress,
      windowPackets,
      transferLog: isComplete
        ? [...logs, '[COMPLETE] ✓ File transfer successful — integrity verified']
        : logs,
      sessionState: isComplete ? 'COMPLETED' : 'TRANSFERRING',
    };
  }

  return s;
}
