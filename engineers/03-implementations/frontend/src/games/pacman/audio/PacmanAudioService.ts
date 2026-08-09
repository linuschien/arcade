/**
 * PacmanAudioService.ts
 * Authentic 8-Bit Arcade Synthesizer for Pac-Man sound effects and Background Siren.
 * Implements classic pitch sweeps for wakka-wakka, background siren loop, and death tune.
 */

import { SoundEngine } from '@/core/audio/SoundEngine';

class PacmanAudioServiceImpl {
  private toggleWakka: boolean = false;
  private sirenTimer: any = null;
  private isFrightenedSiren: boolean = false;
  private sirenPitchOffset: number = 0;

  /**
   * Authentic Game Start Intro Fanfare (16-Note Pac-Man Theme).
   */
  public playGameStart(): void {
    const melody = [
      { freq: 493.88, delayMs: 0, durationSeconds: 0.12, type: 'square' as OscillatorType, vol: 0.15 },  // B4
      { freq: 987.77, delayMs: 120, durationSeconds: 0.12, type: 'square' as OscillatorType, vol: 0.15 }, // B5
      { freq: 739.99, delayMs: 240, durationSeconds: 0.12, type: 'square' as OscillatorType, vol: 0.15 }, // F#5
      { freq: 622.25, delayMs: 360, durationSeconds: 0.12, type: 'square' as OscillatorType, vol: 0.15 }, // D#5
      { freq: 987.77, delayMs: 480, durationSeconds: 0.08, type: 'square' as OscillatorType, vol: 0.15 }, // B5
      { freq: 739.99, delayMs: 560, durationSeconds: 0.16, type: 'square' as OscillatorType, vol: 0.15 }, // F#5
      { freq: 622.25, delayMs: 720, durationSeconds: 0.2, type: 'square' as OscillatorType, vol: 0.15 },  // D#5

      { freq: 523.25, delayMs: 960, durationSeconds: 0.12, type: 'square' as OscillatorType, vol: 0.15 },  // C5
      { freq: 1046.5, delayMs: 1080, durationSeconds: 0.12, type: 'square' as OscillatorType, vol: 0.15 }, // C6
      { freq: 783.99, delayMs: 1200, durationSeconds: 0.12, type: 'square' as OscillatorType, vol: 0.15 }, // G5
      { freq: 659.25, delayMs: 1320, durationSeconds: 0.12, type: 'square' as OscillatorType, vol: 0.15 }, // E5
      { freq: 1046.5, delayMs: 1440, durationSeconds: 0.08, type: 'square' as OscillatorType, vol: 0.15 }, // C6
      { freq: 783.99, delayMs: 1520, durationSeconds: 0.16, type: 'square' as OscillatorType, vol: 0.15 }, // G5
      { freq: 659.25, delayMs: 1680, durationSeconds: 0.2, type: 'square' as OscillatorType, vol: 0.15 },  // E5
    ];

    SoundEngine.playSequence(melody);
  }

  /**
   * Authentic WAKKA-WAKKA eating pitch sweep.
   * Alternates between a downward frequency sweep and an upward frequency sweep.
   */
  public playWakka(): void {
    const startFreq = this.toggleWakka ? 480 : 240;
    const targetFreq = this.toggleWakka ? 240 : 480;
    this.toggleWakka = !this.toggleWakka;

    SoundEngine.playTone({
      type: 'square',
      frequency: startFreq,
      targetFrequency: targetFreq,
      durationSeconds: 0.045,
      volume: 0.12,
    });
  }

  /**
   * Power Pellet Eat Chime.
   */
  public playPowerPellet(): void {
    SoundEngine.playSequence([
      { freq: 280, delayMs: 0, durationSeconds: 0.06, type: 'sawtooth', vol: 0.15 },
      { freq: 420, delayMs: 60, durationSeconds: 0.06, type: 'square', vol: 0.18 },
      { freq: 640, delayMs: 120, durationSeconds: 0.08, type: 'square', vol: 0.2 },
    ]);
  }

  /**
   * Bonus Fruit Eat Chime.
   */
  public playEatFruit(): void {
    SoundEngine.playSequence([
      { freq: 523.25, delayMs: 0, durationSeconds: 0.06, type: 'square', vol: 0.18 },
      { freq: 659.25, delayMs: 60, durationSeconds: 0.06, type: 'square', vol: 0.18 },
      { freq: 783.99, delayMs: 120, durationSeconds: 0.06, type: 'square', vol: 0.2 },
      { freq: 1046.5, delayMs: 180, durationSeconds: 0.12, type: 'square', vol: 0.22 },
    ]);
  }

  /**
   * Ghost Eat Multiplier Sound.
   */
  public playEatGhost(): void {
    SoundEngine.playSequence([
      { freq: 250, delayMs: 0, durationSeconds: 0.05, type: 'sawtooth', vol: 0.2 },
      { freq: 500, delayMs: 50, durationSeconds: 0.05, type: 'sawtooth', vol: 0.22 },
      { freq: 1000, delayMs: 100, durationSeconds: 0.05, type: 'square', vol: 0.25 },
      { freq: 1500, delayMs: 150, durationSeconds: 0.08, type: 'square', vol: 0.25 },
    ]);
  }

  /**
   * Authentic Classic Pac-Man Death Tune (11-Step Pitch Drop).
   */
  public playDeath(): void {
    const deathNotes = [
      { freq: 750, delayMs: 0, durationSeconds: 0.07, type: 'triangle' as OscillatorType, vol: 0.18 },
      { freq: 680, delayMs: 70, durationSeconds: 0.07, type: 'triangle' as OscillatorType, vol: 0.18 },
      { freq: 600, delayMs: 140, durationSeconds: 0.07, type: 'triangle' as OscillatorType, vol: 0.18 },
      { freq: 520, delayMs: 210, durationSeconds: 0.07, type: 'triangle' as OscillatorType, vol: 0.18 },
      { freq: 450, delayMs: 280, durationSeconds: 0.07, type: 'triangle' as OscillatorType, vol: 0.18 },
      { freq: 380, delayMs: 350, durationSeconds: 0.07, type: 'triangle' as OscillatorType, vol: 0.18 },
      { freq: 320, delayMs: 420, durationSeconds: 0.07, type: 'triangle' as OscillatorType, vol: 0.18 },
      { freq: 260, delayMs: 490, durationSeconds: 0.07, type: 'triangle' as OscillatorType, vol: 0.18 },
      { freq: 200, delayMs: 560, durationSeconds: 0.07, type: 'sawtooth' as OscillatorType, vol: 0.18 },
      { freq: 140, delayMs: 630, durationSeconds: 0.07, type: 'sawtooth' as OscillatorType, vol: 0.18 },
      { freq: 80, delayMs: 700, durationSeconds: 0.12, type: 'sawtooth' as OscillatorType, vol: 0.2 },
      { freq: 50, delayMs: 820, durationSeconds: 0.15, type: 'square' as OscillatorType, vol: 0.22 },
    ];

    SoundEngine.playSequence(deathNotes);
  }

  /**
   * Stage Clear Fanfare.
   */
  public playLevelClear(): void {
    SoundEngine.playSequence([
      { freq: 440, delayMs: 0, durationSeconds: 0.08, type: 'square', vol: 0.15 },
      { freq: 554, delayMs: 80, durationSeconds: 0.08, type: 'square', vol: 0.15 },
      { freq: 659, delayMs: 160, durationSeconds: 0.08, type: 'square', vol: 0.18 },
      { freq: 880, delayMs: 240, durationSeconds: 0.2, type: 'square', vol: 0.22 },
    ]);
  }

  /**
   * Start Arcade Background Siren Loop.
   */
  public startSiren(isFrightened: boolean = false): void {
    if (this.sirenTimer) return;
    this.isFrightenedSiren = isFrightened;
    this.scheduleSirenLoop();
  }

  public setFrightenedSiren(isFrightened: boolean): void {
    this.isFrightenedSiren = isFrightened;
  }

  public stopSiren(): void {
    if (this.sirenTimer) {
      clearTimeout(this.sirenTimer);
      this.sirenTimer = null;
    }
  }

  private scheduleSirenLoop(): void {
    if (SoundEngine.isMutedState()) return;

    if (this.isFrightenedSiren) {
      // Rapid high warble siren
      SoundEngine.playTone({
        type: 'sawtooth',
        frequency: 650,
        targetFrequency: 850,
        durationSeconds: 0.12,
        volume: 0.04,
      });
      this.sirenTimer = setTimeout(() => this.scheduleSirenLoop(), 140);
    } else {
      // Classic ambient maze siren pitch sweep
      const baseFreq = 220 + (this.sirenPitchOffset % 4) * 25;
      const targetFreq = baseFreq + 120;
      this.sirenPitchOffset++;

      SoundEngine.playTone({
        type: 'sine',
        frequency: baseFreq,
        targetFrequency: targetFreq,
        durationSeconds: 0.22,
        volume: 0.03,
      });
      this.sirenTimer = setTimeout(() => this.scheduleSirenLoop(), 260);
    }
  }
}

export const PacmanAudioService = new PacmanAudioServiceImpl();
