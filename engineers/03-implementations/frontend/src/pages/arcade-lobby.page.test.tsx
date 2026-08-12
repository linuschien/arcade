import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { JSONUIProvider, createStateStore } from '@json-render/react';
import { componentRegistry } from '@/json-render/component-registry';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import ArcadeLobbyPage from './arcade-lobby.page';
import { resetMockFixtures, mockPlayer } from '@/mocks/fixtures';
import { server } from '@/mocks/server';
import { http, HttpResponse } from 'msw';

import { useWhoami } from '@/hooks/use-whoami';
import { useGetUserWalletByPlayerId } from '@/hooks/use-getUserWalletByPlayerId';
import { useListGameCards } from '@/hooks/use-listGameCards';
import { useDeductCredit } from '@/hooks/use-deductCredit';
import { useGetTop10Leaderboard } from '@/hooks/use-getTop10Leaderboard';
import { useGrantAdminCredit } from '@/hooks/use-grantAdminCredit';
import { ArcadeBridge } from '@/core/bridge/ArcadeBridge';

const store = createStateStore({
  user: { email: 'test@example.com', id: '550e8400-e29b-41d4-a716-446655440000' },
  wallet: { dailyFreeCredit: 10, adminBonusCredit: 5, totalCredits: 15, id: 'a3b1c2d3-e4f5-6789-abcd-ef0123456789' },
  settings: { crtEnabled: false, masterMuted: false },
  data: {
    listGameCards: [
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
        coverArtUrl: '',
        description: '',
        totalPlayCount: 890,
      },
    ],
    top10Leaderboard: [
      ['1', 'alice@example.com', '98500', '2026-08-06'],
    ],
  },
  activeGameId: 'tetris',
  modals: {
    'admin-grant-credit-modal': false,
    'game-pause-modal': false,
    'out-of-credits-dialog': false,
  },
  form: {
    'bonus-credit-amount-field': 5,
  },
});

const executeBehavior = vi.fn();
const openModal = vi.fn((p: any) => {
  if (p?.id) store.set(`/modals/${p.id}`, true);
});
const testHandlers = { openModal, executeBehavior };

function renderPage(customStore = store, customHandlers = testHandlers) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <JSONUIProvider registry={componentRegistry} store={customStore} handlers={customHandlers as any}>
        <ArcadeLobbyPage store={customStore} handlers={customHandlers} />
      </JSONUIProvider>
    </QueryClientProvider>
  );
}

function HookTestComponent() {
  const { data: whoami } = useWhoami();
  const { data: wallet } = useGetUserWalletByPlayerId('550e8400-e29b-41d4-a716-446655440000');
  const { data: gameCards } = useListGameCards();
  const { data: leaderboard } = useGetTop10Leaderboard('tetris');
  const deductMut = useDeductCredit();
  const grantMut = useGrantAdminCredit();

  return (
    <div>
      <div data-testid="whoami-email">{whoami?.gcpIapEmail}</div>
      <div data-testid="wallet-total">{wallet?.totalCredits}</div>
      <div data-testid="gamecards-count">{gameCards?.length}</div>
      <div data-testid="leaderboard-count">{leaderboard?.length}</div>
      <button
        onClick={() =>
          deductMut.mutate({
            gameCardId: '98765432-10fe-dcba-9876-543210fedcba',
            playerId: '550e8400-e29b-41d4-a716-446655440000',
          })
        }
      >
        Trigger Deduct Hook
      </button>
      <button
        onClick={() =>
          grantMut.mutate({
            playerId: '550e8400-e29b-41d4-a716-446655440000',
            userWalletId: 'a3b1c2d3-e4f5-6789-abcd-ef0123456789',
            amount: 5,
          })
        }
      >
        Trigger Grant Hook
      </button>
    </div>
  );
}

describe('ArcadeLobbyPage Unit Tests', () => {
  beforeEach(() => {
    resetMockFixtures();
    store.set('/modals', {
      'admin-grant-credit-modal': false,
      'game-pause-modal': false,
      'out-of-credits-dialog': false,
    });
    store.set('/form', { 'bonus-credit-amount-field': 5 });
    vi.clearAllMocks();
  });

  // Pattern 1 — Render
  it('Pattern 1: renders lobby headings and primary controls', async () => {
    renderPage();
    expect(await screen.findByText('Select Arcade Game')).toBeInTheDocument();
    expect(await screen.findByText(/Top 10 Leaderboard/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /START/i })).toBeInTheDocument();
  });

  // Pattern 2 — Query (store-based data)
  it('Pattern 2: renders leaderboard rows when store data is populated', async () => {
    const user = userEvent.setup();
    renderPage();
    const showLeaderboardBtn = screen.getByRole('button', { name: /Top 10 Leaderboard/i });
    await user.click(showLeaderboardBtn);

    expect(await screen.findByText('alice@example.com')).toBeInTheDocument();
    expect(await screen.findByText('98500')).toBeInTheDocument();
  });

  it('highlights current user record in leaderboard', async () => {
    const user = userEvent.setup();
    const testStore = createStateStore({
      user: { email: 'linus@example.com', id: '550e8400' },
      wallet: { dailyFreeCredit: 10, adminBonusCredit: 5, totalCredits: 15, id: 'a3b1' },
      settings: { crtEnabled: false, masterMuted: false },
      data: {
        listGameCards: [],
        top10Leaderboard: [
          ['1', 'linus@example.com', '99900', '2026-08-08'],
          ['2', 'alice@example.com', '88800', '2026-08-08'],
        ],
      },
      activeGameId: 'tetris',
      modals: {},
    });

    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <ArcadeLobbyPage store={testStore} />
      </QueryClientProvider>
    );

    const showLeaderboardBtn = screen.getByRole('button', { name: /Top 10 Leaderboard/i });
    await user.click(showLeaderboardBtn);

    const selfCells = await screen.findAllByText('linus@example.com');
    expect(selfCells.length).toBeGreaterThanOrEqual(2);
    expect(selfCells[1]).toHaveClass('text-cyan-300');
  });

  // Pattern 3 — Modal Open + executeBehavior
  it('Pattern 3: opens admin grant modal when button clicked', async () => {
    const user = userEvent.setup();
    renderPage();
    const grantBtn = screen.getByRole('button', { name: /Grant Bonus Credits/i });
    await user.click(grantBtn);

    expect(openModal).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'admin-grant-credit-modal' })
    );
    expect(store.get('/modals/admin-grant-credit-modal')).toBe(true);
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(await screen.findByText(/Grant Admin Bonus Credit/i)).toBeInTheDocument();
  });

  it('hides admin grant button when player is not admin', async () => {
    server.use(
      http.post(/\/api\/v1\/players:whoami/, () => {
        return HttpResponse.json({ ...mockPlayer, isAdmin: false });
      })
    );

    renderPage();
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /Grant Bonus Credits/i })).not.toBeInTheDocument();
    });
  });

  it('Pattern 3: triggers executeBehavior on DeductCredit START button press', async () => {
    const user = userEvent.setup();
    renderPage();
    const startBtn = screen.getByRole('button', { name: /START \(1 Coin\)/i });
    await user.click(startBtn);

    expect(executeBehavior).toHaveBeenCalledWith(
      expect.objectContaining({ ref: 'DeductCredit' })
    );
  });

  // Pattern 4 — Row Actions / Carousel navigation
  it('Pattern 4: triggers executeBehavior on NextGame carousel button press', async () => {
    const user = userEvent.setup();
    renderPage();
    const nextBtn = screen.getByRole('button', { name: /Next ▶/i });
    await user.click(nextBtn);

    expect(executeBehavior).toHaveBeenCalledWith(
      expect.objectContaining({ ref: 'NextGame' })
    );
  });

  // Additional behavior test: Default handler execution & full branch coverage
  it('executes default controller behaviors (CRT, Mute, Carousel, Grant, Out of Credits)', async () => {
    const user = userEvent.setup();
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <ArcadeLobbyPage />
      </QueryClientProvider>
    );

    // Toggle CRT & Mute
    const crtSwitch = await screen.findByRole('switch', { name: /CRT/i });
    await user.click(crtSwitch);

    const muteSwitch = await screen.findByRole('switch', { name: /Audio/i });
    await user.click(muteSwitch);

    // Carousel buttons
    const prevBtn = screen.getByRole('button', { name: /Previous/i });
    await user.click(prevBtn);

    const nextBtn = screen.getByRole('button', { name: /Next/i });
    await user.click(nextBtn);

    // Deduct coin
    const startBtn = screen.getByRole('button', { name: /START \(1 Coin\)/i });
    await user.click(startBtn);
  });

  it('handles admin grant invalid amount validation branch', async () => {
    const user = userEvent.setup();
    const testStore = createStateStore({
      user: { email: 'linus@example.com', id: '550e8400-e29b-41d4-a716-446655440000' },
      wallet: { dailyFreeCredit: 10, adminBonusCredit: 5, totalCredits: 15, id: 'a3b1c2d3' },
      settings: { crtEnabled: false, masterMuted: false },
      data: { listGameCards: [], top10Leaderboard: [] },
      activeGameId: 'tetris',
      modals: { 'admin-grant-credit-modal': true },
      form: { 'bonus-credit-amount-field': 0 },
    });

    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <ArcadeLobbyPage store={testStore} />
      </QueryClientProvider>
    );

    const submitBtn = await screen.findByRole('button', { name: /Issue Bonus Credits|Grant Bonus Credits/i });
    await user.click(submitBtn);
    expect(screen.getByText(/Amount must be at least 1 credit/i)).toBeInTheDocument();
  });

  it('handles admin grant valid submission branch', async () => {
    const user = userEvent.setup();
    const testStore = createStateStore({
      user: { email: 'linus@example.com', id: '550e8400-e29b-41d4-a716-446655440000' },
      wallet: { dailyFreeCredit: 10, adminBonusCredit: 5, totalCredits: 15, id: 'a3b1c2d3' },
      settings: { crtEnabled: false, masterMuted: false },
      data: { listGameCards: [], top10Leaderboard: [] },
      activeGameId: 'tetris',
      modals: { 'admin-grant-credit-modal': true },
      form: { 'bonus-credit-amount-field': 10 },
    });

    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <ArcadeLobbyPage store={testStore} />
      </QueryClientProvider>
    );

    const submitBtn = await screen.findByRole('button', { name: /Issue Bonus Credits|Grant Bonus Credits/i });
    await user.click(submitBtn);
    await waitFor(() => {
      expect(screen.getByText(/successfully/i)).toBeInTheDocument();
    });
  });

  it('handles grant credit API failure branch', async () => {
    server.use(
      http.post(/\/api\/v1\/players\/.*\/user-wallets\/.*:grantAdminCredit/, () => {
        return HttpResponse.json(
          { code: 'BAD_REQUEST', message: 'Admin quota exceeded', timestamp: new Date().toISOString() },
          { status: 400 }
        );
      })
    );

    const user = userEvent.setup();
    const testStore = createStateStore({
      user: { email: 'linus@example.com', id: '550e8400-e29b-41d4-a716-446655440000' },
      wallet: { dailyFreeCredit: 10, adminBonusCredit: 5, totalCredits: 15, id: 'a3b1c2d3' },
      settings: { crtEnabled: false, masterMuted: false },
      data: { listGameCards: [], top10Leaderboard: [] },
      activeGameId: 'tetris',
      modals: { 'admin-grant-credit-modal': true },
      form: { 'bonus-credit-amount-field': 5 },
    });

    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <ArcadeLobbyPage store={testStore} />
      </QueryClientProvider>
    );

    const submitBtn = await screen.findByRole('button', { name: /Issue Bonus Credits|Grant Bonus Credits/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Grant Failed: Admin quota exceeded/i)).toBeInTheDocument();
    });
  });

  it('handles deduct credit API failure branch', async () => {
    server.use(
      http.post(/\/api\/v1\/game-cards\/.*:insertCoin/, () => {
        return HttpResponse.json(
          { code: 'BAD_REQUEST', message: 'Game unavailable', timestamp: new Date().toISOString() },
          { status: 400 }
        );
      })
    );

    const user = userEvent.setup();
    const testStore = createStateStore({
      user: { email: 'linus@example.com', id: '550e8400-e29b-41d4-a716-446655440000' },
      wallet: { dailyFreeCredit: 10, adminBonusCredit: 5, totalCredits: 15, id: 'a3b1c2d3' },
      settings: { crtEnabled: false, masterMuted: false },
      data: {
        listGameCards: [
          { id: '98765432', gameId: 'tetris', title: 'Tetris', coverArtUrl: '', description: '', totalPlayCount: 0 },
        ],
        top10Leaderboard: [],
      },
      activeGameId: 'tetris',
      modals: {},
    });

    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <ArcadeLobbyPage store={testStore} />
      </QueryClientProvider>
    );

    const startBtn = await screen.findByRole('button', { name: /START \(1 Coin\)/i });
    await user.click(startBtn);

    await waitFor(() => {
      expect(screen.getByText(/Insert Coin Failed: Game unavailable/i)).toBeInTheDocument();
    });
  });

  it('handles pause modal and resume/quit buttons', async () => {
    const user = userEvent.setup();
    const modalStore = createStateStore({
      user: { email: 'linus@example.com', id: '550e8400' },
      wallet: { dailyFreeCredit: 10, adminBonusCredit: 5, totalCredits: 15, id: 'a3b1' },
      settings: { crtEnabled: false, masterMuted: false },
      data: { listGameCards: [], top10Leaderboard: [] },
      activeGameId: 'tetris',
      modals: { 'game-pause-modal': true },
    });

    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <ArcadeLobbyPage store={modalStore} />
      </QueryClientProvider>
    );

    const resumeBtn = await screen.findByRole('button', { name: /Resume Game/i });
    await user.click(resumeBtn);

    expect(modalStore.get('/modals/game-pause-modal')).toBe(false);
  });

  it('handles out of credits scenario and OK dismiss button', async () => {
    const user = userEvent.setup();
    resetMockFixtures();
    mockPlayer.wallet.dailyFreeCredit = 0;
    mockPlayer.wallet.adminBonusCredit = 0;
    mockPlayer.wallet.totalCredits = 0;

    const zeroStore = createStateStore({
      user: { email: 'linus@example.com', id: '550e8400-e29b-41d4-a716-446655440000' },
      wallet: { dailyFreeCredit: 0, adminBonusCredit: 0, totalCredits: 0, id: 'a3b1c2d3' },
      settings: { crtEnabled: false, masterMuted: false },
      data: { listGameCards: [], top10Leaderboard: [] },
      activeGameId: 'tetris',
      modals: { 'out-of-credits-dialog': true },
    });

    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <ArcadeLobbyPage store={zeroStore} />
      </QueryClientProvider>
    );

    const okBtn = await screen.findByRole('button', { name: /OK/i });
    await user.click(okBtn);

    expect(zeroStore.get('/modals/out-of-credits-dialog')).toBe(false);
  });

  it('tests api client methods (get with params, put, delete, 204, ApiError)', async () => {
    server.use(
      http.get('/api/v1/test-params', ({ request }) => {
        const url = new URL(request.url);
        return HttpResponse.json({ query: url.searchParams.get('foo') });
      }),
      http.put('/api/v1/test-put', async ({ request }) => {
        const body: any = await request.json();
        return HttpResponse.json({ updated: body.data });
      }),
      http.delete('/api/v1/test-delete', () => {
        return new HttpResponse(null, { status: 204 });
      }),
      http.get('/api/v1/test-error-string', () => {
        return new HttpResponse('Plain Text Error', { status: 500 });
      })
    );

    const { api, ApiError } = await import('@/lib/api-client');
    const getRes: any = await api.get('/test-params', { params: { foo: 'bar', empty: null } });
    expect(getRes.query).toBe('bar');

    const putRes: any = await api.put('/test-put', { data: 123 });
    expect(putRes.updated).toBe(123);

    const delRes: any = await api.delete('/test-delete');
    expect(delRes).toEqual({});

    await expect(api.get('/test-error-string')).rejects.toThrow(ApiError);
  });

  it('tests component registry div passthrough', () => {
    const DivComp = componentRegistry['div'];
    const { container } = render(<DivComp element={{ props: { className: 'custom-div-class' } }}>Content</DivComp>);
    expect(container.querySelector('.custom-div-class')).toBeInTheDocument();
  });

  it('tests ArcadeBridge event subscription, unsubscribe and clearAll', () => {
    const cb = vi.fn();
    const unsub = ArcadeBridge.on('COIN_INSERTED', cb);
    ArcadeBridge.emit('COIN_INSERTED', 5);
    expect(cb).toHaveBeenCalledWith(5);
    unsub();
    ArcadeBridge.clearAll();
  });

  it('handles return to lobby action button', async () => {
    const user = userEvent.setup();
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <ArcadeLobbyPage />
      </QueryClientProvider>
    );

    const returnBtn = await screen.findByRole('button', { name: /Exit/i });
    await user.click(returnBtn);
  });

  it('handles empty gameCardsData branch', async () => {
    server.use(
      http.post('*/graphql', async ({ request }) => {
        const body: any = await request.json().catch(() => ({}));
        if (body?.query?.includes('listGameCards')) {
          return HttpResponse.json({ data: { listGameCards: [] } });
        }
        return HttpResponse.json({ data: {} });
      })
    );
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <ArcadeLobbyPage />
      </QueryClientProvider>
    );
  });

  it('handles DeductCredit when totalCredits <= 0 branch', async () => {
    const user = userEvent.setup();
    resetMockFixtures();
    mockPlayer.wallet.dailyFreeCredit = 0;
    mockPlayer.wallet.adminBonusCredit = 0;
    mockPlayer.wallet.totalCredits = 0;

    const zeroStore = createStateStore({
      user: { email: 'linus@example.com', id: '550e8400' },
      wallet: { dailyFreeCredit: 0, adminBonusCredit: 0, totalCredits: 0, id: 'a3b1' },
      settings: { crtEnabled: false, masterMuted: false },
      data: { listGameCards: [], top10Leaderboard: [] },
      activeGameId: 'tetris',
      modals: {},
    });

    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <ArcadeLobbyPage store={zeroStore} />
      </QueryClientProvider>
    );

    const startBtn = await screen.findByRole('button', { name: /START \(1 Coin\)/i });
    await user.click(startBtn);

    expect(zeroStore.get('/modals/out-of-credits-dialog')).toBe(true);
  });
});
