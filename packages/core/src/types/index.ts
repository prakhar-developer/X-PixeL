/**
 * X-Pixel Core — Type Definitions
 * All enums, interfaces and shared types for the optical communication protocol.
 */

// ─── Packet Identifiers ───────────────────────────────────────────────────────

export type PacketID = number;
export type FileID = number;
export type SessionID = string;

// ─── Control Packet Types ────────────────────────────────────────────────────

export enum ControlType {
  SYNC_REQUEST = 0,
  ACK = 1,
  NACK = 2,
  MODE_CHANGE = 3,
  TRANSFER_COMPLETE = 4,
  HANDSHAKE_INIT = 5,
  HANDSHAKE_ACK = 6,
  THERMAL_THROTTLE = 7,
  BATTERY_CRITICAL = 8,
}

// ─── Transmission Modes ───────────────────────────────────────────────────────

export enum TransmissionMode {
  /** QR code dynamic generation — most robust, ~10 KB/frame */
  QR_DYNAMIC = 0,
  /** RGB LSB modulation — balanced, ~50 KB/frame */
  RGB_MODULATION = 1,
  /** Invisible flicker modulation — high speed, ~100 KB/frame */
  INVISIBLE_FLICKER = 2,
  /** Rolling shutter exploitation — ultra-high, ~250 KB/frame */
  ROLLING_SHUTTER = 3,
  /** Parallel region multiplexing — maximum throughput */
  PARALLEL_MULTIPLEXING = 4,
}

// ─── Packet Status ────────────────────────────────────────────────────────────

export enum PacketStatus {
  PENDING = 0,
  TRANSMITTED = 1,
  ACKNOWLEDGED = 2,
  LOST = 3,
  RECOVERING = 4,
}

// ─── Core Data Structures ─────────────────────────────────────────────────────

export interface OpticalPacket {
  packetId: PacketID;
  totalPackets: number;
  fileId: FileID;
  payload: Buffer;
  fecData: Buffer;
  timestamp: number;
  isControl: boolean;
  controlType: ControlType;
  crc32: number;
  mode: TransmissionMode;
}

export interface OpticalFrame {
  frameId: number;
  timestamp: number;
  data: Buffer | Uint8Array | Uint8ClampedArray;
  width: number;
  height: number;
  mode: TransmissionMode;
  metadata?: FrameMetadata;
}

export interface FrameMetadata {
  fps: number;
  exposure: number;
  gain: number;
  colorBalance: { r: number; g: number; b: number };
  stabilityScore: number;
}

// ─── Device & Transfer ───────────────────────────────────────────────────────

export interface DeviceCapabilities {
  platform: 'ios' | 'android';
  osVersion: string;
  cameraFps: number[];
  displayRefreshRate: number;
  batteryPercentage: number;
  ambientLightLux: number;
  gpuTier: 'low' | 'medium' | 'high';
  thermalState: 'normal' | 'elevated' | 'critical';
}

export interface TransferStats {
  packetsSent: number;
  packetsReceived: number;
  packetLossRate: number;
  throughputKbps: number;
  latencyMs: number;
  currentMode: TransmissionMode;
}

export interface PacketSystemConfig {
  maxQueueSize: number;
  maxPacketSize: number;
  windowSize: number;
  timeoutMs: number;
  retryCount: number;
}

export interface PacketQueueItem {
  packet: OpticalPacket;
  status: PacketStatus;
  createdAt: number;
  transmissionCount: number;
  lastTransmitTime?: number;
}
