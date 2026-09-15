/**
 * UndoSnapshotStack.ts
 * Push-granularity undo snapshot stack and quota management.
 * Enforces instant restoration of worker and box coordinates without intermediate animation steps.
 */

import { SokobanMaze, GridPos } from './SokobanMaze';

export interface UndoSnapshot {
  workerPos: GridPos;
  boxPositions: GridPos[];
}

export class UndoSnapshotStack {
  private stack: UndoSnapshot[] = [];
  private maxQuota: number;
  private remainingQuota: number;

  constructor(maxQuota: number = 0) {
    this.maxQuota = maxQuota;
    this.remainingQuota = maxQuota;
  }

  public reset(newQuota: number): void {
    this.stack = [];
    this.maxQuota = newQuota;
    this.remainingQuota = newQuota;
  }

  public pushSnapshot(maze: SokobanMaze): void {
    this.stack.push({
      workerPos: maze.getWorkerPos(),
      boxPositions: maze.getBoxPositions(),
    });
  }

  public discardTopSnapshot(): void {
    this.stack.pop();
  }

  public canUndo(): boolean {
    return this.remainingQuota > 0 && this.stack.length > 0;
  }

  public undo(maze: SokobanMaze): boolean {
    if (!this.canUndo()) {
      return false;
    }

    const snapshot = this.stack.pop();
    if (!snapshot) return false;

    maze.restoreState(snapshot.workerPos, snapshot.boxPositions);
    this.remainingQuota--;
    return true;
  }

  public getRemainingQuota(): number {
    return this.remainingQuota;
  }

  public getMaxQuota(): number {
    return this.maxQuota;
  }

  public getUsedCount(): number {
    return this.maxQuota - this.remainingQuota;
  }

  public getStackDepth(): number {
    return this.stack.length;
  }
}
