/**
 * X-Pixel Optical Engine — Motion Stabilization
 * Optical flow tracking and temporal filtering for camera jitter correction.
 */

export type MotionVector = { x: number; y: number };

/**
 * Motion Stabilization Engine
 * Block-matching optical flow with temporal Gaussian smoothing.
 * Production: Lucas-Kanade tracker with Kalman filter (Phase 2 Week 3).
 */
export class MotionStabilization {
  private opticalFlow: MotionVector[] = [];
  private readonly temporalBuffer: number[] = [];
  private readonly filterSize: number;

  constructor(filterSize = 5) {
    this.filterSize = filterSize;
  }

  /**
   * Estimate optical flow via block-matching between consecutive frames.
   * Samples a regular grid and finds best-match displacement per block.
   */
  trackOpticalFlow(
    currentFrame: Uint8Array,
    previousFrame: Uint8Array,
    width: number,
    height: number,
    gridSize = 16
  ): MotionVector[] {
    this.opticalFlow = [];

    for (let y = 0; y < height; y += gridSize) {
      for (let x = 0; x < width; x += gridSize) {
        let bestMatch: MotionVector = { x: 0, y: 0 };
        let bestScore = Infinity;

        for (let dy = -8; dy <= 8; dy++) {
          for (let dx = -8; dx <= 8; dx++) {
            const score = this.blockSAD(
              currentFrame, previousFrame,
              x, y, x + dx, y + dy,
              8, width
            );
            if (score < bestScore) {
              bestScore = score;
              bestMatch = { x: dx, y: dy };
            }
          }
        }
        this.opticalFlow.push(bestMatch);
      }
    }
    return this.opticalFlow;
  }

  /**
   * Apply temporal mean filter to smooth a motion vector over recent frames.
   */
  filterMotionVector(vector: MotionVector): MotionVector {
    this.temporalBuffer.push(vector.x);
    if (this.temporalBuffer.length > this.filterSize) {
      this.temporalBuffer.shift();
    }
    const avgX = this.temporalBuffer.reduce((a, b) => a + b, 0) / this.temporalBuffer.length;
    return { x: avgX, y: vector.y };
  }

  /**
   * Get overall frame stability score [0-1].
   * 1.0 = completely stable; 0.0 = extreme motion.
   */
  getStabilityScore(): number {
    if (this.opticalFlow.length === 0) return 1.0;

    const avgX = this.opticalFlow.reduce((a, b) => a + b.x, 0) / this.opticalFlow.length;
    const variance =
      this.opticalFlow.reduce((a, b) => a + Math.pow(b.x - avgX, 2), 0) / this.opticalFlow.length;
    return Math.max(0, 1.0 - Math.sqrt(variance) / 10);
  }

  getLastOpticalFlow(): MotionVector[] { return [...this.opticalFlow]; }

  /** Sum of Absolute Differences for block matching */
  private blockSAD(
    f1: Uint8Array, f2: Uint8Array,
    x1: number, y1: number,
    x2: number, y2: number,
    blockSize: number,
    width: number
  ): number {
    let diff = 0;
    for (let dy = 0; dy < blockSize; dy++) {
      for (let dx = 0; dx < blockSize; dx++) {
        const idx1 = ((y1 + dy) * width + (x1 + dx)) * 4;
        const idx2 = ((y2 + dy) * width + (x2 + dx)) * 4;
        if (idx1 < 0 || idx1 >= f1.length || idx2 < 0 || idx2 >= f2.length) continue;
        diff += Math.abs(f1[idx1] - f2[idx2]);
      }
    }
    return diff;
  }
}
