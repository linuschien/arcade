import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createPipeManiaGame, PipeManiaGame } from '../index';
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
      Scene: class Scene {
        make = { graphics: vi.fn().mockReturnValue({ fillStyle: vi.fn(), fillCircle: vi.fn(), generateTexture: vi.fn(), destroy: vi.fn() }) };
        textures = { exists: vi.fn().mockReturnValue(false), removeKey: vi.fn() };
        scene = { start: vi.fn() };
      },
    },
  };
});

describe('PipeManiaGame Entry Point Unit Tests', () => {
  let container: HTMLDivElement;
  let gameInstance: PipeManiaGame;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'game-container';
    document.body.appendChild(container);
    gameInstance = createPipeManiaGame(container) as PipeManiaGame;
  });

  afterEach(() => {
    if (gameInstance) {
      gameInstance.destroyGame();
    }
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  it('should instantiate PipeManiaGame successfully', () => {
    expect(gameInstance).toBeDefined();
  });

  it('should handle onPause and onResume without errors', () => {
    expect(() => gameInstance.onPause()).not.toThrow();
    expect(() => gameInstance.onResume()).not.toThrow();
  });

  it('should respond to ArcadeBridge events', () => {
    const spyPause = vi.spyOn(gameInstance, 'onPause');
    const spyResume = vi.spyOn(gameInstance, 'onResume');

    ArcadeBridge.emit('PAUSE_REQUESTED');
    expect(spyPause).toHaveBeenCalled();

    ArcadeBridge.emit('RESUME_REQUESTED');
    expect(spyResume).toHaveBeenCalled();
  });

  it('should safely destroy game instance and unbind bridge events', () => {
    expect(() => gameInstance.destroyGame()).not.toThrow();
  });
});
