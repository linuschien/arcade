import { BaseArcadeGame } from '@/core/phaser/BaseArcadeGame';
import { IArcadeGame } from '@/core/bridge/ArcadeBridge';
import { PreloadScene } from './scenes/PreloadScene';
import { MainGameScene } from './scenes/MainGameScene';

import { MahjongAudioService } from './audio/MahjongAudioService';

export class MahjongGame extends BaseArcadeGame {
  constructor(parentContainerId: string | HTMLElement) {
    super({
      gameId: 'mahjong',
      parentContainerId,
      baseWidth: 1280,
      baseHeight: 720,
      backgroundColor: '#061c13',
      scene: [PreloadScene, MainGameScene],
    });
  }

  protected override stopAudioServices(): void {
    MahjongAudioService.stopBGM();
    MahjongAudioService.stopVoice();
  }
}

/**
 * Factory function to instantiate Taiwanese Mahjong game inside a container element.
 */
export function createMahjongGame(container: string | HTMLElement): IArcadeGame {
  return new MahjongGame(container);
}

export * from './MahjongThemeConfig';

