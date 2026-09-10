import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MainGameScene } from '../MainGameScene';
import { InputService, PlayerIndex, ArcadeAction } from '@/core/input/InputService';
import { RALLYX_BORDER_WIDTH } from '@/games/rallyx/logic/RallyXMaze';

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
      setText: vi.fn(),
      setVisible: vi.fn(),
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

  it('should perform comprehensive teardown cleanup safely', () => {
    scene.create();
    (scene as any).handleTeardown();

    expect(mockGraphics.destroy).toHaveBeenCalled();
  });
});

