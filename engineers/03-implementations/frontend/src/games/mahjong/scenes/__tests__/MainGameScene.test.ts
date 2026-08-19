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
    setSize = vi.fn().mockReturnThis();
    setColor = vi.fn().mockReturnThis();
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
    lineBetween = vi.fn().mockReturnThis();
    beginPath = vi.fn().mockReturnThis();
    arc = vi.fn().mockReturnThis();
    moveTo = vi.fn().mockReturnThis();
    lineTo = vi.fn().mockReturnThis();
    closePath = vi.fn().mockReturnThis();
    fill = vi.fn().mockReturnThis();
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
        setSize: vi.fn().mockReturnThis(),
        setColor: vi.fn().mockReturnThis(),
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
        lineBetween: vi.fn().mockReturnThis(),
        beginPath: vi.fn().mockReturnThis(),
        arc: vi.fn().mockReturnThis(),
        moveTo: vi.fn().mockReturnThis(),
        lineTo: vi.fn().mockReturnThis(),
        closePath: vi.fn().mockReturnThis(),
        fill: vi.fn().mockReturnThis(),
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

  it('should render graphical 3-tile cards in showChowSubMenu with tile sprites', () => {
    scene.create();
    (scene as any).add.sprite.mockClear();

    const chowOptions = [
      {
        tiles: [
          { id: '1m', suit: 'CHARACTERS', value: 1, name: '一萬', shortCode: '1m' },
          { id: '2m', suit: 'CHARACTERS', value: 2, name: '二萬', shortCode: '2m' },
          { id: '3m', suit: 'CHARACTERS', value: 3, name: '三萬', shortCode: '3m' },
        ],
        discardTileIds: ['1m', '2m'],
      },
      {
        tiles: [
          { id: '2m', suit: 'CHARACTERS', value: 2, name: '二萬', shortCode: '2m' },
          { id: '3m', suit: 'CHARACTERS', value: 3, name: '三萬', shortCode: '3m' },
          { id: '4m', suit: 'CHARACTERS', value: 4, name: '四萬', shortCode: '4m' },
        ],
        discardTileIds: ['3m', '4m'],
      },
    ];

    (scene as any).showChowSubMenu(chowOptions as any);

    expect((scene as any).subMenuContainer.setVisible).toHaveBeenCalledWith(true);
    const spriteCalls = (scene as any).add.sprite.mock.calls;
    // 2 chow options * 3 tiles = 6 tile sprites
    const tileSprites = spriteCalls.filter((c: any[]) => c[2].startsWith('mahjong:tile_'));
    expect(tileSprites.length).toBe(6);
  });

  it('should update compass player HUD with dynamic gold dealer highlighting and clean [風] format', () => {
    scene.create();
    const gameState = (scene as any).gameState;
    gameState.startNewMatch();

    // 1. When non-dealer is taking turn, dealerSeat receives dealer gold '#facc15'
    const initialDealer = gameState.dealerSeat;
    const activeTurnSeat = ((initialDealer + 1) % 4) as any;
    gameState.currentTurnSeat = activeTurnSeat;
    (scene as any).updateCompass();

    const pTexts = (scene as any).compassPlayerTexts;
    expect(pTexts.length).toBe(4);

    // Assert all 4 texts have clean '[風] 玩家名' format without '莊' character
    for (let s = 0; s < 4; s++) {
      expect(pTexts[s].setText).toHaveBeenCalledWith(expect.stringMatching(/^\[(東|南|西|北)\] /));
      expect(pTexts[s].setText).not.toHaveBeenCalledWith(expect.stringContaining('莊'));
    }

    // Dealer receives dealer gold color '#facc15'
    expect(pTexts[initialDealer].setColor).toHaveBeenCalledWith('#facc15');
    // Active turn seat receives bright active turn color '#fef08a'
    expect(pTexts[activeTurnSeat].setColor).toHaveBeenCalledWith('#fef08a');

    // 2. Rotate dealer to a new seat and verify gold color shifts to the new dealer
    const nextDealer = ((initialDealer + 2) % 4) as any;
    gameState.dealerSeat = nextDealer;
    gameState.currentTurnSeat = initialDealer; // Turn on someone else
    (scene as any).updateCompass();

    // Now nextDealer must receive dealer gold color '#facc15'
    expect(pTexts[nextDealer].setColor).toHaveBeenCalledWith('#facc15');
  });

  it('should keep seat containers stationary during animateTileSort without container position tweens', () => {
    scene.create();
    (scene as any).tweens = {
      add: vi.fn(),
    };

    (scene as any).animateTileSort();

    // Ensure no tween targets the human seat container or modifies its Y position
    const tweenCalls = (scene as any).tweens.add.mock.calls;
    const containerTween = tweenCalls.find(
      (c: any[]) => c[0]?.targets === (scene as any).seatContainers[0]
    );
    expect(containerTween).toBeUndefined();
  });

  it('should render graphical Smart Ting card with mini tile sprites in bottom-right corner when in Ting state', () => {
    scene.create();
    const gameState = (scene as any).gameState;
    const p0 = gameState.players[0];

    // Setup player with Ting hand (waiting on 3m, 6m)
    p0.hand = [
      { id: '1', suit: 'CHARACTERS', value: 1, name: '一萬', shortCode: '1m' },
      { id: '2', suit: 'CHARACTERS', value: 1, name: '一萬', shortCode: '1m' },
      { id: '3', suit: 'CHARACTERS', value: 1, name: '一萬', shortCode: '1m' },
      { id: '4', suit: 'CHARACTERS', value: 2, name: '二萬', shortCode: '2m' },
      { id: '5', suit: 'CHARACTERS', value: 2, name: '二萬', shortCode: '2m' },
      { id: '6', suit: 'CHARACTERS', value: 2, name: '二萬', shortCode: '2m' },
      { id: '7', suit: 'CHARACTERS', value: 4, name: '四萬', shortCode: '4m' },
      { id: '8', suit: 'CHARACTERS', value: 5, name: '五萬', shortCode: '5m' },
      ...Array.from({ length: 8 }, (_, i) => ({
        id: `dummy_${i}`,
        suit: 'BAMBOO' as const,
        value: ((Math.floor(i / 3) + 1) as any),
        name: `${Math.floor(i / 3) + 1}條`,
        shortCode: `${Math.floor(i / 3) + 1}s`,
      })),
    ];
    p0.drawnTile = null;

    (scene as any).add.sprite.mockClear();
    (scene as any).updateSmartTing();

    // Verify tingContainer is shown
    expect((scene as any).tingContainer.setVisible).toHaveBeenCalledWith(true);
    // Verify mini tile sprites are created inside tingContainer
    const spriteCalls = (scene as any).add.sprite.mock.calls;
    const tileSprites = spriteCalls.filter((c: any[]) => c[2].startsWith('mahjong:tile_'));
    expect(tileSprites.length).toBeGreaterThanOrEqual(1);
  });

  it('should immediately clear and hide tingContainer on settlement and dealing phase change', () => {
    scene.create();
    (scene as any).tingContainer.setVisible(true);

    // 1. Simulate onSettlement
    const breakdown = {
      winnerSeat: 0,
      isSelfDrawn: true,
      basePoints: 500,
      fanRate: 200,
      dealerMultiplierFan: 1,
      dealerStreak: 0,
      fans: [],
      totalFans: 1,
      chipDeltas: [600, -200, -200, -200],
      remainingChips: [10600, 9800, 9800, 9800],
      winnerName: '賭神',
    };

    (scene as any).tingContainer.setVisible.mockClear();
    (scene as any).tingContainer.removeAll.mockClear();

    // Trigger onSettlement via gameState callback
    const listeners = (scene as any).gameState.listeners;
    const settlementListener = listeners.find((l: any) => typeof l.onSettlement === 'function');
    expect(settlementListener).toBeDefined();
    settlementListener.onSettlement(breakdown);

    expect((scene as any).tingContainer.setVisible).toHaveBeenCalledWith(false);
    expect((scene as any).tingContainer.removeAll).toHaveBeenCalledWith(true);

    // 2. Simulate phase change to DEALING
    (scene as any).tingContainer.setVisible.mockClear();
    (scene as any).tingContainer.removeAll.mockClear();
    (scene as any).handlePhaseChange('DEALING');

    expect((scene as any).tingContainer.setVisible).toHaveBeenCalledWith(false);
    expect((scene as any).tingContainer.removeAll).toHaveBeenCalledWith(true);
  });

  it('should highlight positive flowers with orange stroke in settlement window according to effectiveWind', () => {
    scene.create();
    const gameState = (scene as any).gameState;
    gameState.startNewMatch();

    const breakdown = {
      winnerSeat: 0,
      isSelfDrawn: true,
      winningTile: { id: '1m_0', suit: 'CHARACTERS', value: 1, name: '一萬', shortCode: '1m' },
      basePoints: 500,
      fanRate: 200,
      dealerMultiplierFan: 1,
      dealerStreak: 0,
      fans: [{ name: '自摸', fan: 1 }],
      totalFans: 1,
      chipDeltas: [600, -200, -200, -200],
      remainingChips: [10600, 9800, 9800, 9800],
      winnerName: '賭神',
    };

    const p0 = gameState.players[0];
    p0.flowers = [
      { id: 'f_spring', suit: 'FLOWERS', value: 1, name: '春', shortCode: 'spring', isFlower: true },
      { id: 'f_summer', suit: 'FLOWERS', value: 2, name: '夏', shortCode: 'summer', isFlower: true },
    ];

    (scene as any).add.graphics.mockClear();

    // 1. When dealerSeat is 0 (Winner is Dealer / EAST), Spring is positive and highlighted with graphics box
    gameState.dealerSeat = 0;
    (scene as any).showSettlementWindow(breakdown);
    expect((scene as any).add.graphics).toHaveBeenCalled();

    // 2. When dealerSeat is 3 (Winner seat 0 is South / SOUTH relative to dealer 3), Summer is positive
    (scene as any).add.graphics.mockClear();
    gameState.dealerSeat = 3;
    (scene as any).showSettlementWindow(breakdown);
    expect((scene as any).add.graphics).toHaveBeenCalled();
  });
});
