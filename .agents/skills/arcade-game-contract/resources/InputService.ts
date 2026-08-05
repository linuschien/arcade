/**
 * InputService.ts
 * Unified Input Abstraction for Arcade Cabinets, Gamepads, Keyboards, and Touch D-Pads.
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
