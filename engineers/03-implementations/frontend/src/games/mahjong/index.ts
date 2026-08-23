/**
 * index.ts
 * Main entry point for Taiwanese 16-Tile Mahjong inside Arcade Stadium.
 * Implements IArcadeGame lifecycle contract and bridges ArcadeBridge events.
 */

import Phaser from 'phaser';
import { BaseArcadeGame } from '@/core/phaser/BaseArcadeGame';
import { IArcadeGame, ArcadeBridge } from '@/core/bridge/ArcadeBridge';
import { SoundEngine } from '@/core/audio/SoundEngine';
import { PreloadScene } from './scenes/PreloadScene';
import { MainGameScene } from './scenes/MainGameScene';

export class MahjongGame extends BaseArcadeGame {
  private unsubscribeListeners: Array<() => void> = [];

  constructor(parentContainerId: string | HTMLElement) {
    super({
      parentContainerId,
      baseWidth: 1280,
      baseHeight: 720,
      backgroundColor: '#061c13',
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
    console.log(`[MahjongGame] Coin inserted! Credits added: ${credits}`);
  }

  public onPause(): void {
    if (!this.game) return;
    const scene = this.game.scene.getScene('mahjong:MainGameScene') as MainGameScene;
    if (scene) {
      scene.setPauseState(true);
      scene.scene.pause();
    }
  }

  public onResume(): void {
    if (!this.game) return;
    const scene = this.game.scene.getScene('mahjong:MainGameScene') as MainGameScene;
    if (scene) {
      scene.setPauseState(false);
      scene.scene.resume();
    }
  }

  public destroyGame(): void {
    this.unsubscribeListeners.forEach((unsub) => unsub());
    this.unsubscribeListeners = [];

    SoundEngine.stopAll();

    if (this.game) {
      this.game.destroy(true);
      this.game = null;
    }
  }
}

/**
 * Factory function to instantiate Taiwanese Mahjong game inside a container element.
 */
export function createMahjongGame(container: string | HTMLElement): IArcadeGame {
  return new MahjongGame(container);
}

export * from './MahjongThemeConfig';

