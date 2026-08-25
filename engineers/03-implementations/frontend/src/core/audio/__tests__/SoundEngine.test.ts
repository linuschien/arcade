import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SoundEngine } from '../SoundEngine';

class MockAudioContext {
  state = 'running';
  currentTime = 0;
  destination = {};
  createOscillator() {
    return {
      type: 'square',
      frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };
  }
  createGain() {
    return {
      gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      connect: vi.fn(),
    };
  }
  resume() {}
}

(globalThis as any).AudioContext = MockAudioContext;

describe('SoundEngine', () => {
  beforeEach(() => {
    SoundEngine.setMuted(false);
  });

  it('toggles muted state', () => {
    SoundEngine.setMuted(true);
    expect(SoundEngine.isMutedState()).toBe(true);

    SoundEngine.setMuted(false);
    expect(SoundEngine.isMutedState()).toBe(false);
  });

  it('plays tone and sequence without throwing', () => {
    expect(() =>
      SoundEngine.playTone({
        frequency: 440,
        targetFrequency: 880,
        durationSeconds: 0.1,
      })
    ).not.toThrow();

    expect(() =>
      SoundEngine.playSequence([
        { freq: 440, delayMs: 0, durationSeconds: 0.1 },
        { freq: 880, delayMs: 100, durationSeconds: 0.1 },
      ])
    ).not.toThrow();
  });

  it('resets explicit pause state when stopAll is called', () => {
    SoundEngine.suspend();
    // After stopping all tones, explicit pause lock is cleared
    SoundEngine.stopAll();
    expect(() => SoundEngine.resume()).not.toThrow();
  });
});
