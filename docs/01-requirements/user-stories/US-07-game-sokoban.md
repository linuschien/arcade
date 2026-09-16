# US-07 街機倉庫番模組 (Sokoban 50 Game Module)

## 背景 (Background)

《街機倉庫番（Sokoban 50）》是 Arcade Stadium 平台上的第六款經典街機遊戲。本模組針對 16:9 街機寬螢幕（$1280 \times 720\text{ px}$）量身打造，結合三欄式框體美學、4 層沙盤渲染管線（Floating Diorama Pipeline）、推箱粒度 Undo、瞬間快照還原、嚴格正交直角死鎖判定、長按棄局、軟性長考計時器、防刷分通關結算、10 萬分固定 1UP 獎命、兩位數關卡分數隱寫術，以及四大世界 50 關線性推進。

---

## US-07-01：進度記憶二擇一開局 (Binary Start Selection & Progress Persistence)

**身份**： 街機玩家 (Arcade Player)

> **As a** 玩家，  
> **I want to** 投幣後在「從第 1 關重新開始」或「從歷史最高通關關卡 + 1 繼續」之間二擇一，  
> **So that** 我能跳過已通關的早期章節，直接挑戰目標關卡，同時保有快速乾脆的街機開局體驗。

### 驗收條件 (Acceptance Criteria)

- **AC1 (進度讀取)**：系統從本地持久化儲存（LocalStorage）讀取鍵值 `sokoban_max_cleared_stage`（若無記錄則預設為 `0`）。
- **AC2 (二擇一開局選單)**：
  - 若 `maxClearedStage === 0`：開局僅提供 `NEW GAME (STAGE 01)` 選項（或直接進入第 1 關）。
  - 若 `maxClearedStage > 0`：開局畫面呈現極簡二擇一選單：
    1. `NEW GAME (STAGE 01)`
    2. `CONTINUE (STAGE [min(maxClearedStage + 1, 50)])`
  - 系統嚴格不支援任意關卡自由選取，亦不需要渲染關卡縮圖或目標箱數，保持純粹街機風格。
- **AC3 (開局狀態重置)**：玩家選定任一選項進入遊戲時：
  - 初始生命值重置為 $\text{Lives} \leftarrow 3$。
  - 當前累積純得分重置為 $\text{RawScore} \leftarrow 0$。
  - 當局最高通關記錄重置為 $\text{lastClearedStage} \leftarrow 0$。
- **AC4 (鍵盤操作與智慧聚焦)**：
  - 支援實體方向鍵 `[↑↓]` 切換選項，`[Enter]` 或 `[Space]` 鍵確認開局。
  - **游標智慧聚焦 (Plan B)**：當 `maxClearedStage > 0` 時，選單順序維持標準之 `NEW GAME`（第一項）與 `CONTINUE`（第二項），但游標預設智慧聚焦於第二項 `CONTINUE`，兼顧標準選單排版認知與街機快速投幣接關便利性。

---

## US-07-02：左側儀表板資訊渲染 (Left Flank HUD Rendering)

**身份**： 街機玩家 (Arcade Player)

> **As a** 玩家，  
> **I want to** 在畫面左側儀表板隨時掌握當前世界、關卡進度、倒數狀態與 Undo 配額，  
> **So that** 我能在不干擾解謎視野的情況下隨時評估剩餘資源與戰術。

### 驗收條件 (Acceptance Criteria)

- **AC1 (位置與外觀規格)**：左側 HUD 錨定於 $(X: 0, Y: 30)$，尺寸固定為 $200 \times 660\text{ px}$，具備 Alpha 85% 半透明暗黑底板與微光邊框。
- **AC2 (世界主題徽章)**：頂部展示當前世界代號與主題名稱（例如：`WORLD 02: STEEL WORKS`）。
- **AC3 (關卡計數器)**：展示當前關卡序號與總關卡數，格式為 `STAGE SS / 50`（例如 `STAGE 18 / 50`）。
- **AC4 (軟性倒數計時器渲染)**：
  - 數字顯示格式為分秒 `MM:SS`（例如 `02:45`）。
  - 色彩變換規則：
    - 剩餘時間 $> 30\text{s}$：呈現霓虹綠（`#00E676`）。
    - 剩餘時間 $\le 30\text{s}$：呈現警示黃（`#FFD600`）。
    - 倒數歸零超時：呈現紅色高頻閃爍（`#FF1744`），標籤切換為 `00:00 [TIME OUT]`。
  - 下方配置長度 $160\text{ px}$ 進度條，寬度比例為 $\max(0, T_{\text{soft}} - t_{\text{elapsed}}) / T_{\text{soft}}$。
- **AC5 (Undo 配額矩陣)**：
  - 以圓形點陣呈現配額，可用配額顯示為青綠色實心圓燈，已消耗配額顯示為暗灰色空心圓圈。
  - 底部標籤文字即時顯示 `REMAINING: u / U_quota`。

---

## US-07-03：右側儀表板與純鍵盤指引 (Right Flank HUD & Pure Keyboard Guide)

**身份**： 街機玩家 (Arcade Player)

> **As a** 玩家，  
> **I want to** 在畫面右側查看得分、命數、1UP 進度與常駐的純鍵盤按鍵指引，  
> **So that** 我能掌握命數資本與得分，且不需要記憶複雜的街機鍵位。

### 驗收條件 (Acceptance Criteria)

- **AC1 (位置與外觀規格)**：右側 HUD 錨定於 $(X: 1080, Y: 30)$，尺寸固定為 $200 \times 660\text{ px}$，具備 Alpha 85% 半透明暗黑底板。
- **AC2 (純得分儀表)**：標題為 `SCORE`，數值為 8 位數補零（例如 `0,420,100`），文字採用亮金色（`#FFD700`），字級 $24\text{ px}$。
- **AC3 (生命數顯示)**：顯示工人頭像圖示與當前剩餘命數數字（例如：`▲ ▲ ▲ (3)`）。
- **AC4 (1UP 獎命進度條)**：顯示距離下一個 $100,000$ 分門檻的累計進度條，滿額瞬間觸發 1UP 動畫。
- **AC5 (常駐純鍵盤指南)**：底部固定展示實體按鍵指南卡槽，嚴格對應純鍵盤鍵位：
  - `[↑↓←→] MOVE`
  - `[Z] UNDO`
  - `[HOLD R] GIVE UP (-1♥)`（字體呈警示亮紅色）。

---

## US-07-04：中央 4:3 沙盤自適應與主題背景切換 (Center Playfield Diorama & 4-Layer Rendering Pipeline)

**身份**： 遊戲渲染引擎 (Game Render Engine)

> **As a** 渲染引擎，  
> **I want to** 將迷宮在中央 4:3 區域內動態等比居中縮放，並以 4 層沙盤渲染管線平鋪專屬底圖與陰影暗角，  
> **So that** 畫面完全消除死黑邊，突顯各主題世界的微縮沙盤立體氛圍。

### 驗收條件 (Acceptance Criteria)

- **AC1 (中央可玩視窗與無縫貼合佈局)**：
  - 可玩視窗固定於 $(X: 200, Y: 30)$，尺寸為 $880 \times 660\text{ px}$（嚴格 4:3 比例）。
  - **垂直對稱置中**：高度 $660\text{ px}$ 配合頂部 $Y: 30$ 與底部 $30\text{ px}$ 外邊距（$30 + 660 + 30 = 720\text{ px}$）。
  - **水平無縫貼合**：左側 HUD ($0 \sim 200$) ＋ 中央棋盤 ($200 \sim 1080$) ＋ 右側 HUD ($1080 \sim 1280$) 剛好填滿 $1280\text{ px}$，消除任何欄間死黑邊隙。
- **AC2 (圖塊尺寸動態換算)**：
  依據當前關卡網格寬高計算等比正方形圖塊尺寸：
  $$\text{TileSize} = \min\left( \left\lfloor \frac{880}{W_{\text{grid}}} \right\rfloor, \; \left\lfloor \frac{660}{H_{\text{grid}}} \right\rfloor \right)$$
  圖塊尺寸範圍限制於 $44\text{ px} \sim 80\text{ px}$。
- **AC3 (絕對居中偏移量計算)**：
  $$\text{OriginX} = 200 + \left\lfloor \frac{880 - (W_{\text{grid}} \cdot \text{TileSize})}{2} \right\rfloor, \quad \text{OriginY} = 30 + \left\lfloor \frac{660 - (H_{\text{grid}} \cdot \text{TileSize})}{2} \right\rfloor$$
- **AC4 (Layer 0 環境底層)**：
  在 $880 \times 660\text{ px}$ 區域內無縫平鋪（TileSprite）當前世界專屬暗色紋理（明度調降 50%）：
  - World 1 (Cargo Depot)：暗色無縫木地板紋理。
  - World 2 (Steel Works)：冷軋鋼菱形防滑網紋。
  - World 3 (Cyber Vault)：印刷電路板暗紫色走線紋理。
  - World 4 (Mega Terminal)：粗顆粒深灰瀝青地坪紋理。
- **AC5 (Layer 1 外牆投影)**：沿迷宮最外層牆壁（`#`）向右下方 $(+8\text{ px}, +12\text{ px})$ 繪製帶羽化之深黑陰影（Alpha 45%），形成浮動沙盤懸浮立體感。
- **AC6 (Layer 2 迷宮主體)**：於計算之 Origin 座標精確繪製地板、牆壁、目標點、箱子與工人角色。
- **AC7 (Layer 3 徑向暗角)**：覆蓋中心透明、邊緣漸變為暗黑之 Vignette Mask，聚焦中央棋盤。

---

## US-07-05：推箱粒度的 Undo 額度機制與瞬間還原 (Push-Granularity Undo & Instant Snapshot Restore)

**身份**： 街機玩家 (Arcade Player)

> **As a** 玩家，  
> **I want to** 按下 `[Z]` 鍵瞬間回溯至推箱前一刻，且純走廊移動不消耗 Undo 額度，  
> **So that** 容錯資源專注保護關鍵的幾何推箱決策，且回溯過程乾脆俐落。

### 驗收條件 (Acceptance Criteria)

- **AC1 (額度初始化與參數定義)**：
  關卡載入時計算該關可用總配額 $U_{\text{quota}}$：
  $$U_{\text{quota}}(S, B, W) = \min\left( U_{\max}(W), \; \left\lfloor U_{\text{base}}(W) + B \cdot K_u(W) + 0.15 \cdot (S - S_{\text{start}}(W)) \right\rfloor \right)$$
  初始化剩餘額度 $u_{\text{remaining}} \leftarrow U_{\text{quota}}$。
  
  **參數符號定義：**
  * $S \in [1, 50]$：當前關卡序號。
  * $W \in [1, 4]$：當前所屬主題世界代號。
  * $B$：當前關卡需歸位之目標箱子總數。
  * $S_{\text{start}}(W)$：世界起始關卡序號（W1: 1, W2: 6, W3: 21, W4: 41）。
  * $U_{\text{base}}(W)$：世界基準保底額度（W1: 2, W2: 4, W3: 6, W4: 8）。
  * $K_u(W)$：單箱 Undo 加權係數（W1: 0.6, W2: 0.6, W3: 0.5, W4: 0.5）。
  * $0.15 \cdot (S - S_{\text{start}}(W))$：世界內每深入推進之微幅補償。
  * $U_{\max}(W)$：各世界配額上限（W1: 6, W2: 12, W3: 14, W4: 18）。

- **AC2 (純走位不扣額度與推箱快照封裝)**：
  - 工人在通道內純走動位移時，不扣除 $u_{\text{remaining}}$，不入推箱歷史棧。
  - 當工人成功推動箱子（箱子座標產生改變）瞬間，系統將推箱前一刻的工人座標與全盤箱子座標封裝為單一快照（Snapshot）推入棧頂。
- **AC3 (瞬間還原 Instant Snapshot Restore)**：
  - 玩家按下鍵盤 `[Z]` 鍵時：
    - 若 $u_{\text{remaining}} > 0$：彈出棧頂快照，**瞬間**將盤面所有箱子與工人座標恢復至推箱前一刻（不播放逐步倒播動畫），$u_{\text{remaining}} \leftarrow u_{\text{remaining}} - 1$，左側 HUD 圓燈同步熄滅一顆，播放 `SFX_UNDO`。
    - 若 $u_{\text{remaining}} = 0$：禁止回溯，左側 HUD 配額儀表紅色閃爍並播放警示蜂鳴。

---

## US-07-06：嚴格正交直角死鎖警報與強制處決 (Strict Orthogonal Corner Trap & Auto-Resign)

**身份**： 遊戲規則引擎 (Game Rules Engine)

> **As a** 規則引擎，  
> **I want to** 在箱子被推入正交直角死角時主動發出警報；若玩家已無 Undo 額度則延遲處決扣命重置，  
> **So that** 玩家能及時發現推箱失誤，並在確定無解時避免無謂空耗時間。

### 驗收條件 (Acceptance Criteria)

- **AC1 (嚴格正交直角死角判定 Corner Trap)**：
  當盤面上任一不在目標點（`.`）上的箱子，其兩相鄰垂直側（「上與左」、「上與右」、「下與左」、「下與右」）皆為不可穿越障礙物（牆壁 `#` 或已被判定為死鎖之卡死箱子）時，立即判定盤面進入死鎖狀態。不擴展複雜長牆或 2x2 死鎖，確保 100% 零誤判。
- **AC2 (有額度警報演出 $u_{\text{remaining}} > 0$)**：
  - 中央可玩視窗頂部滑出橙色警報橫幅：`⚠ DEADLOCK DETECTED! PRESS [Z] TO UNDO`。
  - 觸發死鎖之箱子外框以黃光脈衝呼吸閃爍，播放警示提示音 `SFX_DEADLOCK_WARN`。
- **AC3 (無額度警報升級 $u_{\text{remaining}} = 0$)**：
  - 警報橫幅升級為紅色高頻閃爍：`🚨 CRITICAL DEADLOCK! NO UNDO AVAILABLE`。
- **AC4 (強制處決扣命)**：
  - 在無額度死鎖狀態下，延遲 $1.2\text{ 秒}$ 後全屏淡黑（Fade to Black）。
  - 強制扣除 1 條生命：$\text{Lives} \leftarrow \text{Lives} - 1$。
  - 若 $\text{Lives} > 0$：關卡重置至初始狀態，$u_{\text{remaining}} \leftarrow U_{\text{quota}}$，$t_{\text{elapsed}} \leftarrow 0$。
  - 若 $\text{Lives} = 0$：直接轉入 Game Over 結算流程。

---

## US-07-07：長按 X 鍵主動棄局防誤觸 (Hold-to-Give-Up Mechanism)

**身份**： 街機玩家 (Arcade Player)

> **As a** 陷入死局或希望重整局面的玩家，  
> **I want to** 長按 `[X]` 鍵（或街機 `BUTTON_B`）滿 1.0 秒來主動放棄本局重試，  
> **So that** 我能隨時重置關卡，同時杜絕因單擊鍵盤誤觸導致的意外扣命。

### 驗收條件 (Acceptance Criteria)

- **AC1 (單擊無效)**：玩家短按或單擊鍵盤 `[X]` 鍵，系統不觸發任何動作。
- **AC2 (長按提示視窗彈出)**：
  - 玩家按住 `[X]` 鍵瞬間，中央視窗中央彈出 $320 \times 120\text{ px}$ 浮動警告視窗。
  - 標題顯示：`GIVING UP...`。
  - 中央進度條隨按住時間（$0.0\text{ s} \to 1.0\text{ s}$）平滑填滿，顏色由金黃色漸變為鮮紅色。
  - 底部警語標註：`SACRIFICING 1 LIFE`。
- **AC3 (中途鬆開取消)**：若玩家在 $1.0\text{ 秒}$ 內鬆開 `[X]` 鍵，浮動視窗立即消失，棄局動作完全取消。
- **AC4 (按滿 1.0 秒處決)**：
  - 按住滿 $1.0\text{ 秒}$ 瞬間：
    - 扣除 1 條生命：$\text{Lives} \leftarrow \text{Lives} - 1$。
    - 若 $\text{Lives} > 0$：關卡重置至初始狀態，$u_{\text{remaining}} \leftarrow U_{\text{quota}}$，$t_{\text{elapsed}} \leftarrow 0$。
    - 若 $\text{Lives} = 0$：轉入 Game Over 結算。

---

## US-07-08：軟性計時與長考保護 (Soft Timer & Long-Thought Protection)

**身份**： 益智街機玩家 (Puzzle Player)

> **As a** 玩家，  
> **I want to** 在軟性計時器倒數歸零後仍能繼續推演操作，  
> **So that** 我在面對高難度幾何密室時能安心長考，不必承受超時猝死的壓力。

### 驗收條件 (Acceptance Criteria)

- **AC1 (時限初始化與參數定義)**：
  關卡載入時初始化總秒數 $T_{\text{soft}}$：
  $$T_{\text{soft}}(S, B, W) = T_{\text{base}}(W) + 2 \cdot (S - S_{\text{start}}(W)) + B \cdot K_t(W)$$

  **參數符號定義：**
  * $S \in [1, 50]$：當前關卡序號。
  * $W \in [1, 4]$：當前所屬主題世界代號。
  * $B$：當前關卡需歸位之目標箱子總數。
  * $S_{\text{start}}(W)$：世界起始關卡序號（W1: 1, W2: 6, W3: 21, W4: 41）。
  * $T_{\text{base}}(W)$：世界第一關基準秒數（W1: 50s, W2: 120s, W3: 160s, W4: 200s）。
  * $K_t(W)$：單箱時間加權權重（W1: 10s, W2: 20s, W3: 15s, W4: 15s）。
  * $2 \cdot (S - S_{\text{start}}(W))$：世界內每推進 1 關線性遞增 2 秒思考寬容度。

- **AC2 (倒數計時推進)**：遊戲進行期間，$t_{\text{elapsed}}$ 每秒累加，左側 HUD 計時器與進度條即時更新。
- **AC3 (超時鎖定與提示音)**：當 $t_{\text{elapsed}} \ge T_{\text{soft}}$ 瞬間：
  - 播放單次低沉超時提示音（`SFX_TIMEOUT`）。
  - 計時器數字鎖定為 `00:00` 並呈紅色高頻閃爍，標籤切換為 `[TIME OUT]`。
  - 歸零後音效保持安靜，不產生持續性吵雜蜂鳴，確保玩家專注解謎。
- **AC4 (長考保護原則)**：
  - 超時後遊戲**絕不中斷、絕不扣命、不設強制死亡**，玩家可繼續自由移動與推箱。
  - 懲罰限制於通關計分：該關通關時時間分 $P_{\text{time}} = 0$，且喪失完美獎勵資格（$P_{\text{perfect}} = 0$）。

---

## US-07-09：防刷分通關結算體系 (Anti-Pressing Stage Clear Scoring)

**身份**： 街機玩家 (Arcade Player)

> **As a** 玩家，  
> **I want to** 僅在通關時獲得「保底分＋時間分＋節約Undo分＋完美獎勵」之四合一結算，  
> **So that** 無法透過原地推箱洗分，且高精準度速通能獲得顯著的分數回報。

### 驗收條件 (Acceptance Criteria)

- **AC1 (零即時推箱分數)**：工人位移與箱子推動過程中完全不發放即時分數。
- **AC2 (過關觸發 STAGE CLEAR)**：盤面上所有目標點填滿箱子的瞬間觸發通關：
  - 鎖定玩家輸入，彈出結算卡片，播放 `SFX_STAGE_CLEAR`。
  - 單關得分結算公式：
    $$P_{\text{stage}} = P_{\text{base}}(W) + P_{\text{time}} + P_{\text{undo}} + P_{\text{perfect}}$$
- **AC3 (四項加分指標)**：
  - **世界保底分：** $P_{\text{base}}(W) = 200 \times W$
  - **剩餘時間分：** $P_{\text{time}} = \left\lfloor \frac{\max(0, T_{\text{soft}} - t_{\text{elapsed}})}{5} \right\rfloor \times 100$
  - **節約 Undo 分：** $P_{\text{undo}} = u_{\text{remaining}} \times 100$
  - **完美解題獎勵分：** 若 $t_{\text{elapsed}} < T_{\text{soft}} \;\land\; u_{\text{remaining}} = U_{\text{quota}}$，發放 $P_{\text{perfect}} = 100 \times (2W + 1)$；否則為 $0$。
- **AC4 (同餘模數保證)**：所有計分項皆為 100 的整數倍，$\text{RawScore} \pmod{100} \equiv 0$ 恆成立。
- **AC5 (存檔與進度更新)**：
  - 更新當局最後通關關卡：$\text{lastClearedStage} \leftarrow S$。
  - 若 $S > \text{maxClearedStage}$，同步寫入本機持久化儲存。
  - 右側 HUD 分數滾動累加新得分。

---

## US-07-10：雙軌獎命體系 (World Clear Bonus & 10,000 Pts Extend)

**身份**： 街機玩家 (Arcade Player)

> **As a** 玩家，  
> **I want to** 在成功攻克一個主題世界、或純得分每累積跨越 10,000 分門檻時獲得 1 條額外生命 (1UP)，  
> **So that** 優秀的推箱表現與章節進度能直接轉化為後續高難度世界的容錯資本。

### 驗收條件 (Acceptance Criteria)

- **AC1 (世界通關獎勵 World Clear Bonus)**：
  當成功通關任一世界之終點關卡（Stage 05、Stage 20、Stage 40）時，於結算時無條件發放額外生命：$\text{Lives} \leftarrow \text{Lives} + 1$。
- **AC2 (10,000 分階梯判定觸發)**：
  當結算後累計純得分滿足：
  $$\left\lfloor \frac{\text{RawScore}_{\text{new}}}{10,000} \right\rfloor > \left\lfloor \frac{\text{RawScore}_{\text{old}}}{10,000} \right\rfloor$$
  額外獎勵 1 條生命：$\text{Lives} \leftarrow \text{Lives} + 1$。兩軌獎勵可同關疊加。
- **AC3 (純音效回饋與零冗餘動畫)**：
  - 播放街機經典升調小號音效（`SFX_EXTEND`）。
  - **不額外彈出文字或字卡動畫**，保持沙盤迷宮 100% 乾淨通透。
- **AC4 (HUD 同步)**：
  - 右側 HUD 工人頭像與數字即時點亮更新。
  - 10K 累積進度條（`1UP PROGRESS (10K)`）依 10,000 分為週期累積更新。

---

## US-07-11：兩位數關卡分數隱寫術 (Steganographic Score Encoding)

**身份**： Arcade Stadium 排行榜系統 (Leaderboard System)

> **As a** 排行榜系統，  
> **I want to** 總分末兩位數自動寫入玩家「最後成功通關關卡（00～50）」，  
> **So that** 排行榜資料表只需單一整數欄位即可同時呈現純得分與攻克關卡。

### 驗收條件 (Acceptance Criteria)

- **AC1 (隱寫時機)**：當 $\text{Lives} = 0$ 觸發 Game Over 或第 50 關通關（ALL CLEAR）時執行編碼。
- **AC2 (隱寫編碼公式)**：
  上報至系統排行榜之唯一整數值：
  $$\text{Score}_{\text{final}} = \left( \left\lfloor \frac{\text{RawScore}}{100} \right\rfloor \times 100 \right) + \operatorname{clamp}(\text{lastClearedStage}, 0, 50)$$
- **AC3 (邊界驗收案例)**：
  - **第 1 關未過陣亡**：$\text{lastClearedStage} = 0, \text{RawScore} = 800 \implies \mathbf{800}$（末兩位 `00`）。
  - **第 3 關陣亡**：通關第 1、2 關，$\text{lastClearedStage} = 2, \text{RawScore} = 3,200 \implies \mathbf{3,202}$（末兩位 `02`）。
  - **第 14 關陣亡**：通關至第 13 關，$\text{lastClearedStage} = 13, \text{RawScore} = 28,400 \implies \mathbf{28,413}$（末兩位 `13`）。
  - **第 50 關通關 ALL CLEAR**：$\text{lastClearedStage} = 50, \text{RawScore} = 328,000 \implies \mathbf{328,050}$（末兩位 `50`）。
- **AC4 (街機出廠預設排行榜不霸榜原則)**：
  - 模擬經典街機出廠 ROM 預設榜單機制，分數區間設定為親民且易於攻克的 $1,101 \sim 16,808$（關卡分佈 Stage $01 \sim 08$），嚴禁霸榜。
  - 玩家通關 World 1（累計約 $9,100$ 分，編碼為 `9,105`）即可榮登前 5 名；若攻克至 World 2 前中期（Stage 6～8）即可問鼎第 1 名。

---

## US-07-12：四大主題世界線性推進 (4 Themed Worlds Linear Progression)

**身份**： 街機玩家 (Arcade Player)

> **As a** 玩家，  
> **I want to** 體驗 50 關在視覺氛圍、難度與箱數分明遞進且完全不重疊的四大主題世界，  
> **So that** 長時間遊玩時獲得清晰的篇章推進感與視覺新鮮度。

### 驗收條件 (Acceptance Criteria)

- **AC1 (World 1: Cargo Depot，Stage 01～05，5 關)**：
  - 題庫來源：`Microban.txt`（David W. Skinner）。
  - 箱數分佈嚴格固定為：**`[1, 2, 2, 2, 2]`** 顆（包含傳奇單箱破冰神關 `#44 Duh!`）。
  - 風格為木造貨棧，光線溫暖，供玩家熟悉基礎操作與避免死鎖。
- **AC2 (World 2: Cyber Vault，Stage 06～20，15 關)**：
  - 題庫來源：`minicosmos.txt`（3 箱關卡）＋ `microcosmos.txt`（4～5 箱關卡）（Aymeric du Peloux 宇宙雙部曲）。
  - 箱數分佈：**$5 : 5 : 5$ 均勻線性分佈**，每 5 關箱數精準 $+1$（3 箱 $\times$ 5、4 箱 $\times$ 5、5 箱 $\times$ 5）。
  - 風格為賽博金庫，高密度微型密室。
  - **第 06 關篇章轉場**：首次進入第 06 關時，觸發全屏紅色警報閃爍、CRT 雜訊掃描與鏡頭拉近（Zoom-in）轉場特效。
- **AC3 (World 3: Steel Works，Stage 21～40，20 關)**：
  - 題庫來源：`Original-Plus-Extra.txt`（今林宏行 Thinking Rabbit 原版經典 20 關）。
  - 箱數分佈：**6 箱 $\times$ 2**（含歷史開山第 1 關 `#01`）、**8 箱 $\times$ 2**、**9 箱 $\times$ 2**、**10 箱 $\times$ 5**、**11 箱 $\times$ 3**、**12 箱 $\times$ 6**。
  - 風格為重工業鋼鐵廠，經典開闊長廊與多凹槽空間。
  - **第 21 關篇章轉場**：首次進入第 21 關時，觸發重工業廠警報蒸氣轉場特效。
- **AC4 (World 4: Mega Terminal，Stage 41～50，10 關)**：
  - 題庫來源：`Sasquatch.txt`（David W. Skinner）。
  - 箱數分佈：**13 箱 $\times$ 2**、**14 箱 $\times$ 2**、**15 箱 $\times$ 1**、**16 箱 $\times$ 1**、**17 箱 $\times$ 1**、**18 箱 $\times$ 1**、**19 箱 $\times$ 1**、**20 箱 $\times$ 1**（壓軸終戰 `#39`）。
  - 風格為巨型碼頭，全域廣角大圖終極決戰。
  - **第 41 關篇章轉場**：首次進入第 41 關時，觸發巨型碼頭開闊轉場特效。

---

## US-07-13：正方形與微橫幅幾何拓撲過濾 (Aspect Ratio & Geometric Filter)

**身份**： 關卡篩選管線 (Level Pipeline)

> **As a** 關卡篩選管線，  
> **I want to** 嚴格篩選符合長寬比與視口邊長限制的地圖並固化為靜態 JSON 資料集，  
> **So that** 徹底排除直幅與牙膏地圖，保證在中央 4:3 區域內呈現最佳構圖且運行時零負擔。

### 驗收條件 (Acceptance Criteria)

- **AC1 (長寬比篩選標準)**：
  所有收錄地圖必須嚴格滿足：
  $$1.00 \le \frac{W_{\text{grid}}}{H_{\text{grid}}} \le 1.75$$
  （嚴格排除直幅地圖，精選 50 關中 0 關需要旋轉；78% 落在 $1.00 \le W/H \le 1.45$ 之黃金正方與微橫幅，22% 容納今林宏行 #1 等不可替代之原版開闊寬橫幅）。
- **AC2 (各世界網格上限限制)**：
  - World 1: $W_{\text{grid}} \le 12, \; H_{\text{grid}} \le 12$
  - World 2: $W_{\text{grid}} \le 12, \; H_{\text{grid}} \le 12$
  - World 3: $W_{\text{grid}} \le 20, \; H_{\text{grid}} \le 16$
  - World 4: $W_{\text{grid}} \le 26, \; H_{\text{grid}} \le 18$
- **AC3 (構建期靜態固化)**：
  地圖由建置腳本 `filter_levels.py` 自 external-specs 的 5 大題庫篩選並固化為 50 關靜態 JSON 檔案（`sokoban_50_master.json`），包含地圖 ASCII 矩陣、工人起始點座標、目標點座標與箱子數量，遊戲運行時零動態計算。

---

## US-07-14：平台事件契約整合、Web Audio 與生命週期 (Platform Lifecycle, Audio & ArcadeBridge)

**身份**： 街機平台整合層 (Arcade Platform Adapter)

> **As a** 平台整合層，  
> **I want to** 實作 `IArcadeGame` 介面、監聽 `ArcadeBridge` 事件，並在 Game Over 時結算隱寫分數後直接銷毀 Canvas 返回大廳，  
> **So that** 倉庫番與 Arcade Stadium 平台體系達成 100% 無縫整合。

### 驗收條件 (Acceptance Criteria)

- **AC1 (介面實作)**：實作 `IArcadeGame` 介面標準生命週期方法（`init()`, `start()`, `pause()`, `resume()`, `destroyGame()`）。
- **AC2 (事件接收與廣播)**：
  - 監聽接收：`START_GAME`, `PAUSE_REQUESTED`, `RESUME_REQUESTED`, `MUTE_TOGGLED`。
  - 發布廣播：`SCORE_UPDATED`, `LIVES_UPDATED`, `STAGE_CLEARED`, `GAME_OVER`。
- **AC3 (純鍵盤控制映射)**：
  - 方向鍵 `[↑↓←→]` 映射為移動。
  - `[Z]` 鍵映射為 Undo。
  - 長按 `[X]` 鍵（或 Arcade `BUTTON_B`）滿 1.0 秒映射為棄局。
  - 實體鍵盤**不映射 `[ESC]` 鍵**（解謎過程中不需玩家手動敲鍵盤暫停）。
  - 嚴格不擴展 Gamepad 額外按鍵，保持純鍵盤操作。
- **AC4 (平台暫停機制與生命週期)**：
  - 當外層 React Host Shell 點擊 UI 暫停按鈕，或瀏覽器分頁切換失焦（Window `onblur`）發送 `PAUSE_REQUESTED` 時：
    - 系統觸發 `pause()`，立即凍結軟性計時器累加（$t_{\text{elapsed}}$ 停止計時）。
    - 暫停當前世界 Web Audio 輕音樂（BGM）與音效。
    - 鎖定鍵盤方向鍵、Z 鍵與 X 鍵輸入，中央視窗浮現半透明 `PAUSED` 遮罩。
  - 當平台發送 `RESUME_REQUESTED` 或調用 `resume()` 時：
    - 關閉暫停遮罩，恢復軟性計時器計時，恢復 BGM 播放，重新解鎖鍵盤輸入。
- **AC5 (Game Over 退出流程)**：當 $\text{Lives} = 0$ 觸發 Game Over 時，系統上報隱寫分數，銷毀 Canvas 視窗，直接返回 Arcade Stadium 大廳，不提供原地投幣接關倒數。
- **AC6 (程序化 Web Audio 輕音樂 BGM)**：
  為四大世界各配置專屬低干擾、輕節奏之合成器晶片背景音樂（BGM），營造專注長考氛圍：
  - `BGM_WORLD_1 (Cargo Warmth)`：木質溫暖打擊晶片音樂（World 1: Cargo Depot）。
  - `BGM_WORLD_2 (Cyber Pulse)`：賽博低頻環境脈衝晶片音樂（World 2: Cyber Vault）。
  - `BGM_WORLD_3 (Steel Jazz)`：沉穩輕爵士晶片音樂（World 3: Steel Works）。
  - `BGM_WORLD_4 (Terminal Vista)`：碼頭廣角大氣晶片管弦樂（World 4: Mega Terminal）。
  - 支援平台 `MUTE_TOGGLED` 一鍵靜音與音量控管。
- **AC7 (程序化 Web Audio 音效 SFX)**：採用 Web Audio 即時合成全套音效（腳步聲、推箱聲、入洞鈴聲、Undo 音、死鎖警告、超時提示、1UP 號角、通關音樂），零外部音檔依賴。

