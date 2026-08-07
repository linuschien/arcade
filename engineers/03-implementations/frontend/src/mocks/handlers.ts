import { playerHandlers } from './handlers/player-handlers';
import { walletHandlers } from './handlers/wallet-handlers';
import { gameCardHandlers } from './handlers/game-card-handlers';
import { leaderboardHandlers } from './handlers/leaderboard-handlers';

export const handlers = [
  ...playerHandlers,
  ...walletHandlers,
  ...gameCardHandlers,
  ...leaderboardHandlers,
];

export * from './fixtures';
