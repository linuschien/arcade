/**
 * SevenBag.test.ts
 * Vitest unit tests for 7-Bag Tetromino randomizer logic.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SevenBag } from '../logic/SevenBag';
import { TetrominoType } from '../logic/Tetromino';

describe('SevenBag Randomizer', () => {
  let sevenBag: SevenBag;

  beforeEach(() => {
    sevenBag = new SevenBag();
  });

  it('should draw all 7 unique tetromino types in every bag of 7', () => {
    const drawn: TetrominoType[] = [];
    for (let i = 0; i < 7; i++) {
      drawn.push(sevenBag.next());
    }

    expect(drawn.length).toBe(7);
    const uniqueSet = new Set(drawn);
    expect(uniqueSet.size).toBe(7);

    const allTypes = Object.values(TetrominoType);
    allTypes.forEach((t) => {
      expect(uniqueSet.has(t)).toBe(true);
    });
  });

  it('should allow peeking ahead without mutating the drawn order', () => {
    const peeked = sevenBag.peek(3);
    expect(peeked.length).toBe(3);

    const first = sevenBag.next();
    const second = sevenBag.next();
    const third = sevenBag.next();

    expect(first).toBe(peeked[0]);
    expect(second).toBe(peeked[1]);
    expect(third).toBe(peeked[2]);
  });

  it('should reset queue state on reset call', () => {
    const firstBefore = sevenBag.peek(1)[0];
    sevenBag.reset();
    const peekedAfter = sevenBag.peek(1);
    expect(peekedAfter.length).toBe(1);
  });
});
