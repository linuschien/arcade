/**
 * BaseArcadeGame.test.ts
 * Unit tests for BaseArcadeGame base class.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BaseArcadeGame, calculateDynamicResolution } from '../BaseArcadeGame';
import Phaser from 'phaser';

vi.mock('phaser', () => {
  return {
    default: {
      AUTO: 'AUTO',
      Game: vi.fn().mockImplementation((config) => ({
        config,
        scene: {
          getScene: vi.fn(),
        },
        destroy: vi.fn(),
      })),
      Scale: {
        FIT: 'FIT',
        CENTER_BOTH: 'CENTER_BOTH',
      },
    },
  };
});

class ConcreteTestGame extends BaseArcadeGame {
  public onPause = vi.fn();
  public onResume = vi.fn();
  public destroyGame = vi.fn();

  public getGameInstance(): Phaser.Game | null {
    return this.game;
  }
}

describe('BaseArcadeGame Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should construct Phaser.Game with high-DPI config and parent container element', () => {
    const container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);

    const testGame = new ConcreteTestGame({
      parentContainerId: 'test-container',
      baseWidth: 1280,
      baseHeight: 720,
      backgroundColor: '#061c13',
      scene: [],
    });

    const game = testGame.getGameInstance();
    expect(game).toBeDefined();
    expect(Phaser.Game).toHaveBeenCalledWith(
      expect.objectContaining({
        parent: container,
        backgroundColor: '#061c13',
        scale: expect.objectContaining({
          mode: 'FIT',
          autoCenter: 'CENTER_BOTH',
        }),
      })
    );

    document.body.removeChild(container);
  });

  it('should accept HTMLElement directly as parentContainerId and support custom physics', () => {
    const container = document.createElement('div');

    const testGame = new ConcreteTestGame({
      parentContainerId: container,
      baseWidth: 600,
      baseHeight: 735,
      scene: [],
      physics: {
        default: 'arcade',
        arcade: { debug: true },
      },
    });

    const game = testGame.getGameInstance();
    expect(game).toBeDefined();
    expect(Phaser.Game).toHaveBeenCalledWith(
      expect.objectContaining({
        parent: container,
        physics: expect.objectContaining({
          arcade: { debug: true },
        }),
      })
    );
  });

  it('should trigger preBoot callback and set arcadeBaseWidth/Height and _arcadeDpr properties', () => {
    let capturedConfig: any = null;
    vi.mocked(Phaser.Game).mockImplementationOnce((config) => {
      capturedConfig = config;
      return { config } as any;
    });

    new ConcreteTestGame({
      parentContainerId: 'test-div',
      baseWidth: 920,
      baseHeight: 640,
      scene: [],
    });

    expect(capturedConfig).toBeDefined();
    expect(capturedConfig.callbacks?.preBoot).toBeDefined();

    const mockGameObj: any = {};
    capturedConfig.callbacks.preBoot(mockGameObj);

    expect(mockGameObj._arcadeBaseWidth).toBe(920);
    expect(mockGameObj._arcadeBaseHeight).toBe(640);
    expect(mockGameObj._arcadeDpr).toBeDefined();
  });

  it('should calculate dynamic integer resolution correctly across different screens and game bases', () => {
    const originalScreen = window.screen;
    const originalDpr = window.devicePixelRatio;

    try {
      // 1. Retina / 2.8K display (2880x1800)
      Object.defineProperty(window, 'devicePixelRatio', { writable: true, configurable: true, value: 1 });
      Object.defineProperty(window, 'screen', {
        writable: true,
        configurable: true,
        value: { width: 2880, height: 1800 },
      });

      // New Rally-X (640x480): min(2880/640=4.5, 1800/480=3.75) = 3.75 -> ceil: 4
      expect(calculateDynamicResolution(640, 480)).toBe(4);

      // Mahjong (1280x720): min(2880/1280=2.25, 1800/720=2.5) = 2.25 -> ceil: 3
      expect(calculateDynamicResolution(1280, 720)).toBe(3);

      // Tetris (800x720): min(2880/800=3.6, 1800/720=2.5) = 2.5 -> ceil: 3
      expect(calculateDynamicResolution(800, 720)).toBe(3);

      // 2. 4K display (3840x2160)
      Object.defineProperty(window, 'screen', {
        writable: true,
        configurable: true,
        value: { width: 3840, height: 2160 },
      });
      // New Rally-X (640x480): min(3840/640=6, 2160/480=4.5) = 4.5 -> clamped max: 4
      expect(calculateDynamicResolution(640, 480)).toBe(4);
      // Mahjong (1280x720): min(3840/1280=3, 2160/720=3) = 3.0 -> ceil: 3
      expect(calculateDynamicResolution(1280, 720)).toBe(3);

      // 3. 1080p display (1920x1080)
      Object.defineProperty(window, 'screen', {
        writable: true,
        configurable: true,
        value: { width: 1920, height: 1080 },
      });
      // Mahjong (1280x720): min(1920/1280=1.5, 1080/720=1.5) = 1.5 -> ceil: 2
      expect(calculateDynamicResolution(1280, 720)).toBe(2);
      // New Rally-X (640x480): min(1920/640=3, 1080/480=2.25) = 2.25 -> ceil: 3
      expect(calculateDynamicResolution(640, 480)).toBe(3);
    } finally {
      Object.defineProperty(window, 'screen', { writable: true, configurable: true, value: originalScreen });
      Object.defineProperty(window, 'devicePixelRatio', { writable: true, configurable: true, value: originalDpr });
    }
  });

  it('should respect custom resolutionMultiplier override when provided in options', () => {
    let capturedConfig: any = null;
    vi.mocked(Phaser.Game).mockImplementationOnce((config) => {
      capturedConfig = config;
      return { config } as any;
    });

    new ConcreteTestGame({
      parentContainerId: 'test-div',
      baseWidth: 640,
      baseHeight: 480,
      resolutionMultiplier: 4,
      scene: [],
    });

    expect(capturedConfig.scale.width).toBe(640 * 4);
    expect(capturedConfig.scale.height).toBe(480 * 4);

    const mockGameObj: any = {};
    capturedConfig.callbacks.preBoot(mockGameObj);
    expect(mockGameObj._arcadeDpr).toBe(4);
  });

  it('should support default onCoinInsert, onPause, onResume, and destroyGame lifecycle implementations', () => {
    class DefaultTestGame extends BaseArcadeGame {
      public getGame(): Phaser.Game | null {
        return this.game;
      }
    }

    const mockScene = {
      setPauseState: vi.fn(),
      scene: {
        pause: vi.fn(),
        resume: vi.fn(),
      },
    };

    const mockGame = {
      scene: {
        getScene: vi.fn().mockReturnValue(mockScene),
      },
      destroy: vi.fn(),
    };

    vi.mocked(Phaser.Game).mockReturnValueOnce(mockGame as any);

    const testGame = new DefaultTestGame({
      gameId: 'testgame',
      parentContainerId: 'test-container',
      baseWidth: 800,
      baseHeight: 600,
      scene: [],
    });

    // onPause
    testGame.onPause();
    expect(mockGame.scene.getScene).toHaveBeenCalledWith('testgame:MainGameScene');
    expect(mockScene.setPauseState).toHaveBeenCalledWith(true);
    expect(mockScene.scene.pause).toHaveBeenCalled();

    // onResume
    testGame.onResume();
    expect(mockScene.setPauseState).toHaveBeenCalledWith(false);
    expect(mockScene.scene.resume).toHaveBeenCalled();

    // destroyGame
    testGame.destroyGame();
    expect(mockGame.destroy).toHaveBeenCalledWith(true);
    expect(testGame.getGame()).toBeNull();
  });
});
