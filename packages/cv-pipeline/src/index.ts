/**
 * X-Pixel CV Pipeline — Public API
 */

// Sync / Handshake
export { OpticalHandshake, HandshakeState } from './sync/handshake';
export type { HandshakeMessage, DeviceCapabilities } from './sync/handshake';

// FEC
export { ReedSolomonFEC } from './fec/reed-solomon';
export { FountainCode } from './fec/fountain';
export type { EncodedSymbol } from './fec/fountain';

// Protocol
export { SelectiveRepeatProtocol, PacketStatus } from './protocol/selective-repeat';
export type { SRPacket } from './protocol/selective-repeat';

export { SessionManager, SessionState } from './protocol/session';
export type { SessionInfo } from './protocol/session';

// Decode
export { DecodePipeline } from './decode/pipeline';
export type { DecodeResult } from './decode/pipeline';
