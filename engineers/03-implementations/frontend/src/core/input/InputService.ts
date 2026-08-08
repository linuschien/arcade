/**
 * InputService.ts
 * Unified Input Abstraction for Arcade Cabinets, Gamepads, Keyboards, and Touch D-Pads.
 * Binds DOM Keyboard listeners AND HTML5 Gamepad API polling for Bluetooth/USB controllers.
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
  private isGamepadPollingStarted: boolean = false;

  private readonly keyMap: Record<string, ArcadeAction> = {
    // Joystick / D-Pad Directions
    ArrowLeft: ArcadeAction.LEFT,
    KeyA: ArcadeAction.LEFT,
    a: ArcadeAction.LEFT,

    ArrowRight: ArcadeAction.RIGHT,
    KeyD: ArcadeAction.RIGHT,
    d: ArcadeAction.RIGHT,

    ArrowDown: ArcadeAction.DOWN,
    KeyS: ArcadeAction.DOWN,
    s: ArcadeAction.DOWN,

    ArrowUp: ArcadeAction.UP,
    KeyW: ArcadeAction.UP,
    w: ArcadeAction.UP,

    // Primary Action Button (Button A)
    Space: ArcadeAction.BUTTON_A,
    ' ': ArcadeAction.BUTTON_A,
    KeyJ: ArcadeAction.BUTTON_A,

    // Secondary Action Button (Button B)
    KeyX: ArcadeAction.BUTTON_B,
    x: ArcadeAction.BUTTON_B,

    // Tertiary Utility Button (Button C)
    KeyC: ArcadeAction.BUTTON_C,
    c: ArcadeAction.BUTTON_C,
    ShiftLeft: ArcadeAction.BUTTON_C,
    ShiftRight: ArcadeAction.BUTTON_C,

    // Mode / Auxiliary Button (Button D)
    KeyM: ArcadeAction.BUTTON_D,
    m: ArcadeAction.BUTTON_D,
  };

  constructor() {
    this.setupKeyboardListeners();
    this.startGamepadPolling();
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

  /**
   * HTML5 Gamepad API polling loop for Bluetooth & USB controllers.
   */
  private startGamepadPolling(): void {
    if (typeof window === 'undefined' || typeof navigator === 'undefined' || this.isGamepadPollingStarted) return;
    this.isGamepadPollingStarted = true;

    const pollGamepad = () => {
      try {
        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        const gp = gamepads[0] || gamepads[1]; // Active controller

        if (gp && gp.connected) {
          // Standard Gamepad Layout D-Pad Buttons
          const dUp = gp.buttons[12]?.pressed ?? false;
          const dDown = gp.buttons[13]?.pressed ?? false;
          const dLeft = gp.buttons[14]?.pressed ?? false;
          const dRight = gp.buttons[15]?.pressed ?? false;

          // Analog Stick Axes (Left Stick Deadzone 0.4)
          const axisX = gp.axes[0] || 0;
          const axisY = gp.axes[1] || 0;
          const stickLeft = axisX < -0.4;
          const stickRight = axisX > 0.4;
          const stickUp = axisY < -0.4;
          const stickDown = axisY > 0.4;

          this.setActionState(PlayerIndex.P1, ArcadeAction.LEFT, dLeft || stickLeft);
          this.setActionState(PlayerIndex.P1, ArcadeAction.RIGHT, dRight || stickRight);
          this.setActionState(PlayerIndex.P1, ArcadeAction.UP, dUp || stickUp);
          this.setActionState(PlayerIndex.P1, ArcadeAction.DOWN, dDown || stickDown);

          // Standard Action Buttons
          // Button 0 (A / Cross) -> BUTTON_A
          // Button 1 (B / Circle) -> BUTTON_B
          // Button 2 (X / Square) -> BUTTON_C
          // Button 3 (Y / Triangle) -> BUTTON_D
          // Button 4 (L1 / LB) -> BUTTON_C
          // Button 5 (R1 / RB) -> BUTTON_B
          // Button 9 (Start / Options) -> START
          const btnA = gp.buttons[0]?.pressed ?? false;
          const btnB = gp.buttons[1]?.pressed ?? false;
          const btnX = gp.buttons[2]?.pressed ?? false;
          const btnY = gp.buttons[3]?.pressed ?? false;
          const btnLB = gp.buttons[4]?.pressed ?? false;
          const btnRB = gp.buttons[5]?.pressed ?? false;
          const btnStart = gp.buttons[9]?.pressed ?? false;

          this.setActionState(PlayerIndex.P1, ArcadeAction.BUTTON_A, btnA);
          this.setActionState(PlayerIndex.P1, ArcadeAction.BUTTON_B, btnB || btnRB);
          this.setActionState(PlayerIndex.P1, ArcadeAction.BUTTON_C, btnX || btnLB);
          this.setActionState(PlayerIndex.P1, ArcadeAction.BUTTON_D, btnY);
          if (btnStart) {
            this.setActionState(PlayerIndex.P1, ArcadeAction.START, true);
          }
        }
      } catch (err) {
        // Ignore gamepad poll errors in non-standard environments
      }

      requestAnimationFrame(pollGamepad);
    };

    requestAnimationFrame(pollGamepad);
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
