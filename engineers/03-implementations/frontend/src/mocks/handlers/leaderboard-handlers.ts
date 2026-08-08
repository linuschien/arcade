import { http, HttpResponse } from 'msw';
import { mockLeaderboardEntries, mockGameCards, mockPlayer } from '../fixtures';

export const leaderboardHandlers = [
  http.post('*/graphql', async ({ request }) => {
    const body: any = await request.json().catch(() => ({}));
    const query = body?.query || '';

    if (query.includes('getTop10Leaderboard')) {
      return HttpResponse.json({
        data: {
          getTop10Leaderboard: mockLeaderboardEntries,
        },
      });
    }

    if (query.includes('listGameCards')) {
      return HttpResponse.json({
        data: {
          listGameCards: mockGameCards,
        },
      });
    }

    if (query.includes('getUserWalletByPlayerId')) {
      return HttpResponse.json({
        data: {
          getUserWalletByPlayerId: mockPlayer.wallet,
        },
      });
    }

    return HttpResponse.json({ data: {} });
  }),
];
