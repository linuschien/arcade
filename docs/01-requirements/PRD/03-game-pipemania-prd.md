# PRD-03: 水管工人 (Pipe Mania Game PRD)

## 1. 遊戲願景與簡介 (Overview)
Pipe Mania 是一部經典的網格路徑規劃益智遊戲。玩家在 $10 \times 7$ 的遊戲網格上，利用側邊 5 格 FIFO 佇列產生的水管組件，在化學液體（Flooz）由起點噴發前鋪設一條連續未中斷的管道，使其流經指定長度並安全進入終點排水口。

---

## 2. 核心遊戲機制 (Core Game Mechanics)

### 2.1 網格與元件規格
- **地圖網格**：$10 \times 7$ 離散網格（寬 10 格: $X \in [0, 9]$，高 7 格: $Y \in [0, 6]$）。
- **13 種水管元件類型 (13 Pipe Types)**：
  1. **7 種基礎管 (Standard Pipes)**：
     - 水平直管 (`─`)、垂直直管 (`│`)
     - 4 款雙向彎管：`╝` (右上)、`╚` (左上)、`╗` (右下)、`╔` (左下)
     - 1 款立體交叉管 (`╬` Cross Pipe)：水平與垂直兩路獨立直行，液體可先後通過兩軸，禁止轉彎。
  2. **4 種單向直管 (One-Way Pipes)**：
     - 僅允許指定單一方向進入（`→`, `←`, `↑`, `↓`）。反向或側邊灌入立即觸發爆管 (Spill Game Over)。
  3. **2 種水庫直管 (Reservoir Tanks)**：
     - 水流進入水庫管後，填充耗時精確為當前普通直管的 **6.0 倍**（即推進時間 $T_{\text{reservoir}} = T_{\text{flow}} \times 6.0$，流速降為 $16.7\%$），提供顯著的蓄水緩衝時間。完全填滿後提供 $+300$ 分高額獎勵。
- **障礙與預設元件**：
  - **障礙石頭 (Obstacles)**：不可通過且不可覆蓋替換。
  - **預設固定水管 (Preset Pipes)**：盤面上以螺栓固定、不可覆蓋的金色金屬水管。**預設水管之種類生成機率與發牌佇列完全一致，共享同套全域統一線性加權發牌算式 (Unified Linear Drop Rate)**。流經獲得 **「該水管基礎得分 + 200 點 Bonus」**（例：直管 $250$ 分，十字管 $300$ 分/軸，水庫管 $500$ 分）。

### 2.2 跨裝置輸入與網格游標 (Multi-Device Input & Grid Reticle)
- **多裝置控制整合**：
  - **滑鼠 / 觸控**：直接點擊目標網格座標 $(X, Y)$ 放置水管；點擊 UI 頂部「Fast Forward」按鈕加速。
  - **鍵盤 / 街機搖桿 (Arcade Stick & Gamepad)**：
    - 盤面上渲染高亮 **「網格游標 (Grid Cursor / Reticle)」**。
    - **方向鍵 / D-Pad / 類比搖桿**：在 $10 \times 7$ 網格範圍內移動游標座標 $(X, Y)$。
    - **`Space` / `Enter` / `KeyJ` / `KeyZ` / Gamepad `Button A` (ACTION_1)**：將手牌水管放置於當前游標所在格子。
    - **`Shift` / `F` / `KeyX` / `KeyK` / Gamepad `Button B` (ACTION_2)**：按住觸發 Fast Forward 手動加速。

### 2.3 平滑水流填充遮罩動畫 (Continuous Fill Mask Animation)
- **水流視覺渲染**：
  - 水流在每格水管中的推進採 **$0\% \to 100\%$ 平滑連續填充遮罩 (Continuous Fill Mask)** 呈現，絕非跳格突變。
  - **普通水管推進動畫**：依當前關卡 $T_{\text{flow}}$ 毫秒平滑由入水口延伸至出水口。
  - **水庫管推進動畫**：水流進入水庫管後，以 $T_{\text{reservoir}} = T_{\text{flow}} \times 6.0$ 毫秒慢速注入擴張廣口水槽，水體斷面擴展充滿水庫，讓玩家清晰目測剩餘蓄水時間。

### 2.4 音樂與音效規格 (Audio & Sound Effects Specification)
遊戲音效完全整合至 Arcade Stadium 全域音量與靜音控制器（`ArcadeBridge` / `SoundEngine`），包含以下音樂與音效：

| 聲音資產代碼 (Sound Asset ID) | 觸發時機 (Trigger Event) | 聲效描述與風格 | 播放類型 |
|---|---|---|---|
| **`BGM_GAMEPLAY`** | 進入關卡開始遊玩 | 輕快、富有節奏感的 8-bit/16-bit 街機益智電子音樂 | 背景音樂 Loop |
| **`SFX_STAGE_START`** | 關卡開場 1.5 秒提示期 | 經典街機關卡開始開場號角聲 (Opening Fanfare) | 單次播放 |
| **`SFX_COUNTDOWN_TICK`** | 起噴前 5 秒倒數 | 緊湊、清脆的倒數滴答警示聲 (Warning Beep) | 每秒 Tick |
| **`SFX_FLOW_BUBBLE`** | 液體開始在管道中流動 | 咕嚕咕嚕的液體管道冒泡聲 (Bubbling Water Loop) | 水流期間 Loop |
| **`SFX_PIPE_PLACE`** | 成功在空格放置水管 | 乾淨清脆的金屬水管卡榫裝配聲 (Click-Clack) | 單次播放 |
| **`SFX_PIPE_REPLACE`** | 覆蓋已放置水管 | 水管拆卸敲碎與重新固定的複合音效 (Crunch-Snap) | 單次播放 |
| **`SFX_RESERVOIR_FILL`** | 水流進入水庫管慢速蓄水 | 沉穩、厚重的大容量注水蓄水聲 (Tank Filling) | 蓄水期間 Loop |
| **`SFX_FAST_FORWARD`** | 觸發 Fast Forward 加速 | 高頻機械增壓音與急促水流聲 (Turbo Surge) | 加速期間 Loop |
| **`SFX_STAGE_CLEAR`** | 成功將水流引導進終點 | 歡快激昂的街機勝利通關號角聲 (Victory Fanfare) | 單次播放 |
| **`SFX_SPILL_BURST`** | 管道未接通或水流溢出 | 水管爆裂、高壓液體噴濺與警報聲 (Burst & Splash) | 單次播放 |
| **`SFX_EXTEND_LIFE`** | 累積達到加命門檻分數 | 閃爍夢幻的 1UP 加命獎勵音 (Chime Arpeggio) | 單次播放 |
| **`SFX_GAME_OVER`** | 扳手生命耗盡結算 | 低沈沉重的街機遊戲結束音效 (Game Over Jingle) | 單次播放 |

### 2.5 生命值（扳手 Wrenches）與加命機制 (Lives & Extends)
- **初始生命值**：單次投幣 (1 Credit) 獲得 **3 支扳手 (3 條生命 / Lives)**。
- **扣命與關卡重試**：
  - 當發生「爆管溢出 (Spill)」或「長度未達標 (Underflow)」時，扣除 1 支扳手，播放 `SFX_SPILL_BURST`。
  - 若剩餘扳手 $> 0$，玩家**原關重試 (Retry Current Level)**，重置盤面並重新發送開局 $T_{\text{delay}}$ 預備時間。
  - 若扳手 $= 0$，進入平台 10 秒 Continue 倒數。
- **獎勵加命 (Extend Mechanism)**：
  - 玩家每累積獲得 **50,000 分**，系統播放 `SFX_EXTEND_LIFE` 並自動獎勵 **+1 支扳手 (Extend)**。
  - 扳手上限為 **5 支**。

### 2.6 5 格 FIFO 水管發牌佇列 (5-Slot FIFO Pipe Queue)
- **UI 佇列結構明確定義**：
  - **第 1 格 (最頂端 / Index 0)**：**「當前即將放置的水管 (Active Pipe)」**。玩家點擊盤面時，此水管被放置至網格。
  - **第 2 ~ 4 格**：即將依序遞補的後續水管預覽。
  - **第 5 格 (最底端 / Index 4)**：**「最新生成的水管 (Newest Incoming Pipe)」**。
- **放置遞移邏輯**：放置水管後，第 1 格彈出 (Pop)，第 2~5 格依序向上平滑移動（$2\to 1, 3\to 2, 4\to 3, 5\to 4$），第 5 格依權重動態生成新水管補齊。

### 2.7 開口防死路約束與地圖保證可解性演算協定 (Clamping & Solvability Protocol)
1. **開口朝向防死路約束 (Port Clamping Rules)**：
   - **起點防死路**：若起點貼近邊界（如 $X=0$），其出水口禁止朝向外牆；起點出水口正前方相鄰第 1 格**絕對禁止放置障礙石頭或不可進水元件**。
   - **終點防死路**：終點入水口正前方相鄰第 1 格**必須為空白可通行網格**（禁止緊貼外牆或障礙物）。
   - **預設固定水管防死路**：預設單向管或彎管之開口若貼近邊界，必須自動轉向確保進出端口皆至少有 1 格可用空白緩衝。
2. **連通性檢驗 (BFS Connectivity Check)**：
   - 隨機佈局障礙石頭後，以廣度優先搜尋 (BFS) 檢驗起點與終點是否處於同一個連通分量 (Connected Component)，禁止形成完全隔離的孤島死局。
3. **最長路徑容量驗證 (Max Potential Path $\ge N_{\text{target}}$)**：
   - 以深度優先 (DFS) 啟發式評估盤面所有可用空白格子，起點至終點之**理論最大無自交路徑長度必須 $\ge N_{\text{target}}$**。
   - **自動重試機制 (Generation Retry Loop)**：若生成的隨機種子未通過上述檢驗，系統在 5ms 內重新取 Seed 生成（最多重試 10 次；若仍未通過則自動減少 1 顆障礙石頭以保證 100% 可解）。

---

## 3. 全域單一線性函數與數值區間對照表 (Unified Linear Level Formulas)

全系統採用 **100% 純線性數學函數（搭配標準 $\max / \min$ 邊界約束，完全消除 `if-else` 分歧）**，支援 1 至 36 關主線關卡與無限循環模式：

### 3.1 全域單一線性公式表 (Unified Formula Definitions)

| 關卡參數項目 | 單一線性數學公式 (Pure Linear Clamped Formula) | 1~36 關整體數值區間 | 備註說明 |
|---|---|---|---|
| **起噴預備時間 $T_{\text{delay}}$** | $T_{\text{delay}}(L) = \max(6.0, 20.0 - 0.40 \times (L - 1))$ | **$20.00\text{s} \sim 6.00\text{s}$** | 秒 (開局至液體流動時間，保留終點拓撲規劃期) |
| **每格流速推進間隔 $T_{\text{flow}}$** | $T_{\text{flow}}(L) = \max(800, 2500 - 50 \times (L - 1))$ | **$2500\text{ms} \sim 800\text{ms}$** | 毫秒/格 (開局 2.5s，高難度 0.8s) |
| **水庫管推進耗時 $T_{\text{reservoir}}$** | $T_{\text{reservoir}}(L) = T_{\text{flow}}(L) \times 6.0$ | **$15000\text{ms} \sim 4800\text{ms}$** | 毫秒/格 (6倍時間，16.7%流速，戰略救場緩衝) |
| **通關目標長度 $N_{\text{target}}$** | $N_{\text{target}}(L) = \min(30, \lfloor 10 + 0.58 \times (L - 1) \rfloor)$ | **$10 \sim 30$ 格** | 進入終點前最少須連通格數 (佔全盤空間 53%) |
| **地圖障礙石頭數 $N_{\text{obstacle}}$** | $N_{\text{obstacle}}(L) = \min(6, \lfloor 0.18 \times (L - 1) \rfloor)$ | **$0 \sim 6$ 顆** | 盤面隨機障礙石頭數量 (上限 6 顆，避免形成死角) |
| **預設固定水管數 $N_{\text{fixed}}$** | $N_{\text{fixed}}(L) = \min(6, \max(0, \lfloor 0.19 \times (L - 3) \rfloor))$ | **$0 \sim 6$ 根** | $L=1\sim 8$為0，$L\ge 9$自然遞增，為高階玩家提供額外加分中繼站 |
| **起終點曼哈頓距離 $D$** | $D_{\text{manhattan}}(L) = \max(2, \lfloor 6 - 0.11 \times (L - 1) \rfloor)$ | **$6 \sim 2$ 格** | 開局 6 格 (留足 S 型繞路空間)，漸進至 2 格 (緊密對峙) |
| **單向水管發牌率 $P_{\text{oneway}}$** | $P_{\text{oneway}}(L) = \min(20\%, \max(0\%, 0.72\% \times (L - 8)))$ | **$0\% \sim 20.0\%$** | $L\le 8$自然為0%，$L>8$線性遞增 |
| **水庫水管發牌率 $P_{\text{reservoir}}$** | $P_{\text{reservoir}}(L) = \max(5\%, 15\% - 0.30\% \times (L - 1))$ | **$15.0\% \sim 5.0\%$** | 由開局 15% 漸進降至 5% 救命保底 |
| **7 種基礎水管總發牌率** | $P_{\text{standard}}(L) = 100\% - P_{\text{oneway}}(L) - P_{\text{reservoir}}(L)$ | **$85.0\% \sim 75.0\%$** | 7 種基礎管平均瓜分 (各 12.1%~10.7%) |

---

### 3.2 典型關卡數值採樣驗證表 (Sample Level Verification Table)

| Level ($L$) | $T_{\text{delay}}$ | $T_{\text{flow}}$ | $T_{\text{reservoir}}$ | $N_{\text{target}}$ | $N_{\text{obstacle}}$ | $N_{\text{fixed}}$ | 距離 $D$ | 終點朝向 | $P_{\text{oneway}}$ | $P_{\text{reservoir}}$ | $P_{\text{standard}}$ |
|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **L1** | 20.00s | 2500ms | 15000ms | 10 格 | 0 顆 | 0 根 | 6 格 | 正對起點 | **0.0%** | **15.0%** | **85.0%** (各12.1%) |
| **L5** | 18.40s | 2300ms | 13800ms | 12 格 | 0 顆 | 0 根 | 5 格 | 正對起點 | **0.0%** | **13.8%** | **86.2%** |
| **L8** | 17.20s | 2150ms | 12900ms | 14 格 | 1 顆 | 0 根 | 5 格 | 正對起點 | **0.0%** | **12.9%** | **87.1%** |
| **L9** | 16.80s | 2100ms | 12600ms | 14 格 | 1 顆 | 1 根 | 5 格 | 垂直正交 | **0.7%** | **12.6%** | **86.7%** |
| **L15** | 14.40s | 1800ms | 10800ms | 18 格 | 2 顆 | 2 根 | 4 格 | 垂直正交 | **5.0%** | **10.8%** | **84.2%** |
| **L20** | 12.40s | 1550ms | 9300ms | 21 格 | 3 顆 | 3 根 | 3 格 | 垂直正交 | **8.6%** | **9.3%** | **82.1%** |
| **L21** | 12.00s | 1500ms | 9000ms | 21 格 | 3 顆 | 3 根 | 3 格 | 背向起點 | **9.4%** | **9.0%** | **81.6%** |
| **L28** | 9.20s | 1150ms | 6900ms | 25 格 | 4 顆 | 4 根 | 3 格 | 背向起點 | **14.4%** | **6.9%** | **78.7%** |
| **L36** | 6.00s | 800ms | 4800ms | 30 格 | 6 顆 | 6 根 | 2 格 | 背向起點 | **20.0%** | **5.0%** | **75.0%** (各10.7%) |

---

### 3.3 無限循環模式各輪次數值區間 (Endless Loop: Level > 36)

當關卡 $L > 36$ 時，定義循環輪數 $R = \lfloor (L - 1) / 36 \rfloor$ 與基準關卡 $\text{BaseLevel} = ((L - 1) \bmod 36) + 1$：

| 循環輪次 (Loop $R$) | 關卡等級範圍 ($L$) | $T_{\text{delay}}$ 範圍區間 | $T_{\text{flow}}$ 範圍區間 | $T_{\text{reservoir}}$ 範圍區間 | 備註說明 |
|---|---|---|---|---|---|
| **第 1 輪 (主線)** ($R=0$) | $L = 1 \sim 36$ | **20.00s ~ 6.00s** | **2500ms ~ 800ms** | **15000ms ~ 4800ms** | 針對指定終點制打造的 36 關主線 |
| **第 2 輪 (Loop 1)** ($R=1$) | $L = 37 \sim 72$ | **18.00s ~ 5.40s** | **2250ms ~ 720ms** | **13500ms ~ 4320ms** | 起速重置為 2250ms (Wave Reset 喘息)，終速 720ms |
| **第 3 輪 (Loop 2)** ($R=2$) | $L = 73 \sim 108$ | **16.20s ~ 4.86s** | **2025ms ~ 648ms** | **12150ms ~ 3888ms** | 起速 2025ms，終速 648ms |
| **第 4 輪 (Loop 3)** ($R=3$) | $L = 109 \sim 144$ | **14.58s ~ 4.37s** | **1823ms ~ 583ms** | **10935ms ~ 3499ms** | 起速 1823ms，終速 583ms |
| **第 5 輪+ (極限)** ($R \ge 4$) | $L \ge 145$ | **4.00s** (保底極限) | **$T_{\text{flow}} \to 500\text{ms}$** (保底極限) | **3000ms** (保底極限) | 達到極限保護牆 |

---

## 4. 得分與結算機制 (Scoring & Victory Evaluation)
- **基礎水管填充分**：普通水管 $+50$ 分；十字管 $+100$ 分；水庫管 $+300$ 分。
- **預設固定水管加成**：流經預設水管獲得 **「基礎分 + 200」** 額外獎勵。
- **水管覆蓋替換扣分**：覆蓋未流經的水管扣除 $-50$ 分。
- **Fast Forward 快進加分**：水流推進間隔強制縮短至 $50\text{ ms}$，加速期間每格水管獲得 $2\times$ 額外倍率積分加成。
- **過關結算獎勵**：超過目標長度 $N_{\text{target}}$ 的額外水管，每格獎勵 $+100$ 分。
- **勝負判定**：
  - **通關 (Level Complete)**：水流由終點指定合法開口進入，且累積流經格數 $\ge N_{\text{target}}$，播放 `SFX_LEVEL_CLEAR` 與 `BGM_VICTORY`。
  - **未達標失敗 (Underflow)**：水流進入終點開口，但累積格數 $< N_{\text{target}}$，扣除 1 支扳手。
  - **溢出爆管失敗 (Spill)**：水流撞擊邊界、錯位或反向單向管，扣除 1 支扳手，播放 `SFX_SPILL_BURST`。
  - **ArcadeBridge 廣播**：扳手歸零或放棄續關時，播放 `BGM_GAMEOVER` 並發送 `ArcadeBridge.emit('GAME_OVER', summary)`。
