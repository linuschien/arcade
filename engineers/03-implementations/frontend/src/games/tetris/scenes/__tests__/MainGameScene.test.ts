import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MainGameScene } from '../MainGameScene';
import { InputService, PlayerIndex, ArcadeAction } from '@/core/input/InputService';

vi.mock('../../audio/TetrisAudioService', () => ({
  TetrisAudioService: {
    startBgm: vi.fn(),
    stopBgm: vi.fn(),
    updateBgmTempo: vi.fn(),
    playRotate: vi.fn(),
    playMove: vi.fn(),
    playHardDrop: vi.fn(),
    playLineClear: vi.fn(),
    playGameOver: vi.fn(),
  },
}));

describe('Tetris MainGameScene Unit Tests', () => {
  let scene: MainGameScene;

  let mockGraphics: any;
  let textInstances: Array<{ text: string; style?: any; setText: any; setColor: any; setOrigin: any; setVisible: any }>;
  let mockEvents: any;
  let mockTime: any;

  beforeEach(() => {
    scene = new MainGameScene();
    textInstances = [];

    mockGraphics = {
      clear: vi.fn().mockReturnThis(),
      fillStyle: vi.fn().mockReturnThis(),
      fillRect: vi.fn().mockReturnThis(),
      lineStyle: vi.fn().mockReturnThis(),
      strokeRect: vi.fn().mockReturnThis(),
      destroy: vi.fn(),
    };

    mockEvents = {
      once: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
    };

    mockTime = {
      now: 1000,
      delayedCall: vi.fn((_ms, cb) => cb && cb()),
    };

    (scene as any).add = {
      graphics: vi.fn().mockReturnValue(mockGraphics),
      text: vi.fn((x: number, y: number, text: string, style?: any) => {
        const instance: any = {
          x,
          y,
          text,
          style,
          setText: vi.fn(),
          setColor: vi.fn(),
          setOrigin: vi.fn().mockReturnThis(),
          setVisible: vi.fn().mockReturnThis(),
          destroy: vi.fn(),
        };
        instance.setText.mockImplementation((t: string) => {
          instance.text = t;
          return instance;
        });
        instance.setColor.mockImplementation((c: string) => {
          if (instance.style) instance.style.color = c;
          return instance;
        });
        textInstances.push(instance);
        return instance;
      }),
    };

    (scene as any).events = mockEvents;
    (scene as any).time = mockTime;
    (scene as any).sys = {
      game: {
        config: { width: 800, height: 720 },
      },
    };

    // Spy on InputService
    vi.spyOn(InputService, 'isActionDown').mockReturnValue(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize HUD elements including HOLD key instructions (Press C / Shift)', () => {
    scene.create();

    const holdTitle = textInstances.find((t) => t.text === 'HOLD');
    expect(holdTitle).toBeDefined();
    expect(holdTitle?.setOrigin).toHaveBeenCalledWith(0.5, 0);

    const holdInstruction = textInstances.find((t) => t.text === '(Press C / Shift)');
    expect(holdInstruction).toBeDefined();
    expect(holdInstruction?.setOrigin).toHaveBeenCalledWith(0.5, 0);

    const modeIndicator = textInstances.find((t) => t.text === 'MODE (Press M)');
    expect(modeIndicator).toBeDefined();

    const modeValue = textInstances.find((t) => t.text === 'MODERN');
    expect(modeValue).toBeDefined();
  });

  it('should update HOLD instruction to (Classic: Off) when switching to Classic 1989 mode and back to (Press C / Shift)', () => {
    scene.create();

    const holdInstruction = textInstances.find((t) => t.text === '(Press C / Shift)');
    const modeValue = textInstances.find((t) => t.text === 'MODERN');
    expect(holdInstruction).toBeDefined();

    // 1. Press BUTTON_D to switch to Classic mode
    vi.spyOn(InputService, 'isActionDown').mockImplementation((_player, action) => {
      return action === ArcadeAction.BUTTON_D;
    });

    scene.update(1016, 16);
    expect(modeValue?.text).toBe('CLASSIC 1989');
    expect(holdInstruction?.text).toBe('(Classic: Off)');
    expect(holdInstruction?.setColor).toHaveBeenCalledWith('#ef4444');

    // Reset button press edge
    vi.spyOn(InputService, 'isActionDown').mockReturnValue(false);
    scene.update(1032, 16);

    // 2. Press BUTTON_D again to switch back to Modern mode
    vi.spyOn(InputService, 'isActionDown').mockImplementation((_player, action) => {
      return action === ArcadeAction.BUTTON_D;
    });
    scene.update(1048, 16);

    expect(modeValue?.text).toBe('MODERN');
    expect(holdInstruction?.text).toBe('(Press C / Shift)');
    expect(holdInstruction?.setColor).toHaveBeenCalledWith('#64748b');
  });

  it('should trigger hold swap on BUTTON_C press in Modern mode', () => {
    scene.create();

    vi.spyOn(InputService, 'isActionDown').mockImplementation((_player, action) => {
      return action === ArcadeAction.BUTTON_C;
    });

    expect(() => scene.update(1016, 16)).not.toThrow();
  });
});
