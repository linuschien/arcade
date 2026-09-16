import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SokobanAudioService } from '../audio/SokobanAudioService';
import { SoundEngine } from '@/core/audio/SoundEngine';

describe('SokobanAudioService Unit Tests', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(SoundEngine, 'playTone').mockImplementation(() => {});
    vi.spyOn(SoundEngine, 'playSequence').mockImplementation(() => {});
    vi.spyOn(SoundEngine, 'isMutedState').mockReturnValue(false);
  });

  afterEach(() => {
    SokobanAudioService.stopBGM();
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should play and switch all 4 world BGM themes safely', () => {
    expect(() => SokobanAudioService.playWorldBGM('cargo_depot')).not.toThrow();
    expect(() => SokobanAudioService.playWorldBGM('cyber_vault')).not.toThrow();
    expect(() => SokobanAudioService.playWorldBGM('steel_works')).not.toThrow();
    expect(() => SokobanAudioService.playWorldBGM('mega_terminal')).not.toThrow();
    expect(() => SokobanAudioService.pauseBGM()).not.toThrow();
    expect(() => SokobanAudioService.resumeBGM()).not.toThrow();
    expect(() => SokobanAudioService.stopBGM()).not.toThrow();
  });

  it('should synthesize calm ambient sine wave BGM for World 2 (cyber_vault) with 220ms pacing', () => {
    SokobanAudioService.playWorldBGM('cyber_vault');

    // Advance by 1 step (220ms)
    vi.advanceTimersByTime(220);

    // Verify SoundEngine.playTone was called with sine wave at 0.08 volume and 73.42Hz sub-bass at 0.11
    expect(SoundEngine.playTone).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'sine',
        volume: 0.08,
      })
    );
    expect(SoundEngine.playTone).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'sine',
        frequency: 73.42,
        volume: 0.11,
      })
    );
  });

  it('should synthesize warm triangle arpeggios for World 1 (cargo_depot) with balanced volume', () => {
    SokobanAudioService.playWorldBGM('cargo_depot');
    vi.advanceTimersByTime(170);

    expect(SoundEngine.playTone).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'triangle',
        volume: 0.075,
      })
    );
  });

  it('should play all 8 arcade SFX with enhanced audible volume', () => {
    expect(() => SokobanAudioService.playStep()).not.toThrow();
    expect(SoundEngine.playTone).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'triangle', volume: 0.06 })
    );

    expect(() => SokobanAudioService.playPush()).not.toThrow();
    expect(SoundEngine.playTone).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'square', volume: 0.11 })
    );

    expect(() => SokobanAudioService.playBoxTarget()).not.toThrow();
    expect(SoundEngine.playSequence).toHaveBeenCalled();

    expect(() => SokobanAudioService.playUndo()).not.toThrow();
    expect(SoundEngine.playTone).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'sine', volume: 0.10 })
    );

    expect(() => SokobanAudioService.playDeadlockWarn()).not.toThrow();
    expect(() => SokobanAudioService.playTimeout()).not.toThrow();
    expect(() => SokobanAudioService.playExtend()).not.toThrow();
    expect(() => SokobanAudioService.playStageClear()).not.toThrow();
  });
});


