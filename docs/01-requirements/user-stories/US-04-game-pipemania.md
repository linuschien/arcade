# US-04 水管工人模組 (Pipe Mania Game Module)

## 背景 (Background)
Pipe Mania 是 Arcade Stadium 平台上的第三個益智路徑規劃類子遊戲。本模組規範 $10 \times 7$ 網格操作、13 種水管連通物理、5 格 FIFO 發牌佇列、動態權重發牌、3 支扳手生命與每 50,000 分獎勵加命、無硬編碼線性關卡公式 (1~36 關 + 無限循環波浪節奏)、起終點線性難度佈局、Fast Forward 快進結算以及 GameOver 爆管判定邏輯。

---

## US-04-01：$10 \times 7$ 網格操作與水管放置 (Grid Interaction & Pipe Placement)

**身份**： Pipe Mania 玩家 (Pipe Mania Player)

> **As a** 玩家，  
> **I want to** 在 $10 \times 7$ 的矩形網格上點擊空白格子，  
> **So that** 我能將發牌佇列頂端（第 1 格）的水管放置到指定座標鋪設水路。

### 驗收條件 (Acceptance Criteria)
- **AC1 (Placement)**：點擊空白格子時，將佇列最頂端（第 1 格 / Index 0）水管放置到該座標。
- **AC2 (Queue Shift)**：頂端第 1 格水管彈出 (Pop)，下方第 2~5 格水管依序向上移動遞補，第 5 格依權重生成新水管補齊。
- **AC3 (Replacement & Penalty)**：點擊已放置水管但水流尚未流經的格子時，允許以佇列新水管進行覆蓋替換，並扣除 $-50$ 分覆蓋分數。
- **AC4 (Flooded Lock)**：點擊水流正在流經或已流過的格子時，系統忽略點擊，禁止覆蓋。

---

## US-04-02：障礙物與預設固定水管限制 (Obstacles & Preset Pipes)

**身份**： 關卡設計師 / 玩家

> **As a** 玩家，  
> **I want to** 在盤面上看到「障礙石頭」與「預設固定水管」，  
> **So that** 關卡具備適度的路徑限制並能賺取預設水管的額外獎勵分。

### 驗收條件 (Acceptance Criteria)
- **AC1 (Obstacle Lock)**：點擊「障礙石頭」時，系統忽略輸入且不消耗佇列水管。
- **AC2 (Preset Pipe Types & Weight Consistency)**：預設水管涵蓋直管、彎管、十字管、水庫管與單向管。**預設水管種類之生成機率與 US-04-06 佇列加權發牌機率完全一致 (100% 共享算式)**，開局固定於網格上且不可覆蓋替換。
- **AC3 (Preset Score Bonus Formula)**：當水流成功流經預設水管時，結算得分為 **「該水管基礎分 + 200 點 Bonus」**（直管為 $50+200=250$ 分，十字管為 $100+200=300$ 分/軸，水庫管為 $300+200=500$ 分）。

---

## US-04-03：13 種實體水管元件連通性與物理規則 (13 Pipe Types Physical Rules)

**身份**： 遊戲引擎 (Game Engine)

> **As a** 遊戲引擎，  
> **I want to** 依據 13 種水管類型判定水流的出入方向與精確推進耗時，  
> **So that** 能正確推進水流或判定溢出爆管。

### 驗收條件 (Acceptance Criteria)
- **AC1 (7 Standard Pipes)**：
  - 2 款直管（水平 `─` / 垂直 `│`），推進耗時為基準 $T_{\text{flow}}$。
  - 4 款無方向性雙向彎管（`╝`, `╚`, `╗`, `╔`），推進耗時為基準 $T_{\text{flow}}$。
  - 1 款立體交叉十字管 (`╬`)：水平與垂直兩路各自獨立直行，液體可先後通過兩軸，禁止轉彎。流經獲得 $+100$ 分。
- **AC2 (4 One-Way Pipes)**：僅允許指定單一方向進入（`→`, `←`, `↑`, `↓`），反向或側面灌入立即觸發爆管 (Spill Game Over)。
- **AC3 (2 Reservoir Tank Pipes)**：水流進入水庫直管後，推進填充耗時精確計算為 $T_{\text{reservoir}} = T_{\text{flow}} \times 4.0$（推進時間為普通管的 4 倍，流速降為 $25\%$）。完全填滿後提供 $+300$ 分高額獎勵。

---

## US-04-04：生命值（扳手）、扣命重試與加命 (Wrenches Lives, Retry & Extend)

**身份**： Pipe Mania 玩家

> **As a** 玩家，  
> **I want to** 開局擁有 3 支扳手生命，失誤時扣除 1 支並重試當前關卡，並能透過得分獲得額外扳手，  
> **So that** 遊戲具備容錯空間與持續挑戰動力。

### 驗收條件 (Acceptance Criteria)
- **AC1 (Initial 3 Wrenches)**：單局投幣開局獲得 **3 支扳手 (3 條生命 / Lives)**。
- **AC2 (Spill & Retry Current Level)**：當發生溢出爆管 (Spill) 或長度未達標 (Underflow) 時，扣除 1 支扳手。若剩餘扳手 $> 0$，**立即原關重試 (Retry Current Level)**，重置盤面並重新倒數 $T_{\text{delay}}$ 預備時間。
- **AC3 (Extend Every 50k Pts)**：玩家每累積獲得 **50,000 分**，系統自動獎勵 **+1 支扳手**（上限為 5 支），播放經典獎勵音效。
- **AC4 (Game Over Trigger)**：當扳手 $= 0$ 時，觸發平台 10 秒 Continue 倒數。若倒數結束未續幣，發送 `ArcadeBridge.emit('GAME_OVER', summary)`。

---

## US-04-05：5 格先進先出 (FIFO) 水管發送器 (5-Slot FIFO Queue UI)

**身份**： Pipe Mania 玩家

> **As a** 玩家，  
> **I want to** 在側邊 UI 清楚看到由頂至底排布的 5 個水管，  
> **So that** 我能明確知道當前手牌與未來 4 步的水管順序。

### 驗收條件 (Acceptance Criteria)
- **AC1 (Queue Structure)**：側邊 UI 垂直排布 5 格水管圖示。**最頂端（第 1 格 / Index 0）為當前即將放置的水管**，第 2~4 格為預覽序列，**最底端（第 5 格 / Index 4）為最新生成補入的水管**。
- **AC2 (Pop & Shift Animation)**：每次放置後，第 1 格出牌消失，第 2~5 格平滑向上滑動遞補（$2\to 1, 3\to 2, 4\to 3, 5\to 4$），第 5 格隨機生成新水管。

---

## US-04-06：基於關卡等級的統一加權發牌 (Unified Weighted Drop Rate by Level L)

**身份**： 遊戲系統

> **As a** 遊戲系統，  
> **I want to** 讓發牌佇列與盤面預放水管共享同一套動態機率算式，  
> **So that** 難度隨進度合理提升，架構簡潔一致且水庫管在後期依然具備 5% 保底率。

### 驗收條件 (Acceptance Criteria)
- **AC1 (Level < 4)**：水庫管發牌率為 $0\%$、單向管發牌率為 $0\%$。
- **AC2 (4 <= Level < 7)**：水庫管發牌率 $P_{\text{reservoir}} = \max(5\%, 15\% - 1\% \times (L - 4))$，單向管為 $0\%$。
- **AC3 (Level >= 7)**：
  - 單向管機率隨等級線性遞增：$P_{\text{oneway}} = \min(20\%, 5\% + 1\% \times (L - 7))$。
  - 水庫管機率隨等級線性遞減：$P_{\text{reservoir}} = \max(5\%, 12\% - 0.5\% \times (L - 7))$（保底下限 **5%**）。
  - 其餘權重（$100\% - P_{\text{oneway}} - P_{\text{reservoir}}$）平均分配予 7 種基礎管。
- **AC4 (Unified RNG Generation)**：本發牌權重規則由「側邊 5 格發牌佇列」與「盤面 $N_{\text{fixed}}$ 預設固定水管生成器」**100% 共享共用同一套 `PipeRNG.getRandomPipe(level)` 函式**。

---

## US-04-07：無硬編碼線性難度參數公式 (Linear Level Formulas)

**身份**： 遊戲平衡系統

> **As a** 遊戲平衡系統，  
> **I want to** 透過線性函數計算每關的預備時間、水流速度、目標長度與障礙數量，且速度下限維持在舒適的 500ms，  
> **So that** 系統節奏適中且支援 1 至 36 關的平滑推進。

### 驗收條件 (Acceptance Criteria)
- **AC1 (Delay Time)**：$T_{\text{delay}} = \max(1.0, 10 - 0.25 \times (L - 1))$ 秒。
- **AC2 (Flow Speed)**：$T_{\text{flow}} = \max(500, 1500 - 28 \times (L - 1))$ 毫秒（下限為 500ms，即每秒推進 2 格，節奏適中）。
- **AC3 (Target Length)**：$N_{\text{target}} = \min(40, \lfloor 10 + 0.85 \times (L - 1) \rfloor)$ 格。
- **AC4 (Obstacles Count)**：$N_{\text{obstacle}} = \min(12, \lfloor 0 + 0.35 \times (L - 1) \rfloor)$ 個。
- **AC5 (Preset Count)**：$L \ge 5$ 時，$N_{\text{fixed}} = \min(6, \lfloor 1 + 0.15 \times (L - 5) \rfloor)$ 個；$L < 5$ 時為 0。

---

## US-04-08：起終點線性難度佈局與長度驗收 (Start & End Linear Layout & Drain Check)

**身份**： 遊戲核心判定系統

> **As a** 遊戲核心判定系統，  
> **I want to** 隨等級線性縮短起終點距離並調整終點朝向，並驗證水流進入終點之開口與長度，  
> **So that** 決定關卡是成功通關還是因未達標/撞牆而失敗。

### 驗收條件 (Acceptance Criteria)
- **AC1 (Level Complete)**：水流由終點指定合法開口進入，且累積流經格數 $\ge N_{\text{target}}$ 時，判定通關 (Level Complete)。
- **AC2 (Underflow Game Over)**：水流由終點指定合法開口進入，但累積流經格數 $< N_{\text{target}}$ 時，判定未達標失敗 (Underflow Game Over)。
- **AC3 (Spill Game Over)**：水流由終點非開口面撞擊時，判定撞牆溢出 (Spill Game Over)。
- **AC4 (Linear Start & End Layout by Level)**：
  - **$L = 1 \sim 8$ (新手)**：起終點曼哈頓距離 $D \ge 9$，終點開口**正對**起點方向。
  - **$L = 9 \sim 20$ (進階)**：曼哈頓距離 $D = \max(5, 10 - \lfloor 0.3 \times (L - 8) \rfloor)$，終點開口**垂直正交**於起點。
  - **$L = 21 \sim 36$ (高階)**：曼哈頓距離 $D = \max(2, 5 - \lfloor 0.2 \times (L - 20) \rfloor)$（距離僅 2~5 格），終點開口**背向**起點，強迫繞全場大迴圈。

---

## US-04-09：36 關主線通關與無限循環波浪節奏 (Endless Mode & Wave Pacing)

**身份**： 核心玩家

> **As a** 核心玩家，  
> **I want to** 在完成 36 關後進入無限循環模式並體驗經典街機的周回波浪節奏，  
> **So that** 在第 37 關獲得適度喘息並在後續輪次中挑戰更高極限。

### 驗收條件 (Acceptance Criteria)
- **AC1 (36 Level Mainline)**：通過第 36 關時，顯示通關榮譽並進入 Endless Loop。
- **AC2 (Wave Pacing in Loop)**：當關卡 $L > 36$ 時，定義循環輪數 $R = \lfloor (L - 1) / 36 \rfloor$ 與基準關卡 $\text{BaseLevel} = ((L - 1) \bmod 36) + 1$：
  - 地圖佈局按 $\text{BaseLevel}$ 生成。
  - **波浪節奏 (Wave Pacing)**：進入第 37 關時（即第 2 輪的 Level 1 地圖），流速為 $1500 \times 0.90 = 1350\text{ ms}$。流速適度放緩，給予玩家通關後的新一輪節奏起伏。
  - 起噴延遲公式：$T_{\text{delay}}(L) = \max(1.0, T_{\text{delay}}(\text{BaseLevel}) \times 0.90^R)$。
  - 水流速度公式：$T_{\text{flow}}(L) = \max(350, T_{\text{flow}}(\text{BaseLevel}) \times 0.90^R)$（極限保底 350ms）。

---

## US-04-10：手動加速（Fast Forward）與結算加分 (Fast Forward & Score Multiplier)

**身份**： 熟練玩家

> **As a** 熟練玩家，  
> **I want to** 按下 Fast Forward 按鈕讓水流以最高速前進，  
> **So that** 我能跳過等待時間並賺取剩餘時間的倍率獎勵。

### 驗收條件 (Acceptance Criteria)
- **AC1 (Fast Forward Speed)**：長按或點擊加速按鈕時，水流推進間隔強制縮短至 $50\text{ ms}$。
- **AC2 (Bonus Multiplier)**：加速期間流經的每格水管獲得 $2\times$ 額外倍率積分加成。
