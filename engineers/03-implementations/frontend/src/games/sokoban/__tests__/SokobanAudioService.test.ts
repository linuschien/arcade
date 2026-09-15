/**
 * SokobanAudioService.test.ts
 * Verifies that all BGM loops and SFX trigger safely without runtime errors.
 */

import { describe, it, expect } from 'vitest';
import { SokobanAudioService } from '../audio/SokobanAudioService';

describe('SokobanAudioService Unit Tests', () => {
  it('should play and switch all 4 world BGM themes safely', () => {
    expect(() => SokobanAudioService.playWorldBGM('cargo_depot')).not.toThrow();
    expect(() => SokobanAudioService.playWorldBGM('cyber_vault')).not.toThrow();
    expect(() => SokobanAudioService.playWorldBGM('steel_works')).not.toThrow();
    expect(() => SokobanAudioService.playWorldBGM('mega_terminal')).not.toThrow();
    expect(() => SokobanAudioService.pauseBGM()).not.toThrow();
    expect(() => SokobanAudioService.resumeBGM()).not.toThrow();
    expect(() => SokobanAudioService.stopBGM()).not.toThrow();
  });

  it('should play all 8 arcade SFX without throwing', () => {
    expect(() => SokobanAudioService.playStep()).not.toThrow();
    expect(() => SokobanAudioService.playPush()).not.toThrow();
    expect(() => SokobanAudioService.playBoxTarget()).not.toThrow();
    expect(() => SokobanAudioService.playUndo()).not.toThrow();
    expect(() => SokobanAudioService.playDeadlockWarn()).not.toThrow();
    expect(() => SokobanAudioService.playTimeout()).not.toThrow();
    expect(() => SokobanAudioService.playExtend()).not.toThrow();
    expect(() => SokobanAudioService.playStageClear()).not.toThrow();
  });
});

