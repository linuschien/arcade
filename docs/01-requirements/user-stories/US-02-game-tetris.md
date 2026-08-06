# US-02 俄羅斯方塊模組 (Tetris Game Module)

## 背景 (Background)
Tetris 是 Arcade Stadium 平台上的第一個益智類子遊戲。本模組規範 7-Bag 隨機生成、NEXT 預覽視窗、Hold 暫存區經典/現代設定、SRS 移動旋轉、滿行消除、以 Level 1~15 (平緩休閒 200ms 封頂) 為基準的下落加速曲線與 GameOver 結算邏輯。

---

## US-02-01：7-Bag 方塊隨機生成、NEXT 預覽與 Hold 區 (7-Bag, NEXT Preview & Hold)

**身份**： Tetris 玩家 (Tetris Player)

> **As a** 玩家，  
> **I want to** 在畫面右側看到 NEXT 下一個方塊預覽視窗，並能依設定使用 Hold 暫存區，  
> **So that** 我能進行戰術規劃，或切換至經典模式感受最道地的 1989 懷舊樂趣。

### 驗收條件 (Acceptance Criteria)
- **AC1 (7-Bag & NEXT Preview)**：
  - 採用 7-Bag 隨機袋發牌，確保每 7 次落下方塊種類不重複。
  - **NEXT 預覽視窗**：經典模式與現代模式**皆顯示 NEXT 視窗**（經典模式顯示下 1 個方塊；現代模式顯示下 1~3 個方塊）。
- **AC2 (Hold Mechanics & Mode Settings)**：
  - **現代模式 (Modern Standard - 預設)**：提供 NEXT 預覽、Hold 暫存區（下落期間限交換 1 次）與底部 Ghost 影子預覽。
  - **經典模式 (Classic Mode)**：提供 NEXT 預覽，但**停用 Hold 暫存區**與底部 Ghost 預覽，還原 1989 年初代實體體驗。

---

## US-02-02：方塊位移、SRS 旋轉與硬降/軟降 (Movement, SRS Rotation & Drops)

**身份**： Tetris Player

> **As a** 玩家，  
> **I want to** 使用方向鍵與控制鍵控制方塊左右移動、SRS 旋轉以及 Soft/Hard Drop，  
> **So that** 方塊能精確落在我期望的位置。

### 驗收條件 (Acceptance Criteria)
- **AC1 (Grid Alignment & Wall Collision)**：方塊左右移動時，不得穿透 10x20 的遊戲邊界或已固定的方塊。
- **AC2 (SRS Wall Kick)**：執行旋轉時採用 SRS 旋轉矩陣。若旋轉碰撞牆壁或方塊，自動嘗試 5 個 SRS Kick 向量點。若 5 個點皆碰撞，阻擋旋轉。
- **AC3 (Hard/Soft Drop Scoring)**：
  - 按 `BUTTON_A` (Hard Drop)，方塊瞬間垂直落至最底端並立即鎖定 (Lock Down)，按降落格數每格 $+2$ 分。
  - 按住 `DOWN` (Soft Drop)，加速下落，每格 $+1$ 分。

---

## US-02-03：滿行消除與 Level 1~15 休閒平緩加速曲線 (Line Clear & Casual Level 1~15 Curve)

**身份**： Tetris Player

> **As a** 玩家，  
> **I want to** 在拼滿一整行 10 個格子時觸發消除與得分，且隨著 Level 提升感受平緩適中的速度遞增，  
> **So that** 遊戲過程輕鬆愉悅，不會因為過度暴走而產生挫折感。

### 驗收條件 (Acceptance Criteria)
- **AC1 (Single/Double/Triple/Tetris Scoring)**：
  - 1 行消除：$+100 \times \text{Level}$ 分
  - 2 行消除：$+300 \times \text{Level}$ 分
  - 3 行消除：$+500 \times \text{Level}$ 分
  - 4 行消除 (Tetris)：$+800 \times \text{Level}$ 分
- **AC2 (Casual Level Progression & Speed Curve Table)**：每累積消除 10 行，`Level` $+1$（由 Level 1 提升至上限 Level 15），下落時間間隔 (Drop Interval) 按平緩休閒曲線遞減：
  - Level 1: $1,000\text{ms}$ (1.0 秒/格 - 極度輕鬆)
  - Level 3: $800\text{ms}$ (0.8 秒/格)
  - Level 5: $600\text{ms}$ (0.6 秒/格)
  - Level 8: $450\text{ms}$ (0.45 秒/格)
  - Level 10: $350\text{ms}$ (0.35 秒/格)
  - Level 12: $250\text{ms}$ (0.25 秒/格)
  - **Level 15 (Casual Max Cap 封頂)**: $200\text{ms}$ (0.2 秒/格 - 充裕反應時間)。
- **AC3 (Casual Max Level Cap)**：到達 Level 15 後，等級封頂不再上升，下落速度維持在安全的 $200\text{ms}$ 間隔，玩家可持續遊玩累積高分。

---

## US-02-04：遊戲結束與分數上報 (Game Over & ArcadeBridge Emission)

**身份**： Tetris Player

> **As a** 玩家，  
> **I want to** 在方塊堆疊超越頂部失敗時看到 Game Over 畫面，  
> **So that** 系統將我的最終得分傳送至 Arcade 平台進行高分紀錄。

### 驗收條件 (Acceptance Criteria)
- **AC1 (Block Out Condition)**：當新生成的方塊在置頂 Spawn 位置已被固定方塊重疊時，觸發 Game Over。
- **AC2 (Bridge Event Emission)**：Game Over 發生時，發送 `ArcadeBridge.emit('GAME_OVER', summary)`。
- **AC3 (Memory Teardown)**：監聽 Scene `SHUTDOWN`，清空 Timer、解綁事件並釋放 WebGL 質感與音效記憶體。
