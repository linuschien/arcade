/**
 * BaseArcadeGame.test.ts
 * Unit tests for BaseArcadeGame base class.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BaseArcadeGame } from '../BaseArcadeGame';
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

  it('should trigger postBoot callback and set arcadeBaseWidth/Height properties', () => {
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
    expect(capturedConfig.callbacks?.postBoot).toBeDefined();

    const mockGameObj: any = { config: {} };
    capturedConfig.callbacks.postBoot(mockGameObj);

    expect(mockGameObj._arcadeBaseWidth).toBe(920);
    expect(mockGameObj._arcadeBaseHeight).toBe(640);
    expect(mockGameObj.config.arcadeBaseWidth).toBe(920);
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
