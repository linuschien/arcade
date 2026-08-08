/**
 * InputService.ts
 * Unified Input Abstraction for Arcade Cabinets, Gamepads, Keyboards, and Touch D-Pads.
 * Automatically binds DOM Keyboard listeners for standard WASD / Arrow keys.
 */

export enum PlayerIndex {
  P1 = 0,
  P2 = 1,
}

export enum ArcadeAction {
  UP = 'UP',
  DOWN = 'DOWN',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
  BUTTON_A = 'BUTTON_A',
  BUTTON_B = 'BUTTON_B',
  BUTTON_C = 'BUTTON_C',
  BUTTON_D = 'BUTTON_D',
  START = 'START',
  COIN = 'COIN',
}

export interface InputVector {
  x: number; // -1.0 to 1.0
  y: number; // -1.0 to 1.0
}

class InputServiceImpl {
  private actionState: Map<string, boolean> = new Map();
  private isListening: boolean = false;

  private readonly keyMap: Record<string, ArcadeAction> = {
    // Directional Movement
    ArrowLeft: ArcadeAction.LEFT,
    KeyA: ArcadeAction.LEFT,
    a: ArcadeAction.LEFT,

    ArrowRight: ArcadeAction.RIGHT,
    KeyD: ArcadeAction.RIGHT,
    d: ArcadeAction.RIGHT,

    ArrowDown: ArcadeAction.DOWN,
    KeyS: ArcadeAction.DOWN,
    s: ArcadeAction.DOWN,

    // Rotation (Up / W / X)
    ArrowUp: ArcadeAction.UP,
    KeyW: ArcadeAction.UP,
    w: ArcadeAction.UP,
    KeyX: ArcadeAction.BUTTON_B,
    x: ArcadeAction.BUTTON_B,

    // Hard Drop (Space / J)
    Space: ArcadeAction.BUTTON_A,
    ' ': ArcadeAction.BUTTON_A,
    KeyJ: ArcadeAction.BUTTON_A,

    // Hold Piece (C / Shift)
    KeyC: ArcadeAction.BUTTON_C,
    c: ArcadeAction.BUTTON_C,
    ShiftLeft: ArcadeAction.BUTTON_C,
    ShiftRight: ArcadeAction.BUTTON_C,

    // Mode Switch (M / BUTTON_D)
    KeyM: ArcadeAction.BUTTON_D,
    m: ArcadeAction.BUTTON_D,
  };

  constructor() {
    this.setupKeyboardListeners();
  }

  private setupKeyboardListeners(): void {
    if (typeof window === 'undefined' || this.isListening) return;
    this.isListening = true;

    window.addEventListener('keydown', (e: KeyboardEvent) => {
      const action = this.keyMap[e.code] || this.keyMap[e.key];
      if (action) {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', ' '].includes(e.code) || ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
          e.preventDefault();
        }
        this.setActionState(PlayerIndex.P1, action, true);
      }
    });

    window.addEventListener('keyup', (e: KeyboardEvent) => {
      const action = this.keyMap[e.code] || this.keyMap[e.key];
      if (action) {
        this.setActionState(PlayerIndex.P1, action, false);
      }
    });
  }

  private getKey(player: PlayerIndex, action: ArcadeAction): string {
    return `${player}:${action}`;
  }

  /**
   * Set the state of a virtual Arcade Action (called by Keyboard listeners, Gamepad poller, or Touch controls).
   */
  public setActionState(player: PlayerIndex, action: ArcadeAction, isPressed: boolean): void {
    this.actionState.set(this.getKey(player, action), isPressed);
  }

  /**
   * Query whether a specific Arcade Action is currently held down.
   */
  public isActionDown(player: PlayerIndex, action: ArcadeAction): boolean {
    return this.actionState.get(this.getKey(player, action)) === true;
  }

  /**
   * Get normalized directional vector (-1 to 1 for X and Y).
   */
  public getActionVector(player: PlayerIndex): InputVector {
    let x = 0;
    let y = 0;

    if (this.isActionDown(player, ArcadeAction.LEFT)) x -= 1;
    if (this.isActionDown(player, ArcadeAction.RIGHT)) x += 1;
    if (this.isActionDown(player, ArcadeAction.UP)) y -= 1;
    if (this.isActionDown(player, ArcadeAction.DOWN)) y += 1;

    return { x, y };
  }

  /**
   * Reset input states.
   */
  public reset(): void {
    this.actionState.clear();
  }
}

export const InputService = new InputServiceImpl();
