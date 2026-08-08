import React from 'react';
import { useStateStore } from '@json-render/react';

export interface GameCardItem {
  id: string;
  gameId: string;
  title: string;
  coverArtUrl: string;
  description: string;
  totalPlayCount: number;
}

export interface GameCardCarouselProps {
  id?: string;
  label?: string;
  games?: any;
  activeGameId?: any;
}

export default function GameCardCarousel({
  props,
  children,
}: {
  props: GameCardCarouselProps;
  children?: React.ReactNode;
}) {
  const { games: rawGames, activeGameId: rawActiveId } = props || {};
  let store: any;
  try {
    store = useStateStore();
  } catch {
    store = null;
  }

  let gamesList: GameCardItem[] = [];
  let currentActiveId: string = 'tetris';

  if (store) {
    if (typeof rawGames === 'object' && rawGames !== null && '$bindState' in rawGames) {
      gamesList = store.get(rawGames.$bindState) || [];
    } else if (typeof rawGames === 'string' && rawGames.startsWith('/')) {
      gamesList = store.get(rawGames) || [];
    } else if (Array.isArray(rawGames)) {
      gamesList = rawGames;
    }

    if (typeof rawActiveId === 'object' && rawActiveId !== null && '$bindState' in rawActiveId) {
      currentActiveId = store.get(rawActiveId.$bindState) || 'tetris';
    } else if (typeof rawActiveId === 'string' && rawActiveId.startsWith('/')) {
      currentActiveId = store.get(rawActiveId) || 'tetris';
    } else if (typeof rawActiveId === 'string') {
      currentActiveId = rawActiveId;
    }
  }

  const activeGame =
    gamesList.find((g) => g.gameId === currentActiveId) || gamesList[0];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col md:flex-row gap-6 items-center shadow-xl">
      <div className="w-full md:w-1/2 aspect-video bg-slate-950 rounded-lg overflow-hidden relative flex items-center justify-center border border-slate-800 shadow-md">
        {activeGame?.coverArtUrl ? (
          <img
            src={activeGame.coverArtUrl}
            alt={activeGame.title || 'Game Cover'}
            className="w-full h-full object-cover rounded-lg"
          />
        ) : (
          <div className="text-slate-500 font-mono text-sm">NO COVER ART</div>
        )}
        <div className="absolute bottom-2 right-2 z-20 bg-black/80 backdrop-blur-md text-amber-400 text-xs px-2.5 py-1 rounded-full font-semibold border border-amber-500/30 shadow-lg">
          🎮 Plays: {activeGame?.totalPlayCount ?? 0}
        </div>
      </div>

      <div className="w-full md:w-1/2 flex flex-col justify-between space-y-4">
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold text-emerald-400">
            Selected Game
          </span>
          <h3 className="text-2xl font-black text-white mt-1">
            {activeGame?.title || 'No Game Selected'}
          </h3>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed">
            {activeGame?.description || 'Select a game card from the catalog above to view details.'}
          </p>
        </div>

        <div className="pt-2 flex items-center justify-between border-t border-slate-800">
          <div className="text-xs text-slate-400">
            Cost: <span className="font-bold text-amber-400">1 Coin</span> / Play
          </div>
          <div>{children}</div>
        </div>
      </div>
    </div>
  );
}
