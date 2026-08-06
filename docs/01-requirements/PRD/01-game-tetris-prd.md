# PRD-01: 俄羅斯方塊 (Tetris Game PRD)

## 1. 遊戲願景與簡介 (Overview)
Tetris 是一部經典的網格益智遊戲。玩家操控落下的 7 種不同幾何形狀方塊 (Tetrominoes)，在 10x20 的遊戲矩陣中進行旋轉、移動與消除，挑戰極限反應與高分。

---

## 2. 核心遊戲機制 (Core Game Mechanics)

### 2.1 規格參數
- **網格尺寸**：寬 10 格 (Cols) x 高 20 格 (Rows) 可見區域（上方設有 2 格隱藏 Buffer）。
- **7 種方塊 (7 Tetrominoes)**：
  - `I` (淺藍 - 4x1 條狀)
  - `J` (深藍 - L型反轉)
  - `L` (橘色 - L型)
  - `O` (黃色 - 2x2 正方形)
  - `S` (綠色 - S型)
  - `T` (紫色 - T型)
  - `Z` (紅色 - Z型)
- **旋轉系統**：Super Rotation System (SRS) 規格，支援牆壁反彈 Kick (Wall Kicks)。
- **隨機生成**：7-Bag 隨機袋演算法，確保每 7 次落下方塊必定不重複涵蓋所有 7 種種類。

### 2.2 操作控制對映 (Input Mapping via InputService)
- `LEFT` / `RIGHT`：左右移動方塊 1 格。
- `DOWN` (Soft Drop)：加速下落，每下落 1 格獲得 1 分。
- `BUTTON_A` (Hard Drop)：瞬間降落至底部並固定，每降落 1 格獲得 2 分。
- `BUTTON_B` / `UP`：順時針旋轉方塊。
- `BUTTON_C` (Hold)：將當前方塊存入 Hold 區（每顆下落方塊限交換 1 次）。

### 2.3 計分與等級提升 (Scoring & Leveling)
- **單行消除 (Single)**：$100 \times \text{Level}$ 分
- **雙行消除 (Double)**：$300 \times \text{Level}$ 分
- **三行消除 (Triple)**：$500 \times \text{Level}$ 分
- **四行消除 (Tetris)**：$800 \times \text{Level}$ 分
- **等級提升 (Level Up)**：每消除 10 行提升 1 級，下落速度 (Gravity) 隨 Level 提高而加速。

### 2.4 失敗條件 (Game Over Condition)
- 當新生成的方塊在置頂 Spawn 位置已被固定方塊重疊（Block Out），或方塊在可見區域上方固定（Lock Out），觸發 Game Over。
- 透過 `ArcadeBridge.emit('GAME_OVER', summary)` 拋出分數並結束遊戲。
