/**
 * SevenBag.ts
 * Pure TypeScript implementation of the 7-Bag Tetromino randomizer.
 * Guarantees each set of 7 tetromino types drops in a randomized permutation.
 */

import { TetrominoType } from './Tetromino';

export class SevenBag {
  private bag: TetrominoType[] = [];
  private queue: TetrominoType[] = [];

  constructor() {
    this.refillQueue();
  }

  /**
   * Refills the queue so it always has at least 7 pieces available for peeking.
   */
  private generateBag(): TetrominoType[] {
    const types: TetrominoType[] = [
      TetrominoType.I,
      TetrominoType.J,
      TetrominoType.L,
      TetrominoType.O,
      TetrominoType.S,
      TetrominoType.T,
      TetrominoType.Z,
    ];

    // Fisher-Yates shuffle
    for (let i = types.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [types[i], types[j]] = [types[j], types[i]];
    }

    return types;
  }

  private refillQueue(): void {
    while (this.queue.length < 14) {
      this.queue.push(...this.generateBag());
    }
  }

  /**
   * Pulls the next tetromino from the bag queue.
   */
  public next(): TetrominoType {
    this.refillQueue();
    const piece = this.queue.shift()!;
    this.refillQueue();
    return piece;
  }

  /**
   * Peeks ahead at the next N pieces without consuming them.
   */
  public peek(count: number = 3): TetrominoType[] {
    this.refillQueue();
    return this.queue.slice(0, count);
  }

  /**
   * Reset bag generator state.
   */
  public reset(): void {
    this.bag = [];
    this.queue = [];
    this.refillQueue();
  }
}
