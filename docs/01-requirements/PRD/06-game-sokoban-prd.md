# PRD-06: 街機倉庫番 (Sokoban 50 Game PRD)

## 1. 遊戲願景與定位 (Overview & Arcade Vision)

《街機倉庫番（Sokoban 50）》是 Arcade Stadium 平台上的第六款經典益智推箱遊戲。不同於傳統倉庫番常因直幅或狹長地圖而在現代寬螢幕上留下巨大死黑邊，本作採用專為 **16:9 街機寬螢幕（$1280 \times 720\text{ px}$）** 量身打造的「三欄式框體佈局」與「沙盤美學渲染管線 (Floating Diorama Pipeline)」，將核心解謎棋盤置於中央 4:3 區域，兩側配置高度專業的街機儀表板（HUD），營造極具沉浸感的高階街機推箱體驗。

遊戲規劃 50 個由淺入深的精選關卡，橫跨四大經典主題世界（貨棧、工廠、賽博金庫、巨型碼頭）。機制上融合了推箱粒度 Undo、正交直角死鎖警報、長按棄局、軟性長考計時器、防刷分通關結算、10 萬分固定 1UP 獎命，以及獨創的「兩位數關卡分數隱寫術」，讓玩家在純粹的幾何與空間邏輯推演中，享受街機硬派競技與通關榮耀。

---

## 2. 畫面視覺架構與沙盤渲染管線 (Visual & Screen Architecture)

### 2.1 全域畫布與三欄式佈局 (Canvas Layout)

* **基準解析度：** $1280 \times 720\text{ px}$（標準 16:9 街機寬螢幕）。
* **結構劃分：** 採用左右對稱雙翼 HUD 與中央 4:3 核心棋盤之三欄式無縫貼合設計。徹底消除多餘標籤，排行榜最高分僅於平台大廳展示，遊戲內維持乾淨專注。
* **垂直絕對居中（Vertical Centering）：**
  * 畫布高度為 $720\text{ px}$，三欄組件高度皆為 $660\text{ px}$，錨定於頂部 $Y = 30\text{ px}$。
  * 頂部外邊距 $30\text{ px}$，底部外邊距 $720 - (30 + 660) = 30\text{ px}$（$30 + 660 + 30 = 720\text{ px}$），達成上下嚴格對稱垂直置中。
* **水平無縫貼合（Horizontal Seamless Docking）：**
  * 畫布寬度為 $1280\text{ px}$。
  * 左側 HUD（$200\text{ px}$）＋ 中央棋盤（$880\text{ px}$）＋ 右側 HUD（$200\text{ px}$）$= 1280\text{ px}$。
  * 座標嚴密對齊：左側 $X: 0 \sim 200$、中央 $X: 200 \sim 1080$、右側 $X: 1080 \sim 1280$，無任何水平黑邊縫隙與錯位。

```text
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│ 16:9 ARCADE CANVAS ( 1280 x 720 px )                                (Top Margin: 30 px)     │
│┌───────────────────┬────────────────────────────────────────────────┬──────────────────────┐│
││  LEFT FLANK HUD   │            CENTER PLAYFIELD ( 4:3 )            │   RIGHT FLANK HUD    ││
││ (X:0, 200x660 px) │               (X:200, 880x660 px)              │ (X:1080, 200x660 px) ││
│├───────────────────┼────────────────────────────────────────────────┼──────────────────────┤│
││                   │                                                │                      ││
││ [WORLD THEME]     │    Layer 0: 主題環境底圖平鋪 (TileSprite)      │ [CURRENT SCORE]      ││
││ WORLD 02          │                                                │ SCORE:               ││
││ STEEL WORKS       │        ┌── 外牆陰影 (Drop Shadow) ──┐          │ 0,420,100            ││
││                   │        │                            │          │                      ││
││ [STAGE]           │        │   ######                   │          │ [LIVES]              ││
││ STAGE 18 / 50     │        │   #  $ #    (核心迷宮)     │          │ ▲ ▲ ▲ (3)            ││
││                   │        │   # .@ #                   │          │                      ││
││ [SOFT TIMER]      │        │   ######                   │          │ [EXTEND PROGRESS]    ││
││ 02:45             │        │                            │          │ 42,000 / 100,000     ││
││ [██████████░░░░]  │        └────────────────────────────┘          │                      ││
││                   │                                                │ [CONTROLS GUIDE]     ││
││ [UNDO QUOTA]      │                                                │ [↑↓←→] MOVE          ││
││ ● ● ● ○ ○         │                                                │ [Z]    UNDO          ││
││ REMAINING: 3 / 5  │                                                │ [HOLD R]             ││
││                   │    Layer 3: 邊緣徑向暗角 (Vignette Mask)       │ GIVE UP (-1♥)        ││
│└───────────────────┴────────────────────────────────────────────────┴──────────────────────┘│
│                                                                     (Bottom Margin: 30 px)  │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 渲染圖層與沙盤美學管線 (Floating Diorama Pipeline)

中央可玩區（$880 \times 660\text{ px}$）採用分層渲染架構，徹底消除黑邊並突顯立體沙盤美感：

* **Layer 0（環境底層 Ambient Backdrop）：** 
  全區無縫平鋪（TileSprite）當前世界專屬暗色紋理，整體明度降低 50%，消除純黑背景：
  * **World 1 (Cargo Depot)：** 暗色無縫木地板紋理。
  * **World 2 (Steel Works)：** 冷軋鋼菱形防滑網紋。
  * **World 3 (Cyber Vault)：** 印刷電路板暗紫色走線紋理。
  * **World 4 (Mega Terminal)：** 粗顆粒深灰瀝青地坪紋理。
* **Layer 1（外牆投影 Drop Shadow）：** 
  沿迷宮最外層牆壁（`#`）向右下方 $(+8\text{ px}, +12\text{ px})$ 繪製帶羽化效果之深黑陰影（Alpha 45%），營造迷宮浮空於沙盤底座的 2.5D 立體感。
* **Layer 2（迷宮主體 Labyrinth Grid）：** 
  根據關卡網格寬高動態計算等比正方形圖塊尺寸（Tile Size：$44\text{ px} \sim 80\text{ px}$），並保證水平與垂直絕對居中：
  $$\text{TileSize} = \min\left( \left\lfloor \frac{880}{W_{\text{grid}}} \right\rfloor, \; \left\lfloor \frac{660}{H_{\text{grid}}} \right\rfloor \right)$$
  置中偏移量計算公式：
  $$\text{OriginX} = 200 + \left\lfloor \frac{880 - (W_{\text{grid}} \cdot \text{TileSize})}{2} \right\rfloor, \quad \text{OriginY} = 30 + \left\lfloor \frac{660 - (H_{\text{grid}} \cdot \text{TileSize})}{2} \right\rfloor$$
* **Layer 3（徑向暗角 Vignette Mask）：** 
  覆蓋全區，中心區域完全透明、邊緣漸變為暗黑的徑向羽化遮罩，聚焦玩家視線於中央核心盤面。

### 2.3 雙翼 HUD 規格 (Left & Right Flank HUDs)

* **左側儀表板 (Left Flank HUD)**：
  * 座標與尺寸：錨定於 $(X: 0, Y: 30)$，尺寸 $200 \times 660\text{ px}$，半透明暗黑底板（Alpha 85%）。
  * **主題徽章**：顯示當前世界代號與主題名稱（例如：`WORLD 02: STEEL WORKS`）。
  * **關卡計數**：顯示 `STAGE SS / 50`。
  * **軟性倒數計時器**：顯示分秒 `MM:SS`，三段色彩警示與 $160\text{ px}$ 倒數進度條。
  * **Undo 配額矩陣**：實心點陣圓燈與剩餘數字標籤 `REMAINING: u / U_quota`。
* **右側儀表板 (Right Flank HUD)**：
  * 座標與尺寸：錨定於 $(X: 1080, Y: 30)$，尺寸 $200 \times 660\text{ px}$，半透明暗黑底板（Alpha 85%）。
  * **純得分儀表**：8 位數補零金色大字（例如 `0,420,100`，`#FFD700`，字級 $24\text{ px}$）。
  * **生命數顯示**：工人頭像圖示與數字（例如：`▲ ▲ ▲ (3)`）。
  * **1UP 獎命進度條**：累計距離下一個 $100,000$ 分門檻之進度條。
  * **常駐純鍵盤按鍵指南**：
    * `[↑↓←→] MOVE`
    * `[Z] UNDO`
    * `[HOLD R] GIVE UP (-1♥)`（紅色警示字體）。

---

## 3. 核心推箱、容錯與生命週期機制 (Core Gameplay & Lifecycle Mechanics)

### 3.1 推箱粒度 Undo 與瞬間快照還原 (Push-Granularity Undo & Instant Snapshot Restore)

* **保護決策原則**：玩家單純在走廊走位位移不消耗 Undo 配額；只有當工人施力推動箱子（箱子座標發生改變）時，系統將推箱前一刻的工人座標與所有箱子座標封裝為單一快照節點（Undo Snapshot）推入歷史棧。
* **關卡配額計算公式**：
  關卡載入時依據關卡序號 $S$、箱數 $B$ 與世界基底參數動態初始化：
  $$U_{\text{quota}}(S, B, W) = \min\left( U_{\max}(W), \; \left\lfloor U_{\text{base}}(W) + B \cdot K_u(W) + 0.15 \cdot (S - S_{\text{start}}(W)) \right\rfloor \right)$$

  **$U_{\text{quota}}$ 公式參數符號定義表：**
  | 參數符號 | 參數名稱 | 單位 / 型態 | 說明與定義 |
  |---|---|---|---|
  | $S$ | 當前關卡序號 (Stage) | 整數 ($1 \sim 50$) | 當前進行的關卡編號。 |
  | $W$ | 當前世界代號 (World) | 整數 ($1 \sim 4$) | 當前所屬主題世界（1: Cargo Depot, 2: Cyber Vault, 3: Steel Works, 4: Mega Terminal）。 |
  | $B$ | 目標箱子數 (Box Count) | 顆 (整數) | 當前地圖需推入目標點的箱子總數量。 |
  | $S_{\text{start}}(W)$ | 世界起始關卡序號 | 關 (整數) | 各世界起點關卡：World 1 為 `1`、World 2 為 `6`、World 3 為 `21`、World 4 為 `41`。 |
  | $U_{\text{base}}(W)$ | 世界基準保底額度 | 次 (整數) | 該世界第一關之基準 Undo 次數（W1: 2, W2: 4, W3: 6, W4: 8）。 |
  | $K_u(W)$ | 單箱 Undo 加權係數 | 次/顆 (浮點數) | 隨箱數增加給予之 Undo 補償（W1: 0.6, W2: 0.6, W3: 0.5, W4: 0.5）。 |
  | $0.15 \cdot (S - S_{\text{start}}(W))$ | 關卡推進額度微調 | 次 (浮點數) | 世界內每深入推進，給予微幅 Undo 補償。 |
  | $U_{\max}(W)$ | 各世界配額上限 | 次 (整數) | 強制鎖定配額上限（W1: 6, W2: 12, W3: 14, W4: 18）。 |

* **瞬間還原流程 (Instant Snapshot Restore)**：
  * 當玩家按下 `[Z]` 鍵：
    * 若剩餘額度 $u_{\text{remaining}} > 0$：立即自棧頂彈出上一快照，**瞬間**將工人和所有箱子座標還原至推箱前一刻（無逐格倒退動畫），$u_{\text{remaining}} \leftarrow u_{\text{remaining}} - 1$，左側 HUD 圓燈熄滅一顆。
    * 若剩餘額度 $u_{\text{remaining}} = 0$：禁止回溯，左側 HUD 配額顯示器紅色閃爍並播放警示音。

### 3.2 嚴格正交直角死鎖判定與處決 (Strict Orthogonal Corner Trap & Auto-Resign)

* **判定條件 (Corner Trap)**：
  當盤面上存在任一不在目標點（`.`）上的箱子，其兩相鄰垂直側（「上與左」、「上與右」、「下與左」、「下與右」）皆為不可穿越障礙物（牆壁 `#` 或已被判定為死鎖之卡死箱子）時，立即判定為死鎖狀態。
* **處決層級分流**：
  * **尚有 Undo 額度（$u_{\text{remaining}} > 0$）**：
    * 中央視窗頂端滑出橙色警報橫幅：`⚠ DEADLOCK DETECTED! PRESS [Z] TO UNDO`。
    * 觸發死鎖之箱子邊框呈現亮黃光脈衝呼吸閃爍，提示玩家即時挽救。
  * **已無 Undo 額度（$u_{\text{remaining}} = 0$）**：
    * 警報橫幅升級為高頻紅色閃爍：`🚨 CRITICAL DEADLOCK! NO UNDO AVAILABLE`。
    * 系統延遲 $1.2\text{ 秒}$ 後全屏淡黑（Fade to Black），強制扣除 1 條生命（$\text{Lives} \leftarrow \text{Lives} - 1$）並重置關卡。若 $\text{Lives} = 0$ 則直接觸發 Game Over。

### 3.3 長按 R 鍵主動棄局防誤觸 (Hold-to-Give-Up)

* **設計意圖**：允許玩家在推錯或陷入非直角死局時主動重置，但透過長按時間鎖徹底防止按鍵誤觸造成的無謂扣命。
* **互動流程**：
  * 單擊鍵盤 `[R]` 鍵完全不觸發任何動作。
  * 玩家按住 `[R]` 鍵時，中央棋盤中央即時彈出專屬警告浮動視窗（$320 \times 120\text{ px}$）：
    * 視窗標題：`GIVING UP...`
    * 動態進度條：隨按住時間（$0.0\text{ s} \to 1.0\text{ s}$）平滑填滿，顏色由金黃漸變為警示鮮紅。
    * 底部警語：`SACRIFICING 1 LIFE`。
  * 若在 $1.0\text{ 秒}$ 內鬆開按鍵，視窗瞬間消退，判定取消。
  * 若按住滿 $1.0\text{ 秒}$：
    * 立即扣除 1 條生命（$\text{Lives} \leftarrow \text{Lives} - 1$）。
    * 若 $\text{Lives} > 0$：關卡原地重置至初始狀態，$u_{\text{remaining}} \leftarrow U_{\text{quota}}$，$t_{\text{elapsed}} \leftarrow 0$。
    * 若 $\text{Lives} = 0$：觸發 Game Over 結算流程。

---

## 4. 經濟、計時、防刷分結算與排行榜隱寫 (Economy, Scoring & Steganography)

### 4.1 軟性計時器與長考保護 (Soft Timer)

* **關卡總秒數公式**：
  $$T_{\text{soft}}(S, B, W) = T_{\text{base}}(W) + 2 \cdot (S - S_{\text{start}}(W)) + B \cdot K_t(W)$$

  **$T_{\text{soft}}$ 公式參數符號定義表：**
  | 參數符號 | 參數名稱 | 單位 / 型態 | 說明與定義 |
  |---|---|---|---|
  | $S$ | 當前關卡序號 (Stage) | 整數 ($1 \sim 50$) | 當前進行的關卡編號。 |
  | $W$ | 當前世界代號 (World) | 整數 ($1 \sim 4$) | 當前所屬主題世界（1: Cargo Depot, 2: Cyber Vault, 3: Steel Works, 4: Mega Terminal）。 |
  | $B$ | 目標箱子數 (Box Count) | 顆 (整數) | 當前地圖需推入目標點的箱子總數量。 |
  | $S_{\text{start}}(W)$ | 世界起始關卡序號 | 關 (整數) | 各世界起點關卡：World 1 為 `1`、World 2 為 `6`、World 3 為 `21`、World 4 為 `41`。 |
  | $T_{\text{base}}(W)$ | 世界基底時限 (Base Time) | 秒 ($\text{s}$) | 該世界第一關之起始基準秒數（W1: $50\text{s}$, W2: $120\text{s}$, W3: $160\text{s}$, W4: $200\text{s}$）。 |
  | $K_t(W)$ | 單箱時間加權權重 | 秒/顆 ($\text{s}$) | 每增加 1 顆箱子給予之思考緩衝時間（W1: $10\text{s}$, W2: $20\text{s}$, W3: $15\text{s}$, W4: $15\text{s}$）。 |
  | $2 \cdot (S - S_{\text{start}}(W))$ | 關卡推進時間遞增 | 秒 ($\text{s}$) | 該世界內每推進 1 關，自動線性遞增 2 秒思考時間。 |
* **超時保護機制**：
  * 當累計遊玩時間 $t_{\text{elapsed}} \ge T_{\text{soft}}$ 時：
    * 播放單次低沉提示音（`SFX_TIMEOUT`）。
    * 左側 HUD 倒數計時器停止，數字固定為 `00:00` 並呈紅色閃爍，進度條歸零。
    * **遊戲絕不中斷、絕不扣命、不設猝死強制重置**，玩家仍可心無旁騖地繼續推理推箱。
    * 懲罰僅限於結算層面：通關時剩餘時間分數為 0（$P_{\text{time}} = 0$），且自動喪失完美通關獎勵（$P_{\text{perfect}} = 0$）。

### 4.2 防刷分通關結算體系 (Anti-Pressing Scoring System)

* **零即時分數原則**：工人的每一次走步與箱子的每一次推移**完全不發放即時分數**，從根本上杜絕在原地反覆推箱洗分的作弊可能。
* **單關結算公式**：
  盤面上所有目標點填滿箱子瞬間觸發 `STAGE CLEAR`，得分依四項相加：
  $$P_{\text{stage}} = P_{\text{base}}(W) + P_{\text{time}} + P_{\text{undo}} + P_{\text{perfect}}$$
  * **世界保底分：** $P_{\text{base}}(W) = 200 \times W$
  * **剩餘時間分：** $P_{\text{time}} = \left\lfloor \frac{\max(0, T_{\text{soft}} - t_{\text{elapsed}})}{5} \right\rfloor \times 100$
  * **節約 Undo 分：** $P_{\text{undo}} = u_{\text{remaining}} \times 100$
  * **完美解題獎勵：** 若 $t_{\text{elapsed}} < T_{\text{soft}} \;\land\; u_{\text{remaining}} = U_{\text{quota}}$（時限內且 1 次 Undo 未用），發放 $P_{\text{perfect}} = 100 \times (2W + 1)$；否則為 $0$。
* **同餘模數保證**：所有加分項皆為 100 的整數倍，純得分嚴格滿足：
  $$\text{RawScore} \pmod{100} \equiv 0$$
* **進度保存**：通關時更新當局通關紀錄 $\text{lastClearedStage} \leftarrow S$；若 $S > \text{maxClearedStage}$，寫入本機持久化儲存。

### 4.3 雙軌獎命體系 (World Clear Bonus & 10,000 Pts Extend)

* **第一軌：世界通關保底獎命（World Clear Bonus）**：
  * 當成功攻克任一主題世界之終點關卡（World 1: Stage 05、World 2: Stage 20、World 3: Stage 40）時，於通關結算當下無條件獲得額外生命：
    $$\text{Lives} \leftarrow \text{Lives} + 1$$
  * 象徵進入新章節獲得工安物資補給，大幅提升後續高難度世界的探索信心與容錯率。
* **第二軌：固定 10,000 分階梯循環獎命（Fixed 10,000 Pts Extend）**：
  * 累計純得分更新後滿足跨越 10,000 分階梯：
    $$\left\lfloor \frac{\text{RawScore}_{\text{new}}}{10,000} \right\rfloor > \left\lfloor \frac{\text{RawScore}_{\text{old}}}{10,000} \right\rfloor$$
* **獎勵反饋與演出規範**：
  * **純音訊回饋**：觸發獎命時播放經典街機升調小號音效（`SFX_EXTEND`）。
  * **零冗餘動畫原則**：**不額外彈出對話框或大字卡動畫**，維持通關勝利慶典與迷宮浮島的 $100\%$ 純淨視覺。
  * **HUD 即時更新**：右側 HUD 餘命圖示即時更新點亮；獎命進度條以 10,000 分為週期累積（標籤為 `1UP PROGRESS (10K)`）。

### 4.4 兩位數關卡分數隱寫術 (Steganographic Score Encoding)

* **設計背景**：Arcade Stadium 平台排行榜資料表採用通用單一整數分數欄位（`score`）。為同時在排行榜展示「玩家真實實力積分」與「攻克之最高關卡（00～50）」，利用 $\text{RawScore} \pmod{100} \equiv 0$ 的純淨末兩位空位進行隱寫編碼。
* **編碼公式**：
  當 $\text{Lives} = 0$ 觸發 Game Over 或完成第 50 關（ALL CLEAR）時，提交至系統排行榜之唯一整數值：
  $$\text{Score}_{\text{final}} = \left( \left\lfloor \frac{\text{RawScore}}{100} \right\rfloor \times 100 \right) + \operatorname{clamp}(\text{lastClearedStage}, 0, 50)$$
* **標準案例驗證**：
  * **案例 A**：第 1 關未過陣亡（$\text{lastClearedStage} = 0, \text{RawScore} = 800$）$\to \mathbf{800}$。
  * **案例 B**：第 3 關陣亡（通關第 1、2 關，$\text{lastClearedStage} = 2, \text{RawScore} = 3,200$）$\to \mathbf{3,202}$。
  * **案例 C**：第 14 關陣亡（通關至第 13 關，$\text{lastClearedStage} = 13, \text{RawScore} = 28,400$）$\to \mathbf{28,413}$。
  * **案例 D**：第 50 關通關 ALL CLEAR（$\text{lastClearedStage} = 50, \text{RawScore} = 328,000$）$\to \mathbf{328,050}$。

### 4.5 街機出廠預設排行榜校準 (Arcade Factory Default Leaderboard Calibration)

* **街機出廠哲學（非霸榜原則）**：
  * 排行榜預設資料乃模擬經典街機剛出廠（Factory Default ROM）時寫入之基準分數，目的在於營造機台投幣歷史感，並作為玩家可攻克、易上榜之挑戰目標。
  * **嚴禁預設霸榜**：預設分數不得設為極限通關分數（如 50 關全通 328,050 分），否則初入街機廳之玩家將喪失投幣爭取榮譽之激勵感。
  * 平台各遊戲基準對照：俄羅斯方塊預設榜為 $1,200 \sim 12,500$ 分；小精靈為 $800 \sim 8,500$ 分。
* **Sokoban 50 預設榜單分佈（$1,101 \sim 16,808$）**：
  * 涵蓋關卡分佈：Stage $01 \sim 08$（World 1 延伸至 World 2 前中期）。
  * 玩家通關 World 1 五關（累計純分約 $9,100$ 分，編碼後為 `9,105`）即可直接強勢空降榜單第 5 名；若攻克至 World 2 前中期（Stage 6～8）即有機會問鼎第 1 名，大幅契合街機投幣成就反饋。
  * **預設 10 筆名冊與隱寫校驗表**：
    | 名次 (Rank) | 預設玩家 (Email / Alias) | 顯示分數 (Score) | 純分數 (RawScore) | 通關關卡 (Stage) | 隱寫驗證 |
    |---|---|---|---|---|---|
    | 1 | `arcade.veteran@arcade.com` | **16,808** | 16,800 | Stage 08 | $16800 + 8 = 16808$ |
    | 2 | `cyber.runner@arcade.com` | **14,207** | 14,200 | Stage 07 | $14200 + 7 = 14207$ |
    | 3 | `grid.master@arcade.com` | **11,806** | 11,800 | Stage 06 | $11800 + 6 = 11806$ |
    | 4 | `depot.champ@arcade.com` | **9,605** | 9,600 | Stage 05 | $9600 + 5 = 9605$ |
    | 5 | `box.pusher@arcade.com` | **7,804** | 7,800 | Stage 04 | $7800 + 4 = 7804$ |
    | 6 | `forklift.driver@arcade.com` | **5,903** | 5,900 | Stage 03 | $5900 + 3 = 5903$ |
    | 7 | `warehouse.intern@arcade.com` | **4,202** | 4,200 | Stage 02 | $4200 + 2 = 4202$ |
    | 8 | `undo.saver@arcade.com` | **2,802** | 2,800 | Stage 02 | $2800 + 2 = 2802$ |
    | 9 | `puzzle.novice@arcade.com` | **1,701** | 1,700 | Stage 01 | $1700 + 1 = 1701$ |
    | 10 | `rookie.pusher@arcade.com` | **1,101** | 1,100 | Stage 01 | $1100 + 1 = 1101$ |

---

## 5. 四大主題世界巡迴與幾何拓撲 (World Progression & Geometric Topology)

### 5.1 四大主題世界（5/15/20/10 零重疊線性推進陣列）

遊戲 50 關按四大主題世界線性推進，各世界題庫來源 100% 獨立純粹，箱數梯級滿足嚴格零重疊整數分割（$W_1 [1, 2] < W_2 [3, 5] < W_3 [6, 12] < W_4 [13, 20]$）：

* **World 1 (Stage 01～05，Microban，5 關)：**
  * **題庫來源**：`Microban.txt`（David W. Skinner）。
  * **風格**：木造貨棧（CARGO DEPOT），明亮溫暖，極致平緩的新手入門教學階梯。
  * **箱數分佈**：嚴格固定為 **`[1, 2, 2, 2, 2]`** 顆（包含傳奇單箱破冰神關 `#44 Duh!`）。
* **World 2 (Stage 06～20，Cosmos 宇宙雙部曲，15 關)：**
  * **題庫來源**：`minicosmos.txt`（3 箱關卡）＋ `microcosmos.txt`（4～5 箱關卡）（Aymeric du Peloux）。
  * **風格**：賽博金庫（CYBER VAULT），高密度微型密室，科技冷冽。
  * **箱數分佈**：**$5 : 5 : 5$ 完美均勻對稱**，每 5 關箱數精準 $+1$：
    * **3 箱 $\times$ 5 關**（Stage 06～10，來自 `minicosmos.txt` 自然正方/微橫幅精華）
    * **4 箱 $\times$ 5 關**（Stage 11～15，來自 `microcosmos.txt`）
    * **5 箱 $\times$ 5 關**（Stage 16～20，來自 `microcosmos.txt`）
  * **特殊演出**：首次進入第 06 關時，觸發全屏紅色警報閃爍、CRT 雜訊掃描與鏡頭拉近（Zoom-in）震撼篇章轉場。
* **World 3 (Stage 21～40，Original，20 關)：**
  * **題庫來源**：`Original-Plus-Extra.txt`（今林宏行 Thinking Rabbit 原版經典 20 關）。
  * **風格**：重工業工廠（STEEL WORKS），經典開闊長廊與多凹槽空間。
  * **箱數分佈**：
    * **6 箱 $\times$ 2 關**（Stage 21～22，完整收錄 1982 年歷史開山第 1 關 `#01`）
    * **8 箱 $\times$ 2 關**（Stage 23～24）
    * **9 箱 $\times$ 2 關**（Stage 25～26）
    * **10 箱 $\times$ 5 關**（Stage 27～31）
    * **11 箱 $\times$ 3 關**（Stage 32～34，含原版第 3 關 `#03`）
    * **12 箱 $\times$ 6 關**（Stage 35～40，含原版第 5 關 `#05`）
  * **特殊演出**：首次進入第 21 關時，觸發重工業廠篇章轉場與警報蒸氣特效。
* **World 4 (Stage 41～50，Sasquatch，10 關)：**
  * **題庫來源**：`Sasquatch.txt`（David W. Skinner）。
  * **風格**：巨型碼頭（MEGA TERMINAL），全域廣角大圖終極決戰。
  * **箱數分佈**：由 14 箱至 20 箱呈現每關線性 $+1$ 箱之終極登山階梯：
    * **13 箱 $\times$ 2 關**（Stage 41～42）
    * **14 箱 $\times$ 2 關**（Stage 43～44）
    * **15 箱 $\times$ 1 關**（Stage 45）
    * **16 箱 $\times$ 1 關**（Stage 46，全題庫唯一）
    * **17 箱 $\times$ 1 關**（Stage 47，全題庫唯一）
    * **18 箱 $\times$ 1 關**（Stage 48）
    * **19 箱 $\times$ 1 關**（Stage 49）
    * **20 箱 $\times$ 1 關**（Stage 50 壓軸終戰 `#39`）
  * **特殊演出**：首次進入第 41 關時，觸發巨型碼頭篇章轉場。

### 5.2 幾何拓撲過濾與地圖固化管線 (Geometric Filter & Static Dataset)

* **長寬比與邊長限制**：
  為排除視覺壓迫之直幅地圖（$W < H$），收錄地圖必須嚴格滿足：
  $$\begin{cases} 1.00 \le \dfrac{W_{\text{grid}}}{H_{\text{grid}}} \le 1.75 & (\text{排除直幅地圖，僅收錄正方形至橫幅；50 關中 0 關需要旋轉}) \\ W_{\text{grid}} \le W_{\max}(W) \;\land\; H_{\text{grid}} \le H_{\max}(W) & (\text{各世界網格邊長上限，保障單格 Tile 高清像素}) \end{cases}$$
  * **比例分佈**：入選 50 關中，78%（39 關）落在 $1.00 \le W/H \le 1.45$ 之黃金正方與微橫幅；22%（11 關）落在 $1.45 < W/H \le 1.73$，完整保全今林宏行 #1（$19\times 11$）與 Skinner #44（$5\times 3$）等原版歷史名作。
* **各世界網格邊長上限矩陣**：
  * World 1: $W_{\text{grid}} \le 12, \; H_{\text{grid}} \le 12$
  * World 2: $W_{\text{grid}} \le 12, \; H_{\text{grid}} \le 12$
  * World 3: $W_{\text{grid}} \le 20, \; H_{\text{grid}} \le 16$
  * World 4: $W_{\text{grid}} \le 26, \; H_{\text{grid}} \le 18$
* **構建期靜態固化**：
  由過濾管線腳本（`filter_levels.py`）於構建期預先自 external-specs 提取並固化為 50 關靜態 JSON 資料集（`sokoban_50_master.json`，包含盤面 ASCII 陣列、工人起點、箱數、寬高、預先運算之 $T_{\text{soft}}$ 與 $U_{\text{quota}}$），遊戲運行時零動態解析開銷。

---

## 6. 平台整合、輸入映射與生命週期契約 (Platform Integration & Controls)

### 6.1 純鍵盤輸入映射 (Input Mapping via InputService)

遵循街機硬體規範，專注純鍵盤精確操作，按鍵行為嚴格對應右側 HUD 實體按鍵指南。遊戲為純回合制空間解謎，工人靜止即等同暫停，且採用軟性長考計時，無需額外配置實體 Escape 暫停鍵：

| 實體按鍵 | 遊戲動作 | 行為細節 |
|---|---|---|
| `ArrowUp` | 向上移動 | 工人向上走 1 格；若有箱子則推動箱子 1 格 |
| `ArrowDown` | 向下移動 | 工人向下走 1 格；若有箱子則推動箱子 1 格 |
| `ArrowLeft` | 向左移動 | 工人向左走 1 格；若有箱子則推動箱子 1 格 |
| `ArrowRight` | 向右移動 | 工人向右走 1 格；若有箱子則推動箱子 1 格 |
| `KeyZ` | 執行 Undo | 扣除 1 次配額，盤面瞬間還原至推箱前一刻 |
| `KeyR` (長按 1.0s) | 主動棄局 | 彈出進度條視窗，按滿 1.0 秒扣除 1 命重置關卡 |

### 6.2 投幣與二擇一啟動流程 (Coin Insert & Binary Start Selector)

1. 玩家在大廳點擊「START (1 Coin)」，錢包扣除 1 枚 Credit 並掛載 Canvas。
2. 系統讀取本地儲存之 `maxClearedStage`（無記錄預設為 0）。
3. 遊戲開局呈現二擇一選單（不設複雜選關矩陣與縮圖）：
   * **選項一**：`NEW GAME (STAGE 01)`（始終可選）。
   * **選項二**：`CONTINUE (STAGE [maxClearedStage + 1])`（僅當 $\text{maxClearedStage} > 0$ 時出現，上限為 Stage 50）。
4. 玩家確認選擇後進入遊戲：
   * 生命值重置為 $\text{Lives} \leftarrow 3$。
   * 純得分重置為 $\text{RawScore} \leftarrow 0$。
   * 當局最高通關記錄重置為 $\text{lastClearedStage} \leftarrow 0$。

### 6.3 平台生命週期契約與音效架構 (`IArcadeGame` & Web Audio)

* **介面實作**：`IArcadeGame`（`init()`, `start()`, `pause()`, `resume()`, `destroyGame()`）。
* **雙向事件廣播 (`ArcadeBridge`)**：
  * 接收：`START_GAME`, `PAUSE_REQUESTED`, `RESUME_REQUESTED`, `MUTE_TOGGLED`。
  * 廣播：`SCORE_UPDATED`, `LIVES_UPDATED`, `STAGE_CLEARED`, `GAME_OVER`。
* **平台暫停機制與生命週期 (Pause & Resume Lifecycle)**：
  * 雖然實體鍵盤不對應 `Escape` 鍵，但系統**完整實作平台層暫停生命週期**。
  * 當外層 React Host Shell 點擊暫停按鈕、或分頁失焦（Window `onblur`）發送 `PAUSE_REQUESTED` 時：
    * 系統調用 `pause()`，立即凍結軟性計時器累加（$t_{\text{elapsed}}$ 停止推進）。
    * 暫停當前世界 Web Audio 輕音樂（BGM）與音效播放。
    * 鎖定鍵盤輸入，畫面中央彈出半透明 `PAUSED` 暫停遮罩視窗。
  * 當收到 `RESUME_REQUESTED` 時，調用 `resume()`，淡出遮罩、恢復計時器與背景音樂，解鎖輸入。
* **Game Over 處理**：
  當 $\text{Lives} = 0$ 時，計算隱寫分數 $\text{Score}_{\text{final}}$，廣播 `GAME_OVER` 事件，隨後銷毀 Canvas 並退回 Arcade Stadium 大廳。
* **程序化 Web Audio 輕音樂 (Four-World Ambient Chip BGM)**：
  為四大主題世界分別配置獨立的低干擾、輕節奏晶片音樂，音量適中柔和，營造專注長考氛圍；支援大廳與快捷鍵 `MUTE_TOGGLED` 一鍵靜音：
  * `BGM_WORLD_1 (Cargo Warmth)`：木質溫暖、輕巧打擊節奏（World 1: Cargo Depot）。
  * `BGM_WORLD_2 (Cyber Pulse)`：輕量合成器脈衝、賽博空間氛圍（World 2: Cyber Vault）。
  * `BGM_WORLD_3 (Steel Jazz)`：沉穩輕爵士、冷軋鋼敲擊點綴（World 3: Steel Works）。
  * `BGM_WORLD_4 (Terminal Vista)`：廣角大氣、開闊晶片管弦音（World 4: Mega Terminal）。
* **程序化 Web Audio 音效 (Synthesized SFX)**：
  * `SFX_STEP`：輕巧腳步聲。
  * `SFX_PUSH`：厚重推箱摩擦音。
  * `SFX_TARGET_ON`：箱子入目標點清脆鎖定鈴聲。
  * `SFX_UNDO`：瞬間回溯低音。
  * `SFX_DEADLOCK_WARN`：死鎖橙色警報提示音。
  * `SFX_TIMEOUT`：軟性計時歸零低沉提示音。
  * `SFX_EXTEND`：10 萬分 1UP 獎勵號角。
  * `SFX_STAGE_CLEAR`：通關結算音樂與分數滾動音。

---

## 附錄：50 關全域靜態數值與時間對照矩陣 (50-Stage Master Schedule Table)

各世界基底常數：
* **World 1 (Cargo Depot):** $T_{\text{base}}=50\text{s}, K_t=10\text{s}, U_{\text{base}}=2, K_u=0.6, U_{\max}=6, P_{\text{base}}=200, P_{\text{perf}}=300$
* **World 2 (Cyber Vault):** $T_{\text{base}}=120\text{s}, K_t=20\text{s}, U_{\text{base}}=4, K_u=0.6, U_{\max}=12, P_{\text{base}}=400, P_{\text{perf}}=500$
* **World 3 (Steel Works):** $T_{\text{base}}=160\text{s}, K_t=15\text{s}, U_{\text{base}}=6, K_u=0.5, U_{\max}=14, P_{\text{base}}=600, P_{\text{perf}}=700$
* **World 4 (Mega Terminal):** $T_{\text{base}}=200\text{s}, K_t=15\text{s}, U_{\text{base}}=8, K_u=0.5, U_{\max}=18, P_{\text{base}}=800, P_{\text{perf}}=900$

| 關卡 $S$ | 世界 $W$ | 箱數 $B$ | 來源題庫與關卡 | 網格尺寸 | 長寬比 | 軟性時限 $T_{\text{soft}}$ | Undo 配額 $U_{\text{quota}}$ | 保底分 $P_{\text{base}}$ | Perfect 獎勵 $P_{\text{perf}}$ |
|:---:|:---:|:---:|:---|:---:|:---:|:---:|:---:|:---:|:---:|
| **01** | 1 (Cargo) | 1 | Microban #44 | 5x3 | 1.67 | $60\text{ s}$ | 2 次 | 200 | 300 |
| **02** | 1 (Cargo) | 2 | Microban #14 | 7x6 | 1.17 | $72\text{ s}$ | 3 次 | 200 | 300 |
| **03** | 1 (Cargo) | 2 | Microban #21 | 7x6 | 1.17 | $74\text{ s}$ | 3 次 | 200 | 300 |
| **04** | 1 (Cargo) | 2 | Microban #11 | 9x8 | 1.12 | $76\text{ s}$ | 3 次 | 200 | 300 |
| **05** | 1 (Cargo) | 2 | Microban #12 | 9x8 | 1.12 | $78\text{ s}$ | 3 次 | 200 | 300 |
| **06** | 2 (Cyber) | 3 | minicosmos #3 | 8x8 | 1.00 | $180\text{ s}$ | 5 次 | 400 | 500 |
| **07** | 2 (Cyber) | 3 | minicosmos #10 | 8x8 | 1.00 | $182\text{ s}$ | 5 次 | 400 | 500 |
| **08** | 2 (Cyber) | 3 | minicosmos #12 | 9x8 | 1.12 | $184\text{ s}$ | 6 次 | 400 | 500 |
| **09** | 2 (Cyber) | 3 | minicosmos #18 | 10x9 | 1.11 | $186\text{ s}$ | 6 次 | 400 | 500 |
| **10** | 2 (Cyber) | 3 | minicosmos #33 | 9x7 | 1.29 | $188\text{ s}$ | 6 次 | 400 | 500 |
| **11** | 2 (Cyber) | 4 | microcosmos #1 | 9x7 | 1.29 | $210\text{ s}$ | 7 次 | 400 | 500 |
| **12** | 2 (Cyber) | 4 | microcosmos #8 | 8x8 | 1.00 | $212\text{ s}$ | 7 次 | 400 | 500 |
| **13** | 2 (Cyber) | 4 | microcosmos #9 | 9x9 | 1.00 | $214\text{ s}$ | 7 次 | 400 | 500 |
| **14** | 2 (Cyber) | 4 | microcosmos #13 | 8x8 | 1.00 | $216\text{ s}$ | 7 次 | 400 | 500 |
| **15** | 2 (Cyber) | 4 | microcosmos #15 | 10x9 | 1.11 | $218\text{ s}$ | 7 次 | 400 | 500 |
| **16** | 2 (Cyber) | 5 | microcosmos #6 | 8x8 | 1.00 | $240\text{ s}$ | 8 次 | 400 | 500 |
| **17** | 2 (Cyber) | 5 | microcosmos #11 | 9x8 | 1.12 | $242\text{ s}$ | 8 次 | 400 | 500 |
| **18** | 2 (Cyber) | 5 | microcosmos #21 | 9x9 | 1.00 | $244\text{ s}$ | 8 次 | 400 | 500 |
| **19** | 2 (Cyber) | 5 | microcosmos #24 | 10x9 | 1.11 | $246\text{ s}$ | 8 次 | 400 | 500 |
| **20** | 2 (Cyber) | 5 | microcosmos #26 | 10x10 | 1.00 | $248\text{ s}$ | 9 次 | 400 | 500 |
| **21** | 3 (Steel) | 6 | Original-Plus-Extra #18 | 16x14 | 1.14 | $250\text{ s}$ | 9 次 | 600 | 700 |
| **22** | 3 (Steel) | 6 | Original-Plus-Extra #1 | 19x11 | 1.73 | $252\text{ s}$ | 9 次 | 600 | 700 |
| **23** | 3 (Steel) | 8 | Original-Plus-Extra #42 | 11x11 | 1.00 | $284\text{ s}$ | 10 次 | 600 | 700 |
| **24** | 3 (Steel) | 8 | Original-Plus-Extra #85 | 19x12 | 1.58 | $286\text{ s}$ | 10 次 | 600 | 700 |
| **25** | 3 (Steel) | 9 | Original-Plus-Extra #48 | 19x11 | 1.73 | $303\text{ s}$ | 11 次 | 600 | 700 |
| **26** | 3 (Steel) | 9 | Original-Plus-Extra #49 | 19x15 | 1.27 | $305\text{ s}$ | 11 次 | 600 | 700 |
| **27** | 3 (Steel) | 10 | Original-Plus-Extra #6 | 12x11 | 1.09 | $322\text{ s}$ | 11 次 | 600 | 700 |
| **28** | 3 (Steel) | 10 | Original-Plus-Extra #2 | 14x10 | 1.40 | $324\text{ s}$ | 12 次 | 600 | 700 |
| **29** | 3 (Steel) | 10 | Original-Plus-Extra #84 | 14x13 | 1.08 | $326\text{ s}$ | 12 次 | 600 | 700 |
| **30** | 3 (Steel) | 10 | Original-Plus-Extra #90 | 17x13 | 1.31 | $328\text{ s}$ | 12 次 | 600 | 700 |
| **31** | 3 (Steel) | 10 | Original-Plus-Extra #93 | 17x10 | 1.70 | $330\text{ s}$ | 12 次 | 600 | 700 |
| **32** | 3 (Steel) | 11 | Original-Plus-Extra #7 | 13x12 | 1.08 | $347\text{ s}$ | 13 次 | 600 | 700 |
| **33** | 3 (Steel) | 11 | Original-Plus-Extra #19 | 19x13 | 1.46 | $349\text{ s}$ | 13 次 | 600 | 700 |
| **34** | 3 (Steel) | 11 | Original-Plus-Extra #3 | 17x10 | 1.70 | $351\text{ s}$ | 13 次 | 600 | 700 |
| **35** | 3 (Steel) | 12 | Original-Plus-Extra #91 | 16x12 | 1.33 | $368\text{ s}$ | 14 次 | 600 | 700 |
| **36** | 3 (Steel) | 12 | Original-Plus-Extra #5 | 17x13 | 1.31 | $370\text{ s}$ | 14 次 | 600 | 700 |
| **37** | 3 (Steel) | 12 | Original-Plus-Extra #89 | 17x13 | 1.31 | $372\text{ s}$ | 14 次 | 600 | 700 |
| **38** | 3 (Steel) | 12 | Original-Plus-Extra #94 | 16x14 | 1.14 | $374\text{ s}$ | 14 次 | 600 | 700 |
| **39** | 3 (Steel) | 12 | Original-Plus-Extra #54 | 16x15 | 1.07 | $376\text{ s}$ | 14 次 | 600 | 700 |
| **40** | 3 (Steel) | 12 | Original-Plus-Extra #86 | 19x12 | 1.58 | $378\text{ s}$ | 14 次 | 600 | 700 |
| **41** | 4 (Mega) | 13 | Sasquatch #6 | 15x12 | 1.25 | $395\text{ s}$ | 14 次 | 800 | 900 |
| **42** | 4 (Mega) | 13 | Sasquatch #24 | 14x14 | 1.00 | $397\text{ s}$ | 14 次 | 800 | 900 |
| **43** | 4 (Mega) | 14 | Sasquatch #42 | 19x17 | 1.12 | $414\text{ s}$ | 15 次 | 800 | 900 |
| **44** | 4 (Mega) | 14 | Sasquatch #32 | 24x16 | 1.50 | $416\text{ s}$ | 15 次 | 800 | 900 |
| **45** | 4 (Mega) | 15 | Sasquatch #48 | 23x17 | 1.35 | $433\text{ s}$ | 16 次 | 800 | 900 |
| **46** | 4 (Mega) | 16 | Sasquatch #41 | 24x14 | 1.71 | $450\text{ s}$ | 16 次 | 800 | 900 |
| **47** | 4 (Mega) | 17 | Sasquatch #28 | 21x13 | 1.61 | $467\text{ s}$ | 17 次 | 800 | 900 |
| **48** | 4 (Mega) | 18 | Sasquatch #29 | 22x16 | 1.38 | $484\text{ s}$ | 18 次 | 800 | 900 |
| **49** | 4 (Mega) | 19 | Sasquatch #25 | 18x14 | 1.29 | $501\text{ s}$ | 18 次 | 800 | 900 |
| **50** | 4 (Mega) | 20 | Sasquatch #39 | 23x17 | 1.35 | $518\text{ s}$ | 18 次 | 800 | 900 |
