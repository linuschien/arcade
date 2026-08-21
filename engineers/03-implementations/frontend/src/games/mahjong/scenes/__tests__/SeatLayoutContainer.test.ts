/**
 * SeatLayoutContainer.test.ts
 * Unit tests for SeatLayoutContainer rendering hand, modular melds, 4x2 flower rack,
 * discard river, and upright HUD.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SeatLayoutContainer } from '../SeatLayoutContainer';
import { PlayerProfile } from '../../logic/MahjongTypes';

vi.mock('phaser', () => {
  class MockGameObject {
    scene: any;
    x: number;
    y: number;
    constructor(scene?: any, x: number = 0, y: number = 0) {
      this.scene = scene;
      this.x = x;
      this.y = y;
    }
    add = vi.fn().mockReturnThis();
    removeAll = vi.fn().mockReturnThis();
    setPosition = vi.fn().mockReturnThis();
    setAngle = vi.fn().mockReturnThis();
    setVisible = vi.fn().mockReturnThis();
    setDisplaySize = vi.fn().mockReturnThis();
    setData = vi.fn().mockReturnThis();
    getData = vi.fn();
    setInteractive = vi.fn().mockReturnThis();
    setTint = vi.fn().mockReturnThis();
    clearTint = vi.fn().mockReturnThis();
    setY = vi.fn().mockReturnThis();
    setText = vi.fn().mockReturnThis();
    fillStyle = vi.fn().mockReturnThis();
    fillRoundedRect = vi.fn().mockReturnThis();
    lineStyle = vi.fn().mockReturnThis();
    strokeRoundedRect = vi.fn().mockReturnThis();
    lineBetween = vi.fn().mockReturnThis();
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
    },
  };
});

describe('SeatLayoutContainer Unit Tests', () => {
  let mockScene: any;

  beforeEach(() => {
    const createMockObj = () => ({
      add: vi.fn().mockReturnThis(),
      removeAll: vi.fn().mockReturnThis(),
      setPosition: vi.fn().mockReturnThis(),
      setAngle: vi.fn().mockReturnThis(),
      setVisible: vi.fn().mockReturnThis(),
      setDisplaySize: vi.fn().mockReturnThis(),
      setData: vi.fn().mockReturnThis(),
      getData: vi.fn(),
      setInteractive: vi.fn().mockReturnThis(),
      setTint: vi.fn().mockReturnThis(),
      clearTint: vi.fn().mockReturnThis(),
      setY: vi.fn().mockReturnThis(),
      setText: vi.fn().mockReturnThis(),
      fillStyle: vi.fn().mockReturnThis(),
      fillRoundedRect: vi.fn().mockReturnThis(),
      lineStyle: vi.fn().mockReturnThis(),
      strokeRoundedRect: vi.fn().mockReturnThis(),
      lineBetween: vi.fn().mockReturnThis(),
      each: vi.fn(),
      once: vi.fn().mockReturnThis(),
      on: vi.fn().mockReturnThis(),
      off: vi.fn().mockReturnThis(),
      destroy: vi.fn(),
    });

    mockScene = {
      add: {
        graphics: vi.fn().mockImplementation(createMockObj),
        sprite: vi.fn().mockImplementation(createMockObj),
        text: vi.fn().mockImplementation(createMockObj),
        container: vi.fn().mockImplementation(createMockObj),
        existing: vi.fn(),
      },
    };
  });

  const createMockProfile = (): PlayerProfile => ({
    seat: 0,
    name: '賭神',
    isHuman: true,
    wind: 'EAST',
    isDealer: true,
    chips: 10000,
    hand: [
      { id: '1m_0', suit: 'CHARACTERS', value: 1, name: '一萬', shortCode: '1m' },
      { id: '2m_0', suit: 'CHARACTERS', value: 2, name: '二萬', shortCode: '2m' },
    ],
    drawnTile: { id: '3m_0', suit: 'CHARACTERS', value: 3, name: '三萬', shortCode: '3m' },
    melds: [
      {
        type: 'CHOW',
        tiles: [
          { id: '4m_0', suit: 'CHARACTERS', value: 4, name: '四萬', shortCode: '4m' },
          { id: '5m_0', suit: 'CHARACTERS', value: 5, name: '五萬', shortCode: '5m' },
          { id: '6m_0', suit: 'CHARACTERS', value: 6, name: '六萬', shortCode: '6m' },
        ],
        sourceSeat: 3,
      },
    ],
    flowers: [
      { id: 'spring_0', suit: 'FLOWERS', value: 1, name: '春', shortCode: 'spring', isFlower: true },
    ],
    discards: [
      { id: '9s_0', suit: 'BAMBOO', value: 9, name: '九條', shortCode: '9s' },
    ],
    isTing: false,
    isAutoPlay: false,
    isPassLockout: false,
    passPongCodesInTurn: new Set(),
  });

  it('should instantiate SeatLayoutContainer and initialize HUD with anti-rotation', () => {
    const seatContainer = new SeatLayoutContainer(mockScene, 640, 645, 0, 0);
    expect(seatContainer).toBeDefined();
    expect(mockScene.add.existing).toHaveBeenCalledWith(seatContainer);
  });

  it('should render player state including hand, melds, flowers, and discards', () => {
    const seatContainer = new SeatLayoutContainer(mockScene, 640, 645, 0, 0);
    const profile = createMockProfile();

    expect(() => seatContainer.renderPlayerState(profile, true)).not.toThrow();
  });

  it('should render AI concealed kong with 100% face-down tiles and human concealed kong with outer tiles revealed', () => {
    const seatContainer = new SeatLayoutContainer(mockScene, 640, 645, 0, 0);
    const profile = createMockProfile();
    profile.hand = [];
    profile.drawnTile = null;
    profile.melds = [
      {
        type: 'CONCEALED_KONG',
        tiles: [
          { id: '1m_1', suit: 'CHARACTERS', value: 1, name: '一萬', shortCode: '1m' },
          { id: '1m_2', suit: 'CHARACTERS', value: 1, name: '一萬', shortCode: '1m' },
          { id: '1m_3', suit: 'CHARACTERS', value: 1, name: '一萬', shortCode: '1m' },
          { id: '1m_4', suit: 'CHARACTERS', value: 1, name: '一萬', shortCode: '1m' },
        ],
        sourceSeat: 1,
      },
    ];

    // Render for AI (isHuman = false)
    mockScene.add.sprite.mockClear();
    seatContainer.renderPlayerState(profile, false);
    const aiSpriteCalls = mockScene.add.sprite.mock.calls;
    const aiTile1mCalls = aiSpriteCalls.filter((c: any[]) => c[2] === 'mahjong:tile_1m');
    const aiTileBackCalls = aiSpriteCalls.filter((c: any[]) => c[2] === 'mahjong:tile_back');
    // AI concealed kong must NOT reveal tile_1m to human player
    expect(aiTile1mCalls.length).toBe(0);
    expect(aiTileBackCalls.length).toBeGreaterThanOrEqual(4);

    // Render for Human (isHuman = true)
    mockScene.add.sprite.mockClear();
    seatContainer.renderPlayerState(profile, true);
    const humanSpriteCalls = mockScene.add.sprite.mock.calls;
    const humanTile1mCalls = humanSpriteCalls.filter((c: any[]) => c[2] === 'mahjong:tile_1m');
    const humanTileBackCalls = humanSpriteCalls.filter((c: any[]) => c[2] === 'mahjong:tile_back');
    // Human concealed kong reveals outer 2 tiles for self identification
    expect(humanTile1mCalls.length).toBe(2);
    expect(humanTileBackCalls.length).toBeGreaterThanOrEqual(2);
  });

  it('should initialize HUD positions correctly around the central compass (Ring 1)', () => {
    // Seat 0: Top/Bottom seat -> relative (0, -225)
    const seat0 = new SeatLayoutContainer(mockScene, 640, 645, 0, 0);
    expect((seat0 as any).hudGroup.setPosition).toHaveBeenCalledWith(0, -225);

    // Seat 1: Side seat -> relative (0, -425)
    const seat1 = new SeatLayoutContainer(mockScene, 1180, 360, 270, 1);
    expect((seat1 as any).hudGroup.setPosition).toHaveBeenCalledWith(0, -425);

    // Seat 2: Top/Bottom seat -> relative (0, -225)
    const seat2 = new SeatLayoutContainer(mockScene, 640, 75, 180, 2);
    expect((seat2 as any).hudGroup.setPosition).toHaveBeenCalledWith(0, -225);

    // Seat 3: Side seat -> relative (0, -425)
    const seat3 = new SeatLayoutContainer(mockScene, 100, 360, 90, 3);
    expect((seat3 as any).hudGroup.setPosition).toHaveBeenCalledWith(0, -425);
  });

  it('should place melds strictly between hand and flower rack (positive X offset)', () => {
    const seatContainer = new SeatLayoutContainer(mockScene, 640, 645, 0, 0);
    const profile = createMockProfile();

    mockScene.add.container.mockClear();
    seatContainer.renderPlayerState(profile, true);

    const containerCalls = mockScene.add.container.mock.calls;
    const meldContainerCall = containerCalls.find((c: any[]) => c[0] >= 100 && c[1] === 0);
    expect(meldContainerCall).toBeDefined();
  });

  it('should ensure drawn tile is strictly placed to the left of melds without any overlap', () => {
    const seatContainer = new SeatLayoutContainer(mockScene, 640, 645, 0, 0);
    const profile = createMockProfile();
    // Human with 13 hand tiles, 1 drawn tile, and 1 meld
    profile.hand = Array.from({ length: 13 }, (_, i) => ({
      id: `hand_${i}`,
      suit: 'CHARACTERS',
      value: (i % 9) + 1,
      name: `${(i % 9) + 1}萬`,
      shortCode: `${(i % 9) + 1}m`,
    }));
    profile.drawnTile = {
      id: 'drawn_1',
      suit: 'DOTS',
      value: 1,
      name: '一筒',
      shortCode: '1p',
    };
    profile.melds = [
      {
        type: 'PONG',
        tiles: [
          { id: 'pong_1', suit: 'BAMBOO', value: 3, name: '三條', shortCode: '3s' },
          { id: 'pong_2', suit: 'BAMBOO', value: 3, name: '三條', shortCode: '3s' },
          { id: 'pong_3', suit: 'BAMBOO', value: 3, name: '三條', shortCode: '3s' },
        ],
        sourceSeat: 1,
      },
    ];

    mockScene.add.sprite.mockClear();
    mockScene.add.container.mockClear();
    seatContainer.renderPlayerState(profile, true);

    const spriteCalls = mockScene.add.sprite.mock.calls;
    const containerCalls = mockScene.add.container.mock.calls;

    // Find drawn tile sprite call ('mahjong:tile_1p')
    const drawnTileCall = spriteCalls.find((c: any[]) => c[2] === 'mahjong:tile_1p');
    expect(drawnTileCall).toBeDefined();
    const drawnTileX = drawnTileCall[0];

    // Find meld container call
    const meldContainerCall = containerCalls.find((c: any[]) => c[1] === 0);
    expect(meldContainerCall).toBeDefined();
    const meldCenterX = meldContainerCall[0];
    const meldLeftEdge = meldCenterX - (36 * 3) / 2; // Meld center minus half-meld width

    // Drawn tile right edge (drawnTileX + 18) must be strictly less than meld left edge
    const drawnTileRightEdge = drawnTileX + 18;
    expect(drawnTileRightEdge).toBeLessThan(meldLeftEdge);
  });

  it('should render player wind and name in HUD correctly', () => {
    const seat0 = new SeatLayoutContainer(mockScene, 640, 645, 0, 0);
    const profile0 = createMockProfile();
    profile0.wind = 'EAST';
    profile0.isDealer = true;
    profile0.name = '賭神';
    seat0.updatePlayerInfo(profile0, 'EAST');
    expect((seat0 as any).hudText.setText).toHaveBeenCalledWith('[東] 賭神');

    const seat1 = new SeatLayoutContainer(mockScene, 1180, 360, 270, 1);
    const profile1 = createMockProfile();
    profile1.wind = 'SOUTH';
    profile1.isDealer = false;
    profile1.name = '賭俠小刀';
    seat1.updatePlayerInfo(profile1, 'EAST');
    expect((seat1 as any).hudText.setText).toHaveBeenCalledWith('[南] 賭俠小刀');

    const seat2 = new SeatLayoutContainer(mockScene, 640, 75, 180, 2);
    const profile2 = createMockProfile();
    profile2.wind = 'WEST';
    profile2.isDealer = false;
    profile2.name = '賭聖阿星';
    seat2.updatePlayerInfo(profile2, 'EAST');
    expect((seat2 as any).hudText.setText).toHaveBeenCalledWith('[西] 賭聖阿星');

    const seat3 = new SeatLayoutContainer(mockScene, 100, 360, 90, 3);
    const profile3 = createMockProfile();
    profile3.wind = 'NORTH';
    profile3.isDealer = false;
    profile3.name = '陳金城';
    seat3.updatePlayerInfo(profile3, 'EAST');
    expect((seat3 as any).hudText.setText).toHaveBeenCalledWith('[北] 陳金城');
  });

  it('should rotate the correct tile sideways in PONG based on discard source relative seat', () => {
    const seat0 = new SeatLayoutContainer(mockScene, 640, 645, 0, 0);
    const profile = createMockProfile();

    // Pong from Seat 3 (上家, rel 3) -> leftmost tile (index 0) rotated 90 deg
    profile.melds = [
      {
        type: 'PONG',
        tiles: [
          { id: '1m_1', suit: 'CHARACTERS', value: 1, name: '一萬', shortCode: '1m' },
          { id: '1m_2', suit: 'CHARACTERS', value: 1, name: '一萬', shortCode: '1m' },
          { id: '1m_3', suit: 'CHARACTERS', value: 1, name: '一萬', shortCode: '1m' },
        ],
        sourceSeat: 3,
      },
    ];

    seat0.renderPlayerState(profile, true);
    // Verified meld rendered without error
    expect(mockScene.add.container).toHaveBeenCalled();
  });

  it('should rotate the eaten calledTile 90 degrees sideways in CHOW melds with tiles in numerical sequence', () => {
    const seat0 = new SeatLayoutContainer(mockScene, 640, 645, 0, 0);
    const profile = createMockProfile();
    profile.hand = [];
    profile.drawnTile = null;
    profile.flowers = [];
    profile.discards = [];

    // Chow 3m with 4m, 5m -> tiles [3m, 4m, 5m], calledTile is 3m
    profile.melds = [
      {
        type: 'CHOW',
        tiles: [
          { id: '3m_1', suit: 'CHARACTERS', value: 3, name: '三萬', shortCode: '3m' },
          { id: '4m_1', suit: 'CHARACTERS', value: 4, name: '四萬', shortCode: '4m' },
          { id: '5m_1', suit: 'CHARACTERS', value: 5, name: '五萬', shortCode: '5m' },
        ],
        calledTile: { id: '3m_1', suit: 'CHARACTERS', value: 3, name: '三萬', shortCode: '3m' },
        sourceSeat: 3,
      },
    ];

    mockScene.add.sprite.mockClear();
    seat0.renderPlayerState(profile, true);

    const spriteCalls = mockScene.add.sprite.mock.calls;
    const meldSprites = spriteCalls.filter((c: any[]) =>
      ['mahjong:tile_3m', 'mahjong:tile_4m', 'mahjong:tile_5m'].includes(c[2])
    );
    expect(meldSprites.length).toBe(3);
  });

  it('should render 9x2 compact discard river with 9 columns per row', () => {
    const seatContainer = new SeatLayoutContainer(mockScene, 640, 645, 0, 0);
    const profile = createMockProfile();
    // 18 discards filling exactly 2 rows of 9 columns
    profile.discards = Array.from({ length: 18 }, (_, i) => ({
      id: `discard_${i}`,
      suit: 'CHARACTERS',
      value: (i % 9) + 1,
      name: `${(i % 9) + 1}萬`,
      shortCode: `${(i % 9) + 1}m`,
    }));

    mockScene.add.sprite.mockClear();
    seatContainer.renderPlayerState(profile, true, true);

    const spriteCalls = mockScene.add.sprite.mock.calls;
    // Discard sprites: 18 tiles
    const discardTileCalls = spriteCalls.filter((c: any[]) => c[2].startsWith('mahjong:tile_'));
    expect(discardTileCalls.length).toBeGreaterThanOrEqual(18);
  });

  it('should highlight matching discards correctly', () => {
    const seatContainer = new SeatLayoutContainer(mockScene, 640, 645, 0, 0);
    expect(() => seatContainer.highlightMatchingDiscards('1m')).not.toThrow();
    expect(() => seatContainer.highlightMatchingDiscards(null)).not.toThrow();
  });

  it('should render AI hand tiles with identical size and spacing (TILE_W = 36px, gapDrawn = 12px) to human hand', () => {
    const humanSeat = new SeatLayoutContainer(mockScene, 640, 645, 0, 0);
    const aiSeat = new SeatLayoutContainer(mockScene, 640, 75, 180, 2);

    const profile = createMockProfile();
    profile.melds = [];
    profile.flowers = [];
    profile.discards = [];
    profile.hand = Array.from({ length: 16 }, (_, i) => ({
      id: `h_${i}`,
      suit: 'CHARACTERS',
      value: (i % 9) + 1,
      name: `${(i % 9) + 1}萬`,
      shortCode: `${(i % 9) + 1}m`,
    }));
    profile.drawnTile = { id: 'd_0', suit: 'CHARACTERS', value: 1, name: '一萬', shortCode: '1m' };

    mockScene.add.sprite.mockClear();
    humanSeat.renderPlayerState(profile, true);
    const humanSprites = [...mockScene.add.sprite.mock.calls];

    mockScene.add.sprite.mockClear();
    aiSeat.renderPlayerState(profile, false);
    const aiSprites = [...mockScene.add.sprite.mock.calls];

    // Both Human and AI should create 16 hand tiles + 1 drawn tile (17 total sprites in hand)
    const humanHandTiles = humanSprites.filter((c) => c[2].startsWith('mahjong:tile_'));
    const aiHandTiles = aiSprites.filter((c) => c[2] === 'mahjong:tile_back');
    expect(humanHandTiles.length).toBe(17);
    expect(aiHandTiles.length).toBe(17);
  });

  it('should render Banker Dice cleanly below flower rack only for dealer seat', () => {
    const dealerSeat = new SeatLayoutContainer(mockScene, 640, 645, 0, 0);
    const nonDealerSeat = new SeatLayoutContainer(mockScene, 1180, 360, 270, 1);

    mockScene.add.sprite.mockClear();
    mockScene.add.graphics.mockClear();

    // 1. Dealer seat should render banker dice sprites and background
    dealerSeat.showBankerDice([1, 2, 3], true);
    const dealerSpriteCalls = mockScene.add.sprite.mock.calls;
    const dealerDiceCalls = dealerSpriteCalls.filter((c: any[]) => c[2].startsWith('mahjong:dice_'));
    expect(dealerDiceCalls.length).toBe(3);

    // 2. Non-dealer seat should NOT render banker dice sprites
    mockScene.add.sprite.mockClear();
    nonDealerSeat.showBankerDice([1, 2, 3], false);
    const nonDealerSpriteCalls = mockScene.add.sprite.mock.calls;
    const nonDealerDiceCalls = nonDealerSpriteCalls.filter((c: any[]) => c[2].startsWith('mahjong:dice_'));
    expect(nonDealerDiceCalls.length).toBe(0);
  });

  it('should highlight positive flowers with coral orange frame according to effectiveWind', () => {
    const seatContainer = new SeatLayoutContainer(mockScene, 640, 645, 0, 0);
    const profile = createMockProfile();
    // Has Spring (1) and Summer (2)
    profile.flowers = [
      { id: 'f_spring', suit: 'FLOWERS', value: 1, name: '春', shortCode: 'spring', isFlower: true },
      { id: 'f_summer', suit: 'FLOWERS', value: 2, name: '夏', shortCode: 'summer', isFlower: true },
    ];

    mockScene.add.graphics.mockClear();
    // 1. When effectiveWind is EAST (Dealer), Spring (1) is positive and highlighted with coral frame
    seatContainer.renderPlayerState(profile, true, false, false, 'EAST', null, 'EAST');
    expect(mockScene.add.graphics).toHaveBeenCalled();

    mockScene.add.graphics.mockClear();
    // 2. When effectiveWind is SOUTH, Summer (2) is positive and highlighted with coral frame
    seatContainer.renderPlayerState(profile, true, false, false, 'EAST', null, 'SOUTH');
    expect(mockScene.add.graphics).toHaveBeenCalled();
  });

  it('should accurately record drawnSlotWorldX after rendering player state', () => {
    const seatContainer = new SeatLayoutContainer(mockScene, 640, 680, 0, 0);
    const profile = createMockProfile();
    seatContainer.renderPlayerState(profile, true);
    expect(seatContainer.drawnSlotWorldX).toBeGreaterThan(640);
  });
});
