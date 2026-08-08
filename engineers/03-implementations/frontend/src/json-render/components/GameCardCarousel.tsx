import React, { useState } from 'react';
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
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  let store: any;
  try {
    store = useStateStore();
  } catch {
    store = null;
  }

  let gamesList: GameCardItem[] = [];
  let currentActiveId: string = 'tetris';
  let leaderboardRows: any[] = [];

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

    leaderboardRows = store.get('/data/top10Leaderboard') || [];
  }

  const activeGame =
    gamesList.find((g) => g.gameId === currentActiveId) || gamesList[0];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col md:flex-row gap-6 items-start shadow-xl">
      {/* Left Column: 16:9 Full Bleed Game Cover (Clean without badge overlay) */}
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
      </div>

      {/* Right Column: Game Details, Plays Stats Badge, Leaderboard Option & Play Action */}
      <div className="w-full md:w-1/2 flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-emerald-400">
              Selected Game
            </span>
            {/* Plays stats moved to right side */}
            <span className="bg-slate-800 text-amber-400 text-xs px-2.5 py-1 rounded-full font-semibold border border-amber-500/30 flex items-center gap-1 shadow-sm">
              🎮 Plays: {activeGame?.totalPlayCount ?? 0}
            </span>
          </div>

          <h3 className="text-2xl font-black text-white mt-1">
            {activeGame?.title || 'No Game Selected'}
          </h3>

          <p className="text-sm text-slate-300 mt-2 leading-relaxed">
            {activeGame?.description || 'Select a game card from the catalog above to view details.'}
          </p>
        </div>

        {/* Option Button: Top 10 Leaderboard (by default hidden) */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowLeaderboard((prev) => !prev)}
            className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-md bg-slate-800 text-indigo-300 hover:text-white hover:bg-slate-700 border border-slate-700 transition-colors cursor-pointer"
          >
            🏆 {showLeaderboard ? 'Hide Top 10 Leaderboard' : 'Show Top 10 Leaderboard'}
          </button>

          {/* Collapsible Leaderboard Section (Default Hidden) */}
          {showLeaderboard && (
            <div className="mt-3 bg-slate-950 border border-slate-800 rounded-lg p-3 space-y-2 animate-in fade-in-0 duration-200">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                🏆 Top 10 Leaderboard — {activeGame?.title}
              </h4>
              {leaderboardRows && leaderboardRows.length > 0 ? (
                <div className="overflow-x-auto max-h-48 overflow-y-auto custom-scrollbar">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400">
                        <th className="pb-1.5 font-semibold">Rank</th>
                        <th className="pb-1.5 font-semibold">Player</th>
                        <th className="pb-1.5 font-semibold text-right">Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {leaderboardRows.map((row: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-900/50">
                          <td className="py-1 font-bold text-amber-400">#{row[0] || idx + 1}</td>
                          <td className="py-1 text-slate-200 truncate max-w-[140px]">{row[1]}</td>
                          <td className="py-1 text-right font-mono text-emerald-400 font-bold">{row[2]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-xs text-slate-500 italic py-2">No leaderboard scores recorded yet.</div>
              )}
            </div>
          )}
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
