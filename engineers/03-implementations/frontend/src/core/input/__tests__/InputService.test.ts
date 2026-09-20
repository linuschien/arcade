import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { InputService, PlayerIndex, ArcadeAction } from '../InputService';

describe('InputService Unit Tests', () => {
  beforeEach(() => {
    InputService.reset();
  });

  afterEach(() => {
    InputService.reset();
  });

  it('should trigger BUTTON_C on standard ShiftRight event (code: ShiftRight)', () => {
    const eventDown = new KeyboardEvent('keydown', { code: 'ShiftRight', key: 'Shift' });
    window.dispatchEvent(eventDown);

    expect(InputService.isActionDown(PlayerIndex.P1, ArcadeAction.BUTTON_C)).toBe(true);

    const eventUp = new KeyboardEvent('keyup', { code: 'ShiftRight', key: 'Shift' });
    window.dispatchEvent(eventUp);

    expect(InputService.isActionDown(PlayerIndex.P1, ArcadeAction.BUTTON_C)).toBe(false);
  });

  it('should trigger BUTTON_C on ShiftRight fallback when code is empty or unidentified (key: Shift)', () => {
    // Linux / Chromium issue where code is empty string on certain layouts
    const eventDown = new KeyboardEvent('keydown', { code: '', key: 'Shift' });
    window.dispatchEvent(eventDown);

    expect(InputService.isActionDown(PlayerIndex.P1, ArcadeAction.BUTTON_C)).toBe(true);

    const eventUp = new KeyboardEvent('keyup', { code: '', key: 'Shift' });
    window.dispatchEvent(eventUp);

    expect(InputService.isActionDown(PlayerIndex.P1, ArcadeAction.BUTTON_C)).toBe(false);
  });

  it('should trigger BUTTON_C on ShiftLeft', () => {
    const eventDown = new KeyboardEvent('keydown', { code: 'ShiftLeft', key: 'Shift' });
    window.dispatchEvent(eventDown);

    expect(InputService.isActionDown(PlayerIndex.P1, ArcadeAction.BUTTON_C)).toBe(true);
  });

  it('should trigger BUTTON_A on KeyJ and lowercase j', () => {
    // code KeyJ
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyJ', key: 'j' }));
    expect(InputService.isActionDown(PlayerIndex.P1, ArcadeAction.BUTTON_A)).toBe(true);
    window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyJ', key: 'j' }));
    expect(InputService.isActionDown(PlayerIndex.P1, ArcadeAction.BUTTON_A)).toBe(false);

    // fallback when code is missing, key is 'j'
    window.dispatchEvent(new KeyboardEvent('keydown', { code: '', key: 'j' }));
    expect(InputService.isActionDown(PlayerIndex.P1, ArcadeAction.BUTTON_A)).toBe(true);
    window.dispatchEvent(new KeyboardEvent('keyup', { code: '', key: 'j' }));
    expect(InputService.isActionDown(PlayerIndex.P1, ArcadeAction.BUTTON_A)).toBe(false);
  });

  it('should calculate directional action vector correctly', () => {
    InputService.setActionState(PlayerIndex.P1, ArcadeAction.RIGHT, true);
    InputService.setActionState(PlayerIndex.P1, ArcadeAction.UP, true);

    const vector = InputService.getActionVector(PlayerIndex.P1);
    expect(vector).toEqual({ x: 1, y: -1 });
  });
});

