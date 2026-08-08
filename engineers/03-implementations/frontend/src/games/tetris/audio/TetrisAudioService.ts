/**
 * TetrisAudioService.ts
 * Game-specific audio & BGM synthesizer for Tetris.
 * Located in games/tetris/audio/ to maintain modular arcade architecture.
 */

import { SoundEngine } from '@/core/audio/SoundEngine';

class TetrisAudioServiceImpl {
  private bgmTimer: any = null;
  private currentBgmNoteIndex: number = 0;
  private currentBgmTempoMs: number = 220; // Base tempo for Korobeiniki

  // Classic Korobeiniki (Tetris Type A) melody notes (frequency in Hz)
  private readonly korobeinikiMelody: { note: number; durationRatio: number }[] = [
    { note: 659.25, durationRatio: 1 },   // E5
    { note: 493.88, durationRatio: 0.5 }, // B4
    { note: 523.25, durationRatio: 0.5 }, // C5
    { note: 587.33, durationRatio: 1 },   // D5
    { note: 523.25, durationRatio: 0.5 }, // C5
    { note: 493.88, durationRatio: 0.5 }, // B4
    { note: 440.00, durationRatio: 1 },   // A4
    { note: 440.00, durationRatio: 0.5 }, // A4
    { note: 523.25, durationRatio: 0.5 }, // C5
    { note: 659.25, durationRatio: 1 },   // E5
    { note: 587.33, durationRatio: 0.5 }, // D5
    { note: 523.25, durationRatio: 0.5 }, // C5
    { note: 493.88, durationRatio: 1.5 }, // B4
    { note: 523.25, durationRatio: 0.5 }, // C5
    { note: 587.33, durationRatio: 1 },   // D5
    { note: 659.25, durationRatio: 1 },   // E5
    { note: 523.25, durationRatio: 1 },   // C5
    { note: 440.00, durationRatio: 1 },   // A4
    { note: 440.00, durationRatio: 1 },   // A4
    { note: 0, durationRatio: 0.5 },      // Pause
    { note: 587.33, durationRatio: 1 },   // D5
    { note: 698.46, durationRatio: 0.5 }, // F5
    { note: 880.00, durationRatio: 1 },   // A5
    { note: 783.99, durationRatio: 0.5 }, // G5
    { note: 698.46, durationRatio: 0.5 }, // F5
    { note: 659.25, durationRatio: 1.5 }, // E5
    { note: 523.25, durationRatio: 0.5 }, // C5
    { note: 659.25, durationRatio: 1 },   // E5
    { note: 587.33, durationRatio: 0.5 }, // D5
    { note: 523.25, durationRatio: 0.5 }, // C5
    { note: 493.88, durationRatio: 1 },   // B4
    { note: 493.88, durationRatio: 0.5 }, // B4
    { note: 523.25, durationRatio: 0.5 }, // C5
    { note: 587.33, durationRatio: 1 },   // D5
    { note: 659.25, durationRatio: 1 },   // E5
    { note: 523.25, durationRatio: 1 },   // C5
    { note: 440.00, durationRatio: 1 },   // A4
    { note: 440.00, durationRatio: 1 },   // A4
    { note: 0, durationRatio: 1 },        // Rest
  ];

  public playMove(): void {
    SoundEngine.playTone({
      type: 'square',
      frequency: 600,
      durationSeconds: 0.03,
      volume: 0.08,
    });
  }

  public playRotate(): void {
    SoundEngine.playTone({
      type: 'square',
      frequency: 400,
      targetFrequency: 800,
      durationSeconds: 0.04,
      volume: 0.1,
    });
  }

  public playHardDrop(): void {
    SoundEngine.playTone({
      type: 'triangle',
      frequency: 160,
      targetFrequency: 40,
      durationSeconds: 0.08,
      volume: 0.25,
    });
  }

  public playLineClear(linesCount: number): void {
    const isTetris = linesCount >= 4;
    const freqs = isTetris
      ? [523.25, 659.25, 783.99, 1046.5] // Tetris Fanfare
      : [523.25, 659.25, 783.99];

    SoundEngine.playSequence(
      freqs.map((freq, idx) => ({
        freq,
        delayMs: idx * 60,
        durationSeconds: 0.12,
        type: 'square',
        vol: 0.15,
      }))
    );
  }

  public playGameOver(): void {
    const freqs = [329.63, 293.66, 261.63, 246.94];
    SoundEngine.playSequence(
      freqs.map((freq, idx) => ({
        freq,
        delayMs: idx * 120,
        durationSeconds: 0.15,
        type: 'sawtooth',
        vol: 0.15,
      }))
    );
  }

  public startBgm(level: number = 1): void {
    if (SoundEngine.isMutedState() || this.bgmTimer) return;
    this.currentBgmTempoMs = Math.max(120, 220 - (level - 1) * 8);
    this.currentBgmNoteIndex = 0;
    this.scheduleNextBgmNote();
  }

  public updateBgmTempo(level: number): void {
    this.currentBgmTempoMs = Math.max(120, 220 - (level - 1) * 8);
  }

  public stopBgm(): void {
    if (this.bgmTimer) {
      clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  private scheduleNextBgmNote(): void {
    if (SoundEngine.isMutedState()) return;

    const item = this.korobeinikiMelody[this.currentBgmNoteIndex];
    if (item && item.note > 0) {
      const duration = (item.durationRatio * this.currentBgmTempoMs) / 1000;
      SoundEngine.playTone({
        type: 'square',
        frequency: item.note,
        durationSeconds: duration * 0.9,
        volume: 0.035,
      });
    }

    const delay = item ? item.durationRatio * this.currentBgmTempoMs : 200;
    this.currentBgmNoteIndex = (this.currentBgmNoteIndex + 1) % this.korobeinikiMelody.length;

    this.bgmTimer = setTimeout(() => {
      this.scheduleNextBgmNote();
    }, delay);
  }
}

export const TetrisAudioService = new TetrisAudioServiceImpl();
