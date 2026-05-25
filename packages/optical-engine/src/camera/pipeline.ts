/**
 * X-Pixel Optical Engine — Camera Pipeline
 * Platform abstraction for AVFoundation (iOS) and Camera2 (Android).
 */

export interface CameraFrame {
  data: Uint8Array;
  format: 'YUV420' | 'RGBA' | 'NV21';
  width: number;
  height: number;
  timestamp: number;
  exposure: number;
  iso: number;
  colorTemperature: number;
  frameId: number;
  /** Capture quality confidence [0-1] */
  quality: number;
}

export interface CameraConfig {
  targetFPS: number;
  resolution: { width: number; height: number };
  autoFocus: boolean;
  autoExposure: boolean;
  autoWhiteBalance: boolean;
  preferredFormat: 'YUV420' | 'RGBA' | 'NV21';
}

/**
 * Camera Pipeline Manager
 * Ring-buffer capture queue with YUV↔RGBA color-space conversion.
 */
export class CameraPipeline {
  private readonly config: CameraConfig;
  private frameBuffer: CameraFrame[] = [];
  private readonly maxBufferSize = 10;
  private currentFPS = 30;
  private frameCount = 0;
  private lastFPSCalc = Date.now();

  constructor(config: Partial<CameraConfig> = {}) {
    this.config = {
      targetFPS: 30,
      resolution: { width: 1920, height: 1080 },
      autoFocus: true,
      autoExposure: true,
      autoWhiteBalance: true,
      preferredFormat: 'RGBA',
      ...config,
    };
  }

  /**
   * Initialize camera capture session.
   * iOS: AVCaptureSession + AVCaptureVideoDataOutput
   * Android: CameraDevice + CameraCaptureSession
   */
  async initialize(): Promise<boolean> {
    return true; // Native layer bootstraps in production
  }

  /** Dequeue the oldest frame from the capture ring buffer. */
  captureFrame(): CameraFrame | null {
    if (this.frameBuffer.length === 0) return null;

    const frame = this.frameBuffer.shift();
    this.frameCount++;

    const now = Date.now();
    const elapsed = now - this.lastFPSCalc;
    if (elapsed >= 1000) {
      this.currentFPS = Math.round((this.frameCount * 1000) / elapsed);
      this.frameCount = 0;
      this.lastFPSCalc = now;
    }

    return frame ?? null;
  }

  /**
   * Enqueue a frame from the native capture callback.
   * Drops oldest frame when buffer is full (ring buffer semantics).
   */
  queueFrame(frame: CameraFrame): void {
    if (this.frameBuffer.length >= this.maxBufferSize) {
      this.frameBuffer.shift(); // Drop oldest
    }
    this.frameBuffer.push(frame);
  }

  /**
   * Convert YUV420 planar to RGBA.
   * Used to normalize camera output to a single format for the CV pipeline.
   */
  static yuv420ToRGBA(
    yData: Uint8Array,
    uData: Uint8Array,
    vData: Uint8Array,
    width: number,
    height: number
  ): Uint8Array {
    const rgba = new Uint8Array(width * height * 4);

    for (let row = 0; row < height; row++) {
      for (let col = 0; col < width; col++) {
        const yIdx = row * width + col;
        const uvIdx = Math.floor(row / 2) * Math.floor(width / 2) + Math.floor(col / 2);

        const c = yData[yIdx] - 16;
        const d = uData[uvIdx] - 128;
        const e = vData[uvIdx] - 128;

        const r = Math.max(0, Math.min(255, (298 * c + 409 * e + 128) >> 8));
        const g = Math.max(0, Math.min(255, (298 * c - 100 * d - 208 * e + 128) >> 8));
        const b = Math.max(0, Math.min(255, (298 * c + 516 * d + 128) >> 8));

        const rgbaIdx = (row * width + col) * 4;
        rgba[rgbaIdx] = r;
        rgba[rgbaIdx + 1] = g;
        rgba[rgbaIdx + 2] = b;
        rgba[rgbaIdx + 3] = 255;
      }
    }
    return rgba;
  }

  getCurrentFPS(): number { return this.currentFPS; }
  getConfig(): Readonly<CameraConfig> { return this.config; }
  getBufferUsage(): { used: number; total: number } {
    return { used: this.frameBuffer.length, total: this.maxBufferSize };
  }

  dispose(): void {
    this.frameBuffer = [];
  }
}
