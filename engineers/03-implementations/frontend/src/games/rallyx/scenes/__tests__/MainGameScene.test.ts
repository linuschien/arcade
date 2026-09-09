import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MainGameScene } from '../MainGameScene';
import { InputService, PlayerIndex, ArcadeAction } from '@/core/input/InputService';

describe('MainGameScene Unit Tests', () => {
  let scene: MainGameScene;

  let mockGraphics: any;
  let mockSprite: any;
  let mockText: any;
  let mockContainer: any;
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
      fillCircle: vi.fn(),
      strokeCircle: vi.fn(),
      fillTriangle: vi.fn(),
      lineStyle: vi.fn(),
      strokeRect: vi.fn(),
      lineBetween: vi.fn(),
      destroy: vi.fn(),
    };

    mockSprite = {
      setPosition: vi.fn(),
      setVisible: vi.fn(),
      setTexture: vi.fn(),
      setOrigin: vi.fn().mockReturnThis(),
      setAlpha: vi.fn(),
      setAngle: vi.fn(),
      destroy: vi.fn(),
    };

    mockText = {
      setText: vi.fn(),
      setVisible: vi.fn(),
      setOrigin: vi.fn().mockReturnThis(),
      destroy: vi.fn(),
    };

    mockContainer = {
      add: vi.fn(),
      setPosition: vi.fn().mockReturnThis(),
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
      sprite: vi.fn().mockReturnValue(mockSprite),
      text: vi.fn().mockReturnValue(mockText),
      container: vi.fn().mockReturnValue(mockContainer),
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

  it('should initialize single camera, containers, graphics, and HUD on create', () => {
    scene.create();

    expect(mockCameras.main.startFollow).toHaveBeenCalledWith(
      expect.anything(),
      true,
      1,
      1,
      240,
      240
    );
    expect(mockContainer.setPosition).toHaveBeenCalledWith(480, 0);
    expect(mockContainer.setScrollFactor).toHaveBeenCalledWith(0, 0, true);
    expect(mockContainer.setDepth).toHaveBeenCalledWith(1000);
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
    expect(mockGraphics.fillCircle).toHaveBeenCalled();
    expect(mockGraphics.lineBetween).toHaveBeenCalled();

    // Theme 1: Garden (Red)
    (scene as any).renderMazeGraphics(1);
    expect(mockGraphics.fillRect).toHaveBeenCalled();

    // Theme 2: Waterway (Cyan)
    (scene as any).renderMazeGraphics(2);
    expect(mockGraphics.lineStyle).toHaveBeenCalled();

    // Theme 3: Ruins (Grey)
    (scene as any).renderMazeGraphics(3);
    expect(mockGraphics.fillRect).toHaveBeenCalled();
  });

  it('should perform comprehensive teardown cleanup safely', () => {
    scene.create();
    (scene as any).handleTeardown();

    expect(mockGraphics.destroy).toHaveBeenCalled();
  });
});

