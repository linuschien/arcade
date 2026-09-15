/**
 * SokobanAudioService.ts
 * Web Audio procedural synthesizer for Sokoban 50.
 * Synthesizes 4 distinct World Theme BGMs and 8 authentic arcade sound effects.
 * 100% self-contained via SoundEngine with no external audio assets required.
 */

import { SoundEngine } from '@/core/audio/SoundEngine';
import { WorldThemeKey } from '../logic/SokobanLevelSpecs';

class SokobanAudioServiceImpl {
  private bgmTimer: any = null;
  private bgmStep: number = 0;
  private currentTheme: WorldThemeKey | null = null;
  private isBgmPlaying: boolean = false;

  /**
   * Start or switch background music according to world theme key.
   */
  public playWorldBGM(themeKey: WorldThemeKey): void {
    if (this.isBgmPlaying && this.currentTheme === themeKey) {
      return;
    }

    this.stopBGM();
    this.isBgmPlaying = true;
    this.currentTheme = themeKey;
    this.bgmStep = 0;

    switch (themeKey) {
      case 'cargo_depot':
        this.startCargoWarmthLoop();
        break;
      case 'cyber_vault':
        this.startCyberPulseLoop();
        break;
      case 'steel_works':
        this.startSteelJazzLoop();
        break;
      case 'mega_terminal':
        this.startTerminalVistaLoop();
        break;
    }
  }

  public stopBGM(): void {
    this.isBgmPlaying = false;
    this.currentTheme = null;
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  // --- 4 World BGM Synthesizers ---

  // World 1: Cargo Warmth (88 BPM -> ~170ms 16th note, warm C Major triangle arpeggios)
  private startCargoWarmthLoop(): void {
    const scale = [261.63, 329.63, 392.0, 523.25]; // C4, E4, G4, C5
    this.bgmTimer = setInterval(() => {
      if (!this.isBgmPlaying || SoundEngine.isMutedState()) return;
      const note = scale[this.bgmStep % scale.length];

      SoundEngine.playTone({
        type: 'triangle',
        frequency: note,
        durationSeconds: 0.12,
        volume: 0.04,
      });

      if (this.bgmStep % 4 === 0) {
        SoundEngine.playTone({
          type: 'sine',
          frequency: note / 2,
          durationSeconds: 0.2,
          volume: 0.06,
        });
      }
      this.bgmStep = (this.bgmStep + 1) % 16;
    }, 170);
  }

  // World 2: Cyber Pulse (118 BPM -> ~127ms 16th note, D Minor techno synth pulse)
  private startCyberPulseLoop(): void {
    const scale = [293.66, 349.23, 440.0, 587.33, 440.0, 349.23]; // D4, F4, A4, D5, A4, F4
    this.bgmTimer = setInterval(() => {
      if (!this.isBgmPlaying || SoundEngine.isMutedState()) return;
      const note = scale[this.bgmStep % scale.length];

      SoundEngine.playTone({
        type: 'sawtooth',
        frequency: note,
        durationSeconds: 0.08,
        volume: 0.03,
      });

      if (this.bgmStep % 2 === 0) {
        SoundEngine.playTone({
          type: 'square',
          frequency: 146.83, // D3 bass
          durationSeconds: 0.1,
          volume: 0.05,
        });
      }
      this.bgmStep = (this.bgmStep + 1) % 16;
    }, 127);
  }

  // World 3: Steel Works (102 BPM -> ~147ms 16th note, punchy F Blues groove)
  private startSteelJazzLoop(): void {
    const scale = [349.23, 415.3, 466.16, 493.88, 523.25, 622.25]; // F4, Ab4, Bb4, B4, C5, Eb5
    this.bgmTimer = setInterval(() => {
      if (!this.isBgmPlaying || SoundEngine.isMutedState()) return;
      const note = scale[this.bgmStep % scale.length];

      SoundEngine.playTone({
        type: 'square',
        frequency: note,
        durationSeconds: 0.09,
        volume: 0.035,
      });

      if (this.bgmStep % 4 === 0) {
        SoundEngine.playTone({
          type: 'triangle',
          frequency: 87.31, // F2 heavy bass
          durationSeconds: 0.18,
          volume: 0.07,
        });
      }
      this.bgmStep = (this.bgmStep + 1) % 16;
    }, 147);
  }

  // World 4: Terminal Vista (78 BPM -> ~192ms 16th note, atmospheric slow deep maritime pulse)
  private startTerminalVistaLoop(): void {
    const scale = [220.0, 261.63, 329.63, 440.0]; // A3, C4, E4, A4
    this.bgmTimer = setInterval(() => {
      if (!this.isBgmPlaying || SoundEngine.isMutedState()) return;
      const note = scale[this.bgmStep % scale.length];

      SoundEngine.playTone({
        type: 'sine',
        frequency: note,
        durationSeconds: 0.22,
        volume: 0.05,
      });

      if (this.bgmStep % 4 === 0) {
        SoundEngine.playTone({
          type: 'triangle',
          frequency: 55.0, // A1 sub-bass
          durationSeconds: 0.35,
          volume: 0.08,
        });
      }
      this.bgmStep = (this.bgmStep + 1) % 16;
    }, 192);
  }

  // --- 8 Arcade SFX ---

  /** SFX_STEP: Subtle footstep tap (~30ms) */
  public playStep(): void {
    SoundEngine.playTone({
      type: 'triangle',
      frequency: 180,
      durationSeconds: 0.03,
      volume: 0.04,
    });
  }

  /** SFX_PUSH: Heavy crate sliding thump (~80ms) */
  public playPush(): void {
    SoundEngine.playTone({
      type: 'square',
      frequency: 95,
      durationSeconds: 0.08,
      volume: 0.08,
    });
  }

  /** SFX_BOX_TARGET: Crisp harmonic bell chime upon box arriving on goal (~150ms) */
  public playBoxTarget(): void {
    SoundEngine.playSequence([
      { freq: 523.25, delayMs: 0, durationSeconds: 0.08, type: 'sine', vol: 0.08 }, // C5
      { freq: 659.25, delayMs: 60, durationSeconds: 0.12, type: 'sine', vol: 0.1 }, // E5
      { freq: 1046.5, delayMs: 120, durationSeconds: 0.2, type: 'sine', vol: 0.12 }, // C6
    ]);
  }

  /** SFX_UNDO: Distinct downward rewind sweep (~100ms) */
  public playUndo(): void {
    SoundEngine.playTone({
      type: 'sine',
      frequency: 440,
      durationSeconds: 0.09,
      volume: 0.08,
    });
  }

  /** SFX_DEADLOCK_WARN: Two-tone alert beacon (~200ms) */
  public playDeadlockWarn(): void {
    SoundEngine.playSequence([
      { freq: 880.0, delayMs: 0, durationSeconds: 0.08, type: 'square', vol: 0.07 }, // A5
      { freq: 659.25, delayMs: 100, durationSeconds: 0.12, type: 'square', vol: 0.09 }, // E5
    ]);
  }

  /** SFX_TIMEOUT: Low soft timeout thud (~300ms) */
  public playTimeout(): void {
    SoundEngine.playTone({
      type: 'sawtooth',
      frequency: 110.0,
      durationSeconds: 0.3,
      volume: 0.08,
    });
  }

  /** SFX_EXTEND: 1UP 100,000 pts golden fanfare (~500ms) */
  public playExtend(): void {
    SoundEngine.playSequence([
      { freq: 523.25, delayMs: 0, durationSeconds: 0.08, type: 'square', vol: 0.1 }, // C5
      { freq: 659.25, delayMs: 90, durationSeconds: 0.08, type: 'square', vol: 0.1 }, // E5
      { freq: 783.99, delayMs: 180, durationSeconds: 0.08, type: 'square', vol: 0.12 }, // G5
      { freq: 1046.5, delayMs: 270, durationSeconds: 0.25, type: 'square', vol: 0.15 }, // C6
    ]);
  }

  /** SFX_STAGE_CLEAR: Victorious level clear fanfare (~1.0s) */
  public playStageClear(): void {
    SoundEngine.playSequence([
      { freq: 440.0, delayMs: 0, durationSeconds: 0.1, type: 'triangle', vol: 0.1 }, // A4
      { freq: 554.37, delayMs: 100, durationSeconds: 0.1, type: 'triangle', vol: 0.1 }, // C#5
      { freq: 659.25, delayMs: 200, durationSeconds: 0.12, type: 'triangle', vol: 0.12 }, // E5
      { freq: 880.0, delayMs: 320, durationSeconds: 0.4, type: 'triangle', vol: 0.15 }, // A5
    ]);
  }
}

export const SokobanAudioService = new SokobanAudioServiceImpl();

