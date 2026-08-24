/**
 * MahjongAudioService.test.ts
 * Unit tests for Mahjong audio synthesizer service.
 */

import { describe, it, expect } from 'vitest';
import { MahjongAudioService } from '../MahjongAudioService';

describe('MahjongAudioService Unit Tests', () => {
  it('should start and stop BGM without throwing', () => {
    expect(() => {
      MahjongAudioService.playBGM();
      MahjongAudioService.stopBGM();
    }).not.toThrow();
  });

  it('should trigger all SFX and Voice methods safely', () => {
    expect(() => {
      MahjongAudioService.playTileSelect();
      MahjongAudioService.playTileDiscard();
      MahjongAudioService.playDiceRoll();
      MahjongAudioService.playFlowerReplace();
      MahjongAudioService.playFanTally();
      MahjongAudioService.playVictory();
      MahjongAudioService.playGameOver();
      MahjongAudioService.playVoiceChow();
      MahjongAudioService.playVoicePong();
      MahjongAudioService.playVoiceKong();
      MahjongAudioService.playVoiceTing();
      MahjongAudioService.playVoiceHu();
      MahjongAudioService.stopVoice();
    }).not.toThrow();
  });

  it('should resolve waitForVoiceComplete cleanly and not hang', async () => {
    // 1. When no voice is active
    await expect(MahjongAudioService.waitForVoiceComplete()).resolves.toBeUndefined();

    // 2. When voice is triggered
    MahjongAudioService.playVoiceHu();
    await expect(MahjongAudioService.waitForVoiceComplete()).resolves.toBeUndefined();
  });
});

