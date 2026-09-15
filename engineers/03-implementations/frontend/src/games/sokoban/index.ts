/**
 * index.ts
 * Sokoban 50 Arcade Stadium Game Entry Point.
 * Implements IArcadeGame and extends BaseArcadeGame.
 */

import { BaseArcadeGame } from '@/core/phaser/BaseArcadeGame';
import { IArcadeGame } from '@/core/bridge/ArcadeBridge';
import { PreloadScene } from './scenes/PreloadScene';
import { MainGameScene } from './scenes/MainGameScene';
import { SokobanAudioService } from './audio/SokobanAudioService';

export class SokobanGame extends BaseArcadeGame {
  constructor(parentContainerId: string | HTMLElement) {
    super({
      gameId: 'sokoban',
      parentContainerId,
      baseWidth: 1280,
      baseHeight: 720,
      backgroundColor: '#020617',
      scene: [PreloadScene, MainGameScene],
    });
  }

  protected override stopAudioServices(): void {
    SokobanAudioService.stopBGM();
  }
}

/**
 * Factory function to instantiate Sokoban game inside a container element.
 */
export function createSokobanGame(container: string | HTMLElement): IArcadeGame {
  return new SokobanGame(container);
}

