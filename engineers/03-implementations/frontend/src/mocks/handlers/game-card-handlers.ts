import { http, HttpResponse, graphql } from 'msw';
import { mockGameCards, mockPlayer } from '../fixtures';

export const gameCardHandlers = [
  graphql.query('listGameCards', () => {
    return HttpResponse.json({
      data: {
        listGameCards: mockGameCards,
      },
    });
  }),

  http.post(/\/api\/v1\/game-cards\/.*:insertCoin/, () => {
    if (mockPlayer.wallet.totalCredits <= 0) {
      return HttpResponse.json(
        { code: 'BAD_REQUEST', message: 'Insufficient credits.', timestamp: new Date().toISOString() },
        { status: 400 }
      );
    }
    if (mockPlayer.wallet.dailyFreeCredit > 0) {
      mockPlayer.wallet.dailyFreeCredit -= 1;
    } else if (mockPlayer.wallet.adminBonusCredit > 0) {
      mockPlayer.wallet.adminBonusCredit -= 1;
    }
    mockPlayer.wallet.totalCredits -= 1;

    if (mockGameCards[0]) {
      mockGameCards[0].totalPlayCount += 1;
    }

    return HttpResponse.json({
      success: true,
      message: 'Coin inserted successfully.',
      timestamp: new Date().toISOString(),
    });
  }),
];
