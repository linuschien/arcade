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
   * Authentic Game Start Intro Fanfare (32-Note Authentic 1980 Pac-Man Theme).
   */
  public playGameStart(): void {
    const melody = [
      // Measure 1: B Major
      { freq: 493.88, delayMs: 0,    durationSeconds: 0.1, type: 'square' as OscillatorType, vol: 0.08 },  // B4
      { freq: 987.77, delayMs: 110,  durationSeconds: 0.1, type: 'square' as OscillatorType, vol: 0.08 },  // B5
      { freq: 739.99, delayMs: 220,  durationSeconds: 0.1, type: 'square' as OscillatorType, vol: 0.08 },  // F#5
      { freq: 622.25, delayMs: 330,  durationSeconds: 0.1, type: 'square' as OscillatorType, vol: 0.08 },  // D#5
      { freq: 987.77, delayMs: 440,  durationSeconds: 0.07, type: 'square' as OscillatorType, vol: 0.08 }, // B5
      { freq: 739.99, delayMs: 510,  durationSeconds: 0.14, type: 'square' as OscillatorType, vol: 0.08 }, // F#5
      { freq: 622.25, delayMs: 650,  durationSeconds: 0.2, type: 'square' as OscillatorType, vol: 0.08 },  // D#5

      // Measure 2: C Major
      { freq: 523.25, delayMs: 870,  durationSeconds: 0.1, type: 'square' as OscillatorType, vol: 0.08 },  // C5
      { freq: 1046.5, delayMs: 980,  durationSeconds: 0.1, type: 'square' as OscillatorType, vol: 0.08 },  // C6
      { freq: 783.99, delayMs: 1090, durationSeconds: 0.1, type: 'square' as OscillatorType, vol: 0.08 },  // G5
      { freq: 659.25, delayMs: 1200, durationSeconds: 0.1, type: 'square' as OscillatorType, vol: 0.08 },  // E5
      { freq: 1046.5, delayMs: 1310, durationSeconds: 0.07, type: 'square' as OscillatorType, vol: 0.08 }, // C6
      { freq: 783.99, delayMs: 1380, durationSeconds: 0.14, type: 'square' as OscillatorType, vol: 0.08 }, // G5
      { freq: 659.25, delayMs: 1520, durationSeconds: 0.2, type: 'square' as OscillatorType, vol: 0.08 },  // E5

      // Measure 3: B Major Repeat
      { freq: 493.88, delayMs: 1740, durationSeconds: 0.1, type: 'square' as OscillatorType, vol: 0.08 },  // B4
      { freq: 987.77, delayMs: 1850, durationSeconds: 0.1, type: 'square' as OscillatorType, vol: 0.08 },  // B5
      { freq: 739.99, delayMs: 1960, durationSeconds: 0.1, type: 'square' as OscillatorType, vol: 0.08 },  // F#5
      { freq: 622.25, delayMs: 2070, durationSeconds: 0.1, type: 'square' as OscillatorType, vol: 0.08 },  // D#5
      { freq: 987.77, delayMs: 2180, durationSeconds: 0.07, type: 'square' as OscillatorType, vol: 0.08 }, // B5
      { freq: 739.99, delayMs: 2250, durationSeconds: 0.14, type: 'square' as OscillatorType, vol: 0.08 }, // F#5
      { freq: 622.25, delayMs: 2390, durationSeconds: 0.2, type: 'square' as OscillatorType, vol: 0.08 },  // D#5

      // Measure 4: Ascending Finale Cadence
      { freq: 622.25, delayMs: 2610, durationSeconds: 0.09, type: 'square' as OscillatorType, vol: 0.08 }, // D#5
      { freq: 659.25, delayMs: 2700, durationSeconds: 0.09, type: 'square' as OscillatorType, vol: 0.08 }, // E5
      { freq: 698.46, delayMs: 2790, durationSeconds: 0.09, type: 'square' as OscillatorType, vol: 0.08 }, // F5
      { freq: 739.99, delayMs: 2880, durationSeconds: 0.09, type: 'square' as OscillatorType, vol: 0.08 }, // F#5
      { freq: 783.99, delayMs: 2970, durationSeconds: 0.09, type: 'square' as OscillatorType, vol: 0.08 }, // G5
      { freq: 830.61, delayMs: 3060, durationSeconds: 0.09, type: 'square' as OscillatorType, vol: 0.08 }, // G#5
      { freq: 880.00, delayMs: 3150, durationSeconds: 0.09, type: 'square' as OscillatorType, vol: 0.08 }, // A5
      { freq: 987.77, delayMs: 3240, durationSeconds: 0.45, type: 'square' as OscillatorType, vol: 0.10 }, // B5 (Final Held Note!)
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
      volume: 0.05,
    });
  }

  /**
   * Power Pellet Eat Chime.
   */
  public playPowerPellet(): void {
    SoundEngine.playTone({
      type: 'sine',
      frequency: 600,
      targetFrequency: 1200,
      durationSeconds: 0.15,
      volume: 0.08,
    });
  }

  /**
   * Eat Ghost Multiplier Chime.
   */
  public playEatGhost(): void {
    const seq = [
      { freq: 440, delayMs: 0, durationSeconds: 0.06, type: 'square' as OscillatorType, vol: 0.10 },
      { freq: 880, delayMs: 60, durationSeconds: 0.1, type: 'square' as OscillatorType, vol: 0.10 },
    ];
    SoundEngine.playSequence(seq);
  }

  /**
   * Eat Fruit Arpeggio.
   */
  public playEatFruit(): void {
    const seq = [
      { freq: 523.25, delayMs: 0, durationSeconds: 0.05, type: 'triangle' as OscillatorType, vol: 0.10 },
      { freq: 659.25, delayMs: 50, durationSeconds: 0.05, type: 'triangle' as OscillatorType, vol: 0.10 },
      { freq: 783.99, delayMs: 100, durationSeconds: 0.05, type: 'triangle' as OscillatorType, vol: 0.10 },
      { freq: 1046.5, delayMs: 150, durationSeconds: 0.12, type: 'triangle' as OscillatorType, vol: 0.10 },
    ];
    SoundEngine.playSequence(seq);
  }

  /**
   * Extra Life 1UP Chime (High Pitch Ascending Sweep).
   */
  public playExtraLife(): void {
    const seq = [
      { freq: 880, delayMs: 0, durationSeconds: 0.08, type: 'square' as OscillatorType, vol: 0.10 },
      { freq: 1174.66, delayMs: 80, durationSeconds: 0.08, type: 'square' as OscillatorType, vol: 0.10 },
      { freq: 1396.91, delayMs: 160, durationSeconds: 0.08, type: 'square' as OscillatorType, vol: 0.10 },
      { freq: 1760, delayMs: 240, durationSeconds: 0.2, type: 'square' as OscillatorType, vol: 0.12 },
    ];
    SoundEngine.playSequence(seq);
  }

  /**
   * Authentic Pac-Man Death Tune (13-Note Downward Pitch Drop + 2 Final Pop Notes).
   */
  public playDeath(): void {
    const deathSeq = [
      // 11 Downward Pitch Drops
      { freq: 520, delayMs: 0,    durationSeconds: 0.08, type: 'sawtooth' as OscillatorType, vol: 0.10 },
      { freq: 480, delayMs: 80,   durationSeconds: 0.08, type: 'sawtooth' as OscillatorType, vol: 0.10 },
      { freq: 440, delayMs: 160,  durationSeconds: 0.08, type: 'sawtooth' as OscillatorType, vol: 0.10 },
      { freq: 400, delayMs: 240,  durationSeconds: 0.08, type: 'sawtooth' as OscillatorType, vol: 0.10 },
      { freq: 350, delayMs: 320,  durationSeconds: 0.08, type: 'sawtooth' as OscillatorType, vol: 0.10 },
      { freq: 300, delayMs: 400,  durationSeconds: 0.08, type: 'sawtooth' as OscillatorType, vol: 0.10 },
      { freq: 250, delayMs: 480,  durationSeconds: 0.08, type: 'sawtooth' as OscillatorType, vol: 0.10 },
      { freq: 200, delayMs: 560,  durationSeconds: 0.08, type: 'sawtooth' as OscillatorType, vol: 0.10 },
      { freq: 160, delayMs: 640,  durationSeconds: 0.08, type: 'sawtooth' as OscillatorType, vol: 0.10 },
      { freq: 120, delayMs: 720,  durationSeconds: 0.10, type: 'sawtooth' as OscillatorType, vol: 0.10 },
      { freq: 80,  delayMs: 830,  durationSeconds: 0.15, type: 'sawtooth' as OscillatorType, vol: 0.10 },

      // 2 Final Authentic High-Pitch Pop/Plink Finish Chirps (Pac-Man Disappears)
      { freq: 659.25, delayMs: 1040, durationSeconds: 0.08, type: 'square' as OscillatorType, vol: 0.11 }, // High E5 Pop 1
      { freq: 987.77, delayMs: 1140, durationSeconds: 0.12, type: 'square' as OscillatorType, vol: 0.12 }, // High B5 Pop 2
    ];
    SoundEngine.playSequence(deathSeq);
  }

  /**
   * Level Clear Victory Chime.
   */
  public playLevelClear(): void {
    const seq = [
      { freq: 523.25, delayMs: 0, durationSeconds: 0.1, type: 'sine' as OscillatorType, vol: 0.09 },
      { freq: 659.25, delayMs: 100, durationSeconds: 0.1, type: 'sine' as OscillatorType, vol: 0.09 },
      { freq: 783.99, delayMs: 200, durationSeconds: 0.1, type: 'sine' as OscillatorType, vol: 0.09 },
      { freq: 1046.5, delayMs: 300, durationSeconds: 0.3, type: 'sine' as OscillatorType, vol: 0.09 },
    ];
    SoundEngine.playSequence(seq);
  }

  /**
   * Background Siren Loop.
   */
  public startSiren(isFrightened: boolean = false): void {
    this.stopSiren();
    this.isFrightenedSiren = isFrightened;

    this.sirenTimer = setInterval(() => {
      if (this.isFrightenedSiren) {
        // Frightened siren: Low alternating pulse (150Hz / 120Hz)
        const freq = this.sirenPitchOffset % 2 === 0 ? 150 : 120;
        this.sirenPitchOffset++;
        SoundEngine.playTone({
          type: 'sawtooth',
          frequency: freq,
          durationSeconds: 0.18,
          volume: 0.05,
        });
      } else {
        // Normal siren: Rising pitch oscillation (200Hz -> 300Hz)
        const freq = 200 + (this.sirenPitchOffset % 5) * 20;
        this.sirenPitchOffset++;
        SoundEngine.playTone({
          type: 'triangle',
          frequency: freq,
          durationSeconds: 0.12,
          volume: 0.04,
        });
      }
    }, 200);
  }

  public setFrightenedSiren(isFrightened: boolean): void {
    if (this.isFrightenedSiren !== isFrightened) {
      this.startSiren(isFrightened);
    }
  }

  public stopSiren(): void {
    if (this.sirenTimer) {
      clearInterval(this.sirenTimer);
      this.sirenTimer = null;
    }
  }
}

export const PacmanAudioService = new PacmanAudioServiceImpl();
