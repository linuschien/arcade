import { describe, it, expect, beforeEach } from 'vitest';
import {
  RallyXGameState,
  RallyXPlayState,
  MAX_FUEL,
  PASSIVE_FUEL_DRAIN_NORMAL,
  SMOKE_FUEL_COST,
  SMOKE_COOLDOWN_SEC,
  SMOKE_PUFF_DURATION_SEC,
} from '../logic/RallyXGameState';

describe('RallyXGameState Unit Tests', () => {
  let state: RallyXGameState;

  beforeEach(() => {
    state = new RallyXGameState(1, 10000);
  });

  describe('Initialization & Initial State', () => {
    it('should initialize with correct default values', () => {
      expect(state.getRound()).toBe(1);
      expect(state.getScore()).toBe(0);
      expect(state.getHighScore()).toBe(10000);
      expect(state.getLives()).toBe(3);
      expect(state.getFuel()).toBe(MAX_FUEL);
      expect(state.isFuelEmpty()).toBe(false);
      expect(state.getPlayState()).toBe(RallyXPlayState.READY);
      expect(state.getFlagsCollected()).toBe(0);
      expect(state.isSpecialActive()).toBe(false);
      expect(state.isChallengingStage()).toBe(false);
    });

    it('should identify Challenging Stages properly', () => {
      const stage3 = new RallyXGameState(3);
      expect(stage3.isChallengingStage()).toBe(true);

      const stage7 = new RallyXGameState(7);
      expect(stage7.isChallengingStage()).toBe(true);

      const stage4 = new RallyXGameState(4);
      expect(stage4.isChallengingStage()).toBe(false);
    });
  });

  describe('Fuel Consumption & Empty State', () => {
    it('should drain passive fuel during PLAYING state in normal stages', () => {
      state.setPlayState(RallyXPlayState.PLAYING);
      state.updatePassiveFuel(1.0); // 1 second
      expect(state.getFuel()).toBeCloseTo(MAX_FUEL - PASSIVE_FUEL_DRAIN_NORMAL, 1);
    });

    it('should NOT drain passive fuel in Challenging Stages', () => {
      const stage3 = new RallyXGameState(3);
      stage3.setPlayState(RallyXPlayState.PLAYING);
      stage3.updatePassiveFuel(2.0);
      expect(stage3.getFuel()).toBe(MAX_FUEL);
    });

    it('should clamp fuel at zero and report isFuelEmpty', () => {
      state.setPlayState(RallyXPlayState.PLAYING);
      state.updatePassiveFuel(200.0); // massive drain
      expect(state.getFuel()).toBe(0);
      expect(state.isFuelEmpty()).toBe(true);
    });

    it('should restore full fuel unconditionally', () => {
      state.setPlayState(RallyXPlayState.PLAYING);
      state.updatePassiveFuel(10.0);
      expect(state.getFuel()).toBeLessThan(MAX_FUEL);
      state.restoreFullFuel();
      expect(state.getFuel()).toBe(MAX_FUEL);
    });
  });

  describe('Smoke Screen System', () => {
    it('should allow deploying smoke when fuel >= 30 and cooldown is 0', () => {
      state.setPlayState(RallyXPlayState.PLAYING);
      expect(state.canDeploySmoke()).toBe(true);

      const deployed = state.triggerSmokeDeployment();
      expect(deployed).toBe(true);
      expect(state.getFuel()).toBe(MAX_FUEL - SMOKE_FUEL_COST);
      expect(state.getSmokeCooldown()).toBeCloseTo(SMOKE_COOLDOWN_SEC, 2);

      // Subsequent attempt during cooldown should fail
      expect(state.canDeploySmoke()).toBe(false);
      expect(state.triggerSmokeDeployment()).toBe(false);
    });

    it('should disallow deploying smoke when fuel < 30', () => {
      state.setPlayState(RallyXPlayState.PLAYING);
      state.updatePassiveFuel(125.0); // drain down to 0
      expect(state.getFuel()).toBe(0);
      expect(state.canDeploySmoke()).toBe(false);
      expect(state.triggerSmokeDeployment()).toBe(false);
    });

    it('should track active smoke puffs and expire them after 3.5s', () => {
      state.setPlayState(RallyXPlayState.PLAYING);
      state.addSmokePuff(100, 200);
      state.addSmokePuff(120, 200);
      expect(state.getActiveSmokePuffs().length).toBe(2);

      // Elapse 2 seconds
      state.updateSmoke(2.0);
      expect(state.getActiveSmokePuffs().length).toBe(2);
      expect(state.getActiveSmokePuffs()[0].remainingTimeSec).toBeCloseTo(SMOKE_PUFF_DURATION_SEC - 2.0, 1);

      // Elapse another 2 seconds (total 4s > 3.5s)
      state.updateSmoke(2.0);
      expect(state.getActiveSmokePuffs().length).toBe(0);
    });
  });

  describe('Flag Collection, Multipliers, Lucky Refill & Clear', () => {
    it('should award 100 * n for regular flags sequentially', () => {
      state.setPlayState(RallyXPlayState.PLAYING);

      const res1 = state.collectFlag('REGULAR');
      expect(res1.basePoints).toBe(100);
      expect(res1.totalPoints).toBe(100);
      expect(state.getScore()).toBe(100);

      const res2 = state.collectFlag('REGULAR');
      expect(res2.basePoints).toBe(200);
      expect(res2.totalPoints).toBe(200);
      expect(state.getScore()).toBe(300);
    });

    it('should activate 2x multiplier upon collecting Special "S" flag for subsequent flags', () => {
      state.setPlayState(RallyXPlayState.PLAYING);

      // Flag 1: Regular
      state.collectFlag('REGULAR'); // +100 (Total: 100)
      // Flag 2: Special "S"
      const resS = state.collectFlag('SPECIAL'); // +200 (Total: 300)
      expect(resS.isSpecialActivated).toBe(true);
      expect(state.isSpecialActive()).toBe(true);
      expect(state.getScore()).toBe(300);

      // Flag 3: Regular (should be doubled: 300 * 2 = 600)
      const res3 = state.collectFlag('REGULAR');
      expect(res3.multiplierApplied).toBe(true);
      expect(res3.basePoints).toBe(300);
      expect(res3.totalPoints).toBe(600);
      expect(state.getScore()).toBe(900);
    });

    it('should handle Lucky "L" flag: instant fuel bonus, enter LUCKY_REFILL, and animate to full', () => {
      state.setPlayState(RallyXPlayState.PLAYING);
      state.updatePassiveFuel(70.0); // Drains 70 * 8 = 560 pts (Fuel: 440)

      const currentFuelBefore = Math.floor(state.getFuel());
      const resL = state.collectFlag('LUCKY');

      expect(resL.isLuckyActivated).toBe(true);
      expect(resL.luckyFuelBonus).toBe(currentFuelBefore);
      expect(state.getPlayState()).toBe(RallyXPlayState.LUCKY_REFILL);

      // In LUCKY_REFILL state, updateLuckyRefill animates fuel back to 1000
      let finished = state.updateLuckyRefill(0.2); // +240 -> ~680
      expect(finished).toBe(false);
      expect(state.getFuel()).toBeGreaterThan(currentFuelBefore);

      finished = state.updateLuckyRefill(1.0); // +1200 -> 1000
      expect(finished).toBe(true);
      expect(state.getFuel()).toBe(MAX_FUEL);
      expect(state.getPlayState()).toBe(RallyXPlayState.PLAYING);
    });

    it('should trigger STAGE_CLEARED and award fuel bonus when 10th flag collected', () => {
      state.setPlayState(RallyXPlayState.PLAYING);

      for (let i = 1; i <= 9; i++) {
        state.collectFlag('REGULAR');
      }
      expect(state.getFlagsCollected()).toBe(9);
      expect(state.getPlayState()).toBe(RallyXPlayState.PLAYING);

      // Collect 10th flag
      const remainingFuel = Math.floor(state.getFuel());
      const res10 = state.collectFlag('REGULAR');

      expect(res10.isStageClear).toBe(true);
      expect(state.getPlayState()).toBe(RallyXPlayState.STAGE_CLEARED);
      expect(res10.stageClearFuelBonus).toBe(remainingFuel * 10);
    });
  });

  describe('Player Death, Respawn Retention & Game Over', () => {
    it('should decrement lives, set DYING state, and retain collected flags on death', () => {
      state.setPlayState(RallyXPlayState.PLAYING);
      state.collectFlag('REGULAR');
      state.collectFlag('SPECIAL');
      expect(state.isSpecialActive()).toBe(true);
      expect(state.getFlagsCollected()).toBe(2);

      const isGameOver = state.handlePlayerDeath();
      expect(isGameOver).toBe(false);
      expect(state.getLives()).toBe(2);
      expect(state.getPlayState()).toBe(RallyXPlayState.DYING);

      // Respawn
      state.resetAfterDeath();
      expect(state.getPlayState()).toBe(RallyXPlayState.PLAYING);
      expect(state.getFuel()).toBe(MAX_FUEL);
      expect(state.getFlagsCollected()).toBe(2); // Retained!
      expect(state.isSpecialActive()).toBe(false); // Multiplier lost!

      // Next flag collected starts from sequence 1 (100 pts)
      const resNext = state.collectFlag('REGULAR');
      expect(resNext.basePoints).toBe(100);
      expect(resNext.totalPoints).toBe(100);
    });

    it('should transition to GAME_OVER when last life is lost', () => {
      state.setPlayState(RallyXPlayState.PLAYING);
      state.handlePlayerDeath(); // 3 -> 2
      state.resetAfterDeath();
      state.handlePlayerDeath(); // 2 -> 1
      state.resetAfterDeath();

      const isGameOver = state.handlePlayerDeath(); // 1 -> 0
      expect(isGameOver).toBe(true);
      expect(state.getLives()).toBe(0);
      expect(state.getPlayState()).toBe(RallyXPlayState.GAME_OVER);
    });
  });

  describe('1UP Extends Milestones (20,000 and 80,000)', () => {
    it('should award 1UP at 20,000 points and 80,000 points, capped at 5 lives', () => {
      expect(state.getLives()).toBe(3);

      const awarded1 = state.addScore(21000);
      expect(awarded1).toBe(true);
      expect(state.getLives()).toBe(4);

      // Adding more score below 80,000 does not award
      const awardedNone = state.addScore(30000); // 51,000
      expect(awardedNone).toBe(false);
      expect(state.getLives()).toBe(4);

      // Crossing 80,000 awards second 1UP
      const awarded2 = state.addScore(30000); // 81,000
      expect(awarded2).toBe(true);
      expect(state.getLives()).toBe(5);

      // Capped at 5
      state.addScore(100000);
      expect(state.getLives()).toBe(5);
    });
  });

  describe('Round Progression', () => {
    it('should advance to next round properly and reset counters', () => {
      state.setPlayState(RallyXPlayState.PLAYING);
      state.collectFlag('SPECIAL');
      state.collectFlag('REGULAR');

      state.advanceToNextRound();
      expect(state.getRound()).toBe(2);
      expect(state.getFuel()).toBe(MAX_FUEL);
      expect(state.getFlagsCollected()).toBe(0);
      expect(state.isSpecialActive()).toBe(false);
      expect(state.getPlayState()).toBe(RallyXPlayState.READY);
    });

    it('should update play time in update() when PLAYING', () => {
      state.setPlayState(RallyXPlayState.PLAYING);
      state.update(1.5);
      expect(state.getPlayTimeSeconds()).toBeCloseTo(1.5, 1);
    });
  });
});
