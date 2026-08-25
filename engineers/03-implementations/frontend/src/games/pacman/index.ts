import { BaseArcadeGame } from '@/core/phaser/BaseArcadeGame';
import { IArcadeGame } from '@/core/bridge/ArcadeBridge';
import { PreloadScene } from './scenes/PreloadScene';
import { MainGameScene } from './scenes/MainGameScene';
import { PacmanAudioService } from './audio/PacmanAudioService';

export class PacmanGame extends BaseArcadeGame {
  constructor(parentContainerId: string | HTMLElement) {
    super({
      gameId: 'pacman',
      parentContainerId,
      baseWidth: 600,
      baseHeight: 735,
      backgroundColor: '#020617',
      scene: [PreloadScene, MainGameScene],
    });
  }

  protected override stopAudioServices(): void {
    PacmanAudioService.stopSiren();
  }
}

/**
 * Factory function to instantiate Pacman game inside a container element.
 */
export function createPacmanGame(container: string | HTMLElement): IArcadeGame {
  return new PacmanGame(container);
}
