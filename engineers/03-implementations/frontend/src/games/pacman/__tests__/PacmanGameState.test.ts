import { describe, it, expect, beforeEach } from 'vitest';
import { PacmanGameState, PlayState, FRUIT_DURATION_SEC } from '../logic/PacmanGameState';

describe('PacmanGameState Unit Tests', () => {
  let state: PacmanGameState;

  beforeEach(() => {
    state = new PacmanGameState(1);
  });

  it('should initialize score to 0, lives to 3, and state to READY', () => {
    expect(state.getScore()).toBe(0);
    expect(state.getLives()).toBe(3);
    expect(state.getLevel()).toBe(1);
    expect(state.getPlayState()).toBe(PlayState.READY);
  });

  it('should award 10 points for pellets and 50 points for power pellets', () => {
    state.onEatPellet(243);
    expect(state.getScore()).toBe(10);

    state.onEatPowerPellet(242);
    expect(state.getScore()).toBe(60);
  });

  it('should trigger fruit spawn when remaining pellets hit 174 and 74', () => {
    expect(state.getActiveFruit()).toBeNull();

    // Trigger at 174 remaining
    state.onEatPellet(174);
    const fruit1 = state.getActiveFruit();
    expect(fruit1).not.toBeNull();
    expect(fruit1?.type).toBe('Cherry');
    expect(fruit1?.score).toBe(100);

    // Consume fruit
    const score = state.consumeFruit();
    expect(score).toBe(100);
    expect(state.getScore()).toBe(110);
    expect(state.getActiveFruit()).toBeNull();

    // Trigger at 74 remaining
    state.onEatPellet(74);
    const fruit2 = state.getActiveFruit();
    expect(fruit2).not.toBeNull();
  });

  it('should auto-despawn fruit after 9.5 seconds', () => {
    state.onEatPellet(174);
    expect(state.getActiveFruit()).not.toBeNull();

    state.updateFruitTimer(5.0);
    expect(state.getActiveFruit()).not.toBeNull();

    state.updateFruitTimer(5.0); // Total 10s > 9.5s
    expect(state.getActiveFruit()).toBeNull();
  });

  it('should calculate sequential ghost eating multiplier scores (200, 400, 800, 1600)', () => {
    state.resetGhostEatingMultiplier();

    expect(state.eatGhost()).toBe(200);
    expect(state.getScore()).toBe(200);

    expect(state.eatGhost()).toBe(400);
    expect(state.getScore()).toBe(600);

    expect(state.eatGhost()).toBe(800);
    expect(state.getScore()).toBe(1400);

    expect(state.eatGhost()).toBe(1600);
    expect(state.getScore()).toBe(3000);

    // 5th ghost caps at 1600
    expect(state.eatGhost()).toBe(1600);
    expect(state.getScore()).toBe(4600);
  });

  it('should handle life loss and transition to GAME_OVER when lives reach 0', () => {
    state.setPlayState(PlayState.PLAYING);

    const lives1 = state.loseLife();
    expect(lives1).toBe(2);
    expect(state.getPlayState()).toBe(PlayState.DYING);

    state.setPlayState(PlayState.PLAYING);
    const lives2 = state.loseLife();
    expect(lives2).toBe(1);

    state.setPlayState(PlayState.PLAYING);
    const lives3 = state.loseLife();
    expect(lives3).toBe(0);
    expect(state.getPlayState()).toBe(PlayState.GAME_OVER);
  });

  it('should advance level specs on stage clear', () => {
    const nextSpec = state.advanceLevel();
    expect(state.getLevel()).toBe(2);
    expect(nextSpec.fruit).toBe('Strawberry');
    expect(nextSpec.fruitScore).toBe(300);
  });

  it('should track eaten fruit history up to 14 items', () => {
    expect(state.getFruitHistory()).toEqual([]);

    state.onEatPellet(174); // Spawn Cherry
    state.consumeFruit();
    expect(state.getFruitHistory()).toEqual(['Cherry']);
  });
});
