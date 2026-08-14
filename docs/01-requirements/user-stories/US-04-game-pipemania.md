# US-04 水管工人模組 (Pipe Mania Game Module)

## 背景 (Background)
Pipe Mania 是 Arcade Stadium 平台上的第三個益智路徑規劃類子遊戲。本模組規範 $10 \times 7$ 網格操作、13 種水管連通物理、5 格 FIFO 發牌佇列、對齊三大階段 (1~8、9~20、21~36) 的統一加權發牌與精確數值區間、3 支扳手生命與每 50,000 分獎勵加命、開口防死路約束與地圖 100% 保證可解演算協定、起終點線性難度佈局、Fast Forward 快進結算以及 GameOver 爆管判定邏輯。

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
> **I want to** 在盤面上看到「障礙石頭」與「預設固定水管」，且預設水管開口不貼牆死路，  
> **So that** 關卡具備適度的路徑限制並能賺取預設水管的額外獎勵分。

### 驗收條件 (Acceptance Criteria)
- **AC1 (Obstacle Lock)**：點擊「障礙石頭」時，系統忽略輸入且不消耗佇列水管。
- **AC2 (Preset Pipe Types & Weight Consistency)**：預設水管涵蓋直管、彎管、十字管、水庫管與單向管。預設水管種類生成機率與 US-04-06 佇列加權發牌機率完全一致 (100% 共享算式)。
- **AC3 (Preset Port Wall Clamping)**：預設水管（特別是單向管與彎管）開口若緊貼外圍邊界，系統自動旋轉其方向，確保所有進出端口前方的相鄰 1 格皆為可用空白網格，禁止生成死路。
- **AC4 (Preset Score Bonus Formula)**：當水流成功流經預設水管時，結算得分為 **「該水管基礎分 + 200 點 Bonus」**（直管為 $250$ 分，十字管為 $300$ 分/軸，水庫管為 $500$ 分）。

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
- **AC3 (2 Reservoir Tank Pipes)**：水流進入水庫直管後，推進填充耗時精確計算為 $T_{\text{reservoir}} = T_{\text{flow}} \times 4.0$（推進時間為普通管的 4 倍，流速降為 $25\%$）。數值區間為 $6000\text{ms} \to 2080\text{ms}$。完全填滿後提供 $+300$ 分高額獎勵。

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

## US-04-06：三階段統一加權發牌與精確機率區間 (3-Tier Weighted Drop Rates)

**身份**： 遊戲系統

> **As a** 遊戲系統，  
> **I want to** 讓發牌佇列與盤面預放水管共享完全對齊 1~8、9~20、21~36 三大階段的加權發牌算式，  
> **So that** 關卡階梯完全和諧一致，且高階關卡保有 5% 水庫管救命保底率。

### 驗收條件 (Acceptance Criteria)
- **AC1 (Tier 1: Level 1 ~ 8 新手期)**：
  - 單向管機率 $P_{\text{oneway}} = \mathbf{0\%}$
  - 水庫管機率 $P_{\text{reservoir}} = \mathbf{0\%}$
  - 7 種基礎水管總佔比 $\mathbf{100\%}$（每款個別機率為 $\mathbf{14.28\%}$）。
- **AC2 (Tier 2: Level 9 ~ 20 進階期)**：
  - 單向管機率：$P_{\text{oneway}} = 5\% + 0.6\% \times (L - 9)$，數值區間為 **$[5.0\% \sim 11.6\%]$**。
  - 水庫管機率：$P_{\text{reservoir}} = \max(5\%, 12\% - 0.6\% \times (L - 9))$，數值區間為 **$[12.0\% \sim 5.4\%]$**。
  - 7 種基礎水管總佔比恆定為 $\mathbf{83.0\%}$（每款個別機率為 $\mathbf{11.85\%}$）。
- **AC3 (Tier 3: Level 21 ~ 36 高階期)**：
  - 單向管機率：$P_{\text{oneway}} = \min(20\%, 12\% + 0.5\% \times (L - 21))$，數值區間為 **$[12.0\% \sim 19.5\%]$**。
  - 水庫管機率：$P_{\text{reservoir}} = \mathbf{5.0\%}$（保底下限）。
  - 7 種基礎水管總佔比區間為 **$[83.0\% \sim 75.5\%]$**（每款個別機率為 **$[11.85\% \sim 10.78\%]$**）。
- **AC4 (Unified RNG Generation)**：本三階段發牌權重由「側邊 5 格發牌佇列」與「盤面 $N_{\text{fixed}}$ 預設固定水管生成器」**100% 共享共用同一套 `PipeRNG.getRandomPipe(level)` 函式**。

---

## US-04-07：無硬編碼線性難度參數公式與各階段數值區間 (Linear Level Formulas)

**身份**： 遊戲平衡系統

> **As a** 遊戲平衡系統，  
> **I want to** 透過線性函數計算每關的預備時間、水流速度、目標長度與障礙數量，並明確規範各階段之數值區間，  
> **So that** 系統節奏適中且支援 1 至 36 關的平滑推進。

### 驗收條件 (Acceptance Criteria)
- **AC1 (Delay Time $T_{\text{delay}}$)**：
  - 公式：$T_{\text{delay}} = \max(1.0, 10 - 0.25 \times (L - 1))$ 秒。
  - 數值區間：Tier 1 為 **$[10.00\text{s} \sim 8.25\text{s}]$**；Tier 2 為 **$[8.00\text{s} \sim 5.25\text{s}]$**；Tier 3 為 **$[5.00\text{s} \sim 1.25\text{s}]$**。
- **AC2 (Flow Speed $T_{\text{flow}}$)**：
  - 公式：$T_{\text{flow}} = \max(500, 1500 - 28 \times (L - 1))$ 毫秒。
  - 數值區間：Tier 1 為 **$[1500\text{ms} \sim 1304\text{ms}]$**；Tier 2 為 **$[1276\text{ms} \sim 968\text{ms}]$**；Tier 3 為 **$[940\text{ms} \sim 520\text{ms}]$**（封頂 500ms）。
- **AC3 (Target Length $N_{\text{target}}$)**：
  - 公式：$N_{\text{target}} = \min(40, \lfloor 10 + 0.85 \times (L - 1) \rfloor)$ 格。
  - 數值區間：Tier 1 為 **$[10 \sim 15\text{格}]$**；Tier 2 為 **$[16 \sim 26\text{格}]$**；Tier 3 為 **$[27 \sim 40\text{格}]$**（第 36 關封頂 40 格）。
- **AC4 (Obstacles Count $N_{\text{obstacle}}$)**：
  - 公式：$N_{\text{obstacle}} = \min(12, \lfloor 0 + 0.35 \times (L - 1) \rfloor)$ 個。
  - 數值區間：Tier 1 為 **$[0 \sim 2\text{顆}]$**；Tier 2 為 **$[2 \sim 6\text{顆}]$**；Tier 3 為 **$[7 \sim 12\text{顆}]$**（第 36 關封頂 12 顆）。
- **AC5 (Preset Count $N_{\text{fixed}}$)**：
  - 公式：$L \ge 5$ 時為 $\min(6, \lfloor 1 + 0.15 \times (L - 5) \rfloor)$ 個；$L < 5$ 時為 $0$ 個。
  - 數值區間：Tier 1 為 **$[0 \sim 1\text{根}]$**；Tier 2 為 **$[1 \sim 3\text{根}]$**；Tier 3 為 **$[3 \sim 5\text{根}]$**。

---

## US-04-08：起終點開口防死路約束與 100% 可解性驗證 (Port Clamping & Solvability Check)

**身份**： 關卡生成引擎 (Level Generation Engine)

> **As a** 關卡生成引擎，  
> **I want to** 自動約束起終點開口不貼牆死路，並在佈局障礙後以 BFS/DFS 驗證理論最大路徑 $\ge N_{\text{target}}$，  
> **So that** 保證所有隨機關卡 100% 具備可解性，絕不出現死局。

### 驗收條件 (Acceptance Criteria)
- **AC1 (Start & End Port Clamping)**：
  - 起點出水口禁止朝向外圍外牆，且起點出水口正前方相鄰 1 格**絕對禁止放置障礙石頭**。
  - 終點入水口禁止朝向外圍外牆，且終點入水口正前方相鄰 1 格**必須為空白可通行網格**。
- **AC2 (BFS Connectivity Check)**：隨機放置障礙石頭後，使用 BFS 驗證起點與終點必須處於同一個連通分量 (Connected Component)。
- **AC3 (Max Path Capacity Check $\ge N_{\text{target}}$)**：以 DFS 啟發式評估盤面所有可用空白格子，起點至終點的**理論最大無自交路徑長度必須 $\ge N_{\text{target}}$**。
- **AC4 (Auto Retry Loop)**：若生成的地圖未通過 AC1~AC3 驗證，引擎在 5ms 內自動更換隨機種子重新生成（最多重試 10 次；若仍未通過則自動減少 1 顆障礙石頭以保證 100% 可解）。
- **AC5 (3-Tier Level Progression Layout & Distances)**：
  - **$L = 1 \sim 8$ (新手期)**：起終點曼哈頓距離 **$D \ge 9$ 格**（遠距對角），終點開口**正對**起點方向。
  - **$L = 9 \sim 20$ (進階期)**：曼哈頓距離 **$D = [10 \sim 7\text{格}]$**，終點開口**垂直正交 (90°)** 於起點。
  - **$L = 21 \sim 36$ (高階期)**：曼哈頓距離 **$D = [5 \sim 2\text{格}]$**（極近相鄰），終點開口**背向 (180°)** 起點，強迫繞全場大迴圈。

---

## US-04-09：36 關主線通關與無限循環各輪數值區間 (Endless Mode Numerical Reference)

**身份**： 核心玩家

> **As a** 核心玩家，  
> **I want to** 在完成 36 關後進入無限循環模式並查閱各輪次之精確數值區間，  
> **So that** 能在清晰可測量的加壓曲線下持續挑戰極限分數。

### 驗收條件 (Acceptance Criteria)
- **AC1 (36 Level Mainline)**：通過第 36 關時，顯示通關榮譽並進入 Endless Loop。
- **AC2 (Endless Loop Multi-Round Numerical Ranges)**：當關卡 $L > 36$ 時，定義循環輪數 $R = \lfloor (L - 1) / 36 \rfloor$ 與基準關卡 $\text{BaseLevel} = ((L - 1) \bmod 36) + 1$：
  - **第 2 輪 (Loop 1: $L=37\sim 72, R=1$)**：$T_{\text{delay}} = [9.00\text{s} \sim 1.13\text{s}]$, $T_{\text{flow}} = [1350\text{ms} \sim 468\text{ms}]$。
  - **第 3 輪 (Loop 2: $L=73\sim 108, R=2$)**：$T_{\text{delay}} = [8.10\text{s} \sim 1.01\text{s}]$, $T_{\text{flow}} = [1215\text{ms} \sim 421\text{ms}]$。
  - **第 4 輪 (Loop 3: $L=109\sim 144, R=3$)**：$T_{\text{delay}} = [7.29\text{s} \sim 1.00\text{s}]$, $T_{\text{flow}} = [1093\text{ms} \sim 379\text{ms}]$。
  - **第 5 輪+ (極限: $L \ge 145, R \ge 4$)**：$T_{\text{delay}} = 1.00\text{s}$ 保底極限，$T_{\text{flow}} \to 350\text{ms}$ 極限保護牆。

---

## US-04-10：手動加速（Fast Forward）與結算加分 (Fast Forward & Score Multiplier)

**身份**： 熟練玩家

> **As a** 熟練玩家，  
> **I want to** 按下 Fast Forward 按鈕讓水流以最高速前進，  
> **So that** 我能跳過等待時間並賺取剩餘時間的倍率獎勵。

### 驗收條件 (Acceptance Criteria)
- **AC1 (Fast Forward Speed)**：長按或點擊加速按鈕時，水流推進間隔強制縮短至 $50\text{ ms}$。
- **AC2 (Bonus Multiplier)**：加速期間流經的每格水管獲得 $2\times$ 額外倍率積分加成。
- **AC3 (Victory / Underflow / Spill Evaluation)**：水流進入終點且長度 $\ge N_{\text{target}}$ 判定通關；長度 $< N_{\text{target}}$ 扣 1 扳手判定 Underflow；撞牆/錯位扣 1 扳手判定 Spill。
