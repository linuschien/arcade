/**
 * Arcade Stadium Game Registry & Factory
 * Decouples Host Shell from individual game module implementations.
 */

import { IArcadeGame } from '@/core/bridge/ArcadeBridge';
import { createTetrisGame } from './tetris';

export type GameFactory = (container: HTMLElement) => IArcadeGame;

export const gameRegistry: Record<string, GameFactory> = {
  tetris: createTetrisGame,
};

/**
 * Instantiate an Arcade Game instance by gameId slug.
 */
export function createGameInstance(gameId: string, container: HTMLElement): IArcadeGame | null {
  const factory = gameRegistry[gameId];
  if (!factory) {
    console.warn(`[ArcadeRegistry] No game factory registered for gameId: "${gameId}"`);
    return null;
  }
  return factory(container);
}
