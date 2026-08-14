# US-04 水管工人模組 (Pipe Mania Game Module)

## 背景 (Background)
Pipe Mania 是 Arcade Stadium 平台上的第三個益智路徑規劃類子遊戲。本模組規範 $10 \times 7$ 網格操作、13 種水管連通物理、5 格 FIFO 發牌佇列、動態權重發牌、無硬編碼線性關卡公式 (1~36 關 + 無限循環)、Fast Forward 快進結算以及 GameOver 爆管判定邏輯。

---

## US-04-01：$10 \times 7$ 網格操作與水管放置 (Grid Interaction & Pipe Placement)

**身份**： Pipe Mania 玩家 (Pipe Mania Player)

> **As a** 玩家，  
> **I want to** 在 $10 \times 7$ 的矩形網格上點擊空白格子，  
> **So that** 我能將發牌佇列頂端的水管放置到指定座標鋪設水路。

### 驗收條件 (Acceptance Criteria)
- **AC1 (Placement)**：點擊空白格子時，將佇列第 1 格水管放置到該座標。
- **AC2 (Queue Shift)**：佇列頂端水管彈出 (Pop)，下方水管依序上移，第 5 格依權重生成新水管補齊。
- **AC3 (Replacement & Penalty)**：點擊已放置水管但水流尚未流經的格子時，允許以佇列新水管進行覆蓋替換，並扣除 $-50$ 分覆蓋分數。
- **AC4 (Flooded Lock)**：點擊水流正在流經或已流過的格子時，系統忽略點擊，禁止覆蓋。

---

## US-04-02：障礙物與預設固定水管限制 (Obstacles & Preset Pipes)

**身份**： 關卡設計師 / 玩家

> **As a** 玩家，  
> **I want to** 在盤面上看到「障礙石頭」與「預設固定水管」，  
> **So that** 關卡具備適度的路徑限制與獎勵挑戰。

### 驗收條件 (Acceptance Criteria)
- **AC1 (Obstacle Lock)**：點擊「障礙石頭」時，系統忽略輸入且不消耗佇列水管。
- **AC2 (Preset Lock & Bonus)**：點擊「預設固定水管」時，禁止覆蓋替換；當水流流經預設水管時，結算額外獎勵分數 (+100~300 分 Bonus)。

---

## US-04-03：13 種實體水管元件連通性與物理規則 (13 Pipe Types Physical Rules)

**身份**： 遊戲引擎 (Game Engine)

> **As a** 遊戲引擎，  
> **I want to** 依據 13 種水管類型判定水流的出入方向與流速，  
> **So that** 能正確推進水流或判定溢出爆管。

### 驗收條件 (Acceptance Criteria)
- **AC1 (7 Standard Pipes)**：
  - 2 款直管（水平 `─` / 垂直 `│`）
  - 4 款無方向性雙向彎管（`╝`, `╚`, `╗`, `╔`）
  - 1 款立體交叉十字管 (`╬`)：水平與垂直兩路各自獨立直行，液體可先後通過兩軸，禁止轉灣。
- **AC2 (4 One-Way Pipes)**：僅允許指定單一方向進入（`→`, `←`, `↑`, `↓`），反向或側面灌入立即觸發爆管 (Spill Game Over)。
- **AC3 (2 Reservoir Tank Pipes)**：水流進入後填充速度降低至普通直管的 $20\% \sim 33\%$（提供 $3 \sim 5$ 秒緩衝時間），完全填滿後提供大額分數。

---

## US-04-04：邊界碰撞與水流溢出判定 (Spill & Collision Check)

**身份**： 遊戲系統 (Game System)

> **As a** 遊戲系統，  
> **I want to** 在水流超出 $10 \times 7$ 邊界、撞上障礙物或無對接水管時判定失敗，  
> **So that** 維持四面封閉邊界的經典懲罰機制。

### 驗收條件 (Acceptance Criteria)
- **AC1 (Boundary Spill)**：水流前進方向為 $10 \times 7$ 網格外圍邊界時，判定撞牆溢出。
- **AC2 (Mismatched Connection Spill)**：水流前進方向為無開口對接之水管、障礙石頭或單向管反向端時，判定撞牆溢出。
- **AC3 (Spill Animation & Event)**：溢出爆管時播放水流噴發動畫，觸發 Game Over，並透過 `ArcadeBridge.emit('GAME_OVER', summary)` 拋出得分。

---

## US-04-05：5 格先進先出 (FIFO) 水管發送器 (5-Slot FIFO Queue UI)

**身份**： Pipe Mania 玩家

> **As a** 玩家，  
> **I want to** 在側邊 UI 清楚看到接下來的 5 個水管，  
> **So that** 我能進行未來 5 步的路徑規劃與迴圈佈局。

### 驗收條件 (Acceptance Criteria)
- **AC1 (Queue Display)**：側邊 UI 始終維持顯示 5 格水管圖示。
- **AC2 (Pop & Push Animation)**：頂端（第 1 格）標示為當前即將放置的水管，每次放置後以平滑動畫遞移佇列，並於底端生成新水管。

---

## US-04-06：基於關卡等級的加權發牌 (Weighted Drop Rate by Level L)

**身份**： 遊戲系統

> **As a** 遊戲系統，  
> **I want to** 根據當前關卡等級動態調整基礎管、單向管與水庫管的出現機率，  
> **So that** 難度隨進度合理提升且不造成早期認知超載。

### 驗收條件 (Acceptance Criteria)
- **AC1 (Level < 4)**：水庫管發牌率為 $0\%$。
- **AC2 (Level < 7)**：單向管發牌率為 $0\%$。
- **AC3 (Level >= 7)**：單向管機率隨等級線性遞增（最高 $20\%$），水庫管機率隨等級線性遞減（最低 $3\%$），其餘權重平均分配予 7 種基礎管。

---

## US-04-07：無硬編碼線性難度參數公式 (Linear Level Formulas)

**身份**： 遊戲平衡系統

> **As a** 遊戲平衡系統，  
> **I want to** 透過線性函數計算每關的預備時間、水流速度、目標長度與障礙數量，  
> **So that** 系統能以無硬編碼方式支援 1 至 36 關的平滑推進。

### 驗收條件 (Acceptance Criteria)
- **AC1 (Delay Time)**：$T_{\text{delay}} = \max(1.0, 10 - 0.25 \times (L - 1))$ 秒。
- **AC2 (Flow Speed)**：$T_{\text{flow}} = \max(250, 1500 - 35 \times (L - 1))$ 毫秒。
- **AC3 (Target Length)**：$N_{\text{target}} = \min(40, \lfloor 10 + 0.85 \times (L - 1) \rfloor)$ 格。
- **AC4 (Obstacles Count)**：$N_{\text{obstacle}} = \min(12, \lfloor 0 + 0.35 \times (L - 1) \rfloor)$ 個。
- **AC5 (Preset Count)**：$L \ge 5$ 時，$N_{\text{fixed}} = \min(6, \lfloor 1 + 0.15 \times (L - 5) \rfloor)$ 個；$L < 5$ 時為 0。

---

## US-04-08：終點錨定與過關長度驗證 (Drain & Target Length Check)

**身份**： 遊戲核心判定系統

> **As a** 遊戲核心判定系統，  
> **I want to** 驗證水流進入終點時的開口方向與累積水管長度，  
> **So that** 決定關卡是成功通關還是因未達標/撞牆而失敗。

### 驗收條件 (Acceptance Criteria)
- **AC1 (Level Complete)**：水流由終點指定合法開口進入，且累積流經格數 $\ge N_{\text{target}}$ 時，判定通關 (Level Complete)。
- **AC2 (Underflow Game Over)**：水流由終點指定合法開口進入，但累積流經格數 $< N_{\text{target}}$ 時，判定未達標失敗 (Underflow Game Over)。
- **AC3 (Spill Game Over)**：水流由終點非開口面撞擊時，判定撞牆溢出 (Spill Game Over)。
- **AC4 (End Target Orientation)**：終點與起點的曼哈頓距離隨等級 $L$ 提升而縮短（逼迫繞長路），高階關卡終點開口設定為背向起點。

---

## US-04-09：36 關主線通關與無限極限循環 (Endless Mode)

**身份**： 核心玩家

> **As a** 核心玩家，  
> **I want to** 在完成 36 關後進入無限循環模式，  
> **So that** 能在極限速度下持續挑戰最高積分紀錄。

### 驗收條件 (Acceptance Criteria)
- **AC1 (36 Level Mainline)**：通過第 36 關時，顯示通關榮譽並進入 Endless Loop。
- **AC2 (Endless Loop Rule)**：當關卡 $L > 36$ 時，地圖排布以 36 為模數循環（$((L - 1) \bmod 36) + 1$），水流推進速度與預備時間依循環輪數進一步等比加壓。

---

## US-04-10：手動加速（Fast Forward）與結算加分 (Fast Forward & Score Multiplier)

**身份**： 熟練玩家

> **As a** 熟練玩家，  
> **I want to** 按下 Fast Forward 按鈕讓水流以最高速前進，  
> **So that** 我能跳過等待時間並賺取剩餘時間的倍率獎勵。

### 驗收條件 (Acceptance Criteria)
- **AC1 (Fast Forward Speed)**：長按或點擊加速按鈕時，水流推進間隔強制縮短至 $50\text{ ms}$。
- **AC2 (Bonus Multiplier)**：加速期間流經的每格水管獲得 $2\times$ 額外倍率積分加成。
