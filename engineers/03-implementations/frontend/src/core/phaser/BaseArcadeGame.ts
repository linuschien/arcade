/**
 * BaseArcadeGame.ts
 * Base Game class for Arcade Stadium games.
 * Encapsulates Phaser High-DPI game config and Game instance construction.
 */

import Phaser from 'phaser';
import { IArcadeGame, ArcadeBridge } from '@/core/bridge/ArcadeBridge';
import { SoundEngine } from '@/core/audio/SoundEngine';
import { getDynamicResolution } from './init-high-dpi';
import { BaseArcadeScene } from './BaseArcadeScene';

export interface BaseArcadeGameOptions {
  gameId?: string;
  mainSceneKey?: string;
  parentContainerId: string | HTMLElement;
  baseWidth: number;
  baseHeight: number;
  backgroundColor?: string;
  scene: Phaser.Types.Scenes.SceneType[];
  physics?: Phaser.Types.Core.PhysicsConfig;
  autoCenter?: Phaser.Scale.CenterType;
}

export abstract class BaseArcadeGame implements IArcadeGame {
  protected game: Phaser.Game | null = null;
  protected gameId: string;
  protected mainSceneKey: string;
  protected unsubscribeListeners: Array<() => void> = [];

  constructor(options: BaseArcadeGameOptions) {
    this.gameId = options.gameId ?? '';
    this.mainSceneKey = options.mainSceneKey ?? (options.gameId ? `${options.gameId}:MainGameScene` : 'MainGameScene');

    const parent =
      typeof options.parentContainerId === 'string'
        ? document.getElementById(options.parentContainerId) || undefined
        : options.parentContainerId;

    const dpr = getDynamicResolution();
    const physicalWidth = options.baseWidth * dpr;
    const physicalHeight = options.baseHeight * dpr;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent,
      backgroundColor: options.backgroundColor ?? '#020617',
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: options.autoCenter ?? Phaser.Scale.CENTER_BOTH,
        width: physicalWidth,
        height: physicalHeight,
      },
      scene: options.scene,
      physics: options.physics ?? {
        default: 'arcade',
        arcade: {
          debug: false,
        },
      },
      callbacks: {
        postBoot: (game: Phaser.Game) => {
          (game as any)._arcadeBaseWidth = options.baseWidth;
          (game as any)._arcadeBaseHeight = options.baseHeight;
          if (game.config) {
            (game.config as any).arcadeBaseWidth = options.baseWidth;
            (game.config as any).arcadeBaseHeight = options.baseHeight;
          }
        },
      },
    };

    this.game = new Phaser.Game(config);
    this.setupBridgeListeners();
  }

  /**
   * Sets up ArcadeBridge event bindings.
   */
  protected setupBridgeListeners(): void {
    const unsubPause = ArcadeBridge.on('PAUSE_REQUESTED', () => {
      this.onPause();
    });

    const unsubResume = ArcadeBridge.on('RESUME_REQUESTED', () => {
      this.onResume();
    });

    this.unsubscribeListeners.push(unsubPause, unsubResume);
  }

  /**
   * Handles game pause requested by Arcade Stadium Host.
   */
  public onPause(): void {
    if (!this.game) return;
    const scene = this.game.scene.getScene(this.mainSceneKey) as BaseArcadeScene;
    if (scene) {
      if (typeof scene.setPauseState === 'function') {
        scene.setPauseState(true);
      }
      if (scene.scene && typeof scene.scene.pause === 'function') {
        scene.scene.pause();
      }
    }
  }

  /**
   * Handles game resume requested by Arcade Stadium Host.
   */
  public onResume(): void {
    if (!this.game) return;
    const scene = this.game.scene.getScene(this.mainSceneKey) as BaseArcadeScene;
    if (scene) {
      if (typeof scene.setPauseState === 'function') {
        scene.setPauseState(false);
      }
      if (scene.scene && typeof scene.scene.resume === 'function') {
        scene.scene.resume();
      }
    }
  }

  /**
   * Cleans up bridge listeners, stops audio, and destroys the Phaser instance.
   */
  public destroyGame(): void {
    this.unsubscribeListeners.forEach((unsub) => unsub());
    this.unsubscribeListeners = [];

    this.stopAudioServices();
    SoundEngine.stopAll();

    if (this.game) {
      this.game.destroy(true);
      this.game = null;
    }
  }

  /**
   * Optional lifecycle hook for subclasses to stop game-specific audio services upon destruction.
   */
  protected stopAudioServices(): void {
    // Default no-op, can be overridden by specific games
  }
}
