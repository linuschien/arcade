import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MainGameScene } from '../MainGameScene';
import { InputService, PlayerIndex, ArcadeAction } from '@/core/input/InputService';
import { RALLYX_BORDER_WIDTH } from '@/games/rallyx/logic/RallyXMaze';
import { RallyXPlayState } from '@/games/rallyx/logic/RallyXGameState';

describe('MainGameScene Unit Tests', () => {
  let scene: MainGameScene;

  let mockGraphics: any;
  let mockSprite: any;
  let mockText: any;
  let mockEvents: any;
  let mockTextures: any;
  let mockTime: any;
  let mockCameras: any;

  beforeEach(() => {
    scene = new MainGameScene();

    mockGraphics = {
      clear: vi.fn(),
      fillStyle: vi.fn(),
      fillRect: vi.fn(),
      fillRoundedRect: vi.fn(),
      strokeRoundedRect: vi.fn(),
      fillCircle: vi.fn(),
      strokeCircle: vi.fn(),
      fillTriangle: vi.fn(),
      lineStyle: vi.fn(),
      strokeRect: vi.fn(),
      lineBetween: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      strokePath: vi.fn(),
      fillPath: vi.fn(),
      closePath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      setScrollFactor: vi.fn().mockReturnThis(),
      setDepth: vi.fn().mockReturnThis(),
      destroy: vi.fn(),
    };

    mockSprite = {
      visible: true,
      setPosition: vi.fn(),
      setVisible: vi.fn((v: boolean) => {
        mockSprite.visible = v;
      }),
      setTexture: vi.fn(),
      setOrigin: vi.fn().mockReturnThis(),
      setAlpha: vi.fn(),
      setAngle: vi.fn(),
      setScrollFactor: vi.fn().mockReturnThis(),
      setDepth: vi.fn().mockReturnThis(),
      destroy: vi.fn(),
    };

    mockText = {
      x: 0,
      y: 0,
      setText: vi.fn(),
      setVisible: vi.fn(),
      setPosition: vi.fn().mockImplementation((x: number, y: number) => {
        mockText.x = x;
        mockText.y = y;
        return mockText;
      }),
      setAlpha: vi.fn().mockReturnThis(),
      setOrigin: vi.fn().mockReturnThis(),
      setScrollFactor: vi.fn().mockReturnThis(),
      setDepth: vi.fn().mockReturnThis(),
      destroy: vi.fn(),
    };

    mockEvents = {
      once: vi.fn(),
      on: vi.fn(),
    };

    mockTextures = {
      exists: vi.fn().mockReturnValue(true),
      removeKey: vi.fn(),
    };

    mockTime = {
      delayedCall: vi.fn((_ms, cb) => cb && cb()),
    };

    mockCameras = {
      main: {
        setOrigin: vi.fn().mockReturnThis(),
        setZoom: vi.fn().mockReturnThis(),
        startFollow: vi.fn().mockReturnThis(),
        setRoundPixels: vi.fn().mockReturnThis(),
        scrollX: 0,
        scrollY: 0,
      },
    };

    (scene as any).add = {
      graphics: vi.fn().mockReturnValue(mockGraphics),
      sprite: vi.fn().mockImplementation(() => {
        const sp = { ...mockSprite, visible: true };
        sp.setVisible = vi.fn((v: boolean) => {
          sp.visible = v;
          return sp;
        });
        return sp;
      }),
      text: vi.fn().mockReturnValue(mockText),
      tileSprite: vi.fn().mockReturnValue(mockSprite),
    };
    (scene as any).events = mockEvents;
    (scene as any).textures = mockTextures;
    (scene as any).time = mockTime;
    (scene as any).cameras = mockCameras;

    InputService.reset();
  });

  afterEach(() => {
    InputService.reset();
  });

  it('should initialize single camera, graphics, and HUD on create', () => {
    scene.create();

    expect(mockCameras.main.startFollow).toHaveBeenCalledWith(
      expect.anything(),
      true,
      1,
      1,
      240,
      240
    );
    expect(mockGraphics.setScrollFactor).toHaveBeenCalledWith(0);
    expect(mockText.setScrollFactor).toHaveBeenCalledWith(0);
    expect((scene as any).add.graphics).toHaveBeenCalled();
    expect((scene as any).add.sprite).toHaveBeenCalled();
    expect((scene as any).add.text).toHaveBeenCalled();
    expect(mockEvents.once).toHaveBeenCalledTimes(2);
  });

  it('should scale camera zoom cleanly for High-DPI canvas (DPR = 2) without 2x digital stretch', () => {
    (scene as any).scale = { width: 1280, height: 960 };
    scene.create();

    // With 1280 width and baseWidth 640, zoomFactor is exactly 2.0 (Retina DPR), NOT 4.0!
    expect(mockCameras.main.setZoom).toHaveBeenCalledWith(2.0);
    expect(mockCameras.main.setOrigin).toHaveBeenCalledWith(0, 0);
  });

  it('should handle pause and resume states', () => {
    scene.create();
    expect(() => scene.setPauseState(true)).not.toThrow();
    expect(() => scene.setPauseState(false)).not.toThrow();
  });

  it('should process movement ticks and directional inputs', () => {
    scene.create();

    // Trigger UP direction
    InputService.setActionState(PlayerIndex.P1, ArcadeAction.UP, true);
    const startY = (scene as any).playerY;
    for (let i = 0; i < 5; i++) {
      scene.update(100 + i * 16.6, 16.6);
    }
    const endY = (scene as any).playerY;
    expect(endY).toBeLessThan(startY);

    InputService.reset();
    // Trigger DOWN direction (instant 180° turn)
    InputService.setActionState(PlayerIndex.P1, ArcadeAction.DOWN, true);
    scene.update(2000, 16.6);
    expect((scene as any).currentDirection).toBe('DOWN');

    InputService.reset();
    // Trigger BUTTON_A (smoke screen)
    InputService.setActionState(PlayerIndex.P1, ArcadeAction.BUTTON_A, true);
    scene.update(2016, 16.6);
  });

  it('should handle Lucky "L" flag freeze refill animation in update', () => {
    scene.create();
    const gameState = (scene as any).gameState;
    gameState.collectFlag('LUCKY'); // puts state into LUCKY_REFILL

    scene.update(200, 16.6);
    expect(mockGraphics.fillRect).toHaveBeenCalled();
  });

  it('should render all 4 maze decorative border themes and perimeter walls cleanly', () => {
    scene.create();

    // Theme 0: Forest (Green)
    (scene as any).renderMazeGraphics(0);
    expect(mockSprite.setTexture).toHaveBeenCalledWith('rallyx:border_theme_0');
    expect(mockGraphics.lineBetween).toHaveBeenCalled();

    // Theme 1: Garden (Red)
    (scene as any).renderMazeGraphics(1);
    expect(mockSprite.setTexture).toHaveBeenCalledWith('rallyx:border_theme_1');
    expect(mockGraphics.fillRect).toHaveBeenCalled();

    // Theme 2: Waterway (Cyan)
    (scene as any).renderMazeGraphics(2);
    expect(mockSprite.setTexture).toHaveBeenCalledWith('rallyx:border_theme_2');
    expect(mockGraphics.lineStyle).toHaveBeenCalled();

    // Theme 3: Ruins (Grey)
    (scene as any).renderMazeGraphics(3);
    expect(mockSprite.setTexture).toHaveBeenCalledWith('rallyx:border_theme_3');
    expect(mockGraphics.fillRect).toHaveBeenCalled();
  });

  it('should retain collected flags across player death and respawn in the same round', () => {
    scene.create();
    const config = (scene as any).gameState.getCurrentLevelConfig();
    const firstFlag = config.flags[0];
    const flagKey = `flag_${firstFlag.col}_${firstFlag.row}`;

    // Verify initial flag is in flagSprites
    expect((scene as any).flagSprites.has(flagKey)).toBe(true);

    // Simulate player collecting first flag
    (scene as any).playerCol = firstFlag.col + RALLYX_BORDER_WIDTH;
    (scene as any).playerRow = firstFlag.row + RALLYX_BORDER_WIDTH;
    (scene as any).checkCollisions();

    // Verify flag is recorded as collected and hidden
    expect((scene as any).collectedFlagKeys.has(flagKey)).toBe(true);
    expect((scene as any).gameState.getFlagsCollected()).toBe(1);

    // Simulate player death and respawn
    (scene as any).gameState.handlePlayerDeath();
    (scene as any).gameState.resetAfterDeath();
    (scene as any).resetLevelEntities();

    // Flag should NOT be re-spawned into flagSprites!
    expect((scene as any).flagSprites.has(flagKey)).toBe(false);
    expect((scene as any).collectedFlagKeys.has(flagKey)).toBe(true);
    expect((scene as any).gameState.getFlagsCollected()).toBe(1);
  });

  it('should configure HUD with playfield-centered status text and vertically centered radar', () => {
    scene.create();

    // Status banner centered in 480x480 playfield
    const statusBanner = (scene as any).statusBannerText;
    expect(statusBanner.setOrigin).toHaveBeenCalledWith(0.5, 0.5);

    // Score & Round right-aligned at x = 632
    const scoreText = (scene as any).scoreText;
    expect(scoreText.setOrigin).toHaveBeenCalledWith(1, 0);
    const roundText = (scene as any).roundText;
    expect(roundText.setOrigin).toHaveBeenCalledWith(1, 0);

    // Radar rendering vertically centered at y = 100
    mockGraphics.fillRect.mockClear();
    (scene as any).renderRadar();
    // Radar background drawn at (480, 100, 160, 280)
    expect(mockGraphics.fillRect).toHaveBeenCalledWith(480, 100, 160, 280);
  });

  it('should dynamically interpolate player visual angle on 180° reversal (Scheme C) and 90° cornering (Scheme B)', () => {
    scene.create();
    const playerSprite = (scene as any).playerSprite;

    // 1. Trigger 180° reversal from UP to DOWN (Scheme C: 0.08s)
    InputService.setActionState(PlayerIndex.P1, ArcadeAction.DOWN, true);
    scene.update(100, 16.6); // 1st frame (~0.0166s out of 0.08s)
    expect((scene as any).currentDirection).toBe('DOWN');
    expect(playerSprite.setAngle).toHaveBeenCalled();
    const angle1 = (scene as any).playerVisualAngleDeg;
    expect(angle1).toBeGreaterThan(0);
    expect(angle1).toBeLessThan(180);

    // Advance past 0.08s: reaches target 180°
    scene.update(200, 80);
    expect((scene as any).playerVisualAngleDeg).toBe(180);
  });

  it('should emit sequential smoke puffs trailing along player moving position', () => {
    scene.create();
    const gameState = (scene as any).gameState;
    (scene as any).playerX = 500;
    (scene as any).playerY = 500;

    // Trigger smoke
    (scene as any).queueSmokePuffsSequence(500, 500);
    expect(gameState.getActiveSmokePuffs().length).toBe(1);
    expect(gameState.getActiveSmokePuffs()[0].x).toBe(500);

    // Advance 85ms and change player position to simulate car driving forward
    (scene as any).playerX = 500;
    (scene as any).playerY = 480; // moved up
    (scene as any).updatePendingSmokePuffs(85);

    expect(gameState.getActiveSmokePuffs().length).toBe(2);
    // Second puff should be dropped at the car's updated wake coordinate (480)
    expect(gameState.getActiveSmokePuffs()[1].y).toBe(480);
  });

  it('should display Grand Slam congratulatory banner when clearing Round 16', () => {
    scene.create();
    const gameState = (scene as any).gameState;
    // Set round to 16
    (gameState as any).round = 16;
    (scene as any).handleStageClear();

    const statusBanner = (scene as any).statusBannerText;
    expect(statusBanner.setText).toHaveBeenCalledWith('CONGRATULATIONS!\nALL STAGES CLEARED!');
  });

  it('should drain fuel to 0 during stage clear and hold fuel gauge at 0 without popping back', () => {
    scene.create();
    let delayedCb: (() => void) | null = null;
    (scene as any).time.delayedCall = vi.fn((_ms: number, cb: () => void) => {
      delayedCb = cb;
    });

    const gameState = (scene as any).gameState;
    gameState.setPlayState(RallyXPlayState.STAGE_CLEARED);
    gameState.setFuel(600);

    (scene as any).handleStageClear(600);

    expect((scene as any).isStageClearFuelDraining).toBe(true);
    expect((scene as any).stageClearDisplayFuel).toBe(600);
    expect(gameState.getFuel()).toBe(0);

    // Mid-drain frame: 0.5s into drain
    scene.update(0, 500);
    expect((scene as any).isStageClearFuelDraining).toBe(true);
    expect((scene as any).stageClearDisplayFuel).toBeLessThan(600);
    expect((scene as any).stageClearDisplayFuel).toBeGreaterThan(0);

    // Advance 1.5s in 100ms frames to complete drain (delta clamped to 0.1s per frame)
    for (let i = 0; i < 15; i++) {
      scene.update(0, 100);
    }
    expect((scene as any).isStageClearFuelDraining).toBe(false);
    expect((scene as any).stageClearDisplayFuel).toBe(0);
    expect(gameState.getFuel()).toBe(0);

    // Subsequent frame while still in STAGE_CLEARED state (waiting for round delay)
    // Must NOT pop back to 600 or any non-zero value
    scene.update(0, 100);
    expect((scene as any).isStageClearFuelDraining).toBe(false);
    expect((scene as any).stageClearDisplayFuel).toBe(0);
    expect(gameState.getFuel()).toBe(0);

    // When round transition fires, fuel is refilled to 1000 for Round N+1
    delayedCb!();
    expect(gameState.getRound()).toBe(2);
    expect(gameState.getFuel()).toBe(1000);
    expect((scene as any).lowFuelAlarmActive).toBe(false);
  });

  it('should not activate low fuel alarm when completing round with 10th flag', () => {
    scene.create();
    const gameState = (scene as any).gameState;
    gameState.setPlayState(RallyXPlayState.PLAYING);

    // Collect 9 flags
    for (let i = 0; i < 9; i++) {
      gameState.collectFlag('REGULAR');
    }

    // Mock 10th flag collision
    (scene as any).time.delayedCall = vi.fn();
    const config = gameState.getCurrentLevelConfig();
    const tenthFlag = config.flags[9];
    (scene as any).playerX = (tenthFlag.col + RALLYX_BORDER_WIDTH + 0.5) * 48;
    (scene as any).playerY = (tenthFlag.row + RALLYX_BORDER_WIDTH + 0.5) * 48;

    scene.update(0, 16);

    expect(gameState.getPlayState()).toBe(RallyXPlayState.STAGE_CLEARED);
    expect((scene as any).lowFuelAlarmActive).toBe(false);
  });

  it('should spawn floating score with 400x2 format when collecting flag under 2x multiplier', () => {
    scene.create();
    const gameState = (scene as any).gameState;
    gameState.setPlayState(RallyXPlayState.PLAYING);

    // Collect S flag to activate 2x multiplier
    gameState.collectFlag('SPECIAL');
    expect(gameState.isSpecialActive()).toBe(true);

    // Trigger popup on next flag
    const flagResult = gameState.collectFlag('REGULAR');
    expect(flagResult.multiplierApplied).toBe(true);
    expect(flagResult.basePoints).toBe(200);

    (scene as any).triggerFlagScorePopup(100, 200, flagResult);

    const floatingScores = (scene as any).floatingScores;
    expect(floatingScores.length).toBe(1);
    expect((scene as any).add.text).toHaveBeenCalledWith(
      100,
      200,
      '200×2',
      expect.objectContaining({ color: '#facc15' })
    );

    // Advance 1.3s to finish 1.2s floating score duration
    for (let i = 0; i < 14; i++) {
      scene.update(0, 100);
    }
    expect((scene as any).floatingScores.length).toBe(0);
  });

  it('should spawn Special and Lucky formatted single-line floating scores', () => {
    scene.create();

    // Special flag popup: single-line score in cyan
    const sResult = {
      flagType: 'SPECIAL' as const,
      basePoints: 300,
      multiplierApplied: false,
      totalPoints: 300,
      luckyFuelBonus: 0,
      isStageClear: false,
      stageClearFuelBonus: 0,
      isSpecialActivated: true,
      isLuckyActivated: false,
      awarded1UP: false,
    };
    (scene as any).triggerFlagScorePopup(100, 100, sResult);
    expect((scene as any).add.text).toHaveBeenCalledWith(
      100,
      100,
      '300',
      expect.objectContaining({ color: '#38bdf8', fontSize: '18px' })
    );

    // Lucky flag popup with fuel bonus: single-line in electric green
    const lResult = {
      flagType: 'LUCKY' as const,
      basePoints: 400,
      multiplierApplied: true,
      totalPoints: 800,
      luckyFuelBonus: 650,
      isStageClear: false,
      stageClearFuelBonus: 0,
      isSpecialActivated: false,
      isLuckyActivated: true,
      awarded1UP: false,
    };
    (scene as any).triggerFlagScorePopup(200, 200, lResult);
    expect((scene as any).add.text).toHaveBeenCalledWith(
      200,
      200,
      '400×2 +650',
      expect.objectContaining({ color: '#4ade80', fontSize: '18px' })
    );
  });

  it('should perform comprehensive teardown cleanup safely', () => {
    scene.create();
    (scene as any).handleTeardown();

    expect(mockGraphics.destroy).toHaveBeenCalled();
  });
});

