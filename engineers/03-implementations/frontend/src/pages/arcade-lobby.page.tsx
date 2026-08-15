import React, { useEffect, useState, useRef } from 'react';
import { Renderer, JSONUIProvider, createStateStore } from '@json-render/react';
import { componentRegistry } from '@/json-render/component-registry';
import spec from '@/schemas/arcade-lobby.render-schema.json';

import { useWhoami } from '@/hooks/use-whoami';
import { useListGameCards } from '@/hooks/use-listGameCards';
import { useGetTop10Leaderboard } from '@/hooks/use-getTop10Leaderboard';
import { useDeductCredit } from '@/hooks/use-deductCredit';
import { useGrantAdminCredit } from '@/hooks/use-grantAdminCredit';
import { useListPlayers } from '@/hooks/use-listPlayers';
import { useSubmitHighScore } from '@/hooks/use-submitHighScore';
import { ArcadeBridge, IArcadeGame } from '@/core/bridge/ArcadeBridge';
import { createGameInstance } from '@/games';
import { SoundEngine } from '@/core/audio/SoundEngine';

export interface ArcadeLobbyPageProps {
  store?: any;
  handlers?: any;
}

const isCrtInitial = localStorage.getItem('arcade_crt_enabled') === 'true';
const isAudioInitial = localStorage.getItem('arcade_audio_enabled') !== 'false';

const defaultStore = createStateStore({
  user: { email: '', id: '', isAdmin: false },
  wallet: { dailyFreeCredit: 0, adminBonusCredit: 0, totalCredits: 0, id: '' },
  settings: {
    crtEnabled: isCrtInitial,
    masterMuted: !isAudioInitial,
    audioEnabled: isAudioInitial,
    crtLabel: isCrtInitial ? '📺 CRT: ON' : '📺 CRT: OFF',
    muteLabel: isAudioInitial ? '🔊 Audio: ON' : '🔇 Audio: OFF',
  },
  data: {
    listGameCards: [],
    top10Leaderboard: [],
  },
  activeGameId: 'tetris',
  activeGameTitle: 'Tetris Classic',
  modals: {
    'admin-grant-credit-modal': false,
    'game-pause-modal': false,
    'out-of-credits-dialog': false,
  },
  form: {
    'bonus-credit-amount-field': 5,
  },
  game: {
    isPlaying: false,
    isLobbyVisible: true,
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

  const isCrtEnabled = store.get('/settings/crtEnabled');
  const isAudioEnabled = store.get('/settings/audioEnabled') ?? !store.get('/settings/masterMuted');
  const isPlaying = store.get('/game/isPlaying') ?? false;
  const isPauseModalOpen = store.get('/modals/game-pause-modal') ?? false;

  // Sync audio mute state with SoundEngine
  useEffect(() => {
    SoundEngine.setMuted(!isAudioEnabled);
  }, [isAudioEnabled]);

  const activeGameInstanceRef = useRef<IArcadeGame | null>(null);

  // Queries & Mutations
  const { data: whoamiData } = useWhoami();
  const { data: playersData } = useListPlayers(whoamiData?.isAdmin ?? false);
  const { data: gameCardsData } = useListGameCards();
  const [activeGameId, setActiveGameId] = useState<string>('tetris');
  const { data: leaderboardData } = useGetTop10Leaderboard(activeGameId);

  const deductCreditMutation = useDeductCredit();
  const grantAdminCreditMutation = useGrantAdminCredit();
  const submitHighScoreMutation = useSubmitHighScore();

  // Mount/Unmount Game Instance
  useEffect(() => {
    store.set('/game/isLobbyVisible', !isPlaying);

    if (isPlaying) {
      const targetGameId = store.get('/activeGameId') || 'tetris';
      const timer = setTimeout(() => {
        if (!activeGameInstanceRef.current) {
          const container = document.getElementById('phaser-game-canvas-container');
          if (container) {
            const game = createGameInstance(targetGameId, container);
            if (game) {
              activeGameInstanceRef.current = game;
            }
          }
        }
      }, 50);

      return () => {
        clearTimeout(timer);
      };
    } else {
      if (activeGameInstanceRef.current) {
        activeGameInstanceRef.current.destroyGame();
        activeGameInstanceRef.current = null;
      }
    }
  }, [isPlaying, store]);

  // Sync Pause Modal state with Game Loop
  useEffect(() => {
    if (isPlaying) {
      if (isPauseModalOpen) {
        ArcadeBridge.emit('PAUSE_REQUESTED');
      } else {
        ArcadeBridge.emit('RESUME_REQUESTED');
      }
    }
  }, [isPauseModalOpen, isPlaying]);

  // Auto-pause when tab/window loses focus
  useEffect(() => {
    if (!isPlaying) return;

    const triggerAutoPause = () => {
      if (store.get('/game/isPlaying') && !store.get('/modals/game-pause-modal')) {
        ArcadeBridge.emit('PAUSE_REQUESTED');
        store.set('/modals/game-pause-modal', true);
      }
    };

    const handleBlur = () => triggerAutoPause();
    const handleVisibilityChange = () => {
      if (document.hidden) triggerAutoPause();
    };

    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isPlaying, store]);

  // Game Over handling & Score Submission
  useEffect(() => {
    const unsubGameOver = ArcadeBridge.on('GAME_OVER', async (summary: any) => {
      const score = summary?.score ?? 0;
      const playerEmail = store.get('/user/email') || whoamiData?.gcpIapEmail || 'guest@arcade-stadium.local';
      const currentActiveId = store.get('/activeGameId') || activeGameId;
      const games = store.get('/data/listGameCards') || gameCardsData || [];
      const activeGameObj = games.find((g: any) => g.gameId === currentActiveId);
      const gameCardId = activeGameObj?.id || '98765432-10fe-dcba-9876-543210fedcba';

      showToast(`🏆 Game Over! Submitting score: ${score}...`);

      try {
        await submitHighScoreMutation.mutateAsync({ gameCardId, playerEmail, score });
        showToast(`🏆 Game Over! Final Score ${score} submitted to Leaderboard!`);
      } catch (err: any) {
        console.warn('Score submission warning:', err);
        showToast(`🏆 Game Over! Final Score: ${score}`);
      }

      setTimeout(() => {
        if (activeGameInstanceRef.current) {
          activeGameInstanceRef.current.destroyGame();
          activeGameInstanceRef.current = null;
        }
        store.set('/game/isPlaying', false);
        store.set('/game/isLobbyVisible', true);
      }, 3000);
    });

    return unsubGameOver;
  }, [store, whoamiData, gameCardsData, activeGameId, submitHighScoreMutation]);

  useEffect(() => {
    store.set('/settings/crtLabel', isCrtEnabled ? '📺 CRT: ON' : '📺 CRT: OFF');
    store.set('/settings/muteLabel', isAudioEnabled ? '🔊 Audio: ON' : '🔇 Audio: OFF');
    store.set('/settings/masterMuted', !isAudioEnabled);
    if (isCrtEnabled !== undefined) {
      localStorage.setItem('arcade_crt_enabled', String(!!isCrtEnabled));
    }
    if (isAudioEnabled !== undefined) {
      localStorage.setItem('arcade_audio_enabled', String(!!isAudioEnabled));
    }
  }, [isCrtEnabled, isAudioEnabled, store]);

  // Sync state to store on API responses
  useEffect(() => {
    if (whoamiData) {
      store.set('/user/email', whoamiData.gcpIapEmail);
      store.set('/user/id', whoamiData.id);
      store.set('/user/isAdmin', whoamiData.isAdmin ?? false);
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
      const currentId = store.get('/activeGameId') || gameCardsData[0].gameId;
      const currentCard = gameCardsData.find((g: any) => g.gameId === currentId) || gameCardsData[0];
      store.set('/activeGameId', currentCard.gameId);
      store.set('/activeGameTitle', currentCard.title);
      setActiveGameId(currentCard.gameId);
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

  useEffect(() => {
    if (playersData && playersData.length > 0) {
      const selectOptions = playersData.map((p) => p.gcpIapEmail || p.id);
      const playersMapByEmail = Object.fromEntries(
        playersData.map((p) => [p.gcpIapEmail || p.id, p])
      );

      store.set('/data/listPlayersSelectOptions', selectOptions);
      store.set('/data/playersMapByEmail', playersMapByEmail);

      if (!store.get('/form/grant-target-player-field')) {
        store.set('/form/grant-target-player-field', whoamiData?.gcpIapEmail || selectOptions[0]);
      }
    }
  }, [playersData, whoamiData, store]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Controller Action Handlers
  const defaultHandlers = {
    openModal: (params: any) => {
      const modalId = typeof params === 'string' ? params : (params?.id || params?.modalId || params?.path || '');
      if (modalId) {
        const path = modalId.startsWith('/') ? modalId : `/modals/${modalId}`;
        store.set(path, true);
      }
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
          const isAudioEnabled = store.get('/settings/audioEnabled');
          store.set('/settings/masterMuted', !isAudioEnabled);
          break;
        }

        case 'PrevGame': {
          if (games.length > 0) {
            const prevIndex = (currentIndex - 1 + games.length) % games.length;
            const newGame = games[prevIndex];
            store.set('/activeGameId', newGame.gameId);
            store.set('/activeGameTitle', newGame.title);
            setActiveGameId(newGame.gameId);
          }
          break;
        }

        case 'NextGame': {
          if (games.length > 0) {
            const nextIndex = (currentIndex + 1) % games.length;
            const newGame = games[nextIndex];
            store.set('/activeGameId', newGame.gameId);
            store.set('/activeGameTitle', newGame.title);
            setActiveGameId(newGame.gameId);
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
            store.set('/game/isPlaying', true);
            store.set('/game/isLobbyVisible', false);
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

          const selectedEmail = String(
            store.get('/form/grant-target-player-field') || whoamiData?.gcpIapEmail || ''
          );
          const playersMap = store.get('/data/playersMapByEmail') || {};
          const targetPlayer = playersMap[selectedEmail] || Object.values(playersMap)[0];

          const targetPlayerId =
            (targetPlayer as any)?.id || store.get('/user/id') || '550e8400-e29b-41d4-a716-446655440000';
          const targetWalletId =
            (targetPlayer as any)?.wallet?.id || store.get('/wallet/id') || 'a3b1c2d3-e4f5-6789-abcd-ef0123456789';
          const targetEmail = (targetPlayer as any)?.gcpIapEmail || selectedEmail || 'target player';

          try {
            await grantAdminCreditMutation.mutateAsync({
              playerId: targetPlayerId,
              userWalletId: targetWalletId,
              amount: amountVal,
            });
            showToast(`Granted ${amountVal} bonus credit(s) to ${targetEmail} successfully!`);
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
          if (activeGameInstanceRef.current) {
            activeGameInstanceRef.current.destroyGame();
            activeGameInstanceRef.current = null;
          }
          ArcadeBridge.emit('RESUME_REQUESTED');
          store.set('/modals/game-pause-modal', false);
          store.set('/game/isPlaying', false);
          store.set('/game/isLobbyVisible', true);
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

  return (
    <JSONUIProvider store={store} handlers={handlers} registry={componentRegistry}>
      <div
        className={`relative bg-slate-950 text-slate-100 font-sans antialiased ${
          isPlaying ? 'h-screen max-h-screen overflow-hidden flex flex-col justify-center' : 'min-h-screen'
        }`}
      >
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
