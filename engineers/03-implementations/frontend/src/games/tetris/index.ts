import { BaseArcadeGame } from '@/core/phaser/BaseArcadeGame';
import { IArcadeGame } from '@/core/bridge/ArcadeBridge';
import { PreloadScene } from './scenes/PreloadScene';
import { MainGameScene } from './scenes/MainGameScene';
import { TetrisAudioService } from './audio/TetrisAudioService';

export class TetrisGame extends BaseArcadeGame {
  constructor(parentContainerId: string | HTMLElement) {
    super({
      gameId: 'tetris',
      parentContainerId,
      baseWidth: 800,
      baseHeight: 720,
      backgroundColor: '#020617',
      scene: [PreloadScene, MainGameScene],
    });
  }

  protected override stopAudioServices(): void {
    TetrisAudioService.stopBgm();
  }
}

/**
 * Factory function to instantiate Tetris game inside a container element.
 */
export function createTetrisGame(container: string | HTMLElement): IArcadeGame {
  return new TetrisGame(container);
}
