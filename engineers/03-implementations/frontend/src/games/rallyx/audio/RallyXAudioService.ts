/**
 * RallyXAudioService.ts
 * Authentic 8-Bit Web Audio Synthesizer for New Rally-X.
 * Procedurally generates the 130 BPM theme melody and retro SFX suite via SoundEngine.
 */

import { SoundEngine } from '@/core/audio/SoundEngine';

class RallyXAudioServiceImpl {
  private bgmInterval: any = null;
  private lowFuelAlarmInterval: any = null;
  private isBgmPlaying: boolean = false;
  private bgmStepIndex: number = 0;
  private alarmToggle: boolean = false;

  /**
   * New Rally-X 130 BPM Signature Theme Song (16-Step Melodic Loop).
   * Note durations calculated for 130 BPM (~115ms sixteenth note).
   */
  private readonly bgmNotes: Array<{ freq: number; dur: number; type: OscillatorType }> = [
    // Bar 1
    { freq: 523.25, dur: 0.10, type: 'square' }, // C5
    { freq: 587.33, dur: 0.10, type: 'square' }, // D5
    { freq: 659.25, dur: 0.10, type: 'square' }, // E5
    { freq: 523.25, dur: 0.10, type: 'square' }, // C5
    { freq: 659.25, dur: 0.10, type: 'square' }, // E5
    { freq: 783.99, dur: 0.18, type: 'square' }, // G5
    { freq: 523.25, dur: 0.10, type: 'square' }, // C5
    { freq: 659.25, dur: 0.10, type: 'square' }, // E5

    // Bar 2
    { freq: 587.33, dur: 0.10, type: 'square' }, // D5
    { freq: 659.25, dur: 0.10, type: 'square' }, // E5
    { freq: 698.46, dur: 0.10, type: 'square' }, // F5
    { freq: 587.33, dur: 0.10, type: 'square' }, // D5
    { freq: 698.46, dur: 0.10, type: 'square' }, // F5
    { freq: 880.00, dur: 0.18, type: 'square' }, // A5
    { freq: 783.99, dur: 0.10, type: 'square' }, // G5
    { freq: 659.25, dur: 0.10, type: 'square' }, // E5
  ];

  /**
   * Starts or resumes the 130 BPM BGM loop.
   */
  public startBGM(): void {
    if (this.isBgmPlaying) return;
    this.isBgmPlaying = true;
    this.bgmStepIndex = 0;

    this.bgmInterval = setInterval(() => {
      if (!this.isBgmPlaying) return;
      const note = this.bgmNotes[this.bgmStepIndex];
      SoundEngine.playTone({
        type: note.type,
        frequency: note.freq,
        durationSeconds: note.dur,
        volume: 0.05,
      });

      // Bass accompaniment on quarter beats
      if (this.bgmStepIndex % 4 === 0) {
        SoundEngine.playTone({
          type: 'triangle',
          frequency: note.freq / 2,
          durationSeconds: 0.18,
          volume: 0.06,
        });
      }

      this.bgmStepIndex = (this.bgmStepIndex + 1) % this.bgmNotes.length;
    }, 115); // ~130 BPM 16th note timing
  }

  /**
   * Stops the BGM loop and clears the timer.
   */
  public stopBGM(): void {
    this.isBgmPlaying = false;
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
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
    this.bgmInterval = setInterval(() => {
      if (!this.isBgmPlaying) return;
      const note = this.bgmNotes[this.bgmStepIndex];
      SoundEngine.playTone({
        type: note.type,
        frequency: note.freq,
        durationSeconds: note.dur,
        volume: 0.05,
      });

      if (this.bgmStepIndex % 4 === 0) {
        SoundEngine.playTone({
          type: 'triangle',
          frequency: note.freq / 2,
          durationSeconds: 0.18,
          volume: 0.06,
        });
      }

      this.bgmStepIndex = (this.bgmStepIndex + 1) % this.bgmNotes.length;
    }, 115);
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
  }
}

export const RallyXAudioService = new RallyXAudioServiceImpl();

