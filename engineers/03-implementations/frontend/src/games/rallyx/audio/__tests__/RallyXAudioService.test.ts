import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RallyXAudioService } from '../RallyXAudioService';
import { SoundEngine } from '@/core/audio/SoundEngine';

describe('RallyXAudioService Unit Tests', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(SoundEngine, 'playTone').mockImplementation(() => {});
    vi.spyOn(SoundEngine, 'playSequence').mockImplementation(() => {});
    vi.spyOn(SoundEngine, 'stopAll').mockImplementation(() => {});
  });

  afterEach(() => {
    RallyXAudioService.stopAll();
    vi.clearAllTimers();
    vi.restoreAllMocks();
  });

  it('should start, tick, and stop BGM loop without errors', () => {
    RallyXAudioService.startBGM();

    // Advance 100ms timer twice
    vi.advanceTimersByTime(200);
    expect(SoundEngine.playTone).toHaveBeenCalled();

    RallyXAudioService.pauseBGM();
    const callsBefore = (SoundEngine.playTone as any).mock.calls.length;
    vi.advanceTimersByTime(200);
    expect((SoundEngine.playTone as any).mock.calls.length).toBe(callsBefore);

    RallyXAudioService.resumeBGM();
    vi.advanceTimersByTime(100);
    expect((SoundEngine.playTone as any).mock.calls.length).toBeGreaterThan(callsBefore);

    RallyXAudioService.stopBGM();
  });

  it('should play game start fanfare', () => {
    RallyXAudioService.playGameStart();
    expect(SoundEngine.playSequence).toHaveBeenCalled();
  });

  it('should trigger SFX methods cleanly', () => {
    expect(() => RallyXAudioService.playFlagPickup(1)).not.toThrow();
    expect(() => RallyXAudioService.playSpecialFlagFanfare()).not.toThrow();
    expect(() => RallyXAudioService.playLuckyFlagChime()).not.toThrow();
    expect(() => RallyXAudioService.playRefuelingChirp(0.5)).not.toThrow();
    expect(() => RallyXAudioService.playSmokeHiss()).not.toThrow();
    expect(() => RallyXAudioService.playSpinOut()).not.toThrow();
    expect(() => RallyXAudioService.playCrash()).not.toThrow();
    expect(() => RallyXAudioService.playExtraLife()).not.toThrow();
    expect(() => RallyXAudioService.playRoundClear()).not.toThrow();
  });

  it('should manage low fuel alarm interval loop', () => {
    RallyXAudioService.startLowFuelAlarm();
    vi.advanceTimersByTime(400);
    expect(SoundEngine.playTone).toHaveBeenCalled();

    RallyXAudioService.stopLowFuelAlarm();
    const count = (SoundEngine.playTone as any).mock.calls.length;
    vi.advanceTimersByTime(400);
    expect((SoundEngine.playTone as any).mock.calls.length).toBe(count);
  });
});

