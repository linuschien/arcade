import { http, HttpResponse, graphql } from 'msw';
import { mockPlayer } from '../fixtures';

export const playerHandlers = [
  http.post('/api/v1/players:whoami', () => {
    return HttpResponse.json(mockPlayer);
  }),
  graphql.query('listPlayers', () => {
    return HttpResponse.json({
      data: {
        listPlayers: [
          mockPlayer,
          {
            id: '12345678-abcd-ef01-2345-6789abcdef02',
            gcpIapEmail: 'alice@example.com',
            isAdmin: false,
            createdAt: '2026-08-01T00:00:00Z',
            wallet: {
              id: 'b4c2d3e4-f5a6-7890-bcde-f01234567890',
              dailyFreeCredit: 10,
              adminBonusCredit: 0,
              totalCredits: 10,
            },
          },
        ],
      },
    });
  }),
];
