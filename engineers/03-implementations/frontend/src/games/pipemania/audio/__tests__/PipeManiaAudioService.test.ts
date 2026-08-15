import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PipeManiaAudioService } from '../PipeManiaAudioService';
import { SoundEngine } from '@/core/audio/SoundEngine';

describe('PipeManiaAudioService Unit Tests', () => {
  beforeEach(() => {
    SoundEngine.setMuted(false);
  });

  afterEach(() => {
    PipeManiaAudioService.stopBGM();
  });

  it('should start and stop BGM without errors', () => {
    expect(() => PipeManiaAudioService.playBGM()).not.toThrow();
    expect(() => PipeManiaAudioService.stopBGM()).not.toThrow();
  });

  it('should trigger synthesized SFX and jingles without throwing', () => {
    expect(() => PipeManiaAudioService.playVictory()).not.toThrow();
    expect(() => PipeManiaAudioService.playGameOver()).not.toThrow();
    expect(() => PipeManiaAudioService.playCountdownTick()).not.toThrow();
    expect(() => PipeManiaAudioService.playPipePlace()).not.toThrow();
    expect(() => PipeManiaAudioService.playPipeReplace()).not.toThrow();
    expect(() => PipeManiaAudioService.playFlowBubble()).not.toThrow();
    expect(() => PipeManiaAudioService.playReservoirFill()).not.toThrow();
    expect(() => PipeManiaAudioService.playFastForward()).not.toThrow();
    expect(() => PipeManiaAudioService.playSpillBurst()).not.toThrow();
    expect(() => PipeManiaAudioService.playExtendLife()).not.toThrow();
    expect(() => PipeManiaAudioService.playLevelClear()).not.toThrow();
  });
});
