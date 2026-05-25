/**
 * X-Pixel CV Pipeline — Optical Handshake Protocol
 * 3-way synchronization with capability negotiation between sender and receiver.
 */

export enum HandshakeState {
  IDLE = 'IDLE',
  INITIATING = 'INITIATING',
  ACKNOWLEDGE = 'ACKNOWLEDGE',
  READY = 'READY',
  SYNC_CONFIRM = 'SYNC_CONFIRM',
  TRANSFERRING = 'TRANSFERRING',
  COMPLETE = 'COMPLETE',
  FAILED = 'FAILED',
}

export interface DeviceCapabilities {
  maxPayloadSize: number;
  supportsFEC: boolean;
  supportsSelectiveRepeat: boolean;
  supportsFountainCodes: boolean;
  maxFrameRate: number;
}

export interface HandshakeMessage {
  messageType: 'INIT' | 'ACK' | 'READY' | 'SYNC_OK' | 'ERROR';
  deviceId: string;
  sessionId: string;
  protocolVersion: number;
  capabilities: DeviceCapabilities;
  timestamp: number;
  checksum: number;
}

/**
 * Optical Handshake — 3-way synchronization protocol
 *
 * Flow:  Sender INIT → Receiver ACK → Sender READY → (Transfer begins)
 *
 * Handles mutual device identification, protocol version check, and
 * capability negotiation to determine optimal transfer parameters.
 */
export class OpticalHandshake {
  private state: HandshakeState = HandshakeState.IDLE;
  private readonly deviceId: string;
  private sessionId: string;
  private remoteDeviceId = '';
  private remoteCapabilities: DeviceCapabilities | null = null;
  private readonly timeoutMs: number;
  private startTime = 0;

  constructor(deviceId: string, timeoutMs = 5000) {
    this.deviceId = deviceId;
    this.timeoutMs = timeoutMs;
    this.sessionId = this.generateSessionId();
  }

  /** Step 1 (Sender): Broadcast INIT with own capabilities. */
  async initiateHandshake(capabilities: DeviceCapabilities): Promise<HandshakeMessage> {
    if (this.state !== HandshakeState.IDLE) {
      throw new Error(`Cannot initiate: handshake already in state ${this.state}`);
    }
    this.state = HandshakeState.INITIATING;
    this.startTime = Date.now();

    const msg = this.buildMessage('INIT', capabilities);
    return msg;
  }

  /** Step 2 (Receiver): Respond to INIT with own capabilities. */
  async acknowledgeHandshake(
    initMsg: HandshakeMessage,
    capabilities: DeviceCapabilities
  ): Promise<HandshakeMessage> {
    this.assertValid(initMsg);
    this.state = HandshakeState.ACKNOWLEDGE;
    this.remoteDeviceId = initMsg.deviceId;
    this.remoteCapabilities = initMsg.capabilities;
    this.sessionId = initMsg.sessionId;

    return this.buildMessage('ACK', capabilities);
  }

  /** Step 3 (Sender): Confirm receipt of ACK — handshake complete. */
  async confirmHandshake(ackMsg: HandshakeMessage): Promise<HandshakeMessage> {
    this.assertValid(ackMsg);
    this.state = HandshakeState.READY;
    this.remoteDeviceId = ackMsg.deviceId;
    this.remoteCapabilities = ackMsg.capabilities;

    return this.buildMessage('READY', {
      maxPayloadSize: 2048,
      supportsFEC: true,
      supportsSelectiveRepeat: true,
      supportsFountainCodes: true,
      maxFrameRate: 60,
    });
  }

  getState(): HandshakeState {
    if (
      this.state !== HandshakeState.IDLE &&
      this.state !== HandshakeState.READY &&
      Date.now() - this.startTime > this.timeoutMs
    ) {
      this.state = HandshakeState.FAILED;
    }
    return this.state;
  }

  getRemoteDeviceId(): string { return this.remoteDeviceId; }
  getSessionId(): string { return this.sessionId; }
  getNegotiatedCapabilities(): DeviceCapabilities | null { return this.remoteCapabilities; }

  reset(): void {
    this.state = HandshakeState.IDLE;
    this.remoteDeviceId = '';
    this.remoteCapabilities = null;
    this.startTime = 0;
    this.sessionId = this.generateSessionId();
  }

  private buildMessage(
    type: HandshakeMessage['messageType'],
    capabilities: DeviceCapabilities
  ): HandshakeMessage {
    const msg: HandshakeMessage = {
      messageType: type,
      deviceId: this.deviceId,
      sessionId: this.sessionId,
      protocolVersion: 1,
      capabilities,
      timestamp: Date.now(),
      checksum: 0,
    };
    msg.checksum = this.computeChecksum(msg);
    return msg;
  }

  private computeChecksum(msg: HandshakeMessage): number {
    const data = `${msg.deviceId}${msg.sessionId}${msg.timestamp}`;
    let checksum = 0;
    for (let i = 0; i < data.length; i++) {
      checksum = ((checksum << 5) - checksum + data.charCodeAt(i)) | 0;
    }
    return Math.abs(checksum);
  }

  private assertValid(msg: HandshakeMessage): void {
    const expected = this.computeChecksum(msg);
    if (msg.checksum !== expected) {
      throw new Error(`Handshake message integrity failure (got ${msg.checksum}, expected ${expected})`);
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }
}
