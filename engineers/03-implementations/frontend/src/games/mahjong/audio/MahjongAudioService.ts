/**
 * MahjongAudioService.ts
 * Authentic Taiwanese Arcade Mahjong Web Audio API Synthesizer.
 * Provides Chinese Guzheng/Light Jazz pentatonic BGM, authentic wood discard strikes,
 * dice rolls, flower chimes, fan tally ticks, and action voices.
 */

import { SoundEngine } from '@/core/audio/SoundEngine';

class MahjongAudioServiceImpl {
  private bgmTimer: any = null;
  private bgmStep: number = 0;
  private isBgmPlaying: boolean = false;

  /**
   * Chinese Pentatonic scale frequencies in Hz (C4, D4, E4, G4, A4, C5, D5, E5, G5, A5)
   */
  private readonly PENTATONIC_SCALE = [
    261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 783.99, 880.0,
  ];

  /**
   * Starts BGM_MAHJONG_PLAY (Guzheng & Soft Jazz Chinese Melody loop).
   */
  public playBGM(): void {
    if (this.isBgmPlaying) return;
    this.isBgmPlaying = true;
    this.bgmStep = 0;

    const melodySteps = [
      0, 2, 4, 7, 4, 2, 0, 4,
      1, 3, 5, 8, 5, 3, 1, 0,
      4, 6, 8, 9, 8, 6, 4, 2,
      0, 3, 7, 9, 7, 4, 2, 0,
    ];

    this.bgmTimer = setInterval(() => {
      if (!this.isBgmPlaying || SoundEngine.isMutedState()) return;

      const noteIdx = melodySteps[this.bgmStep % melodySteps.length];
      const freq = this.PENTATONIC_SCALE[noteIdx % this.PENTATONIC_SCALE.length];

      // Guzheng pluck (triangle oscillator with rapid decay)
      SoundEngine.playTone({
        type: 'triangle',
        frequency: freq,
        durationSeconds: 0.18,
        volume: 0.06,
      });

      // Subtle Soft Jazz acoustic bass pulse on beats 0, 4
      if (this.bgmStep % 4 === 0) {
        SoundEngine.playTone({
          type: 'sine',
          frequency: freq / 2,
          durationSeconds: 0.35,
          volume: 0.08,
        });
      }

      this.bgmStep = (this.bgmStep + 1) % melodySteps.length;
    }, 220);
  }

  /**
   * Stops BGM.
   */
  public stopBGM(): void {
    this.isBgmPlaying = false;
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  /**
   * BGM_VICTORY (Fanfare celebration jingle on Hu).
   */
  public playVictory(): void {
    const fanfare = [
      { freq: 523.25, delayMs: 0, durationSeconds: 0.12, type: 'square' as OscillatorType, vol: 0.16 }, // C5
      { freq: 659.25, delayMs: 120, durationSeconds: 0.12, type: 'square' as OscillatorType, vol: 0.16 }, // E5
      { freq: 783.99, delayMs: 240, durationSeconds: 0.14, type: 'square' as OscillatorType, vol: 0.18 }, // G5
      { freq: 1046.5, delayMs: 380, durationSeconds: 0.45, type: 'square' as OscillatorType, vol: 0.22 }, // C6
    ];
    SoundEngine.playSequence(fanfare);
  }

  /**
   * BGM_GAMEOVER (Game Over descending minor cadence).
   */
  public playGameOver(): void {
    const cadence = [
      { freq: 440.0, delayMs: 0, durationSeconds: 0.18, type: 'sawtooth' as OscillatorType, vol: 0.15 }, // A4
      { freq: 392.0, delayMs: 200, durationSeconds: 0.18, type: 'sawtooth' as OscillatorType, vol: 0.15 }, // G4
      { freq: 349.23, delayMs: 400, durationSeconds: 0.2, type: 'sawtooth' as OscillatorType, vol: 0.15 }, // F4
      { freq: 293.66, delayMs: 620, durationSeconds: 0.5, type: 'sawtooth' as OscillatorType, vol: 0.18 }, // D4
    ];
    SoundEngine.playSequence(cadence);
  }

  /**
   * SFX_TILE_SELECT (Subtle tile pick elevation click).
   */
  public playTileSelect(): void {
    SoundEngine.playTone({
      type: 'sine',
      frequency: 900,
      targetFrequency: 1400,
      durationSeconds: 0.04,
      volume: 0.08,
    });
  }

  /**
   * SFX_TILE_DRAW (Quick subtle tile slide/lift click).
   */
  public playTileDraw(): void {
    SoundEngine.playTone({
      type: 'sine',
      frequency: 620,
      targetFrequency: 980,
      durationSeconds: 0.035,
      volume: 0.07,
    });
  }

  /**
   * SFX_TILE_DISCARD (Crisp, solid wooden table tile strike).
   */
  public playTileDiscard(): void {
    // Two-tone resonant wood strike
    SoundEngine.playTone({
      type: 'triangle',
      frequency: 240,
      targetFrequency: 80,
      durationSeconds: 0.09,
      volume: 0.18,
    });
    SoundEngine.playTone({
      type: 'sawtooth',
      frequency: 600,
      targetFrequency: 120,
      durationSeconds: 0.05,
      volume: 0.12,
    });
  }

  /**
   * SFX_DICE_ROLL (Rattling 3 dice roll in bowl).
   */
  public playDiceRoll(): void {
    const rattle = [
      { freq: 720, delayMs: 0, durationSeconds: 0.04, type: 'triangle' as OscillatorType, vol: 0.12 },
      { freq: 850, delayMs: 50, durationSeconds: 0.04, type: 'triangle' as OscillatorType, vol: 0.14 },
      { freq: 620, delayMs: 110, durationSeconds: 0.04, type: 'triangle' as OscillatorType, vol: 0.12 },
      { freq: 940, delayMs: 180, durationSeconds: 0.06, type: 'triangle' as OscillatorType, vol: 0.15 },
    ];
    SoundEngine.playSequence(rattle);
  }

  /**
   * SFX_TILE_SORT (Crisp shuffling / card sorting cascade sound).
   */
  public playTileSort(): void {
    const sweep = [
      { freq: 400, delayMs: 0, durationSeconds: 0.04, type: 'triangle' as OscillatorType, vol: 0.1 },
      { freq: 600, delayMs: 35, durationSeconds: 0.04, type: 'triangle' as OscillatorType, vol: 0.12 },
      { freq: 850, delayMs: 70, durationSeconds: 0.05, type: 'triangle' as OscillatorType, vol: 0.14 },
      { freq: 1100, delayMs: 110, durationSeconds: 0.06, type: 'sine' as OscillatorType, vol: 0.12 },
    ];
    SoundEngine.playSequence(sweep);
  }

  private lastFlowerSpeechTime: number = 0;

  /**
   * SFX_FLOWER_REPLACE (Chinese voice "補花" + crisp bell chime for flower replacement).
   */
  public playFlowerReplace(): Promise<void> {
    const chime = [
      { freq: 880.0, delayMs: 0, durationSeconds: 0.08, type: 'sine' as OscillatorType, vol: 0.12 }, // A5
      { freq: 1318.51, delayMs: 80, durationSeconds: 0.25, type: 'sine' as OscillatorType, vol: 0.16 }, // E6
    ];
    SoundEngine.playSequence(chime);

    const now = Date.now();
    if (now - this.lastFlowerSpeechTime > 800) {
      this.lastFlowerSpeechTime = now;
      return this.speakOrTone('補花', [880, 1318.51]);
    }
    return Promise.resolve();
  }

  /**
   * SFX_FAN_TALLY (Rapid score roll tick on settlement).
   */
  public playFanTally(): void {
    SoundEngine.playTone({
      type: 'square',
      frequency: 1200,
      durationSeconds: 0.03,
      volume: 0.1,
    });
  }

  private activeVoicePromise: Promise<void> | null = null;

  /**
   * Waits for the currently active speech/voice announcement to finish playing before proceeding.
   */
  public waitForVoiceComplete(): Promise<void> {
    if (!this.activeVoicePromise) return Promise.resolve();
    return this.activeVoicePromise;
  }

  /**
   * Immediately stops any ongoing speech synthesis announcement.
   */
  public stopVoice(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore
      }
    }
    this.activeVoicePromise = null;
  }

  /**
   * VOICE Announcements with speech synthesis or distinctive audio chords.
   */
  private speakOrTone(text: string, frequencies: number[]): Promise<void> {
    const p = new Promise<void>((resolve) => {
      let resolved = false;
      const done = () => {
        if (!resolved) {
          resolved = true;
          resolve();
        }
      };

      // Always play distinctive audio signature
      frequencies.forEach((freq) => {
        SoundEngine.playTone({
          type: 'square',
          frequency: freq,
          durationSeconds: 0.12,
          volume: 0.14,
        });
      });

      if (typeof window !== 'undefined' && 'speechSynthesis' in window && !SoundEngine.isMutedState()) {
        try {
          // Cancel any previous queued speech to prevent backlog / speech overlap
          window.speechSynthesis.cancel();
          const u = new SpeechSynthesisUtterance(text);
          u.lang = 'zh-TW';
          u.rate = 1.2;
          u.volume = 0.8;
          u.onend = () => done();
          u.onerror = () => done();
          window.speechSynthesis.speak(u);
          // Safety timeout in case onend doesn't fire
          setTimeout(done, 900);
        } catch {
          setTimeout(done, 300);
        }
      } else {
        setTimeout(done, 300);
      }
    });

    this.activeVoicePromise = p;
    return p;
  }

  public playVoiceChow(): Promise<void> {
    return this.speakOrTone('吃', [440, 554]);
  }

  public playVoicePong(): Promise<void> {
    return this.speakOrTone('碰', [523, 659]);
  }

  public playVoiceKong(): Promise<void> {
    return this.speakOrTone('槓', [587, 880]);
  }

  public playVoiceTing(): Promise<void> {
    return this.speakOrTone('聽', [659, 987]);
  }

  public playVoiceHu(): Promise<void> {
    return this.speakOrTone('胡', [784, 1046]);
  }
}

export const MahjongAudioService = new MahjongAudioServiceImpl();
