# US-02 俄羅斯方塊模組 (Tetris Game Module)

## 背景 (Background)
Tetris 是 Arcade Stadium 平台上的第一個益智類子遊戲。本模組規範方塊生成、移動旋轉、滿行消除、分數計算與 GameOver 結算邏輯。

---

## US-02-01：7-Bag 方塊隨機生成與 Hold 區 (7-Bag Generator & Hold)

**身份**： Tetris 玩家 (Tetris Player)

> **As a** 玩家，  
> **I want to** 獲得遵循 7-Bag 公平生成的方塊，並能預覽下 3 個方塊與使用 Hold 暫存區，  
> **So that** 我能進行戰術規劃與佈局。

### 驗收條件 (Acceptance Criteria)
- **AC1 (7-Bag Generation)**：每次生成 7 個方塊一袋 (I, J, L, O, S, T, Z) 的隨機序列，確保每 7 次落下的方塊種類不重複。
- **AC2 (Hold Mechanics)**：按下 `Hold` 按鍵時，將當前方塊存入 Hold 區並置頂換出原 Hold 方塊。若 Hold 區為空，則直接生成下一顆方塊。**每顆新生成方塊落期間僅限 Hold 交換 1 次**。

---

## US-02-02：方塊位移、SRS 旋轉與硬降/軟降 (Movement, SRS Rotation & Drops)

**身份**： Tetris Player

> **As a** 玩家，  
> **I want to** 使用方向鍵與控制鍵控制方塊左右移動、SRS 旋轉以及 Soft/Hard Drop，  
> **So that** 方塊能精確落在我期望的位置。

### 驗收條件 (Acceptance Criteria)
- **AC1 (Grid Alignment & Wall Collision)**：方塊左右移動時，不得穿透 10x20 的遊戲邊界或已固定的方塊。
- **AC2 (SRS Wall Kick)**：執行旋轉時採用 SRS 旋轉矩陣。若旋轉碰撞牆壁或方塊，自動嘗試 5 個 SRS Kick 向量點。若 5 個點皆碰撞，阻擋旋轉。
- **AC3 (Hard Drop)**：按 `BUTTON_A` (Hard Drop)，方塊瞬間垂直落至最底端並立即鎖定 (Lock Down)，發出打擊音效並按降落格數每格 $+2$ 分。

---

## US-02-03：滿行消除與等級加載 (Line Clear & Level Progression)

**身份**： Tetris Player

> **As a** 玩家，  
> **I want to** 在拼滿一整行 10 個格子時觸發消除與得分，  
> **So that** 我能釋放遊戲矩陣空間並獲得高分。

### 驗收條件 (Acceptance Criteria)
- **AC1 (Single/Double/Triple/Tetris Scoring)**：
  - 1 行消除：$+100 \times \text{Level}$ 分
  - 2 行消除：$+300 \times \text{Level}$ 分
  - 3 行消除：$+500 \times \text{Level}$ 分
  - 4 行消除 (Tetris)：$+800 \times \text{Level}$ 分
- **AC2 (Level Increase & Gravity Acceleration)**：每累積消除 10 行，`Level` $+1$，方塊自然下落時間間隔 (Gravity Step) 縮短（速度變快）。

---

## US-02-04：遊戲結束與分數上報 (Game Over & ArcadeBridge Emission)

**身份**： Tetris Player

> **As a** 玩家，  
> **I want to** 在方塊堆疊超越頂部失敗時看到 Game Over 畫面，  
> **So that** 系統將我的最終得分傳送至 Arcade 平台進行高分紀錄。

### 驗收條件 (Acceptance Criteria)
- **AC1 (Block Out Condition)**：當新生成的方塊在置頂 Spawn 位置已被固定方塊重疊時，觸發 Game Over。
- **AC2 (Bridge Event Emission)**：Game Over 發生時，發送 `ArcadeBridge.emit('GAME_OVER', summary)`：
  ```json
  {
    "gameId": "tetris",
    "score": 12500,
    "playTimeSeconds": 185,
    "creditsUsed": 1
  }
  ```
- **AC3 (Memory Teardown)**：監聽 Scene `SHUTDOWN`，清空 Timer、解綁事件並釋放 WebGL 質感與音效記憶體。
