# PRD-01: 俄羅斯方塊 (Tetris Game PRD)

## 1. 遊戲願景與歷史規範 (Overview & Variant Rules)
Tetris 是一部經典的網格益智遊戲。玩家操控落下的 7 種不同幾何形狀方塊 (Tetrominoes)，在 10x20 的遊戲矩陣中進行旋轉、移動與消除，挑戰極限反應與高分。

本平台提供 **經典街機模式 (Classic Arcade 1989)** 與 **現代標準模式 (Modern Guideline)** 之規則支援：
- **Hold (暫存區) 的考據與歷史**：
  - **經典初代 (NES/Arcade 1989)**：**無 Hold 機制**，亦無影子預覽 (Ghost Piece)，極度考驗即時反應與預判布局。
  - **現代標準 (Modern Guideline)**：提供 **Hold 暫存區**（下落期間限交換 1 次）與 Ghost 影子預覽。
  - **Arcade Stadium 預設設定**：大廳提供「Hold 功能啟用/停用」切換，預設啟用以符合現代操作習慣，切換至復古模式可完全還原 1989 無 Hold 經典極限體驗。

---

## 2. 核心遊戲機制 (Core Game Mechanics)

### 2.1 規格參數
- **網格尺寸**：寬 10 格 (Cols) x 高 20 格 (Rows) 可見區域（上方設有 2 格隱藏 Buffer）。
- **7 種方塊 (7 Tetrominoes)**：
  - `I` (淺藍), `J` (深藍), `L` (橘色), `O` (黃色), `S` (綠色), `T` (紫色), `Z` (紅色)。
- **旋轉系統**：SRS (Super Rotation System) 規格，支援 Wall Kicks 反彈。
- **隨機生成**：7-Bag 隨機袋演算法，確保每 7 次落下方塊不重複涵蓋所有 7 種種類。

### 2.2 下落加速曲線與等級上限 (Gravity Curve & Max Level Cap)

遊戲採用經典 60 FPS 幀率基準（每一幀約 16.67ms），隨 Level 提升下落時間間隔 (Gravity Step) 呈指數級加速：

| 等級 (Level) | 下落時間間隔 (Drop Interval) | 每秒格數 (G-Speed) | 經典街機體驗說明 |
|---|---|---|---|
| **Level 1** | 800 ms (48 幀/格) | 1.25 格/秒 | 慢速入門 |
| **Level 2** | 716 ms (43 幀/格) | 1.40 格/秒 | 基礎節奏 |
| **Level 3** | 633 ms (38 幀/格) | 1.58 格/秒 | 穩定推進 |
| **Level 5** | 383 ms (23 幀/格) | 2.61 格/秒 | 中速進階 |
| **Level 8** | 133 ms (8 幀/格) | 7.50 格/秒 | 高速反應 |
| **Level 10** | 100 ms (6 幀/格) | 10.0 格/秒 | 緊張對抗 |
| **Level 15** | 66 ms (4 幀/格) | 15.0 格/秒 | 極速反應 |
| **Level 19** | 33 ms (2 幀/格) | 30.0 格/秒 | 極限暴走 (幾乎肉眼難跟) |
| **Level 20 (Max / Kill Screen)** | **16.67 ms (1 幀/格 / 20G 瞬降)** | **60.0 格/秒** | **上限終極關卡 (方塊生成即落底，反應時間接近 0 秒)** |

- **等級上限 (Max Level Cap)**：**Level 20** 為封頂上限（稱為 20G / Kill Screen）。達到 Level 20 後下落速度不再增加，但玩家可繼續遊玩直到 Block Out 失敗。
- **升級條件**：每累積消除 **10 行 (Lines)**，Level 自動 $+1$ 並套用下一階加速。

### 2.3 計分與加分倍率 (Scoring System)
- **單行消除 (Single)**：$100 \times \text{Level}$ 分
- **雙行消除 (Double)**：$300 \times \text{Level}$ 分
- **三行消除 (Triple)**：$500 \times \text{Level}$ 分
- **四行消除 (Tetris)**：$800 \times \text{Level}$ 分
- **Soft Drop (軟降)**：按住向下鍵時，每額外下落 1 格 $+1$ 分。
- **Hard Drop (硬降)**：瞬間 Hard Drop，每降落 1 格 $+2$ 分。

### 2.4 失敗條件 (Game Over Condition)
- 當新生成的方塊在置頂 Spawn 位置已被固定方塊重疊（Block Out），觸發 Game Over。
- 透過 `ArcadeBridge.emit('GAME_OVER', summary)` 拋出分數並結束遊戲。
