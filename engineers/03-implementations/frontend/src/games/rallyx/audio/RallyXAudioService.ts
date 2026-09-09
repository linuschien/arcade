/**
 * RallyXAudioService.ts
 * Authentic 8-Bit Web Audio Synthesizer for New Rally-X.
 * Procedurally generates the iconic 150 BPM theme melody, authentic Game Start fanfare,
 * and retro SFX suite via SoundEngine.
 */

import { SoundEngine } from '@/core/audio/SoundEngine';

export interface NoteEvent {
  step: number;
  durSec: number;
  freq: number;
  type?: OscillatorType;
  vol?: number;
}

class RallyXAudioServiceImpl {
  private bgmInterval: any = null;
  private lowFuelAlarmInterval: any = null;
  private isBgmPlaying: boolean = false;
  private bgmStepIndex: number = 0;
  private alarmToggle: boolean = false;

  /**
   * 150 BPM Authentic New Rally-X Main BGM Melody Map (256 Sixteenth-Note Steps).
   * 1 sixteenth note = 100ms at 150 BPM.
   */
  private readonly bgmMelody: NoteEvent[] = [
    // --- SECTION A: Main Hook (0..127) ---
    { step:   0, durSec: 0.18, freq:  880.00 }, // A5
    { step:   2, durSec: 0.18, freq:  880.00 }, // A5
    { step:   4, durSec: 0.18, freq:  739.99 }, // F#5
    { step:   6, durSec: 0.18, freq:  659.26 }, // E5
    { step:   8, durSec: 0.18, freq:  880.00 }, // A5
    { step:  12, durSec: 0.35, freq: 1046.50 }, // C6
    { step:  16, durSec: 0.18, freq:  880.00 }, // A5
    { step:  18, durSec: 0.18, freq:  880.00 }, // A5
    { step:  20, durSec: 0.18, freq:  739.99 }, // F#5
    { step:  22, durSec: 0.18, freq:  659.26 }, // E5
    { step:  24, durSec: 0.18, freq:  880.00 }, // A5
    { step:  28, durSec: 0.35, freq:  739.99 }, // F#5
    { step:  32, durSec: 0.18, freq:  880.00 }, // A5
    { step:  34, durSec: 0.18, freq:  880.00 }, // A5
    { step:  36, durSec: 0.18, freq:  739.99 }, // F#5
    { step:  38, durSec: 0.18, freq:  659.26 }, // E5
    { step:  40, durSec: 0.18, freq:  880.00 }, // A5
    { step:  42, durSec: 0.18, freq: 1046.50 }, // C6
    { step:  44, durSec: 0.18, freq: 1174.66 }, // D6
    { step:  46, durSec: 0.18, freq: 1244.51 }, // D#6
    { step:  48, durSec: 0.18, freq: 1318.51 }, // E6
    // Trill
    { step:  50, durSec: 0.08, freq: 1244.51 }, // D#6
    { step:  51, durSec: 0.08, freq: 1318.51 }, // E6
    { step:  52, durSec: 0.08, freq: 1244.51 }, // D#6
    { step:  53, durSec: 0.08, freq: 1318.51 }, // E6
    { step:  54, durSec: 0.08, freq: 1244.51 }, // D#6
    { step:  55, durSec: 0.08, freq: 1318.51 }, // E6
    { step:  56, durSec: 0.28, freq: 1318.51 }, // E6
    // Descending run
    { step:  60, durSec: 0.08, freq: 1318.51 }, // E6
    { step:  61, durSec: 0.08, freq: 1174.66 }, // D6
    { step:  62, durSec: 0.08, freq: 1108.73 }, // C#6
    { step:  63, durSec: 0.08, freq:  987.77 }, // B5

    // Repeat Section A Phrase 2
    { step:  64, durSec: 0.18, freq:  880.00 }, // A5
    { step:  66, durSec: 0.18, freq:  880.00 }, // A5
    { step:  68, durSec: 0.18, freq:  739.99 }, // F#5
    { step:  70, durSec: 0.18, freq:  659.26 }, // E5
    { step:  72, durSec: 0.18, freq:  880.00 }, // A5
    { step:  76, durSec: 0.35, freq: 1046.50 }, // C6
    { step:  80, durSec: 0.18, freq:  880.00 }, // A5
    { step:  82, durSec: 0.18, freq:  880.00 }, // A5
    { step:  84, durSec: 0.18, freq:  739.99 }, // F#5
    { step:  86, durSec: 0.18, freq:  659.26 }, // E5
    { step:  88, durSec: 0.18, freq:  880.00 }, // A5
    { step:  92, durSec: 0.35, freq:  739.99 }, // F#5
    { step:  96, durSec: 0.18, freq:  880.00 }, // A5
    { step:  98, durSec: 0.18, freq:  880.00 }, // A5
    { step: 100, durSec: 0.18, freq:  739.99 }, // F#5
    { step: 102, durSec: 0.18, freq:  659.26 }, // E5
    { step: 104, durSec: 0.18, freq:  880.00 }, // A5
    { step: 106, durSec: 0.18, freq: 1046.50 }, // C6
    { step: 108, durSec: 0.18, freq: 1174.66 }, // D6
    { step: 110, durSec: 0.18, freq: 1244.51 }, // D#6
    { step: 112, durSec: 0.18, freq: 1760.00 }, // A6
    { step: 114, durSec: 0.08, freq: 1318.51 }, // E6
    { step: 115, durSec: 0.08, freq: 1174.66 }, // D6
    { step: 116, durSec: 0.18, freq: 1108.73 }, // C#6
    { step: 118, durSec: 0.18, freq:  880.00 }, // A5
    { step: 120, durSec: 0.18, freq:  783.99 }, // G5
    { step: 122, durSec: 0.18, freq:  830.61 }, // G#5
    { step: 124, durSec: 0.28, freq:  880.00 }, // A5

    // --- SECTION B: Famous Chorus (128..255) ---
    { step: 128, durSec: 0.05, freq: 1174.66 }, // D6
    { step: 129, durSec: 0.25, freq: 1318.51 }, // E6
    { step: 132, durSec: 0.18, freq: 1108.73 }, // C#6
    { step: 134, durSec: 0.18, freq: 1318.51 }, // E6
    { step: 136, durSec: 0.18, freq: 1479.98 }, // F#6
    { step: 138, durSec: 0.18, freq: 1108.73 }, // C#6
    { step: 140, durSec: 0.18, freq: 1318.51 }, // E6
    { step: 142, durSec: 0.18, freq: 1479.98 }, // F#6
    { step: 144, durSec: 0.18, freq: 1108.73 }, // C#6
    { step: 146, durSec: 0.18, freq:  987.77 }, // B5
    { step: 148, durSec: 0.18, freq:  880.00 }, // A5
    { step: 150, durSec: 0.18, freq:  739.99 }, // F#5
    { step: 152, durSec: 0.65, freq:  880.00 }, // A5
    { step: 160, durSec: 0.18, freq:  739.99 }, // F#5
    { step: 162, durSec: 0.18, freq:  880.00 }, // A5
    { step: 164, durSec: 0.18, freq:  987.77 }, // B5
    { step: 166, durSec: 0.18, freq:  880.00 }, // A5
    { step: 168, durSec: 0.18, freq: 1108.73 }, // C#6
    { step: 170, durSec: 0.18, freq:  987.77 }, // B5
    { step: 172, durSec: 0.18, freq:  880.00 }, // A5
    { step: 174, durSec: 0.18, freq:  987.77 }, // B5
    { step: 176, durSec: 0.18, freq: 1108.73 }, // C#6
    { step: 178, durSec: 0.35, freq:  880.00 }, // A5
    { step: 182, durSec: 0.18, freq:  739.99 }, // F#5
    { step: 184, durSec: 0.65, freq:  659.26 }, // E5

    // Chorus Repeat
    { step: 192, durSec: 0.05, freq: 1174.66 }, // D6
    { step: 193, durSec: 0.25, freq: 1318.51 }, // E6
    { step: 196, durSec: 0.18, freq: 1108.73 }, // C#6
    { step: 198, durSec: 0.18, freq: 1318.51 }, // E6
    { step: 200, durSec: 0.18, freq: 1479.98 }, // F#6
    { step: 202, durSec: 0.18, freq: 1108.73 }, // C#6
    { step: 204, durSec: 0.18, freq: 1318.51 }, // E6
    { step: 206, durSec: 0.18, freq: 1479.98 }, // F#6
    { step: 208, durSec: 0.18, freq: 1108.73 }, // C#6
    { step: 210, durSec: 0.18, freq:  987.77 }, // B5
    { step: 212, durSec: 0.18, freq:  880.00 }, // A5
    { step: 214, durSec: 0.18, freq:  739.99 }, // F#5
    { step: 216, durSec: 0.65, freq:  880.00 }, // A5
    { step: 224, durSec: 0.18, freq:  739.99 }, // F#5
    { step: 226, durSec: 0.18, freq:  880.00 }, // A5
    { step: 228, durSec: 0.18, freq:  987.77 }, // B5
    { step: 230, durSec: 0.18, freq:  880.00 }, // A5
    { step: 232, durSec: 0.18, freq: 1108.73 }, // C#6
    { step: 234, durSec: 0.18, freq:  987.77 }, // B5
    { step: 236, durSec: 0.18, freq:  880.00 }, // A5
    { step: 238, durSec: 0.18, freq:  987.77 }, // B5
    { step: 240, durSec: 0.18, freq: 1108.73 }, // C#6
    { step: 242, durSec: 0.35, freq:  880.00 }, // A5
    { step: 246, durSec: 0.18, freq:  739.99 }, // F#5
    { step: 248, durSec: 0.65, freq:  659.26 }, // E5
  ];

  /**
   * Authentic 160 BPM Game Start Fanfare (Original Namco 1981 Arcade Intro).
   * Total duration: ~4.2 seconds.
   */
  public playGameStart(): void {
    const fanfare: Array<{ freq: number; delayMs: number; durationSeconds: number; type?: OscillatorType; vol?: number }> = [
      // Voice 1: Square wave lead
      { freq: 329.63, delayMs:    0, durationSeconds: 0.18, type: 'square', vol: 0.09 }, // E4
      { freq: 369.99, delayMs:  188, durationSeconds: 0.09, type: 'square', vol: 0.09 }, // F#4
      { freq: 440.00, delayMs:  281, durationSeconds: 0.18, type: 'square', vol: 0.09 }, // A4
      { freq: 554.37, delayMs:  469, durationSeconds: 0.28, type: 'square', vol: 0.10 }, // C#5
      { freq: 440.00, delayMs:  750, durationSeconds: 0.09, type: 'square', vol: 0.09 }, // A4
      { freq: 369.99, delayMs:  844, durationSeconds: 0.09, type: 'square', vol: 0.09 }, // F#4
      { freq: 329.63, delayMs: 1125, durationSeconds: 0.18, type: 'square', vol: 0.09 }, // E4
      { freq: 369.99, delayMs: 1313, durationSeconds: 0.09, type: 'square', vol: 0.09 }, // F#4
      { freq: 440.00, delayMs: 1406, durationSeconds: 0.18, type: 'square', vol: 0.09 }, // A4
      { freq: 523.25, delayMs: 1594, durationSeconds: 0.28, type: 'square', vol: 0.10 }, // C5
      { freq: 440.00, delayMs: 1875, durationSeconds: 0.09, type: 'square', vol: 0.09 }, // A4
      { freq: 369.99, delayMs: 1969, durationSeconds: 0.09, type: 'square', vol: 0.09 }, // F#4
      { freq: 329.63, delayMs: 2250, durationSeconds: 0.18, type: 'square', vol: 0.09 }, // E4
      { freq: 369.99, delayMs: 2438, durationSeconds: 0.09, type: 'square', vol: 0.09 }, // F#4
      { freq: 440.00, delayMs: 2531, durationSeconds: 0.18, type: 'square', vol: 0.09 }, // A4
      { freq: 554.37, delayMs: 2719, durationSeconds: 0.28, type: 'square', vol: 0.10 }, // C#5
      { freq: 440.00, delayMs: 3000, durationSeconds: 0.09, type: 'square', vol: 0.09 }, // A4
      { freq: 554.37, delayMs: 3094, durationSeconds: 0.18, type: 'square', vol: 0.10 }, // C#5
      { freq: 587.33, delayMs: 3281, durationSeconds: 0.09, type: 'square', vol: 0.10 }, // D5
      { freq: 659.26, delayMs: 3375, durationSeconds: 0.18, type: 'square', vol: 0.10 }, // E5
      { freq: 587.33, delayMs: 3563, durationSeconds: 0.09, type: 'square', vol: 0.10 }, // D5
      { freq: 554.37, delayMs: 3656, durationSeconds: 0.18, type: 'square', vol: 0.10 }, // C#5
      { freq: 440.00, delayMs: 3844, durationSeconds: 0.09, type: 'square', vol: 0.10 }, // A4
      { freq: 554.37, delayMs: 3938, durationSeconds: 0.18, type: 'square', vol: 0.10 }, // C#5
      { freq: 440.00, delayMs: 4125, durationSeconds: 0.45, type: 'square', vol: 0.12 }, // A4 Finale!

      // Voice 2: Triangle wave bass
      { freq:  82.41, delayMs:    0, durationSeconds: 0.25, type: 'triangle', vol: 0.09 }, // E2
      { freq: 138.59, delayMs:  469, durationSeconds: 0.25, type: 'triangle', vol: 0.08 }, // C#3
      { freq:  82.41, delayMs: 1125, durationSeconds: 0.25, type: 'triangle', vol: 0.09 }, // E2
      { freq: 130.81, delayMs: 1500, durationSeconds: 0.15, type: 'triangle', vol: 0.08 }, // C3
      { freq:  82.41, delayMs: 2250, durationSeconds: 0.25, type: 'triangle', vol: 0.09 }, // E2
      { freq: 138.59, delayMs: 2719, durationSeconds: 0.25, type: 'triangle', vol: 0.08 }, // C#3
      { freq: 164.81, delayMs: 3375, durationSeconds: 0.18, type: 'triangle', vol: 0.09 }, // E3
      { freq: 146.83, delayMs: 3563, durationSeconds: 0.09, type: 'triangle', vol: 0.09 }, // D3
      { freq: 138.59, delayMs: 3656, durationSeconds: 0.09, type: 'triangle', vol: 0.09 }, // C#3
      { freq: 110.00, delayMs: 3844, durationSeconds: 0.09, type: 'triangle', vol: 0.09 }, // A2
      { freq: 138.59, delayMs: 3938, durationSeconds: 0.09, type: 'triangle', vol: 0.09 }, // C#3
      { freq: 110.00, delayMs: 4125, durationSeconds: 0.45, type: 'triangle', vol: 0.11 }, // A2 Finale!
    ];

    SoundEngine.playSequence(fanfare);
  }

  /**
   * Starts or resumes the 150 BPM New Rally-X BGM loop.
   */
  public startBGM(): void {
    if (this.isBgmPlaying) return;
    this.isBgmPlaying = true;
    this.bgmStepIndex = 0;
    this.scheduleNextBgmTick();
  }

  private scheduleNextBgmTick(): void {
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
    }

    this.bgmInterval = setInterval(() => {
      if (!this.isBgmPlaying) return;
      this.playBgmStep(this.bgmStepIndex);
      this.bgmStepIndex = (this.bgmStepIndex + 1) % 256;
    }, 100); // 100ms per sixteenth note = 150 BPM
  }

  private playBgmStep(step: number): void {
    // 1. Lead Melody Note
    const melEvent = this.bgmMelody.find((n) => n.step === step);
    if (melEvent) {
      SoundEngine.playTone({
        type: 'square',
        frequency: melEvent.freq,
        durationSeconds: melEvent.durSec,
        volume: 0.06,
      });
    }

    // 2. Bouncy Walking Bass (on eighth notes: every 2 steps)
    if (step % 2 === 0) {
      let bassFreq = 73.42; // D2 default
      if (step < 96) {
        // Section A: D2 / D3 bounce
        bassFreq = step % 4 === 0 ? 73.42 : 146.83; // D2 / D3
      } else if (step < 112) {
        bassFreq = step % 4 === 0 ? 55.00 : 110.00; // A1 / A2
      } else if (step < 128) {
        // Walkup
        const walk = [55.00, 61.74, 69.30, 73.42]; // A1, B1, C#2, D2
        bassFreq = walk[Math.floor((step - 112) / 4)] || 73.42;
      } else if (step < 192) {
        // Section B: A2 / D3 bounce
        bassFreq = step % 4 === 0 ? 110.00 : 146.83;
      } else {
        // Section B repeat
        bassFreq = step % 4 === 0 ? 110.00 : 164.81; // A2 / E3
      }

      SoundEngine.playTone({
        type: 'triangle',
        frequency: bassFreq,
        durationSeconds: 0.16,
        volume: 0.07,
      });
    }
  }

  /**
   * Stops the BGM loop and resets step index.
   */
  public stopBGM(): void {
    this.isBgmPlaying = false;
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
    this.bgmStepIndex = 0;
  }

  /**
   * Pauses the BGM without resetting step index.
   */
  public pauseBGM(): void {
    this.isBgmPlaying = false;
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }

  /**
   * Resumes the BGM loop from the current step.
   */
  public resumeBGM(): void {
    if (this.isBgmPlaying) return;
    this.isBgmPlaying = true;
    this.scheduleNextBgmTick();
  }

  /**
   * Flag Pickup SFX: Frequency scales higher with each collected flag.
   */
  public playFlagPickup(sequenceNumber: number): void {
    const baseFreq = 440 + Math.min(10, sequenceNumber) * 65;
    SoundEngine.playTone({
      type: 'square',
      frequency: baseFreq,
      targetFrequency: baseFreq * 1.3,
      durationSeconds: 0.07,
      volume: 0.08,
    });
  }

  /**
   * Special "S" Flag Fanfare (Double Multiplier Activated).
   */
  public playSpecialFlagFanfare(): void {
    const fanfare = [
      { freq: 523.25, delayMs: 0, durationSeconds: 0.08, type: 'square' as OscillatorType, vol: 0.09 }, // C5
      { freq: 659.25, delayMs: 70, durationSeconds: 0.08, type: 'square' as OscillatorType, vol: 0.09 }, // E5
      { freq: 783.99, delayMs: 140, durationSeconds: 0.08, type: 'square' as OscillatorType, vol: 0.09 }, // G5
      { freq: 1046.50, delayMs: 220, durationSeconds: 0.30, type: 'square' as OscillatorType, vol: 0.11 }, // C6
    ];
    SoundEngine.playSequence(fanfare);
  }

  /**
   * Lucky "L" Flag Initial Chime.
   */
  public playLuckyFlagChime(): void {
    const arpeggio = [
      { freq: 440.00, delayMs: 0, durationSeconds: 0.06, type: 'triangle' as OscillatorType, vol: 0.09 }, // A4
      { freq: 554.37, delayMs: 50, durationSeconds: 0.06, type: 'triangle' as OscillatorType, vol: 0.09 }, // C#5
      { freq: 659.25, delayMs: 100, durationSeconds: 0.06, type: 'triangle' as OscillatorType, vol: 0.09 }, // E5
      { freq: 880.00, delayMs: 150, durationSeconds: 0.15, type: 'triangle' as OscillatorType, vol: 0.11 }, // A5
    ];
    SoundEngine.playSequence(arpeggio);
  }

  /**
   * Continuous fuel meter recharging chirp during Lucky flag freeze.
   */
  public playRefuelingChirp(progress: number): void {
    const freq = 400 + progress * 800; // Ascending sweep from 400Hz to 1200Hz
    SoundEngine.playTone({
      type: 'sine',
      frequency: freq,
      durationSeconds: 0.04,
      volume: 0.06,
    });
  }

  /**
   * Smoke Screen Hiss: Fast downward noise/tone pulse.
   */
  public playSmokeHiss(): void {
    SoundEngine.playTone({
      type: 'sawtooth',
      frequency: 240,
      targetFrequency: 60,
      durationSeconds: 0.12,
      volume: 0.09,
    });
  }

  /**
   * Tire Spin-Out Screech (Red car hits smoke or rock).
   */
  public playSpinOut(): void {
    const seq = [
      { freq: 750, delayMs: 0, durationSeconds: 0.05, type: 'sawtooth' as OscillatorType, vol: 0.08 },
      { freq: 550, delayMs: 45, durationSeconds: 0.05, type: 'sawtooth' as OscillatorType, vol: 0.08 },
      { freq: 800, delayMs: 90, durationSeconds: 0.06, type: 'sawtooth' as OscillatorType, vol: 0.08 },
    ];
    SoundEngine.playSequence(seq);
  }

  /**
   * Crash Explosion (Blue car crashes into enemy or rock).
   */
  public playCrash(): void {
    const boomSeq = [
      { freq: 140, delayMs: 0, durationSeconds: 0.12, type: 'sawtooth' as OscillatorType, vol: 0.13 },
      { freq: 90, delayMs: 80, durationSeconds: 0.18, type: 'sawtooth' as OscillatorType, vol: 0.12 },
      { freq: 50, delayMs: 200, durationSeconds: 0.30, type: 'triangle' as OscillatorType, vol: 0.10 },
    ];
    SoundEngine.playSequence(boomSeq);
  }

  /**
   * Low Fuel Alarm (Alternating dual-tone beep).
   */
  public startLowFuelAlarm(): void {
    if (this.lowFuelAlarmInterval) return;
    this.lowFuelAlarmInterval = setInterval(() => {
      this.alarmToggle = !this.alarmToggle;
      const freq = this.alarmToggle ? 880 : 587;
      SoundEngine.playTone({
        type: 'square',
        frequency: freq,
        durationSeconds: 0.08,
        volume: 0.07,
      });
    }, 180);
  }

  public stopLowFuelAlarm(): void {
    if (this.lowFuelAlarmInterval) {
      clearInterval(this.lowFuelAlarmInterval);
      this.lowFuelAlarmInterval = null;
    }
  }

  /**
   * Round Clear Victory Fanfare.
   */
  public playRoundClear(): void {
    this.stopBGM();
    this.stopLowFuelAlarm();

    const victorySeq = [
      { freq: 523.25, delayMs: 0, durationSeconds: 0.10, type: 'square' as OscillatorType, vol: 0.09 }, // C5
      { freq: 659.25, delayMs: 100, durationSeconds: 0.10, type: 'square' as OscillatorType, vol: 0.09 }, // E5
      { freq: 783.99, delayMs: 200, durationSeconds: 0.10, type: 'square' as OscillatorType, vol: 0.09 }, // G5
      { freq: 1046.50, delayMs: 300, durationSeconds: 0.20, type: 'square' as OscillatorType, vol: 0.10 }, // C6
      { freq: 880.00, delayMs: 450, durationSeconds: 0.12, type: 'square' as OscillatorType, vol: 0.09 }, // A5
      { freq: 1046.50, delayMs: 600, durationSeconds: 0.40, type: 'square' as OscillatorType, vol: 0.11 }, // C6
    ];
    SoundEngine.playSequence(victorySeq);
  }

  /**
   * 1UP Extra Life Fanfare.
   */
  public playExtraLife(): void {
    const seq = [
      { freq: 880, delayMs: 0, durationSeconds: 0.08, type: 'square' as OscillatorType, vol: 0.09 },
      { freq: 1174.66, delayMs: 80, durationSeconds: 0.08, type: 'square' as OscillatorType, vol: 0.09 },
      { freq: 1396.91, delayMs: 160, durationSeconds: 0.08, type: 'square' as OscillatorType, vol: 0.09 },
      { freq: 1760, delayMs: 240, durationSeconds: 0.22, type: 'square' as OscillatorType, vol: 0.11 },
    ];
    SoundEngine.playSequence(seq);
  }

  /**
   * Stops all active audio loops and timers.
   */
  public stopAll(): void {
    this.stopBGM();
    this.stopLowFuelAlarm();
    SoundEngine.stopAll();
  }
}

export const RallyXAudioService = new RallyXAudioServiceImpl();
