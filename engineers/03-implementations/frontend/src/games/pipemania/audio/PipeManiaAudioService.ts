/**
 * PipeManiaAudioService.ts
 * Authentic 8-Bit Arcade Synthesizer for Pipe Mania.
 * Synthesizes all BGM and SFX dynamically via SoundEngine without external asset files.
 */

import { SoundEngine } from '@/core/audio/SoundEngine';

class PipeManiaAudioServiceImpl {
  private bgmTimer: any = null;
  private bgmStep: number = 0;
  private isBgmPlaying: boolean = false;

  /**
   * BGM_STAGE_START (Retro Arcade Opening Fanfare / Jingle, ~1.2s).
   */
  public playStageStart(): void {
    const jingle = [
      { freq: 440.0, delayMs: 0, durationSeconds: 0.08, type: 'square' as OscillatorType, vol: 0.14 }, // A4
      { freq: 554.37, delayMs: 100, durationSeconds: 0.08, type: 'square' as OscillatorType, vol: 0.14 }, // C#5
      { freq: 659.25, delayMs: 200, durationSeconds: 0.1, type: 'square' as OscillatorType, vol: 0.15 }, // E5
      { freq: 880.0, delayMs: 320, durationSeconds: 0.25, type: 'square' as OscillatorType, vol: 0.18 }, // A5
    ];
    SoundEngine.playSequence(jingle);
  }

  /**
   * Start BGM_GAMEPLAY loop.
   */
  public playBGM(): void {
    if (this.isBgmPlaying) return;
    this.isBgmPlaying = true;
    this.bgmStep = 0;

    const chords = [
      // F Major / D Minor Arpeggio
      [349.23, 440.0, 523.25, 698.46], // F4, A4, C5, F5
      [293.66, 349.23, 440.0, 587.33], // D4, F4, A4, D5
      [261.63, 329.63, 392.0, 523.25], // C4, E4, G4, C5
      [392.0, 493.88, 587.33, 783.99], // G4, B4, D5, G5
    ];

    this.bgmTimer = setInterval(() => {
      if (!this.isBgmPlaying || SoundEngine.isMutedState()) return;

      const chordIndex = Math.floor(this.bgmStep / 4) % chords.length;
      const noteIndex = this.bgmStep % 4;
      const freq = chords[chordIndex][noteIndex];

      SoundEngine.playTone({
        type: 'triangle',
        frequency: freq,
        durationSeconds: 0.12,
        volume: 0.05,
      });

      // Subtle Bass pulse on beat 0
      if (noteIndex === 0) {
        SoundEngine.playTone({
          type: 'square',
          frequency: freq / 2,
          durationSeconds: 0.2,
          volume: 0.07,
        });
      }

      this.bgmStep = (this.bgmStep + 1) % 16;
    }, 150);
  }

  /**
   * Stop BGM.
   */
  public stopBGM(): void {
    this.isBgmPlaying = false;
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  /**
   * BGM_VICTORY (Level Clear Jingle).
   */
  public playVictory(): void {
    const melody = [
      { freq: 523.25, delayMs: 0, durationSeconds: 0.1, type: 'square' as OscillatorType, vol: 0.15 }, // C5
      { freq: 659.25, delayMs: 120, durationSeconds: 0.1, type: 'square' as OscillatorType, vol: 0.15 }, // E5
      { freq: 783.99, delayMs: 240, durationSeconds: 0.1, type: 'square' as OscillatorType, vol: 0.15 }, // G5
      { freq: 1046.5, delayMs: 360, durationSeconds: 0.35, type: 'square' as OscillatorType, vol: 0.18 }, // C6
    ];
    SoundEngine.playSequence(melody);
  }

  /**
   * BGM_GAMEOVER (Game Over Cadence).
   */
  public playGameOver(): void {
    const cadence = [
      { freq: 440.0, delayMs: 0, durationSeconds: 0.15, type: 'sawtooth' as OscillatorType, vol: 0.15 }, // A4
      { freq: 415.3, delayMs: 160, durationSeconds: 0.15, type: 'sawtooth' as OscillatorType, vol: 0.15 }, // Ab4
      { freq: 392.0, delayMs: 320, durationSeconds: 0.15, type: 'sawtooth' as OscillatorType, vol: 0.15 }, // G4
      { freq: 349.23, delayMs: 480, durationSeconds: 0.45, type: 'sawtooth' as OscillatorType, vol: 0.18 }, // F4
    ];
    SoundEngine.playSequence(cadence);
  }

  /**
   * SFX_COUNTDOWN_TICK (Timer Tick Pulse).
   */
  public playCountdownTick(): void {
    SoundEngine.playTone({
      type: 'sine',
      frequency: 880,
      targetFrequency: 440,
      durationSeconds: 0.04,
      volume: 0.1,
    });
  }

  /**
   * SFX_PIPE_PLACE (Pipe snap / metal lock).
   */
  public playPipePlace(): void {
    SoundEngine.playTone({
      type: 'triangle',
      frequency: 600,
      targetFrequency: 1200,
      durationSeconds: 0.06,
      volume: 0.14,
    });
  }

  /**
   * SFX_PIPE_REPLACE (Pipe smash / crack).
   */
  public playPipeReplace(): void {
    SoundEngine.playTone({
      type: 'sawtooth',
      frequency: 350,
      targetFrequency: 120,
      durationSeconds: 0.1,
      volume: 0.16,
    });
  }

  /**
   * SFX_FLOW_BUBBLE (Glug-glug flow sound).
   */
  public playFlowBubble(): void {
    SoundEngine.playTone({
      type: 'sine',
      frequency: 320,
      targetFrequency: 580,
      durationSeconds: 0.08,
      volume: 0.12,
    });
  }

  /**
   * SFX_RESERVOIR_FILL (Deep reservoir water filling).
   */
  public playReservoirFill(): void {
    SoundEngine.playTone({
      type: 'triangle',
      frequency: 180,
      targetFrequency: 240,
      durationSeconds: 0.25,
      volume: 0.15,
    });
  }

  /**
   * SFX_FAST_FORWARD (High-frequency jet turbo).
   */
  public playFastForward(): void {
    SoundEngine.playTone({
      type: 'sawtooth',
      frequency: 800,
      targetFrequency: 1600,
      durationSeconds: 0.05,
      volume: 0.08,
    });
  }

  /**
   * SFX_SPILL_BURST (High-pressure liquid spill / burst).
   */
  public playSpillBurst(): void {
    SoundEngine.playTone({
      type: 'sawtooth',
      frequency: 250,
      targetFrequency: 60,
      durationSeconds: 0.4,
      volume: 0.25,
    });
  }

  /**
   * SFX_EXTEND_LIFE (1UP chime).
   */
  public playExtendLife(): void {
    const chime = [
      { freq: 659.25, delayMs: 0, durationSeconds: 0.08, type: 'square' as OscillatorType, vol: 0.15 }, // E5
      { freq: 880.0, delayMs: 90, durationSeconds: 0.08, type: 'square' as OscillatorType, vol: 0.15 }, // A5
      { freq: 1174.66, delayMs: 180, durationSeconds: 0.25, type: 'square' as OscillatorType, vol: 0.2 }, // D6
    ];
    SoundEngine.playSequence(chime);
  }

  /**
   * SFX_LEVEL_CLEAR (Drain whistle).
   */
  public playLevelClear(): void {
    SoundEngine.playTone({
      type: 'sine',
      frequency: 440,
      targetFrequency: 1320,
      durationSeconds: 0.35,
      volume: 0.2,
    });
  }
}

export const PipeManiaAudioService = new PipeManiaAudioServiceImpl();
