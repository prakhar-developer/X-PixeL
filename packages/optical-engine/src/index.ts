/**
 * X-Pixel Optical Engine — Public API
 */

// GPU & Frame
export { GPUFrameGenerator } from './gpu/frame-generator';
export type { GPUFrameConfig, FrameBuffer, RenderingConfig } from './gpu/frame-generator';

// Camera
export { CameraPipeline } from './camera/pipeline';
export type { CameraFrame, CameraConfig } from './camera/pipeline';

// Vision
export { PerspectiveCorrection } from './vision/perspective';
export type { Point2D, Homography3x3 } from './vision/perspective';

export { MotionStabilization } from './vision/stabilization';
export type { MotionVector } from './vision/stabilization';

// Adaptive
export { EnvironmentMonitor } from './adaptive/monitor';
export type { EnvironmentSnapshot } from './adaptive/monitor';

export { ModeSelector, TransmissionMode, MODE_CHARACTERISTICS } from './adaptive/mode-selector';
export type { ModeCharacteristics, ModeSelectionRequest } from './adaptive/mode-selector';

export { AdaptiveFECController } from './adaptive/fec-controller';
export type { FECConfig } from './adaptive/fec-controller';

export { AdaptiveBitrateController } from './adaptive/bitrate-controller';
export type { BitrateSettings } from './adaptive/bitrate-controller';

export { AdaptiveOpticalEngine } from './adaptive/engine';
export type { AdaptiveEngineConfig, AdaptiveEngineState } from './adaptive/engine';
