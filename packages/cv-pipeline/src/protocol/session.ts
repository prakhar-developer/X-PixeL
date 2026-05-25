/**
 * X-Pixel CV Pipeline — Session Manager
 * Full lifecycle state machine for an optical file transfer session.
 */

import { OpticalHandshake, HandshakeState, DeviceCapabilities } from '../sync/handshake';
import { SelectiveRepeatProtocol } from './selective-repeat';
import { ReedSolomonFEC } from '../fec/reed-solomon';

export enum SessionState {
  IDLE = 'IDLE',
  HANDSHAKE = 'HANDSHAKE',
  READY = 'READY',
  TRANSFERRING = 'TRANSFERRING',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  ABORTED = 'ABORTED',
}

export interface SessionInfo {
  sessionId: string;
  state: SessionState;
  startTime: number;
  endTime: number;
  sender: string;
  receiver: string;
  fileSize: number;
  bytesTransferred: number;
  packetsTotal: number;
  packetsAcknowledged: number;
  errorCount: number;
  successRate: number;
  durationMs: number;
  throughputKbps: number;
}

/**
 * Session Manager — state machine governing the complete transfer lifecycle.
 *
 * States: IDLE → HANDSHAKE → READY → TRANSFERRING ↔ PAUSED → COMPLETED
 *                                                           ↘ FAILED / ABORTED
 */
export class SessionManager {
  private state: SessionState = SessionState.IDLE;
  private readonly sessionId: string;
  private readonly handshake: OpticalHandshake;
  private readonly selectiveRepeat: SelectiveRepeatProtocol;
  private readonly fec: ReedSolomonFEC;
  private startTime = 0;
  private endTime = 0;
  private fileSize = 0;
  private bytesTransferred = 0;
  private errorCount = 0;

  constructor(deviceId: string) {
    this.sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    this.handshake = new OpticalHandshake(deviceId);
    this.selectiveRepeat = new SelectiveRepeatProtocol();
    this.fec = new ReedSolomonFEC(200, 50);
  }

  async startSession(): Promise<void> {
    this.assertState(SessionState.IDLE, 'startSession');
    this.state = SessionState.HANDSHAKE;
    this.startTime = Date.now();
  }

  async completeHandshake(): Promise<void> {
    this.assertState(SessionState.HANDSHAKE, 'completeHandshake');
    if (this.handshake.getState() !== HandshakeState.READY) {
      throw new Error('Handshake not in READY state');
    }
    this.state = SessionState.READY;
  }

  async beginTransfer(fileSize: number): Promise<void> {
    this.assertState(SessionState.READY, 'beginTransfer');
    this.fileSize = fileSize;
    this.state = SessionState.TRANSFERRING;
  }

  updateProgress(bytesTransferred: number): void {
    if (this.state !== SessionState.TRANSFERRING) return;
    this.bytesTransferred = bytesTransferred;
    if (this.bytesTransferred >= this.fileSize && this.selectiveRepeat.isComplete()) {
      this.state = SessionState.COMPLETED;
      this.endTime = Date.now();
    }
  }

  pauseSession(): void {
    if (this.state === SessionState.TRANSFERRING) this.state = SessionState.PAUSED;
  }

  resumeSession(): void {
    if (this.state === SessionState.PAUSED) this.state = SessionState.TRANSFERRING;
  }

  abortSession(): void {
    this.state = SessionState.ABORTED;
    this.endTime = Date.now();
  }

  recordError(): void { this.errorCount++; }

  getSessionInfo(): SessionInfo {
    const duration = (this.endTime || Date.now()) - this.startTime;
    return {
      sessionId: this.sessionId,
      state: this.state,
      startTime: this.startTime,
      endTime: this.endTime,
      sender: this.handshake.getRemoteDeviceId(),
      receiver: this.handshake.getRemoteDeviceId(),
      fileSize: this.fileSize,
      bytesTransferred: this.bytesTransferred,
      packetsTotal: this.selectiveRepeat.getWindowStatus().nextSequence,
      packetsAcknowledged: this.selectiveRepeat.getWindowStatus().acked,
      errorCount: this.errorCount,
      successRate: this.fileSize > 0
        ? Math.min(1, this.bytesTransferred / this.fileSize)
        : 0,
      durationMs: duration,
      throughputKbps: duration > 0
        ? Math.round((this.bytesTransferred * 8) / duration)
        : 0,
    };
  }

  getState(): SessionState { return this.state; }
  getSessionId(): string { return this.sessionId; }
  getHandshake(): OpticalHandshake { return this.handshake; }

  private assertState(expected: SessionState, op: string): void {
    if (this.state !== expected) {
      throw new Error(`${op}: expected state ${expected}, got ${this.state}`);
    }
  }
}
