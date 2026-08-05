/**
 * ArcadeBridge.ts
 * Core communication bridge between React Host Shell and Phaser Game Engine instances.
 */

export interface GameSummary {
  gameId: string;
  score: number;
  playTimeSeconds: number;
  creditsUsed: number;
  extraData?: Record<string, unknown>;
}

export interface IArcadeGame {
  /**
   * Triggered when a coin/credit is inserted via the React Host UI.
   */
  onCoinInsert(credits: number): void;

  /**
   * Pause game loop and physics.
   */
  onPause(): void;

  /**
   * Resume game loop and physics.
   */
  onResume(): void;

  /**
   * Safely tear down scenes, remove event listeners, and unload WebGL textures.
   */
  destroyGame(): void;
}

export type ArcadeEvent =
  | 'COIN_INSERTED'
  | 'PAUSE_REQUESTED'
  | 'RESUME_REQUESTED'
  | 'GAME_OVER'
  | 'SCORE_UPDATED';

export type EventCallback<T = unknown> = (data: T) => void;

class ArcadeBridgeEmitter {
  private listeners: Map<ArcadeEvent, Set<EventCallback>> = new Map();

  /**
   * Subscribe to an ArcadeBridge event.
   */
  public on<T = unknown>(event: ArcadeEvent, callback: EventCallback<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    const set = this.listeners.get(event)!;
    set.add(callback as EventCallback);

    // Return unsubscribe function
    return () => {
      set.delete(callback as EventCallback);
    };
  }

  /**
   * Emit an ArcadeBridge event.
   */
  public emit<T = unknown>(event: ArcadeEvent, payload?: T): void {
    const set = this.listeners.get(event);
    if (set) {
      set.forEach((cb) => cb(payload));
    }
  }

  /**
   * Clear all active event listeners.
   */
  public clearAll(): void {
    this.listeners.clear();
  }
}

export const ArcadeBridge = new ArcadeBridgeEmitter();
