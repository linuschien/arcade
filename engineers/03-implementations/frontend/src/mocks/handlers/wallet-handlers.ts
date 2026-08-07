import { http, HttpResponse, graphql } from 'msw';
import { mockPlayer } from '../fixtures';

export const walletHandlers = [
  graphql.query('getUserWalletByPlayerId', () => {
    return HttpResponse.json({
      data: {
        getUserWalletByPlayerId: mockPlayer.wallet,
      },
    });
  }),

  http.post(/\/api\/v1\/players\/.*\/user-wallets\/.*:grantAdminCredit/, async ({ request }) => {
    const body: any = await request.json().catch(() => ({}));
    const amount = Number(body?.amount || 0);
    mockPlayer.wallet.adminBonusCredit += amount;
    mockPlayer.wallet.totalCredits += amount;
    return HttpResponse.json({
      success: true,
      message: 'Admin bonus credits granted.',
      timestamp: new Date().toISOString(),
    });
  }),
];
