import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MainGameScene } from '../MainGameScene';
import { InputService, PlayerIndex, ArcadeAction } from '@/core/input/InputService';

vi.mock('../../audio/PipeManiaAudioService', () => ({
  PipeManiaAudioService: {
    playStageStart: vi.fn(),
    playBGM: vi.fn(),
    stopBGM: vi.fn(),
    playVictory: vi.fn(),
    playGameOver: vi.fn(),
    playCountdownTick: vi.fn(),
    playPipePlace: vi.fn(),
    playPipeReplace: vi.fn(),
    playFlowBubble: vi.fn(),
    playReservoirFill: vi.fn(),
    playFastForward: vi.fn(),
    playSpillBurst: vi.fn(),
    playExtendLife: vi.fn(),
    playLevelClear: vi.fn(),
  },
}));

describe('PipeMania MainGameScene Unit Tests', () => {
  let scene: MainGameScene;

  let mockGraphics: any;
  let mockSprite: any;
  let mockText: any;
  let mockRect: any;
  let mockContainer: any;
  let mockEvents: any;
  let mockInput: any;

  beforeEach(() => {
    scene = new MainGameScene();

    mockGraphics = {
      clear: vi.fn(),
      fillStyle: vi.fn().mockReturnThis(),
      fillRect: vi.fn().mockReturnThis(),
      fillRoundedRect: vi.fn().mockReturnThis(),
      fillCircle: vi.fn().mockReturnThis(),
      lineStyle: vi.fn().mockReturnThis(),
      strokeRect: vi.fn().mockReturnThis(),
      strokeRoundedRect: vi.fn().mockReturnThis(),
      destroy: vi.fn(),
    };

    mockSprite = {
      setPosition: vi.fn().mockReturnThis(),
      setVisible: vi.fn().mockReturnThis(),
      setTexture: vi.fn().mockReturnThis(),
      setDisplaySize: vi.fn().mockReturnThis(),
      setScale: vi.fn().mockReturnThis(),
      setDepth: vi.fn().mockReturnThis(),
      setInteractive: vi.fn().mockReturnThis(),
      on: vi.fn().mockReturnThis(),
      texture: { key: 'pipemania:grid_tile' },
      destroy: vi.fn(),
    };

    mockText = {
      setText: vi.fn().mockReturnThis(),
      setColor: vi.fn().mockReturnThis(),
      setOrigin: vi.fn().mockReturnThis(),
      setVisible: vi.fn().mockReturnThis(),
      destroy: vi.fn(),
    };

    mockRect = {
      setStrokeStyle: vi.fn().mockReturnThis(),
      setFillStyle: vi.fn().mockReturnThis(),
      setInteractive: vi.fn().mockReturnThis(),
      on: vi.fn().mockReturnThis(),
      destroy: vi.fn(),
    };

    mockContainer = {
      add: vi.fn().mockReturnThis(),
      setVisible: vi.fn().mockReturnThis(),
      setDepth: vi.fn().mockReturnThis(),
      destroy: vi.fn(),
    };

    mockEvents = {
      once: vi.fn(),
      off: vi.fn(),
    };

    mockInput = {
      on: vi.fn(),
    };

    (scene as any).add = {
      graphics: vi.fn().mockReturnValue(mockGraphics),
      sprite: vi.fn().mockReturnValue(mockSprite),
      text: vi.fn().mockReturnValue(mockText),
      rectangle: vi.fn().mockReturnValue(mockRect),
      ellipse: vi.fn().mockReturnValue(mockRect),
      container: vi.fn().mockReturnValue(mockContainer),
    };
    (scene as any).events = mockEvents;
    (scene as any).input = mockInput;
    (scene as any).tweens = {
      add: vi.fn(),
    };

    InputService.reset();
  });

  afterEach(() => {
    if (scene) {
      (scene as any).cleanup();
    }
  });

  it('should create scene objects and setup input on create', () => {
    scene.create();

    expect((scene as any).add.graphics).toHaveBeenCalled();
    expect((scene as any).add.sprite).toHaveBeenCalled();
    expect((scene as any).add.text).toHaveBeenCalled();
    expect((scene as any).add.rectangle).toHaveBeenCalled();
    expect(mockEvents.once).toHaveBeenCalledTimes(2);
  });

  it('should handle pause and resume states', () => {
    scene.create();
    expect(() => scene.setPauseState(true)).not.toThrow();
    expect(() => scene.setPauseState(false)).not.toThrow();
  });

  it('should handle update ticks and D-pad/action inputs', () => {
    scene.create();

    // D-Pad navigation
    InputService.setActionState(PlayerIndex.P1, ArcadeAction.RIGHT, true);
    scene.update(100, 16.6);

    InputService.reset();
    InputService.setActionState(PlayerIndex.P1, ArcadeAction.BUTTON_A, true);
    scene.update(200, 16.6);

    InputService.reset();
    InputService.setActionState(PlayerIndex.P1, ArcadeAction.BUTTON_B, true);
    scene.update(300, 16.6);
  });

  it('should clean up on scene destroy', () => {
    scene.create();
    expect(() => (scene as any).cleanup()).not.toThrow();
    expect(mockGraphics.destroy).toHaveBeenCalled();
  });
});
