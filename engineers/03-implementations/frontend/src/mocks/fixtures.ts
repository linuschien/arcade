// Shared test fixtures for MSW mock handlers and Vitest unit tests

export const mockPlayer: any = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  gcpIapEmail: 'linus@example.com',
  isAdmin: true,
  createdAt: '2026-08-06T12:00:00Z',
  wallet: {
    id: 'a3b1c2d3-e4f5-6789-abcd-ef0123456789',
    playerId: '550e8400-e29b-41d4-a716-446655440000',
    dailyFreeCredit: 10,
    adminBonusCredit: 5,
    totalCredits: 15,
    lastDailyResetTime: '2026-08-06T00:00:00Z',
    version: 1,
  },
};

export const mockGameCards: any[] = [
  {
    id: '98765432-10fe-dcba-9876-543210fedcba',
    gameId: 'tetris',
    title: 'Tetris Classic',
    coverArtUrl: '/assets/covers/tetris.png',
    description: 'Classic 7-Bag SRS Tetris puzzle game.',
    totalPlayCount: 1420,
  },
  {
    id: '12345678-abcd-ef01-2345-6789abcdef01',
    gameId: 'pacman',
    title: 'Pac-Man Classic',
    coverArtUrl: '/assets/covers/pacman.png',
    description: 'Retro maze dot-eating arcade action.',
    totalPlayCount: 890,
  },
  {
    id: '76543210-10fe-dcba-9876-543210fedcba',
    gameId: 'pipemania',
    title: 'Pipe Mania Classic',
    coverArtUrl: '/assets/covers/pipemania.png',
    description: 'Classic path-building puzzle game. Connect pipes before the Flooz flows!',
    totalPlayCount: 520,
  },
  {
    id: '43218765-10fe-dcba-9876-543210fedcba',
    gameId: 'mahjong',
    title: '台灣16張麻將 (Taiwanese Mahjong)',
    coverArtUrl: '/assets/covers/mahjong.png',
    description: '正宗台灣16張麻將。開門擲骰、搬風抓位、智慧聽牌、莊家連拉2N+1！',
    totalPlayCount: 2350,
  },
];

export const mockLeaderboardEntries: any[] = [
  {
    id: '77777777-8888-9999-aaaa-bbbbccccdddd',
    gameCardId: '98765432-10fe-dcba-9876-543210fedcba',
    playerEmail: 'alice@example.com',
    score: 98500,
    submittedAt: '2026-08-06T15:30:00Z',
  },
  {
    id: '88888888-9999-aaaa-bbbb-ccccddddeeee',
    gameCardId: '98765432-10fe-dcba-9876-543210fedcba',
    playerEmail: 'bob@example.com',
    score: 82100,
    submittedAt: '2026-08-06T16:00:00Z',
  },
];

export function resetMockFixtures() {
  mockPlayer.wallet.dailyFreeCredit = 10;
  mockPlayer.wallet.adminBonusCredit = 5;
  mockPlayer.wallet.totalCredits = 15;
}
