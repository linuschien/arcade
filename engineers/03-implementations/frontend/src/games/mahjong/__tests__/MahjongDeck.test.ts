/**
 * MahjongDeck.test.ts
 * Unit tests for MahjongDeck (144 tiles, wall breaking, head/tail drawing, 16 dead wall).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MahjongDeck } from '../logic/MahjongDeck';

describe('MahjongDeck Unit Tests', () => {
  let deck: MahjongDeck;

  beforeEach(() => {
    deck = new MahjongDeck();
  });

  it('should initialize exactly 144 tiles with correct suit distributions', () => {
    const tiles = MahjongDeck.generateAll144Tiles();
    expect(tiles.length).toBe(144);

    const characters = tiles.filter((t) => t.suit === 'CHARACTERS');
    const dots = tiles.filter((t) => t.suit === 'DOTS');
    const bamboo = tiles.filter((t) => t.suit === 'BAMBOO');
    const winds = tiles.filter((t) => t.suit === 'WINDS');
    const dragons = tiles.filter((t) => t.suit === 'DRAGONS');
    const flowers = tiles.filter((t) => t.suit === 'FLOWERS');

    expect(characters.length).toBe(36); // 9 values * 4
    expect(dots.length).toBe(36);
    expect(bamboo.length).toBe(36);
    expect(winds.length).toBe(16); // 4 winds * 4
    expect(dragons.length).toBe(12); // 3 dragons * 4
    expect(flowers.length).toBe(8); // 4 seasons + 4 plants
  });

  it('should setup wall break using 3 dice sum correctly', () => {
    // Dice sum = 9 -> (9 - 1) % 4 = 0 (dealer's own wall)
    const result = deck.setupWallBreak(9, 0);
    expect(result.breakSeat).toBe(0);
    expect(result.breakStack).toBe(9);
    expect(deck.getRegularRemainingCount()).toBe(144 - 16); // 128 regular tiles
    expect(deck.getDeadWallCount()).toBe(16);
  });

  it('should correctly draw from head (clockwise dealing)', () => {
    deck.setupWallBreak(7, 0);
    const initialRemaining = deck.getRegularRemainingCount();

    const t1 = deck.drawHead();
    const t2 = deck.drawHead();

    expect(t1).not.toBeNull();
    expect(t2).not.toBeNull();
    expect(deck.getRegularRemainingCount()).toBe(initialRemaining - 2);
  });

  it('should correctly draw from tail (replenishment) and shift dead wall', () => {
    deck.setupWallBreak(8, 0);
    const initialRemaining = deck.getRegularRemainingCount();

    const tail1 = deck.drawTail();
    const tail2 = deck.drawTail();

    expect(tail1).not.toBeNull();
    expect(tail2).not.toBeNull();
    expect(deck.getRegularRemainingCount()).toBe(initialRemaining - 2);
    expect(deck.getDeadWallCount()).toBe(16); // Always maintains 16 dead wall reserve
  });

  it('should handle running out of regular tiles (reaching 16 dead wall reserve)', () => {
    deck.setupWallBreak(7, 0);

    // Draw all 128 regular tiles
    for (let i = 0; i < 128; i++) {
      expect(deck.hasRegularTilesLeft()).toBe(true);
      const t = deck.drawHead();
      expect(t).not.toBeNull();
    }

    // Now regular tiles should be 0, and 16 dead wall tiles remain untouched
    expect(deck.getRegularRemainingCount()).toBe(0);
    expect(deck.hasRegularTilesLeft()).toBe(false);
    expect(deck.drawHead()).toBeNull();
    expect(deck.drawTail()).toBeNull();
  });

  it('should map breakStackIndex to physical clockwise walls correctly for all seats', () => {
    // Seat 0 (Bottom Wall, start 0): dice sum 17 -> (0 + 17) % 72 = 17
    deck.setupWallBreak(17, 0);
    expect(deck.getBreakStackIndex()).toBe(17);

    // Seat 1 (Right Wall, start 54): dice sum 17 -> (54 + 17) % 72 = 71
    deck.setupWallBreak(17, 1);
    expect(deck.getBreakStackIndex()).toBe(71);

    // Seat 2 (Top Wall, start 36): dice sum 17 -> (36 + 17) % 72 = 53
    deck.setupWallBreak(17, 2);
    expect(deck.getBreakStackIndex()).toBe(53);

    // Seat 3 (Left Wall, start 18): dice sum 17 -> (18 + 17) % 72 = 35
    deck.setupWallBreak(17, 3);
    expect(deck.getBreakStackIndex()).toBe(35);
  });

  it('should identify the 8 stacks (16 tiles) in the dead wall as iron stacks', () => {
    // Setup wall break with diceSum = 9 at dealerSeat 0 -> breakSeat = 0, breakStackIndex = 9
    deck.setupWallBreak(9, 0);
    expect(deck.getBreakStackIndex()).toBe(9);

    // Initial tail is at stack 8, dead wall spans counter-clockwise: 8, 7, 6, 5, 4, 3, 2, 1
    for (let stack = 1; stack <= 8; stack++) {
      expect(deck.isStackInDeadWall(stack)).toBe(true);
    }
    // Stacks outside the 8-stack window are not in dead wall
    expect(deck.isStackInDeadWall(9)).toBe(false); // Wall head
    expect(deck.isStackInDeadWall(0)).toBe(false);
    expect(deck.isStackInDeadWall(71)).toBe(false);

    // Draw from tail (槓尾/補花摸 2 張 = 1 墩) -> Tail moves CCW to stack 7
    deck.drawTail();
    deck.drawTail();

    // Now dead wall spans 7 down to 0 (stack 8 consumed, stack 0 incorporated)
    expect(deck.isStackInDeadWall(8)).toBe(false);
    expect(deck.isStackInDeadWall(0)).toBe(true);
  });

  it('should return false for all isStackInDeadWall calls before setupWallBreak() is invoked (no dice rolled yet)', () => {
    // Fresh deck — setupWallBreak() has NOT been called yet
    const freshDeck = new MahjongDeck();
    for (let i = 0; i < 72; i++) {
      expect(freshDeck.isStackInDeadWall(i)).toBe(false);
    }

    // Also false after reset()
    freshDeck.setupWallBreak(9, 0); // call once to set ready
    freshDeck.reset(); // reset clears ready flag
    for (let i = 0; i < 72; i++) {
      expect(freshDeck.isStackInDeadWall(i)).toBe(false);
    }

    // After a new setupWallBreak, it should work correctly again
    freshDeck.setupWallBreak(9, 0);
    expect(freshDeck.isStackInDeadWall(1)).toBe(true); // inside dead wall
    expect(freshDeck.isStackInDeadWall(9)).toBe(false); // break point itself
  });
});
