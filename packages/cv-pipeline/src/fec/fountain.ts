/**
 * X-Pixel CV Pipeline — Fountain Codes (Luby Transform)
 * Rateless erasure codes for robust packet recovery without retransmissions.
 */

export interface EncodedSymbol {
  id: number;
  data: Uint8Array;
  /** Indices of source blocks XOR'd into this symbol */
  indices: number[];
}

/**
 * Fountain Code (simplified LT-code)
 *
 * Generates an unlimited stream of encoded symbols from K source blocks.
 * A receiver can recover all K blocks from any K+ε received symbols.
 *
 * Ideal for lossy channels where retransmissions are expensive.
 * Production: Replace random degree with Robust Soliton distribution.
 */
export class FountainCode {
  private readonly sourceBlocks: Uint8Array[];
  private readonly blockSize: number;
  private encodeCount = 0;

  constructor(data: Uint8Array, blockSize = 1024) {
    this.blockSize = blockSize;
    this.sourceBlocks = this.chunkData(data, blockSize);
  }

  get blockCount(): number { return this.sourceBlocks.length; }

  /**
   * Generate one encoded symbol by XOR-ing a random set of source blocks.
   * Can be called indefinitely — each call produces a unique symbol.
   */
  generateSymbol(): EncodedSymbol {
    const k = this.sourceBlocks.length;
    const degree = this.solitonDegree(k);
    const indices = this.sampleIndices(k, degree);

    const data = new Uint8Array(this.blockSize);
    for (const idx of indices) {
      const block = this.sourceBlocks[idx];
      for (let i = 0; i < this.blockSize && i < block.length; i++) {
        data[i] ^= block[i];
      }
    }

    return { id: this.encodeCount++, data, indices };
  }

  /**
   * Recover source blocks via belief propagation (peeling decoder).
   * Requires ≥ k + overhead received symbols.
   */
  decode(symbols: Array<Pick<EncodedSymbol, 'indices' | 'data'>>): Uint8Array {
    const k = this.sourceBlocks.length;
    if (symbols.length < k) {
      throw new Error(`Need ≥ ${k} symbols to decode, received ${symbols.length}`);
    }

    // Greedy peeling — simplified; production uses full BP graph solve
    const recovered = new Array<Uint8Array | null>(k).fill(null);
    const working = symbols.slice(0, k + Math.ceil(k * 0.1)); // use slight overhead

    let progress = true;
    while (progress) {
      progress = false;
      for (const sym of working) {
        const unknown = sym.indices.filter((i) => recovered[i] === null);
        if (unknown.length === 1) {
          // Peel: XOR all known blocks away
          let block = new Uint8Array(sym.data);
          for (const i of sym.indices) {
            if (recovered[i] !== null) {
              const r = recovered[i]!;
              for (let j = 0; j < this.blockSize; j++) block[j] ^= r[j];
            }
          }
          recovered[unknown[0]] = block;
          progress = true;
        }
      }
    }

    // Concatenate recovered blocks into output
    const output = new Uint8Array(k * this.blockSize);
    for (let i = 0; i < k; i++) {
      if (recovered[i]) output.set(recovered[i]!, i * this.blockSize);
    }
    return output;
  }

  private chunkData(data: Uint8Array, blockSize: number): Uint8Array[] {
    const chunks: Uint8Array[] = [];
    for (let i = 0; i < data.length; i += blockSize) {
      const chunk = data.slice(i, Math.min(i + blockSize, data.length));
      if (chunk.length < blockSize) {
        const padded = new Uint8Array(blockSize);
        padded.set(chunk);
        chunks.push(padded);
      } else {
        chunks.push(chunk);
      }
    }
    return chunks;
  }

  /** Simplified ideal Soliton degree distribution */
  private solitonDegree(k: number): number {
    const r = Math.random();
    if (r < 1 / k) return 1;
    return Math.min(k, Math.ceil(1 / (r * r)));
  }

  private sampleIndices(k: number, degree: number): number[] {
    const indices = new Set<number>();
    while (indices.size < Math.min(degree, k)) {
      indices.add(Math.floor(Math.random() * k));
    }
    return [...indices];
  }
}
