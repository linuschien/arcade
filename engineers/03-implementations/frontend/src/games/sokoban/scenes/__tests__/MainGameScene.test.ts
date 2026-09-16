import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MainGameScene } from '../MainGameScene';
import { InputService } from '@/core/input/InputService';

vi.mock('../../audio/SokobanAudioService', () => ({
  SokobanAudioService: {
    playWorldBGM: vi.fn(),
    stopBGM: vi.fn(),
    pauseBGM: vi.fn(),
    resumeBGM: vi.fn(),
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
      setDepth: vi.fn().mockReturnThis(),
      setPosition: vi.fn().mockReturnThis(),
      setAlpha: vi.fn().mockReturnThis(),
      setScale: vi.fn().mockReturnThis(),
      destroy: vi.fn(),
    };

    mockSprite = {
      setPosition: vi.fn().mockReturnThis(),
      setVisible: vi.fn().mockReturnThis(),
      setTexture: vi.fn().mockReturnThis(),
      setDisplaySize: vi.fn().mockReturnThis(),
      setScale: vi.fn().mockReturnThis(),
      destroy: vi.fn(),
    };

    mockText = {
      setText: vi.fn().mockReturnThis(),
      setColor: vi.fn().mockReturnThis(),
      setFontSize: vi.fn().mockReturnThis(),
      setOrigin: vi.fn().mockReturnThis(),
      setVisible: vi.fn().mockReturnThis(),
      destroy: vi.fn(),
    };

    mockContainer = {
      add: vi.fn().mockReturnThis(),
      setVisible: vi.fn().mockReturnThis(),
      removeAll: vi.fn().mockReturnThis(),
      setDepth: vi.fn().mockReturnThis(),
      setScale: vi.fn().mockReturnThis(),
      setAlpha: vi.fn().mockReturnThis(),
      destroy: vi.fn(),
    };

    mockEvents = {
      once: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
    };

    const mockTileSprite = {
      setOrigin: vi.fn().mockReturnThis(),
      setDepth: vi.fn().mockReturnThis(),
      setTexture: vi.fn().mockReturnThis(),
      destroy: vi.fn(),
    };

    (scene as any).add = {
      graphics: vi.fn().mockReturnValue(mockGraphics),
      sprite: vi.fn().mockReturnValue(mockSprite),
      text: vi.fn().mockReturnValue(mockText),
      container: vi.fn().mockReturnValue(mockContainer),
      tileSprite: vi.fn().mockReturnValue(mockTileSprite),
    };

    (scene as any).events = mockEvents;
    (scene as any).tweens = {
      killAll: vi.fn(),
      killTweensOf: vi.fn(),
      add: vi.fn().mockReturnValue({ stop: vi.fn() }),
    };
    (scene as any).time = {
      removeAllEvents: vi.fn(),
      delayedCall: vi.fn((_ms: number, cb: () => void) => {
        cb();
        return { remove: vi.fn() };
      }),
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

  it('should handle onPauseAudio and onResumeAudio lifecycle safely', () => {
    scene.create();
    expect(() => (scene as any).onPauseAudio()).not.toThrow();
    expect(() => (scene as any).onResumeAudio()).not.toThrow();
  });

  it('should assign layered depths to overlays ensuring high visibility', () => {
    scene.create();
    expect(mockContainer.setDepth).toHaveBeenCalledWith(100);
    expect(mockContainer.setDepth).toHaveBeenCalledWith(200);
    expect(mockContainer.setDepth).toHaveBeenCalledWith(300);
  });

  it('should process DAS movement and edge-triggered inputs safely without throwing', () => {
    scene.create();
    expect(() => scene.update(1000, 16.6)).not.toThrow();
    expect(() => (scene as any).handleInput(16.6)).not.toThrow();
  });

  it('should animate worker walking and pushing with tweens', () => {
    scene.create();
    (scene as any).state.startNewGame();
    (scene as any).renderStageBoard();
    (scene as any).tweens.add.mockClear();

    // Simulate walking step
    (scene as any).animateMove({
      success: true,
      isPush: false,
      workerFrom: { col: 1, row: 1 },
      workerTo: { col: 2, row: 1 },
    });
    expect((scene as any).tweens.add).toHaveBeenCalled();

    // Simulate pushing step
    (scene as any).animateMove({
      success: true,
      isPush: true,
      workerFrom: { col: 2, row: 1 },
      workerTo: { col: 3, row: 1 },
      boxFrom: { col: 3, row: 1 },
      boxTo: { col: 4, row: 1 },
    });
    expect((scene as any).tweens.add).toHaveBeenCalled();
  });

  it('should trigger in-maze stage clear celebration on victory with unobscured worker animation and playExtend when lifeAwarded is true', async () => {
    scene.create();
    (scene as any).state.startNewGame();
    (scene as any).renderStageBoard();

    const breakdown = {
      pBase: 1000,
      pTime: 250,
      pUndo: 100,
      pPerf: 500,
      isPerfect: true,
      stageTotal: 1850,
    };

    const { SokobanAudioService } = await import('../../audio/SokobanAudioService');
    (SokobanAudioService.playExtend as any).mockClear();

    expect(() => (scene as any).triggerStageClearCeremony(breakdown, true)).not.toThrow();
    // Worker celebratory hop tween is triggered in-maze
    expect((scene as any).tweens.add).toHaveBeenCalled();
    expect(SokobanAudioService.playExtend).toHaveBeenCalled();
  });

  it('should format title menu with NEW GAME first and CONTINUE second, focusing CONTINUE when save exists (Plan B)', () => {
    scene.create();
    const state = (scene as any).state;
    state.maxClearedStage = 5;

    // Trigger title menu with save present
    (scene as any).showTitleMenu();

    // Default cursor should be on CONTINUE (index 1)
    expect((scene as any).titleMenuSelectedIndex).toBe(1);

    // Verify text formatting in modalBodyText
    const modalBodyText = (scene as any).modalBodyText;
    expect(modalBodyText.setText).toHaveBeenCalledWith(
      expect.stringContaining('  NEW GAME (STAGE 01)\n► CONTINUE (STAGE 6)')
    );

    // Switch selection to NEW GAME (index 0)
    (scene as any).titleMenuSelectedIndex = 0;
    (scene as any).updateTitleMenuDisplay();
    expect(modalBodyText.setText).toHaveBeenCalledWith(
      expect.stringContaining('► NEW GAME (STAGE 01)\n  CONTINUE (STAGE 6)')
    );
  });

  it('should play deadlock warn sound and trigger red flash when undo is pressed with 0 quota', async () => {
    scene.create();
    const state = (scene as any).state;
    state.startNewGame();
    (scene as any).renderStageBoard();

    // Force undo quota to 0
    state.undoStack.reset(0);
    expect(state.undoStack.getRemainingQuota()).toBe(0);

    const { SokobanAudioService } = await import('../../audio/SokobanAudioService');
    (SokobanAudioService.playDeadlockWarn as any).mockClear();

    // Mock BUTTON_A press
    vi.spyOn(scene as any, 'isActionJustPressed').mockReturnValue(true);
    (scene as any).handleInput(16.6);

    expect(SokobanAudioService.playDeadlockWarn).toHaveBeenCalled();
    expect((scene as any).undoRefusalFlashTimerMs).toBe(400);

    // Verify HUD reflects refusal flash
    (scene as any).updateHUD();
    expect((scene as any).undoCountText.setColor).toHaveBeenCalledWith('#ef4444');
  });

  it('should render 00:00 [TIME OUT] and red warning when timer reaches 0', () => {
    scene.create();
    const state = (scene as any).state;
    state.startNewGame();
    (scene as any).renderStageBoard();

    // Force elapsedSeconds past tSoft
    state.elapsedSeconds = state.currentStageConfig.tSoft + 5;
    (scene as any).updateHUD();

    expect((scene as any).timerText.setText).toHaveBeenCalledWith('00:00\n[TIME OUT]');
    expect((scene as any).timerText.setFontSize).toHaveBeenCalledWith('18px');
  });

  it('should play deadlock warn sound when hold-to-give-up completes (1.0s)', async () => {
    scene.create();
    const state = (scene as any).state;
    state.startNewGame();
    (scene as any).renderStageBoard();

    const { SokobanAudioService } = await import('../../audio/SokobanAudioService');
    (SokobanAudioService.playDeadlockWarn as any).mockClear();

    // Mock holding BUTTON_B
    vi.spyOn(InputService, 'isActionDown').mockReturnValue(true);

    // Frame 1: registers hold input
    scene.update(0, 16.6);
    expect(SokobanAudioService.playDeadlockWarn).not.toHaveBeenCalled();

    // Frame 2: holds for 500ms (not yet 1000ms)
    scene.update(500, 500);
    expect(SokobanAudioService.playDeadlockWarn).not.toHaveBeenCalled();

    // Frame 3: holds for another 600ms (total > 1000ms -> give up executes!)
    scene.update(1100, 600);
    expect(SokobanAudioService.playDeadlockWarn).toHaveBeenCalled();
  });
});

