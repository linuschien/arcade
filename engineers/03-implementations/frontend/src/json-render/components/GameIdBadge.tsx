import React from 'react';

export interface GameIdBadgeProps {
  id?: string;
  gameId?: any;
}

export default function GameIdBadge({ props }: { props: GameIdBadgeProps }) {
  const rawGameId = props?.gameId ?? '';
  const displayId = String(rawGameId).toUpperCase();

  if (!displayId) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 border border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.3)]">
      <span className="text-sm">🎮</span>
      <span className="uppercase font-black text-sm text-amber-300 tracking-widest drop-shadow-[0_0_8px_rgba(245,158,11,0.7)]">
        {displayId}
      </span>
    </div>
  );
}
