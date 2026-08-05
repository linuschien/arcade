---
name: arcade-game-contract
description: Core Arcade Stadium interfaces and contracts for ArcadeBridge event bus and InputService action mapping. Enforces strict decoupling between React Host Shell and Phaser Game instances.
---

# Skill: Arcade Game Contract

## 🎯 Purpose
Provides standardized, framework-agnostic TypeScript contracts and interfaces (`ArcadeBridge.ts` and `InputService.ts`) for all sub-games running inside the **Arcade Stadium** platform.

---

## 📂 Resources
- `resources/ArcadeBridge.ts`: Event bus and `IArcadeGame` lifecycle interface.
- `resources/InputService.ts`: Unified input action query adapter (`PlayerIndex`, `ArcadeAction`, `InputVector`).

---

## ⚙️ Mandatory Guidelines for Game Engineers

When building or refactoring any game inside `src/games/{game_id}/`:

1. **Implement `IArcadeGame`**:
   - The game entry point at `src/games/{game_id}/index.ts` MUST implement `IArcadeGame`:
     - `onCoinInsert(credits: number): void`
     - `onPause(): void`
     - `onResume(): void`
     - `destroyGame(): void`

2. **Emit `GAME_OVER` & Score Updates**:
   - Emit completion data via `ArcadeBridge`:
     ```typescript
     import { ArcadeBridge } from '@/core/bridge/ArcadeBridge';

     ArcadeBridge.emit('GAME_OVER', {
       gameId: 'tetris',
       score: currentScore,
       playTimeSeconds: elapsedSeconds,
       creditsUsed: 1,
     });
     ```

3. **Query Unified Inputs**:
   - Query inputs exclusively via `InputService`:
     ```typescript
     import { InputService, PlayerIndex, ArcadeAction } from '@/core/input/InputService';

     if (InputService.isActionDown(PlayerIndex.P1, ArcadeAction.BUTTON_A)) {
       // Perform action (e.g. rotate piece, fire weapon, jump)
     }

     const vector = InputService.getActionVector(PlayerIndex.P1);
     // Use vector.x and vector.y for movement
     ```
