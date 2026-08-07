import { http, HttpResponse } from 'msw';
import { mockPlayer } from '../fixtures';

export const playerHandlers = [
  http.post('/api/v1/players:whoami', () => {
    return HttpResponse.json(mockPlayer);
  }),
];
