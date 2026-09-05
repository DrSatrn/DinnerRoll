/**
 * Mulberry32: A fast, high-quality 32-bit PRNG with 2^32 period.
 * Allows full deterministic testability with seed injection.
 */
export class PRNG {
  private state: number;

  constructor(seed?: number) {
    if (seed === undefined) {
      this.state = (Math.random() * 0xffffffff) >>> 0;
    } else {
      this.state = seed >>> 0;
    }
  }

  /**
   * Returns a float in [0, 1).
   */
  next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Returns an integer in [min, max].
   */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /**
   * Weighted random selection from an array of items with associated weights.
   * If all weights are 0, selects uniformly from available items.
   */
  pickWeighted<T>(items: { item: T; weight: number }[]): T | undefined {
    if (items.length === 0) return undefined;

    const totalWeight = items.reduce((sum, entry) => sum + Math.max(0, entry.weight), 0);

    if (totalWeight <= 0) {
      const idx = Math.floor(this.next() * items.length);
      return items[idx].item;
    }

    let threshold = this.next() * totalWeight;
    for (const entry of items) {
      const w = Math.max(0, entry.weight);
      if (threshold <= w) {
        return entry.item;
      }
      threshold -= w;
    }

    return items[items.length - 1].item;
  }
}
