import { describe, it, expect, beforeEach } from 'vitest';
import { PacmanAudioService } from '../PacmanAudioService';
import { SoundEngine } from '@/core/audio/SoundEngine';

describe('PacmanAudioService Unit Tests', () => {
  beforeEach(() => {
    SoundEngine.setMuted(false);
  });

  it('should trigger synthesized sound effects without throwing', () => {
    expect(() => PacmanAudioService.playWakka()).not.toThrow();
    expect(() => PacmanAudioService.playPowerPellet()).not.toThrow();
    expect(() => PacmanAudioService.playEatFruit()).not.toThrow();
    expect(() => PacmanAudioService.playEatGhost()).not.toThrow();
    expect(() => PacmanAudioService.playDeath()).not.toThrow();
    expect(() => PacmanAudioService.playLevelClear()).not.toThrow();
  });
});
