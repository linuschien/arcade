/**
 * index.ts
 * Main entry point for Tetris game module inside Arcade Stadium.
 * Implements IArcadeGame lifecycle contract and bridges ArcadeBridge events.
 */

import Phaser from 'phaser';
import { IArcadeGame, ArcadeBridge } from '@/core/bridge/ArcadeBridge';
import { PreloadScene } from './scenes/PreloadScene';
import { MainGameScene } from './scenes/MainGameScene';

export class TetrisGame implements IArcadeGame {
  private game: Phaser.Game | null = null;
  private unsubscribeListeners: Array<() => void> = [];

  constructor(parentContainerId: string | HTMLElement) {
    const parent =
      typeof parentContainerId === 'string'
        ? document.getElementById(parentContainerId) || undefined
        : parentContainerId;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: parent,
      backgroundColor: '#020617',
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 800,
        height: 720,
      },
      scene: [PreloadScene, MainGameScene],
      physics: {
        default: 'arcade',
        arcade: {
          debug: false,
        },
      },
    };

    this.game = new Phaser.Game(config);
    this.setupBridgeListeners();
  }

  private setupBridgeListeners(): void {
    const unsubCoin = ArcadeBridge.on('COIN_INSERTED', (credits) => {
      this.onCoinInsert(typeof credits === 'number' ? credits : 1);
    });

    const unsubPause = ArcadeBridge.on('PAUSE_REQUESTED', () => {
      this.onPause();
    });

    const unsubResume = ArcadeBridge.on('RESUME_REQUESTED', () => {
      this.onResume();
    });

    this.unsubscribeListeners.push(unsubCoin, unsubPause, unsubResume);
  }

  public onCoinInsert(credits: number): void {
    console.log(`[TetrisGame] Coin inserted! Credits added: ${credits}`);
  }

  public onPause(): void {
    if (!this.game) return;
    const scene = this.game.scene.getScene('tetris:MainGameScene') as MainGameScene;
    if (scene) {
      scene.setPauseState(true);
      scene.scene.pause();
    }
  }

  public onResume(): void {
    if (!this.game) return;
    const scene = this.game.scene.getScene('tetris:MainGameScene') as MainGameScene;
    if (scene) {
      scene.setPauseState(false);
      scene.scene.resume();
    }
  }

  public destroyGame(): void {
    this.unsubscribeListeners.forEach((unsub) => unsub());
    this.unsubscribeListeners = [];

    if (this.game) {
      this.game.destroy(true);
      this.game = null;
    }
  }
}

/**
 * Factory function to instantiate Tetris game inside a container element.
 */
export function createTetrisGame(container: string | HTMLElement): IArcadeGame {
  return new TetrisGame(container);
}
