/**
 * BaseArcadeScene.ts
 * Unified Base Scene for all Arcade Stadium games.
 *
 * Provides standard High-DPI camera alignment and lifecycle management
 * ensuring logical coordinate isolation (1280x720, 600x735, 800x720, 920x640)
 * while leveraging native physical framebuffer sharpness.
 */

import Phaser from 'phaser';
import { SoundEngine } from '@/core/audio/SoundEngine';

export abstract class BaseArcadeScene extends Phaser.Scene {
  protected isPausedState: boolean = false;

  /**
   * Initializes the High-DPI Camera for the Scene.
   * Maps logical game coordinates onto physical retina pixels seamlessly.
   *
   * @param baseWidth - Logical base width (e.g., 600 for Pacman, 1280 for Mahjong)
   */
  protected initHighDpiCamera(baseWidth: number): void {
    if (this.cameras?.main && typeof this.cameras.main.setOrigin === 'function') {
      const zoomFactor = this.scale?.width ? this.scale.width / baseWidth : 1;
      if (zoomFactor > 1) {
        this.cameras.main.setOrigin(0, 0).setZoom(zoomFactor);
      }
    }
  }

  /**
   * Universal pause state lifecycle management for all Arcade Stadium scenes.
   * Enforces pipeline shutdown top-down (stop timers -> suspend audio hardware)
   * and pipeline startup bottom-up (resume audio hardware -> resume timers).
   */
  public setPauseState(paused: boolean): void {
    this.isPausedState = paused;
    if (paused) {
      this.onPauseAudio();
      SoundEngine.suspend();
    } else {
      SoundEngine.resume();
      this.onResumeAudio();
    }
  }

  /**
   * Hook for subclasses to stop game-specific audio services upon pause.
   */
  protected onPauseAudio(): void {}

  /**
   * Hook for subclasses to resume game-specific audio services upon resume.
   */
  protected onResumeAudio(): void {}
}
