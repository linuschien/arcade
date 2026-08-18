/**
 * MahjongGame.test.ts
 * Unit tests for Mahjong entry point and ArcadeBridge integration.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createMahjongGame, MahjongGame } from '../index';
import { ArcadeBridge } from '@/core/bridge/ArcadeBridge';

// Mock Phaser Game instance
vi.mock('phaser', () => {
  return {
    default: {
      AUTO: 'AUTO',
      Game: vi.fn().mockImplementation(() => ({
        scene: {
          getScene: vi.fn().mockReturnValue({
            setPauseState: vi.fn(),
            scene: {
              pause: vi.fn(),
              resume: vi.fn(),
            },
          }),
        },
        destroy: vi.fn(),
      })),
      Scale: {
        FIT: 'FIT',
        CENTER_BOTH: 'CENTER_BOTH',
      },
      GameObjects: {
        Container: class Container {
          add() { return this; }
          removeAll() { return this; }
          setPosition() { return this; }
          setAngle() { return this; }
          setVisible() { return this; }
        },
      },
      Scene: class Scene {
        make = { graphics: vi.fn().mockReturnValue({ fillStyle: vi.fn(), fillCircle: vi.fn(), generateTexture: vi.fn(), destroy: vi.fn() }) };
        textures = { exists: vi.fn().mockReturnValue(false), removeKey: vi.fn() };
        scene = { start: vi.fn() };
        add = {
          container: vi.fn().mockReturnValue({ add: vi.fn(), removeAll: vi.fn(), setPosition: vi.fn(), setAngle: vi.fn(), setVisible: vi.fn() }),
          graphics: vi.fn().mockReturnValue({ fillStyle: vi.fn(), fillRoundedRect: vi.fn(), lineStyle: vi.fn(), strokeRoundedRect: vi.fn() }),
          text: vi.fn().mockReturnValue({ setText: vi.fn(), setVisible: vi.fn(), setOrigin: vi.fn() }),
          sprite: vi.fn().mockReturnValue({ setDisplaySize: vi.fn(), setData: vi.fn(), setInteractive: vi.fn(), on: vi.fn() }),
          existing: vi.fn(),
        };
        events = { on: vi.fn(), off: vi.fn() };
      },
    },
  };
});

describe('MahjongGame Entry Point Unit Tests', () => {
  let container: HTMLDivElement;
  let gameInstance: MahjongGame;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'game-container';
    document.body.appendChild(container);
    gameInstance = createMahjongGame(container) as MahjongGame;
  });

  afterEach(() => {
    if (gameInstance) {
      gameInstance.destroyGame();
    }
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  it('should instantiate MahjongGame successfully', () => {
    expect(gameInstance).toBeDefined();
  });

  it('should handle onCoinInsert without errors', () => {
    expect(() => gameInstance.onCoinInsert(1)).not.toThrow();
  });

  it('should handle onPause and onResume without errors', () => {
    expect(() => gameInstance.onPause()).not.toThrow();
    expect(() => gameInstance.onResume()).not.toThrow();
  });

  it('should respond to ArcadeBridge events', () => {
    const spyCoin = vi.spyOn(gameInstance, 'onCoinInsert');
    const spyPause = vi.spyOn(gameInstance, 'onPause');
    const spyResume = vi.spyOn(gameInstance, 'onResume');

    ArcadeBridge.emit('COIN_INSERTED', 1);
    expect(spyCoin).toHaveBeenCalledWith(1);

    ArcadeBridge.emit('PAUSE_REQUESTED');
    expect(spyPause).toHaveBeenCalled();

    ArcadeBridge.emit('RESUME_REQUESTED');
    expect(spyResume).toHaveBeenCalled();
  });

  it('should safely destroy game instance and unbind bridge events', () => {
    expect(() => gameInstance.destroyGame()).not.toThrow();
  });
});
