import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MainGameScene } from '../MainGameScene';

vi.mock('../../audio/SokobanAudioService', () => ({
  SokobanAudioService: {
    playWorldBGM: vi.fn(),
    stopBGM: vi.fn(),
    playStep: vi.fn(),
    playPush: vi.fn(),
    playBoxTarget: vi.fn(),
    playUndo: vi.fn(),
    playDeadlockWarn: vi.fn(),
    playTimeout: vi.fn(),
    playExtend: vi.fn(),
    playStageClear: vi.fn(),
  },
}));

describe('Sokoban MainGameScene Unit Tests', () => {
  let scene: MainGameScene;
  let mockGraphics: any;
  let mockSprite: any;
  let mockText: any;
  let mockContainer: any;
  let mockEvents: any;

  beforeEach(() => {
    scene = new MainGameScene();

    mockGraphics = {
      clear: vi.fn().mockReturnThis(),
      fillStyle: vi.fn().mockReturnThis(),
      fillRect: vi.fn().mockReturnThis(),
      fillRoundedRect: vi.fn().mockReturnThis(),
      fillCircle: vi.fn().mockReturnThis(),
      lineStyle: vi.fn().mockReturnThis(),
      lineBetween: vi.fn().mockReturnThis(),
      strokeRect: vi.fn().mockReturnThis(),
      strokeRoundedRect: vi.fn().mockReturnThis(),
      strokeCircle: vi.fn().mockReturnThis(),
      destroy: vi.fn(),
    };

    mockSprite = {
      setPosition: vi.fn().mockReturnThis(),
      setVisible: vi.fn().mockReturnThis(),
      setTexture: vi.fn().mockReturnThis(),
      setDisplaySize: vi.fn().mockReturnThis(),
      destroy: vi.fn(),
    };

    mockText = {
      setText: vi.fn().mockReturnThis(),
      setColor: vi.fn().mockReturnThis(),
      setOrigin: vi.fn().mockReturnThis(),
      setVisible: vi.fn().mockReturnThis(),
      destroy: vi.fn(),
    };

    mockContainer = {
      add: vi.fn().mockReturnThis(),
      setVisible: vi.fn().mockReturnThis(),
      removeAll: vi.fn().mockReturnThis(),
      destroy: vi.fn(),
    };

    mockEvents = {
      once: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
    };

    (scene as any).add = {
      graphics: vi.fn().mockReturnValue(mockGraphics),
      sprite: vi.fn().mockReturnValue(mockSprite),
      text: vi.fn().mockReturnValue(mockText),
      container: vi.fn().mockReturnValue(mockContainer),
    };

    (scene as any).events = mockEvents;
    (scene as any).input = {
      keyboard: {
        addKey: vi.fn().mockReturnValue({ isDown: false }),
      },
    };
    (scene as any).tweens = {
      killAll: vi.fn(),
    };
    (scene as any).time = {
      removeAllEvents: vi.fn(),
    };
  });

  it('should initialize successfully on create and present title menu', () => {
    scene.create();
    expect((scene as any).add.graphics).toHaveBeenCalled();
    expect((scene as any).add.text).toHaveBeenCalled();
    expect(mockEvents.once).toHaveBeenCalled();
  });

  it('should tick without error in update loop', () => {
    scene.create();
    expect(() => scene.update(1000, 16.6)).not.toThrow();
  });

  it('should clean up resources on shutdown', () => {
    scene.create();
    (scene as any).handleShutdown();
    expect((scene as any).tweens.killAll).toHaveBeenCalled();
    expect((scene as any).time.removeAllEvents).toHaveBeenCalled();
  });
});

