/**
 * SoundEngine.ts
 * Platform-level Web Audio API 8-Bit Chiptune Synthesizer Primitives.
 * Shared by all Arcade Game Modules to generate retro audio without external MP3/WAV assets.
 */

export interface ToneOptions {
  type?: OscillatorType; // 'square' | 'triangle' | 'sawtooth' | 'sine'
  frequency: number; // Hz
  targetFrequency?: number; // Frequency sweep target Hz
  durationSeconds: number;
  volume?: number; // 0.0 to 1.0
}

class SoundEngineImpl {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private isExplicitlyPaused: boolean = false;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended' && !this.isExplicitlyPaused) {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public suspend(): void {
    this.isExplicitlyPaused = true;
    if (this.ctx && this.ctx.state === 'running') {
      try {
        this.ctx.suspend();
      } catch {
        // Ignore
      }
    }
  }

  public resume(): void {
    this.isExplicitlyPaused = false;
    if (this.ctx && this.ctx.state === 'suspended') {
      try {
        this.ctx.resume();
      } catch {
        // Ignore
      }
    }
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
  }

  public isMutedState(): boolean {
    return this.isMuted;
  }

  /**
   * Play a single synthesized tone with optional frequency sweep.
   */
  public playTone(opts: ToneOptions): void {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = opts.type || 'square';
      osc.frequency.setValueAtTime(opts.frequency, ctx.currentTime);

      if (opts.targetFrequency && opts.targetFrequency !== opts.frequency) {
        osc.frequency.exponentialRampToValueAtTime(opts.targetFrequency, ctx.currentTime + opts.durationSeconds);
      }

      const vol = opts.volume ?? 0.1;
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + opts.durationSeconds);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + opts.durationSeconds);
    } catch {
      // Ignore audio context errors in headless / un-interacted environments
    }
  }

  /**
   * Play a sequence of tones with delay offsets.
   */
  public playSequence(tones: Array<{ freq: number; delayMs: number; durationSeconds: number; type?: OscillatorType; vol?: number }>): void {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    tones.forEach((t) => {
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startSec = ctx.currentTime + t.delayMs / 1000;

        osc.type = t.type || 'square';
        osc.frequency.setValueAtTime(t.freq, startSec);

        const vol = t.vol ?? 0.15;
        gain.gain.setValueAtTime(vol, startSec);
        gain.gain.exponentialRampToValueAtTime(0.001, startSec + t.durationSeconds);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startSec);
        osc.stop(startSec + t.durationSeconds);
      } catch {
        // Ignore audio errors
      }
    });
  }
}

export const SoundEngine = new SoundEngineImpl();
