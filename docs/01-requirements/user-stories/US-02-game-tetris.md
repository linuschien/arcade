# US-02 俄羅斯方塊模組 (Tetris Game Module)

## 背景 (Background)
Tetris 是 Arcade Stadium 平台上的第一個益智類子遊戲。本模組規範 7-Bag 隨機生成、Hold 暫存區歷史與經典/現代設定、SRS 移動旋轉、滿行消除、以 Level 1~20 (20G Kill Screen) 為基準的下落加速曲線與 GameOver 結算邏輯。

---

## US-02-01：7-Bag 方塊隨機生成與 Hold 區 (7-Bag Generator & Hold Option)

**身份**： Tetris 玩家 (Tetris Player)

> **As a** 玩家，  
> **I want to** 獲得遵循 7-Bag 公平發牌的方塊序列，並能依設定使用 Hold 暫存區與預覽，  
> **So that** 我能進行戰術規劃與布局，或切換至經典無 Hold 模式考驗極限反應。

### 驗收條件 (Acceptance Criteria)
- **AC1 (7-Bag Generation)**：每次生成 7 個方塊一袋 (I, J, L, O, S, T, Z) 的隨機序列，確保每 7 次落下的方塊種類不重複。
- **AC2 (Hold Mechanics & Historical Modes)**：
  - **現代模式 (Modern Standard - 預設)**：支援 Hold 暫存區，按下 `Hold` 鍵置換當前方塊（每顆新生成方塊落期間限交換 1 次）。
  - **經典模式 (Classic Arcade 1989)**：若玩家於設定開啟「Classic Mode」，**停用 Hold 暫存區功能**，完全還原 1989 NES/Arcade 無 Hold 考驗傳統玩法。

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

## US-02-03：滿行消除與 Level 1~20 下落加速曲線 (Line Clear & Level 1~20 Gravity Curve)

**身份**： Tetris Player

> **As a** 玩家，  
> **I want to** 在拼滿一整行 10 個格子時觸發消除與得分，且隨著 Level 提升感受明顯加速與 Level 20 封頂挑戰，  
> **So that** 遊戲體驗具備經典街機逐漸緊張暴走與極限挑戰的樂趣。

### 驗收條件 (Acceptance Criteria)
- **AC1 (Single/Double/Triple/Tetris Scoring)**：
  - 1 行消除：$+100 \times \text{Level}$ 分
  - 2 行消除：$+300 \times \text{Level}$ 分
  - 3 行消除：$+500 \times \text{Level}$ 分
  - 4 行消除 (Tetris)：$+800 \times \text{Level}$ 分
- **AC2 (Level Progression & Speed Curve Table)**：每累積消除 10 行，`Level` $+1$（由 Level 1 提升至上限 Level 20），下落時間間隔 (Drop Interval) 按下表呈指數縮短：
  - Level 1: $800\text{ms}$ (48 幀/格)
  - Level 5: $383\text{ms}$ (23 幀/格)
  - Level 10: $100\text{ms}$ (6 幀/格)
  - Level 15: $66\text{ms}$ (4 幀/格)
  - Level 19: $33\text{ms}$ (2 幀/格)
  - **Level 20 (Max Level / 20G Kill Screen)**: $16.67\text{ms}$ (1 幀/格，瞬降底端)。
- **AC3 (Max Level Cap & Kill Screen Persistence)**：到達 Level 20 後，等級封頂不再上升，下落速度維持 1 幀/格 (20G)，玩家繼續遊玩直到 Block Out 失敗。

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
