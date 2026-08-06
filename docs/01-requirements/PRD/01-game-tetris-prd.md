# PRD-01: 俄羅斯方塊 (Tetris Game PRD)

## 1. 遊戲願景與歷史規範 (Overview & Variant Rules)
Tetris 是一部經典的網格益智遊戲。玩家操控落下的 7 種不同幾何形狀方塊 (Tetrominoes)，在 10x20 的遊戲矩陣中進行旋轉、移動與消除，享受休閒解壓與挑戰高分的樂趣。

本平台定係為 **「休閒娛樂 (Casual Play)」** 導向，並提供經典街機視覺與現代操作體驗：
- **NEXT 預覽與 Hold 的歷史精確考據**：
  - **NEXT 下一個方塊預覽 (Next Piece Preview)**：**經典版 (NES/Game Boy 1989) 與現代版皆有 NEXT 視窗**！經典版可預覽下 1 個方塊；現代版可預覽下 1~3 個方塊。
  - **Hold 暫存區與 Ghost 影子預覽**：
    - **經典模式 (Classic Mode)**：具備 NEXT 預覽，但**無 Hold 暫存區**、**無底部 Ghost 影子預覽**，還原 1989 原汁原味經典樂趣。
    - **現代模式 (Modern Mode - 預設)**：具備 NEXT 預覽、**Hold 暫存區**與底部 Ghost 影子預覽。

---

## 2. 核心遊戲機制 (Core Game Mechanics)

### 2.1 規格參數
- **網格尺寸**：寬 10 格 (Cols) x 高 20 格 (Rows) 可見區域。
- **7 種方塊 (7 Tetrominoes)**：`I`, `J`, `L`, `O`, `S`, `T`, `Z`。
- **旋轉系統**：SRS (Super Rotation System) 規格，支援 Wall Kicks 反彈。
- **隨機生成**：7-Bag 隨機袋演算法，確保每 7 次落下方塊不重複涵蓋所有 7 種種類。

### 2.2 休閒平緩加速曲線與上限 (Casual Gravity Curve & Cap)

考量本平台為 **休閒娛樂性質**，放棄過往硬核「1 幀 (16ms) 暴走 Kill Screen」，改採用**平緩舒適的下落速度曲線**，並於 **Level 15 封頂**（最快僅 $200\text{ms}$，提供充裕的思考與反應時間）：

| 等級 (Level) | 下落時間間隔 (Drop Interval) | 下落速度 (秒/格) | 休閒體驗說明 |
|---|---|---|---|
| **Level 1** | **1,000 ms** | 1.0 秒/格 | 極度輕鬆，適合初學者與休閒玩家 |
| **Level 2** | 900 ms | 0.9 秒/格 | 輕鬆步調 |
| **Level 3** | 800 ms | 0.8 秒/格 | 順暢節奏 |
| **Level 5** | 600 ms | 0.6 秒/格 | 適中節奏 |
| **Level 8** | 450 ms | 0.45 秒/格 | 微具挑戰性 |
| **Level 10** | 350 ms | 0.35 秒/格 | 輕快專注 |
| **Level 12** | 250 ms | 0.25 秒/格 | 緊張刺激 |
| **Level 15 (Max Cap 封頂)** | **200 ms** | **0.2 秒/格** | **休閒封頂上限 (速度快速但依然完全可受控與游刃有餘)** |

- **等級上限 (Max Level Cap)**：**Level 15** 為休閒封頂上限。到達 Level 15 後速度不再增加，維持在舒適安全的 $200\text{ms}$ 下落間隔，玩家可持續遊玩累積高分。
- **升級條件**：每累積消除 **10 行 (Lines)**，Level 自動 $+1$。

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
