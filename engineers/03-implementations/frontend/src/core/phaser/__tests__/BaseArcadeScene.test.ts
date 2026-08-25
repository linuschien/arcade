/**
 * BaseArcadeScene.test.ts
 * Unit tests for BaseArcadeScene High-DPI camera alignment helper.
 */

import { describe, it, expect, vi } from 'vitest';
import { BaseArcadeScene } from '../BaseArcadeScene';

class TestArcadeScene extends BaseArcadeScene {
  constructor() {
    super({ key: 'test:Scene' });
  }

  public testAlign(baseWidth: number): void {
    this.initHighDpiCamera(baseWidth);
  }
}

describe('BaseArcadeScene Unit Tests', () => {
  it('should align camera origin and zoom when scale.width > baseWidth', () => {
    const scene = new TestArcadeScene();
    const mockCamera = {
      setOrigin: vi.fn().mockReturnThis(),
      setZoom: vi.fn().mockReturnThis(),
    };

    (scene as any).scale = { width: 1200, height: 1470 };
    (scene as any).cameras = { main: mockCamera };

    scene.testAlign(600);

    expect(mockCamera.setOrigin).toHaveBeenCalledWith(0, 0);
    expect(mockCamera.setZoom).toHaveBeenCalledWith(2);
  });

  it('should not zoom camera when scale.width is equal to baseWidth', () => {
    const scene = new TestArcadeScene();
    const mockCamera = {
      setOrigin: vi.fn().mockReturnThis(),
      setZoom: vi.fn().mockReturnThis(),
    };

    (scene as any).scale = { width: 600, height: 735 };
    (scene as any).cameras = { main: mockCamera };

    scene.testAlign(600);

    expect(mockCamera.setZoom).not.toHaveBeenCalled();
  });

  it('should manage pause lifecycle and audio pipeline ordering', () => {
    class MockGameScene extends BaseArcadeScene {
      public callOrder: string[] = [];

      protected override onPauseAudio(): void {
        this.callOrder.push('onPauseAudio');
      }

      protected override onResumeAudio(): void {
        this.callOrder.push('onResumeAudio');
      }
    }

    const scene = new MockGameScene({ key: 'mock:Scene' });

    // 1. Pause: should call onPauseAudio
    scene.setPauseState(true);
    expect(scene.callOrder).toEqual(['onPauseAudio']);

    // 2. Resume: should call onResumeAudio
    scene.setPauseState(false);
    expect(scene.callOrder).toEqual(['onPauseAudio', 'onResumeAudio']);
  });
});
