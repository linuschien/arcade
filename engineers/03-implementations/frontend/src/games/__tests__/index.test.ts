import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createGameInstance } from '../index';

const mockGameInstance = {
  onPause: vi.fn(),
  onResume: vi.fn(),
  destroyGame: vi.fn(),
};

vi.mock('../tetris', () => ({
  createTetrisGame: vi.fn(() => mockGameInstance),
}));

vi.mock('../pacman', () => ({
  createPacmanGame: vi.fn(() => mockGameInstance),
}));

vi.mock('../pipemania', () => ({
  createPipeManiaGame: vi.fn(() => mockGameInstance),
}));

vi.mock('../mahjong', () => ({
  createMahjongGame: vi.fn(() => mockGameInstance),
}));

describe('Game Registry & Factory (Code-Splitting)', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    vi.clearAllMocks();
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  it('returns null and warns for unregistered gameId', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const instance = await createGameInstance('non-existent-game', container);
    expect(instance).toBeNull();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('[ArcadeRegistry] No game factory registered for gameId: "non-existent-game"')
    );
    warnSpy.mockRestore();
  });

  it('asynchronously creates Tetris game instance', async () => {
    const instance = await createGameInstance('tetris', container);
    expect(instance).toBe(mockGameInstance);
    instance?.destroyGame();
    expect(mockGameInstance.destroyGame).toHaveBeenCalled();
  });

  it('asynchronously creates Pacman game instance', async () => {
    const instance = await createGameInstance('pacman', container);
    expect(instance).toBe(mockGameInstance);
    instance?.destroyGame();
    expect(mockGameInstance.destroyGame).toHaveBeenCalled();
  });

  it('asynchronously creates PipeMania game instance', async () => {
    const instance = await createGameInstance('pipemania', container);
    expect(instance).toBe(mockGameInstance);
    instance?.destroyGame();
    expect(mockGameInstance.destroyGame).toHaveBeenCalled();
  });

  it('asynchronously creates Mahjong game instance', async () => {
    const instance = await createGameInstance('mahjong', container);
    expect(instance).toBe(mockGameInstance);
    instance?.destroyGame();
    expect(mockGameInstance.destroyGame).toHaveBeenCalled();
  });
});
