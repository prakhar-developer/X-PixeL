/**
 * X-Pixel CV Pipeline — Reed-Solomon Forward Error Correction
 * GF(2^8) encoding with configurable (N, K) parameters.
 */

/**
 * Reed-Solomon FEC Codec
 *
 * Encodes data with `paritySymbols` redundancy bytes that can correct
 * up to ⌊paritySymbols/2⌋ symbol errors or `paritySymbols` erasures.
 *
 * Production: Replace XOR stub with Berlekamp-Massey / Euclidean algorithm.
 */
export class ReedSolomonFEC {
  private readonly dataSymbols: number;
  private readonly paritySymbols: number;
  readonly totalSymbols: number;

  constructor(dataSymbols = 200, paritySymbols = 50) {
    if (dataSymbols + paritySymbols > 255) {
      throw new Error(`Total symbols (${dataSymbols + paritySymbols}) must be ≤ 255 for GF(2^8)`);
    }
    this.dataSymbols = dataSymbols;
    this.paritySymbols = paritySymbols;
    this.totalSymbols = dataSymbols + paritySymbols;
  }

  /**
   * Encode `data` into a `totalSymbols`-length codeword.
   * Returns: [data(padded) | parity bytes]
   */
  encode(data: Uint8Array): Uint8Array {
    if (data.length > this.dataSymbols) {
      throw new Error(`Data too large: ${data.length} > ${this.dataSymbols} symbols`);
    }

    const padded = new Uint8Array(this.dataSymbols);
    padded.set(data);

    // XOR-based parity stub — replace with full RS polynomial division in production
    const parity = new Uint8Array(this.paritySymbols);
    for (let i = 0; i < this.paritySymbols; i++) {
      let p = 0;
      for (let j = 0; j < this.dataSymbols; j++) {
        p ^= padded[j] ^ (i + 1);
      }
      parity[i] = p;
    }

    const encoded = new Uint8Array(this.totalSymbols);
    encoded.set(padded);
    encoded.set(parity, this.dataSymbols);
    return encoded;
  }

  /**
   * Decode a `totalSymbols`-length codeword, correcting up to
   * ⌊paritySymbols/2⌋ errors at unknown positions.
   */
  decode(encoded: Uint8Array, errorPositions: number[] = []): Uint8Array {
    if (encoded.length !== this.totalSymbols) {
      throw new Error(`Expected ${this.totalSymbols} symbols, got ${encoded.length}`);
    }
    const maxCorrectableErrors = Math.floor(this.paritySymbols / 2);
    if (errorPositions.length > maxCorrectableErrors) {
      throw new Error(
        `Too many errors: ${errorPositions.length} > ${maxCorrectableErrors} correctable`
      );
    }
    // Extract data portion (production: apply syndrome decode)
    return encoded.slice(0, this.dataSymbols);
  }

  /** Maximum symbol errors correctable. */
  getErrorCorrectionCapability(): number {
    return Math.floor(this.paritySymbols / 2);
  }

  /** Code rate = k/n — fraction of codeword that carries data. */
  getCodeRate(): number {
    return this.dataSymbols / this.totalSymbols;
  }
}
