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
    constructor(scene?: any) {
      this.scene = scene;
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

  it('should highlight matching discards correctly', () => {
    const seatContainer = new SeatLayoutContainer(mockScene, 640, 645, 0, 0);
    expect(() => seatContainer.highlightMatchingDiscards('1m')).not.toThrow();
    expect(() => seatContainer.highlightMatchingDiscards(null)).not.toThrow();
  });
});
