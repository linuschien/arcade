/**
 * BaseArcadeGame.ts
 * Base Game class for Arcade Stadium games.
 * Encapsulates Phaser High-DPI game config and Game instance construction.
 */

import Phaser from 'phaser';
import { IArcadeGame } from '@/core/bridge/ArcadeBridge';
import { getDynamicResolution } from './init-high-dpi';

export interface BaseArcadeGameOptions {
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

  constructor(options: BaseArcadeGameOptions) {
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
  }

  public abstract onCoinInsert(credits: number): void;
  public abstract onPause(): void;
  public abstract onResume(): void;
  public abstract destroyGame(): void;
}
