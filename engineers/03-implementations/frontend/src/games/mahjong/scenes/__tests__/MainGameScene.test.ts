/**
 * MainGameScene.test.ts
 * Unit tests for Mahjong MainGameScene.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MainGameScene } from '../MainGameScene';

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
      delayedCall: vi.fn((delay, callback) => callback()),
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
});
