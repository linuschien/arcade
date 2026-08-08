// AUTO-GENERATED - Arcade Lobby Controller Page
import React, { useEffect, useState } from 'react';
import { Renderer, JSONUIProvider, createStateStore } from '@json-render/react';
import { componentRegistry } from '@/json-render/component-registry';
import spec from '@/schemas/arcade-lobby.render-schema.json';

import { useWhoami } from '@/hooks/use-whoami';
import { useListGameCards } from '@/hooks/use-listGameCards';
import { useGetTop10Leaderboard } from '@/hooks/use-getTop10Leaderboard';
import { useDeductCredit } from '@/hooks/use-deductCredit';
import { useGrantAdminCredit } from '@/hooks/use-grantAdminCredit';
import { ArcadeBridge } from '@/core/bridge/ArcadeBridge';

export interface ArcadeLobbyPageProps {
  store?: any;
  handlers?: any;
}

const defaultStore = createStateStore({
  user: { email: '', id: '' },
  wallet: { dailyFreeCredit: 0, adminBonusCredit: 0, totalCredits: 0, id: '' },
  settings: {
    crtEnabled: localStorage.getItem('arcade_crt_enabled') === 'true',
    masterMuted: false,
  },
  data: {
    listGameCards: [],
    top10Leaderboard: [],
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

export default function ArcadeLobbyPage({ store: propStore, handlers: propHandlers }: ArcadeLobbyPageProps) {
  const store = propStore || defaultStore;
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Subscribe to store updates to re-render when store state changes (CRT, Mute, Modals)
  const [, setTick] = useState(0);
  useEffect(() => {
    const unsub = store.subscribe(() => {
      setTick((t) => t + 1);
    });
    return unsub;
  }, [store]);

  // Queries
  const { data: whoamiData } = useWhoami();
  const { data: gameCardsData } = useListGameCards();
  
  const [activeGameId, setActiveGameId] = useState<string>('tetris');
  const { data: leaderboardData } = useGetTop10Leaderboard(activeGameId);

  // Mutations
  const deductCreditMutation = useDeductCredit();
  const grantAdminCreditMutation = useGrantAdminCredit();

  // Sync state to store on API responses
  useEffect(() => {
    if (whoamiData) {
      store.set('/user/email', whoamiData.gcpIapEmail);
      store.set('/user/id', whoamiData.id);
      if (whoamiData.wallet) {
        store.set('/wallet/dailyFreeCredit', whoamiData.wallet.dailyFreeCredit);
        store.set('/wallet/adminBonusCredit', whoamiData.wallet.adminBonusCredit);
        store.set('/wallet/totalCredits', whoamiData.wallet.totalCredits);
        store.set('/wallet/id', whoamiData.wallet.id);
      }
    }
  }, [whoamiData, store]);

  useEffect(() => {
    if (gameCardsData && gameCardsData.length > 0) {
      store.set('/data/listGameCards', gameCardsData);
      if (!store.get('/activeGameId')) {
        store.set('/activeGameId', gameCardsData[0].gameId);
        setActiveGameId(gameCardsData[0].gameId);
      }
    }
  }, [gameCardsData, store]);

  useEffect(() => {
    if (leaderboardData && leaderboardData.length > 0) {
      const formattedRows = leaderboardData.map((item, idx) => [
        String(item.rank || idx + 1),
        item.playerEmail,
        String(item.score),
        item.submittedAt ? item.submittedAt.substring(0, 10) : '',
      ]);
      store.set('/data/top10Leaderboard', formattedRows);
    }
  }, [leaderboardData, store]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Controller Action Handlers
  const defaultHandlers = {
    openModal: ({ id }: { id: string }) => {
      store.set(`/modals/${id}`, true);
    },

    executeBehavior: async ({ ref, id }: { ref: string; id?: string }) => {
      const currentActiveId = store.get('/activeGameId') || activeGameId;
      const games = store.get('/data/listGameCards') || gameCardsData || [];
      const currentIndex = games.findIndex((g: any) => g.gameId === currentActiveId);

      switch (ref) {
        case 'ToggleCRT': {
          const current = store.get('/settings/crtEnabled');
          localStorage.setItem('arcade_crt_enabled', String(current));
          break;
        }

        case 'ToggleMute': {
          // Store state already updated by Switch setChecked binding
          break;
        }

        case 'PrevGame': {
          if (games.length > 0) {
            const prevIndex = (currentIndex - 1 + games.length) % games.length;
            const newGameId = games[prevIndex].gameId;
            store.set('/activeGameId', newGameId);
            setActiveGameId(newGameId);
          }
          break;
        }

        case 'NextGame': {
          if (games.length > 0) {
            const nextIndex = (currentIndex + 1) % games.length;
            const newGameId = games[nextIndex].gameId;
            store.set('/activeGameId', newGameId);
            setActiveGameId(newGameId);
          }
          break;
        }

        case 'DeductCredit': {
          const totalCredits = store.get('/wallet/totalCredits') || 0;
          if (totalCredits <= 0) {
            store.set('/modals/out-of-credits-dialog', true);
            return;
          }

          const activeGameObj = games.find((g: any) => g.gameId === currentActiveId);
          const gameCardId = activeGameObj?.id || '98765432-10fe-dcba-9876-543210fedcba';
          const playerId = store.get('/user/id') || '550e8400-e29b-41d4-a716-446655440000';

          try {
            await deductCreditMutation.mutateAsync({ gameCardId, playerId });
            ArcadeBridge.emit('COIN_INSERTED', totalCredits - 1);
            showToast('Coin inserted successfully! Launching game...');
          } catch (err: any) {
            const errorMessage = err?.data?.message || err?.message || 'Coin insert failed.';
            showToast(`Insert Coin Failed: ${errorMessage}`);
          }
          break;
        }

        case 'GrantAdminCredit': {
          const amountVal = Number(store.get('/form/bonus-credit-amount-field'));

          // Pre-submit validation per policy
          if (!amountVal || isNaN(amountVal) || amountVal < 1) {
            showToast('Grant Failed: Amount must be at least 1 credit');
            return;
          }

          const playerId = store.get('/user/id') || '550e8400-e29b-41d4-a716-446655440000';
          const userWalletId = store.get('/wallet/id') || 'a3b1c2d3-e4f5-6789-abcd-ef0123456789';

          try {
            await grantAdminCreditMutation.mutateAsync({
              playerId,
              userWalletId,
              amount: amountVal,
            });
            showToast('Bonus credits granted successfully!');
            store.set('/modals/admin-grant-credit-modal', false);
          } catch (err: any) {
            const errorMessage = err?.data?.message || err?.message || 'Failed to grant bonus credits.';
            showToast(`Grant Failed: ${errorMessage}`);
          }
          break;
        }

        case 'ResumeGame': {
          ArcadeBridge.emit('RESUME_REQUESTED');
          store.set('/modals/game-pause-modal', false);
          break;
        }

        case 'ReturnToLobby': {
          ArcadeBridge.emit('RESUME_REQUESTED');
          store.set('/modals/game-pause-modal', false);
          break;
        }

        case 'DismissOutOfCredits': {
          store.set('/modals/out-of-credits-dialog', false);
          break;
        }

        default:
          break;
      }
    },
  };

  const handlers = propHandlers || defaultHandlers;
  const isCrtEnabled = store.get('/settings/crtEnabled');

  return (
    <JSONUIProvider store={store} handlers={handlers} registry={componentRegistry}>
      <div className="relative min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
        {isCrtEnabled && <div className="crt-overlay" aria-hidden="true" />}

        {toastMessage && (
          <div className="fixed top-4 right-4 z-[10000] bg-slate-800 border border-slate-700 text-white text-sm px-4 py-3 rounded-lg shadow-xl flex items-center gap-2">
            <span>ℹ️</span>
            <span>{toastMessage}</span>
          </div>
        )}

        <Renderer spec={spec as any} registry={componentRegistry} />
      </div>
    </JSONUIProvider>
  );
}
