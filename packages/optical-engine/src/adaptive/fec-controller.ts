/**
 * X-Pixel Optical Engine — Adaptive FEC Controller
 * Dynamically tunes Reed-Solomon (N, K) parameters based on link quality.
 */

export interface FECConfig {
  /** Total code symbols (data + parity) — max 255 for GF(2^8) */
  n: number;
  /** Data symbols */
  k: number;
}

/**
 * Adaptive FEC Strength Controller
 * Steps code rate between 0.5–0.95 based on observed success rate.
 */
export class AdaptiveFECController {
  private currentConfig: FECConfig = { n: 250, k: 200 };
  private readonly minCodeRate: number;
  private readonly maxCodeRate: number;

  constructor(minCodeRate = 0.5, maxCodeRate = 0.95) {
    this.minCodeRate = minCodeRate;
    this.maxCodeRate = maxCodeRate;
  }

  /** Return optimal (N, K) config for current error/success conditions. */
  getConfiguration(errorRate: number, successRate: number): FECConfig {
    let codeRate: number;

    if (successRate > 0.99) codeRate = 0.90;          // Near-perfect — low redundancy
    else if (successRate > 0.95) codeRate = 0.85;     // Good link
    else if (successRate > 0.90) codeRate = 0.75;     // Moderate errors
    else if (successRate > 0.80) codeRate = 0.65;     // Poor link
    else codeRate = 0.50;                              // Very poor — max redundancy

    // Bias toward more redundancy if error rate is spiking
    if (errorRate > 0.2) codeRate = Math.min(codeRate, 0.6);

    return this.computeConfig(codeRate);
  }

  getCorrectionCapability(): number {
    return Math.floor((this.currentConfig.n - this.currentConfig.k) / 2);
  }

  getCodeRate(): number {
    return this.currentConfig.k / this.currentConfig.n;
  }

  getCurrentConfig(): FECConfig { return { ...this.currentConfig }; }

  private computeConfig(codeRate: number): FECConfig {
    codeRate = Math.max(this.minCodeRate, Math.min(this.maxCodeRate, codeRate));
    const n = Math.min(255, Math.ceil(250 / codeRate));
    const k = Math.ceil(n * codeRate);
    this.currentConfig = { n, k };
    return { n, k };
  }
}
