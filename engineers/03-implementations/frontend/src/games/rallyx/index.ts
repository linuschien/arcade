/**
 * RallyXGame
 * Main Entry Point for New Rally-X implementing IArcadeGame.
 */

import { BaseArcadeGame } from '@/core/phaser/BaseArcadeGame';
import { IArcadeGame } from '@/core/bridge/ArcadeBridge';
import { PreloadScene } from './scenes/PreloadScene';
import { MainGameScene } from './scenes/MainGameScene';
import { RallyXAudioService } from './audio/RallyXAudioService';

export class RallyXGame extends BaseArcadeGame {
  constructor(parentContainerId: string | HTMLElement) {
    super({
      gameId: 'rallyx',
      parentContainerId,
      baseWidth: 640,
      baseHeight: 480,
      backgroundColor: '#020617',
      scene: [PreloadScene, MainGameScene],
    });
  }

  protected override stopAudioServices(): void {
    RallyXAudioService.stopAll();
  }
}

/**
 * Factory function to instantiate RallyX game inside a container element.
 */
export function createRallyXGame(container: string | HTMLElement): IArcadeGame {
  return new RallyXGame(container);
}

