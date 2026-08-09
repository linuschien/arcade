/**
 * PacmanAudioService.ts
 * Synthesizes retro 8-Bit audio effects for Pac-Man using SoundEngine.
 */

import { SoundEngine } from '@/core/audio/SoundEngine';

export class PacmanAudioService {
  private static toggleWakka: boolean = false;

  public static playWakka(): void {
    const freq = this.toggleWakka ? 440 : 330;
    this.toggleWakka = !this.toggleWakka;

    SoundEngine.playTone({
      type: 'triangle',
      frequency: freq,
      durationSeconds: 0.06,
      volume: 0.08,
    });
  }

  public static playPowerPellet(): void {
    SoundEngine.playSequence([
      { freq: 150, delayMs: 0, durationSeconds: 0.1, type: 'sawtooth', vol: 0.12 },
      { freq: 300, delayMs: 100, durationSeconds: 0.15, type: 'square', vol: 0.15 },
    ]);
  }

  public static playEatFruit(): void {
    SoundEngine.playSequence([
      { freq: 523, delayMs: 0, durationSeconds: 0.08, type: 'square', vol: 0.15 },
      { freq: 659, delayMs: 80, durationSeconds: 0.08, type: 'square', vol: 0.15 },
      { freq: 784, delayMs: 160, durationSeconds: 0.12, type: 'square', vol: 0.2 },
    ]);
  }

  public static playEatGhost(): void {
    SoundEngine.playSequence([
      { freq: 200, delayMs: 0, durationSeconds: 0.06, type: 'sawtooth', vol: 0.2 },
      { freq: 400, delayMs: 60, durationSeconds: 0.06, type: 'sawtooth', vol: 0.2 },
      { freq: 800, delayMs: 120, durationSeconds: 0.1, type: 'square', vol: 0.2 },
    ]);
  }

  public static playDeath(): void {
    SoundEngine.playSequence([
      { freq: 500, delayMs: 0, durationSeconds: 0.1, type: 'triangle', vol: 0.15 },
      { freq: 400, delayMs: 100, durationSeconds: 0.1, type: 'triangle', vol: 0.15 },
      { freq: 300, delayMs: 200, durationSeconds: 0.1, type: 'triangle', vol: 0.15 },
      { freq: 200, delayMs: 300, durationSeconds: 0.2, type: 'sawtooth', vol: 0.15 },
    ]);
  }

  public static playLevelClear(): void {
    SoundEngine.playSequence([
      { freq: 440, delayMs: 0, durationSeconds: 0.1, type: 'square', vol: 0.15 },
      { freq: 554, delayMs: 100, durationSeconds: 0.1, type: 'square', vol: 0.15 },
      { freq: 659, delayMs: 200, durationSeconds: 0.1, type: 'square', vol: 0.15 },
      { freq: 880, delayMs: 300, durationSeconds: 0.3, type: 'square', vol: 0.2 },
    ]);
  }
}
