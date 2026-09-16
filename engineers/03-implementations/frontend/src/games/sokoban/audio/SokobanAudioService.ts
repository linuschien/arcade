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
    if (this.isBgmPlaying && this.currentTheme === themeKey && this.bgmTimer) {
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

  /**
   * Temporarily pause BGM synthesizer loop during game pause.
   */
  public pauseBGM(): void {
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  /**
   * Resume BGM synthesizer loop when unpausing.
   */
  public resumeBGM(): void {
    if (this.isBgmPlaying && this.currentTheme && !this.bgmTimer) {
      switch (this.currentTheme) {
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
        durationSeconds: 0.13,
        volume: 0.075,
      });

      if (this.bgmStep % 4 === 0) {
        SoundEngine.playTone({
          type: 'sine',
          frequency: note / 2,
          durationSeconds: 0.24,
          volume: 0.10,
        });
      }
      this.bgmStep = (this.bgmStep + 1) % 16;
    }, 170);
  }

  // World 2: Cyber Vault (Ambient Cyber Lounge, 68 BPM -> ~220ms, calm crystalline chime motif)
  private startCyberPulseLoop(): void {
    const scale = [293.66, 392.00, 440.0, 523.25, 440.0, 392.00, 329.63, 293.66]; // D4, G4, A4, C5, A4, G4, E4, D4
    this.bgmTimer = setInterval(() => {
      if (!this.isBgmPlaying || SoundEngine.isMutedState()) return;
      const note = scale[this.bgmStep % scale.length];

      SoundEngine.playTone({
        type: 'sine',
        frequency: note,
        durationSeconds: 0.18,
        volume: 0.08,
      });

      // Deep warm sub-bass pulse on downbeat (every 4 steps)
      if (this.bgmStep % 4 === 0) {
        SoundEngine.playTone({
          type: 'sine',
          frequency: 73.42, // D2 deep sub-bass
          durationSeconds: 0.35,
          volume: 0.11,
        });
      }
      this.bgmStep = (this.bgmStep + 1) % 16;
    }, 220);
  }

  // World 3: Steel Works (94 BPM -> ~160ms 16th note, punchy F Blues groove)
  private startSteelJazzLoop(): void {
    const scale = [349.23, 415.3, 466.16, 493.88, 523.25, 622.25]; // F4, Ab4, Bb4, B4, C5, Eb5
    this.bgmTimer = setInterval(() => {
      if (!this.isBgmPlaying || SoundEngine.isMutedState()) return;
      const note = scale[this.bgmStep % scale.length];

      SoundEngine.playTone({
        type: 'square',
        frequency: note,
        durationSeconds: 0.10,
        volume: 0.07,
      });

      if (this.bgmStep % 4 === 0) {
        SoundEngine.playTone({
          type: 'triangle',
          frequency: 87.31, // F2 heavy bass
          durationSeconds: 0.22,
          volume: 0.11,
        });
      }
      this.bgmStep = (this.bgmStep + 1) % 16;
    }, 160);
  }

  // World 4: Terminal Vista (75 BPM -> ~200ms 16th note, atmospheric slow deep maritime pulse)
  private startTerminalVistaLoop(): void {
    const scale = [220.0, 261.63, 329.63, 440.0]; // A3, C4, E4, A4
    this.bgmTimer = setInterval(() => {
      if (!this.isBgmPlaying || SoundEngine.isMutedState()) return;
      const note = scale[this.bgmStep % scale.length];

      SoundEngine.playTone({
        type: 'sine',
        frequency: note,
        durationSeconds: 0.24,
        volume: 0.08,
      });

      if (this.bgmStep % 4 === 0) {
        SoundEngine.playTone({
          type: 'triangle',
          frequency: 55.0, // A1 sub-bass
          durationSeconds: 0.38,
          volume: 0.12,
        });
      }
      this.bgmStep = (this.bgmStep + 1) % 16;
    }, 200);
  }

  // --- 8 Arcade SFX ---

  /** SFX_STEP: Crisp tactile footstep tap on warehouse floor (~45ms downward sweep) */
  public playStep(): void {
    SoundEngine.playTone({
      type: 'triangle',
      frequency: 360,
      targetFrequency: 160,
      durationSeconds: 0.045,
      volume: 0.10,
    });
  }

  /** SFX_PUSH: Heavy crate sliding thump (~80ms) */
  public playPush(): void {
    SoundEngine.playTone({
      type: 'square',
      frequency: 95,
      durationSeconds: 0.08,
      volume: 0.11,
    });
  }

  /** SFX_BOX_TARGET: Crisp harmonic bell chime upon box arriving on goal (~150ms) */
  public playBoxTarget(): void {
    SoundEngine.playSequence([
      { freq: 523.25, delayMs: 0, durationSeconds: 0.08, type: 'sine', vol: 0.10 }, // C5
      { freq: 659.25, delayMs: 60, durationSeconds: 0.12, type: 'sine', vol: 0.12 }, // E5
      { freq: 1046.5, delayMs: 120, durationSeconds: 0.2, type: 'sine', vol: 0.15 }, // C6
    ]);
  }

  /** SFX_UNDO: Distinct downward rewind sweep (~100ms) */
  public playUndo(): void {
    SoundEngine.playTone({
      type: 'sine',
      frequency: 440,
      durationSeconds: 0.09,
      volume: 0.10,
    });
  }

  /** SFX_DEADLOCK_WARN: Two-tone alert beacon (~200ms) */
  public playDeadlockWarn(): void {
    SoundEngine.playSequence([
      { freq: 880.0, delayMs: 0, durationSeconds: 0.08, type: 'square', vol: 0.09 }, // A5
      { freq: 659.25, delayMs: 100, durationSeconds: 0.12, type: 'square', vol: 0.12 }, // E5
    ]);
  }

  /** SFX_TIMEOUT: Low soft timeout thud (~300ms) */
  public playTimeout(): void {
    SoundEngine.playTone({
      type: 'sawtooth',
      frequency: 110.0,
      durationSeconds: 0.3,
      volume: 0.12,
    });
  }

  /** SFX_EXTEND: 1UP 100,000 pts golden fanfare (~500ms) */
  public playExtend(): void {
    SoundEngine.playSequence([
      { freq: 523.25, delayMs: 0, durationSeconds: 0.08, type: 'square', vol: 0.12 }, // C5
      { freq: 659.25, delayMs: 90, durationSeconds: 0.08, type: 'square', vol: 0.12 }, // E5
      { freq: 783.99, delayMs: 180, durationSeconds: 0.08, type: 'square', vol: 0.14 }, // G5
      { freq: 1046.5, delayMs: 270, durationSeconds: 0.25, type: 'square', vol: 0.18 }, // C6
    ]);
  }

  /** SFX_STAGE_CLEAR: Victorious level clear fanfare (~1.0s) */
  public playStageClear(): void {
    SoundEngine.playSequence([
      { freq: 440.0, delayMs: 0, durationSeconds: 0.1, type: 'triangle', vol: 0.12 }, // A4
      { freq: 554.37, delayMs: 100, durationSeconds: 0.1, type: 'triangle', vol: 0.12 }, // C#5
      { freq: 659.25, delayMs: 200, durationSeconds: 0.12, type: 'triangle', vol: 0.14 }, // E5
      { freq: 880.0, delayMs: 320, durationSeconds: 0.4, type: 'triangle', vol: 0.18 }, // A5
    ]);
  }
}

export const SokobanAudioService = new SokobanAudioServiceImpl();

