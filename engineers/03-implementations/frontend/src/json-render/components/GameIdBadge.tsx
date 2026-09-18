import React from 'react';

export interface GameIdBadgeProps {
  id?: string;
  gameId?: any;
  title?: any;
  renderer?: 'WebGL' | 'Canvas' | string;
}

export default function GameIdBadge({ props }: { props: GameIdBadgeProps }) {
  const displayTitle = props?.title || props?.gameId || '';

  if (!displayTitle) {
    return null;
  }

  const renderer = props?.renderer;
  const isWebGL = renderer ? renderer.toLowerCase() === 'webgl' : true;

  return (
    <div className="flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-slate-900 border border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.3)]">
      <span className="text-sm">🎮</span>
      <span className="font-bold text-sm text-amber-300 tracking-wide drop-shadow-[0_0_8px_rgba(245,158,11,0.7)]">
        {displayTitle}
      </span>
      {renderer && (
        <>
          <span className="h-3 w-px bg-slate-700/80" aria-hidden="true" />
          <span
            className={`font-mono text-xs font-semibold tracking-wider flex items-center gap-1 ${
              isWebGL
                ? 'text-cyan-400 drop-shadow-[0_0_6px_rgba(34,211,238,0.5)]'
                : 'text-amber-400'
            }`}
          >
            {isWebGL ? '⚡ WEBGL' : '⚠️ CANVAS'}
          </span>
        </>
      )}
    </div>
  );
}
