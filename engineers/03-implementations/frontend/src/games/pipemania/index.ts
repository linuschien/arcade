import { BaseArcadeGame } from '@/core/phaser/BaseArcadeGame';
import { IArcadeGame } from '@/core/bridge/ArcadeBridge';
import { PreloadScene } from './scenes/PreloadScene';
import { MainGameScene } from './scenes/MainGameScene';
import { PipeManiaAudioService } from './audio/PipeManiaAudioService';

export class PipeManiaGame extends BaseArcadeGame {
  constructor(parentContainerId: string | HTMLElement) {
    super({
      gameId: 'pipemania',
      parentContainerId,
      baseWidth: 920,
      baseHeight: 640,
      backgroundColor: '#020617',
      scene: [PreloadScene, MainGameScene],
    });
  }

  protected override stopAudioServices(): void {
    PipeManiaAudioService.stopBGM();
  }
}

/**
 * Factory function to instantiate Pipe Mania game inside a container element.
 */
export function createPipeManiaGame(container: string | HTMLElement): IArcadeGame {
  return new PipeManiaGame(container);
}
