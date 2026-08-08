import { describe, it, expect, beforeEach } from 'vitest';
import { TetrisAudioService } from '../TetrisAudioService';
import { SoundEngine } from '@/core/audio/SoundEngine';

describe('TetrisAudioService', () => {
  beforeEach(() => {
    SoundEngine.setMuted(false);
    TetrisAudioService.stopBgm();
  });

  it('plays Tetris sound effects without throwing', () => {
    expect(() => TetrisAudioService.playMove()).not.toThrow();
    expect(() => TetrisAudioService.playRotate()).not.toThrow();
    expect(() => TetrisAudioService.playHardDrop()).not.toThrow();
    expect(() => TetrisAudioService.playLineClear(1)).not.toThrow();
    expect(() => TetrisAudioService.playLineClear(4)).not.toThrow();
    expect(() => TetrisAudioService.playGameOver()).not.toThrow();
  });

  it('manages Tetris BGM lifecycle and tempo', () => {
    TetrisAudioService.startBgm(1);
    TetrisAudioService.updateBgmTempo(5);
    TetrisAudioService.stopBgm();
  });
});
