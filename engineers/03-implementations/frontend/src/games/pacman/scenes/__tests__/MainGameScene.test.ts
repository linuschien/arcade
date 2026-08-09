import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MainGameScene } from '../MainGameScene';
import { InputService, PlayerIndex, ArcadeAction } from '@/core/input/InputService';

describe('MainGameScene Unit Tests', () => {
  let scene: MainGameScene;

  let mockGraphics: any;
  let mockSprite: any;
  let mockText: any;
  let mockEvents: any;
  let mockTextures: any;
  let mockTime: any;

  beforeEach(() => {
    scene = new MainGameScene();

    mockGraphics = {
      clear: vi.fn(),
      fillStyle: vi.fn(),
      fillRect: vi.fn(),
      lineStyle: vi.fn(),
      strokeRect: vi.fn(),
      lineBetween: vi.fn(),
      destroy: vi.fn(),
    };

    mockSprite = {
      setPosition: vi.fn(),
      setVisible: vi.fn(),
      setTexture: vi.fn(),
      destroy: vi.fn(),
    };

    mockText = {
      setText: vi.fn(),
      setVisible: vi.fn(),
      setOrigin: vi.fn().mockReturnThis(),
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

    (scene as any).add = {
      graphics: vi.fn().mockReturnValue(mockGraphics),
      sprite: vi.fn().mockReturnValue(mockSprite),
      text: vi.fn().mockReturnValue(mockText),
    };
    (scene as any).events = mockEvents;
    (scene as any).textures = mockTextures;
    (scene as any).time = mockTime;

    InputService.reset();
  });

  it('should initialize game scene and UI on create', () => {
    scene.create();

    expect((scene as any).add.graphics).toHaveBeenCalled();
    expect((scene as any).add.text).toHaveBeenCalled();
    expect((scene as any).add.sprite).toHaveBeenCalled();
    expect(mockEvents.once).toHaveBeenCalledTimes(2);
  });

  it('should update pause state and UI text visibility', () => {
    scene.create();
    scene.setPauseState(true);

    expect(mockText.setText).toHaveBeenCalledWith('PAUSED');
    expect(mockText.setVisible).toHaveBeenCalledWith(true);

    scene.setPauseState(false);
    expect(mockText.setVisible).toHaveBeenCalledWith(false);
  });

  it('should process update tick and directional inputs', () => {
    scene.create();

    // Trigger UP input
    InputService.setActionState(PlayerIndex.P1, ArcadeAction.UP, true);
    scene.update(100, 16.6);

    InputService.reset();
    // Trigger LEFT input
    InputService.setActionState(PlayerIndex.P1, ArcadeAction.LEFT, true);
    scene.update(200, 16.6);
  });

  it('should handle teardown event cleanup safely', () => {
    scene.create();
    (scene as any).handleTeardown();

    expect(mockGraphics.destroy).toHaveBeenCalled();
    expect(mockSprite.destroy).toHaveBeenCalled();
  });
});
