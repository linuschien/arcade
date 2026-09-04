/**
 * Arcade Stadium Game Registry & Factory
 * Decouples Host Shell from individual game module implementations.
 */

import { IArcadeGame } from '@/core/bridge/ArcadeBridge';

export type GameFactory = (container: HTMLElement) => Promise<IArcadeGame> | IArcadeGame;

export const gameLoaders: Record<string, () => Promise<{ [key: string]: any }>> = {
  tetris: () => import('./tetris'),
  pacman: () => import('./pacman'),
  pipemania: () => import('./pipemania'),
  mahjong: () => import('./mahjong'),
};

/**
 * Instantiate an Arcade Game instance asynchronously by gameId slug.
 */
export async function createGameInstance(gameId: string, container: HTMLElement): Promise<IArcadeGame | null> {
  const loader = gameLoaders[gameId];
  if (!loader) {
    console.warn(`[ArcadeRegistry] No game factory registered for gameId: "${gameId}"`);
    return null;
  }

  const module = await loader();
  switch (gameId) {
    case 'tetris':
      return module.createTetrisGame(container);
    case 'pacman':
      return module.createPacmanGame(container);
    case 'pipemania':
      return module.createPipeManiaGame(container);
    case 'mahjong':
      return module.createMahjongGame(container);
    default:
      return null;
  }
}
