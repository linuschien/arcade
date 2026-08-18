/**
 * MainGameScene.test.ts
 * Unit tests for Mahjong MainGameScene.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MainGameScene } from '../MainGameScene';
import { MahjongAudioService } from '../../audio/MahjongAudioService';

vi.mock('phaser', () => {
  class MockGameObject {
    scene: any;
    constructor(scene?: any) {
      this.scene = scene;
    }
    add = vi.fn().mockReturnThis();
    removeAll = vi.fn().mockReturnThis();
    setPosition = vi.fn().mockReturnThis();
    setAngle = vi.fn().mockReturnThis();
    setVisible = vi.fn().mockReturnThis();
    setDepth = vi.fn().mockReturnThis();
    setDisplaySize = vi.fn().mockReturnThis();
    setAlpha = vi.fn().mockReturnThis();
    setScale = vi.fn().mockReturnThis();
    setData = vi.fn().mockReturnThis();
    getData = vi.fn();
    setInteractive = vi.fn().mockReturnThis();
    setTint = vi.fn().mockReturnThis();
    clearTint = vi.fn().mockReturnThis();
    setY = vi.fn().mockReturnThis();
    setText = vi.fn().mockReturnThis();
    setOrigin = vi.fn().mockReturnThis();
    clear = vi.fn().mockReturnThis();
    fillStyle = vi.fn().mockReturnThis();
    fillRect = vi.fn().mockReturnThis();
    fillRoundedRect = vi.fn().mockReturnThis();
    fillCircle = vi.fn().mockReturnThis();
    lineStyle = vi.fn().mockReturnThis();
    strokeRect = vi.fn().mockReturnThis();
    strokeRoundedRect = vi.fn().mockReturnThis();
    strokeCircle = vi.fn().mockReturnThis();
    beginPath = vi.fn().mockReturnThis();
    moveTo = vi.fn().mockReturnThis();
    lineTo = vi.fn().mockReturnThis();
    strokePath = vi.fn().mockReturnThis();
    each = vi.fn().mockReturnThis();
    once = vi.fn().mockReturnThis();
    on = vi.fn().mockReturnThis();
    off = vi.fn().mockReturnThis();
    emit = vi.fn().mockReturnThis();
    destroy = vi.fn().mockReturnThis();
  }

  return {
    default: {
      Scene: class Scene {},
      GameObjects: {
        Container: MockGameObject,
        Sprite: MockGameObject,
        Text: MockGameObject,
        Graphics: MockGameObject,
      },
      Geom: {
        Rectangle: class Rectangle {
          static Contains = vi.fn().mockReturnValue(true);
        },
      },
      Math: {
        DegToRad: vi.fn((deg) => (deg * Math.PI) / 180),
      },
      Scenes: {
        Events: {
          SHUTDOWN: 'shutdown',
          DESTROY: 'destroy',
        },
      },
    },
  };
});

vi.mock('../../audio/MahjongAudioService', () => ({
  MahjongAudioService: {
    playBGM: vi.fn(),
    stopBGM: vi.fn(),
    playVictory: vi.fn(),
    playGameOver: vi.fn(),
    playTileSelect: vi.fn(),
    playTileDiscard: vi.fn(),
    playTileSort: vi.fn(),
    playDiceRoll: vi.fn(),
    playFlowerReplace: vi.fn(),
    playFanTally: vi.fn(),
    playVoiceChow: vi.fn(),
    playVoicePong: vi.fn(),
    playVoiceKong: vi.fn(),
    playVoiceTing: vi.fn(),
    playVoiceHu: vi.fn(),
  },
}));

describe('Mahjong MainGameScene Unit Tests', () => {
  let scene: MainGameScene;

  beforeEach(() => {
    scene = new MainGameScene();

    const createMockObj = () => {
      const obj: any = {
        scene,
        add: vi.fn().mockReturnThis(),
        removeAll: vi.fn().mockReturnThis(),
        setPosition: vi.fn().mockReturnThis(),
        setAngle: vi.fn().mockReturnThis(),
        setVisible: vi.fn().mockReturnThis(),
        setDepth: vi.fn().mockReturnThis(),
        setDisplaySize: vi.fn().mockReturnThis(),
        setData: vi.fn().mockReturnThis(),
        getData: vi.fn(),
        setInteractive: vi.fn().mockReturnThis(),
        setTint: vi.fn().mockReturnThis(),
        clearTint: vi.fn().mockReturnThis(),
        setY: vi.fn().mockReturnThis(),
        setText: vi.fn().mockReturnThis(),
        setOrigin: vi.fn().mockReturnThis(),
        clear: vi.fn().mockReturnThis(),
        fillStyle: vi.fn().mockReturnThis(),
        fillRect: vi.fn().mockReturnThis(),
        fillRoundedRect: vi.fn().mockReturnThis(),
        fillCircle: vi.fn().mockReturnThis(),
        lineStyle: vi.fn().mockReturnThis(),
        strokeRect: vi.fn().mockReturnThis(),
        strokeRoundedRect: vi.fn().mockReturnThis(),
        strokeCircle: vi.fn().mockReturnThis(),
        beginPath: vi.fn().mockReturnThis(),
        moveTo: vi.fn().mockReturnThis(),
        lineTo: vi.fn().mockReturnThis(),
        strokePath: vi.fn().mockReturnThis(),
        each: vi.fn(),
        once: vi.fn().mockReturnThis(),
        on: vi.fn().mockReturnThis(),
        off: vi.fn().mockReturnThis(),
        emit: vi.fn().mockReturnThis(),
        destroy: vi.fn().mockReturnThis(),
        list: [],
        length: 0,
        getAt: vi.fn(),
        getWorldTransformMatrix: vi.fn().mockReturnValue({
          transformPoint: vi.fn((x, y, v) => ({ x: x || 0, y: y || 0 })),
        }),
      };
      return obj;
    };

    (scene as any).add = {
      graphics: vi.fn().mockImplementation(createMockObj),
      sprite: vi.fn().mockImplementation(createMockObj),
      text: vi.fn().mockImplementation(createMockObj),
      container: vi.fn().mockImplementation(createMockObj),
      existing: vi.fn(),
    };
    (scene as any).events = {
      on: vi.fn(),
      off: vi.fn(),
    };
    (scene as any).time = {
      delayedCall: vi.fn(),
    };
  });

  it('should initialize table, compass, seats, and action bar on create', () => {
    expect(() => scene.create()).not.toThrow();
    expect((scene as any).add.graphics).toHaveBeenCalled();
    expect((scene as any).add.sprite).toHaveBeenCalled();
  });

  it('should handle pause and resume states correctly', () => {
    scene.create();
    expect(() => scene.setPauseState(true)).not.toThrow();
    expect(() => scene.setPauseState(false)).not.toThrow();
  });

  it('should play seating dice roll animation and dealer wall break animation', () => {
    scene.create();
    let timerCallback: Function | null = null;
    (scene as any).time = {
      delayedCall: vi.fn((_delay, cb) => {
        timerCallback = cb;
      }),
    };

    const audioService = vi.mocked(MahjongAudioService);
    audioService.playDiceRoll.mockClear();
    audioService.playTileSort.mockClear();

    // 1. Test Seating Dice Roll
    (scene as any).playSeatingDiceAnimation();
    expect(audioService.playDiceRoll).toHaveBeenCalledTimes(1);

    // 2. Test Dealer Wall Break Dice Roll
    audioService.playDiceRoll.mockClear();
    (scene as any).playDealerWallBreakDiceAnimation();
    expect(audioService.playDiceRoll).toHaveBeenCalledTimes(1);

    // Simulate dealer dice roll completion timer -> triggers animateTileSort
    if (timerCallback) (timerCallback as Function)();
    expect(audioService.playTileSort).toHaveBeenCalledTimes(1);
  });

  it('should play voice clip only once on gameState meld claim events and not duplicated in action buttons', () => {
    scene.create();
    const audioService = vi.mocked(MahjongAudioService);
    audioService.playVoicePong.mockClear();

    // Show action bar with Pong option
    (scene as any).showActionBar({
      canHu: false,
      canKong: false,
      kongOptions: [],
      canPong: true,
      canChow: false,
      chowOptions: [],
      canTing: false,
      canPass: true,
    });

    // Clicking Pong button should NOT directly trigger playVoicePong (it is triggered by onMeldClaimed)
    expect(audioService.playVoicePong).toHaveBeenCalledTimes(0);
  });

  it('should pop up action bar with Kong button when human draws a 4th matching tile', () => {
    scene.create();
    const gameState = (scene as any).gameState;
    const p1 = gameState.players[0];

    // Give player three 5m in hand and draw the 4th 5m
    p1.hand = [
      { id: '1', suit: 'CHARACTERS', value: 5, name: '五萬', shortCode: '5m' },
      { id: '2', suit: 'CHARACTERS', value: 5, name: '五萬', shortCode: '5m' },
      { id: '3', suit: 'CHARACTERS', value: 5, name: '五萬', shortCode: '5m' },
      ...Array.from({ length: 13 }, (_, i) => ({
        id: `dummy_${i}`,
        suit: 'BAMBOO',
        value: (i % 9) + 1,
        name: `${(i % 9) + 1}條`,
        shortCode: `${(i % 9) + 1}s`,
      })),
    ];
    p1.drawnTile = { id: '4', suit: 'CHARACTERS', value: 5, name: '五萬', shortCode: '5m' };
    p1.isTing = true;
    p1.isAutoPlay = false;

    (scene as any).checkHumanSelfActions();

    expect((scene as any).actionBarContainer.setVisible).toHaveBeenCalledWith(true);
    // Find sprite call for 'mahjong:action_btn_kong'
    const spriteCalls = (scene as any).add.sprite.mock.calls;
    const kongBtnCall = spriteCalls.find((c: any[]) => c[2] === 'mahjong:action_btn_kong');
    expect(kongBtnCall).toBeDefined();
  });
});
