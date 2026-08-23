/**
 * index.ts
 * Main entry point for Pac-Man game module inside Arcade Stadium.
 * Implements IArcadeGame lifecycle contract and bridges ArcadeBridge events.
 */

import { BaseArcadeGame } from '@/core/phaser/BaseArcadeGame';
import { IArcadeGame, ArcadeBridge } from '@/core/bridge/ArcadeBridge';
import { SoundEngine } from '@/core/audio/SoundEngine';
import { PreloadScene } from './scenes/PreloadScene';
import { MainGameScene } from './scenes/MainGameScene';
import { PacmanAudioService } from './audio/PacmanAudioService';

export class PacmanGame extends BaseArcadeGame {
  private unsubscribeListeners: Array<() => void> = [];

  constructor(parentContainerId: string | HTMLElement) {
    super({
      parentContainerId,
      baseWidth: 600,
      baseHeight: 735,
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
    console.log(`[PacmanGame] Coin inserted! Credits added: ${credits}`);
  }

  public onPause(): void {
    if (!this.game) return;
    const scene = this.game.scene.getScene('pacman:MainGameScene') as MainGameScene;
    if (scene) {
      scene.setPauseState(true);
      scene.scene.pause();
    }
  }

  public onResume(): void {
    if (!this.game) return;
    const scene = this.game.scene.getScene('pacman:MainGameScene') as MainGameScene;
    if (scene) {
      scene.setPauseState(false);
      scene.scene.resume();
    }
  }

  public destroyGame(): void {
    this.unsubscribeListeners.forEach((unsub) => unsub());
    this.unsubscribeListeners = [];

    PacmanAudioService.stopSiren();
    SoundEngine.stopAll();

    if (this.game) {
      this.game.destroy(true);
      this.game = null;
    }
  }
}

/**
 * Factory function to instantiate Pacman game inside a container element.
 */
export function createPacmanGame(container: string | HTMLElement): IArcadeGame {
  return new PacmanGame(container);
}
