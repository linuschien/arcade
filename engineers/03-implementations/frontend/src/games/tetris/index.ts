/**
 * index.ts
 * Main entry point for Tetris game module inside Arcade Stadium.
 * Implements IArcadeGame lifecycle contract and bridges ArcadeBridge events.
 */

import { BaseArcadeGame } from '@/core/phaser/BaseArcadeGame';
import { IArcadeGame, ArcadeBridge } from '@/core/bridge/ArcadeBridge';
import { SoundEngine } from '@/core/audio/SoundEngine';
import { PreloadScene } from './scenes/PreloadScene';
import { MainGameScene } from './scenes/MainGameScene';
import { TetrisAudioService } from './audio/TetrisAudioService';

export class TetrisGame extends BaseArcadeGame {
  private unsubscribeListeners: Array<() => void> = [];

  constructor(parentContainerId: string | HTMLElement) {
    super({
      parentContainerId,
      baseWidth: 800,
      baseHeight: 720,
      backgroundColor: '#020617',
      scene: [PreloadScene, MainGameScene],
    });

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

    TetrisAudioService.stopBgm();
    SoundEngine.stopAll();

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
