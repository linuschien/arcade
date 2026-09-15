# PRD-06: 街機倉庫番 (Sokoban 50 Game PRD)

## 1. 遊戲願景與定位 (Overview & Arcade Vision)

《街機倉庫番（Sokoban 50）》是 Arcade Stadium 平台上的第六款經典益智推箱遊戲。不同於傳統倉庫番常因直幅或狹長地圖而在現代寬螢幕上留下巨大死黑邊，本作採用專為 **16:9 街機寬螢幕（$1280 \times 720\text{ px}$）** 量身打造的「三欄式框體佈局」與「沙盤美學渲染管線 (Floating Diorama Pipeline)」，將核心解謎棋盤置於中央 4:3 區域，兩側配置高度專業的街機儀表板（HUD），營造極具沉浸感的高階街機推箱體驗。

遊戲規劃 50 個由淺入深的精選關卡，橫跨四大經典主題世界（貨棧、工廠、賽博金庫、巨型碼頭）。機制上融合了推箱粒度 Undo、正交直角死鎖警報、長按棄局、軟性長考計時器、防刷分通關結算、10 萬分固定 1UP 獎命，以及獨創的「兩位數關卡分數隱寫術」，讓玩家在純粹的幾何與空間邏輯推演中，享受街機硬派競技與通關榮耀。

---

## 2. 畫面視覺架構與沙盤渲染管線 (Visual & Screen Architecture)

### 2.1 全域畫布與三欄式佈局 (Canvas Layout)

* **基準解析度：** $1280 \times 720\text{ px}$（標準 16:9 街機寬螢幕）。
* **結構劃分：** 採用左右對稱雙翼 HUD 與中央 4:3 核心棋盤之三欄式設計。徹底消除多餘標籤，排行榜最高分僅於平台大廳展示，遊戲內維持乾淨專注。

```text
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│ 16:9 ARCADE CANVAS ( 1280 x 720 px )                                                        │
│                                                                                             │
│ ┌──────────────────┐  ┌────────────────────────────────────────────────┐  ┌──────────────────┐ │
│ │  LEFT FLANK HUD  │  │            CENTER PLAYFIELD ( 4:3 )            │  │  RIGHT FLANK HUD │ │
│ │  ( 200 x 660 px )│  │                ( 880 x 660 px )                │  │  ( 200 x 660 px )│ │
│ ├──────────────────┤  ├────────────────────────────────────────────────┤  ├──────────────────┤ │
│ │                  │  │                                                │  │                  │ │
│ │ [WORLD THEME]    │  │    [ 主題環境底圖平鋪 (Ambient Backdrop) ]     │  │ [CURRENT SCORE]  │ │
│ │ WORLD 02         │  │                                                │  │ SCORE:           │ │
│ │ STEEL WORKS      │  │        ┌── 外牆陰影 (Drop Shadow) ──┐          │  │ 0,420,100        │ │
│ │                  │  │        │                            │          │  │                  │ │
│ │ [STAGE]          │  │        │   ######                   │          │  │ [LIVES]          │ │
│ │ STAGE 18 / 50    │  │        │   #  $ #    (核心迷宮)     │          │  │ ▲ ▲ ▲ (3)        │ │
│ │                  │  │        │   # .@ #                   │          │  │                  │ │
│ │ [SOFT TIMER]     │  │        │   ######                   │          │  │ [EXTEND PROGRESS]│ │
│ │ 02:45            │  │        │                            │          │  │ 42,000 / 100,000 │ │
│ │ [██████████░░░░] │  │        └────────────────────────────┘          │  │                  │ │
│ │                  │  │                                                │  │ [CONTROLS GUIDE] │ │
│ │ [UNDO QUOTA]     │  │                                                │  │ [↑↓←→] MOVE      │ │
│ │ ● ● ● ○ ○        │  │                                                │  │ [Z]    UNDO      │ │
│ │ REMAINING: 3 / 5 │  │                                                │  │ [HOLD R]         │ │
│ │                  │  │       [ 邊緣徑向暗角 (Vignette Mask) ]         │  │ GIVE UP (-1♥)    │ │
│ └──────────────────┘  └────────────────────────────────────────────────┘  └──────────────────┘ │
│                                                                                             │
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
  * 座標與尺寸：錨定於 $(X: 30, Y: 30)$，尺寸 $200 \times 660\text{ px}$，半透明暗黑底板（Alpha 85%）。
  * **主題徽章**：顯示當前世界代號與主題名稱（例如：`WORLD 02: STEEL WORKS`）。
  * **關卡計數**：顯示 `STAGE SS / 50`。
  * **軟性倒數計時器**：顯示分秒 `MM:SS`，三段色彩警示與 $160\text{ px}$ 倒數進度條。
  * **Undo 配額矩陣**：實心點陣圓燈與剩餘數字標籤 `REMAINING: u / U_quota`。
* **右側儀表板 (Right Flank HUD)**：
  * 座標與尺寸：錨定於 $(X: 1050, Y: 30)$，尺寸 $200 \times 660\text{ px}$，半透明暗黑底板（Alpha 85%）。
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
  $$U_{\text{quota}}(S, B, W) = \operatorname{clamp}\left( U_{\text{base}}(W) + \left\lfloor \frac{S - S_{\text{start}}(W)}{4} \right\rfloor + \lfloor B \cdot K_u(W) \rfloor, \quad 3, \quad 16 \right)$$
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

### 4.3 固定階梯 1UP 獎命 (Fixed 100,000 Pts Extend)

* **觸發條件**：累計純得分更新後滿足跨越 100,000 分階梯：
  $$\left\lfloor \frac{\text{RawScore}_{\text{new}}}{100,000} \right\rfloor > \left\lfloor \frac{\text{RawScore}_{\text{old}}}{100,000} \right\rfloor$$
* **獎勵反饋**：
  * 畫面中央彈出金色 `1UP!` 浮動字卡，播放街機獎命音效（`SFX_EXTEND`）。
  * 生命值加 1（$\text{Lives} \leftarrow \text{Lives} + 1$）。
  * 右側 HUD 獎命進度條重置並重新累積下一個 10 萬分。

### 4.4 兩位數關卡分數隱寫術 (Steganographic Score Encoding)

* **設計背景**：Arcade Stadium 平台排行榜資料表採用通用單一整數分數欄位（`score`）。為同時在排行榜展示「玩家真實實力積分」與「攻克之最高關卡（00～50）」，利用 $\text{RawScore} \pmod{100} \equiv 0$ 的純淨末兩位空位進行隱寫編碼。
* **編碼公式**：
  當 $\text{Lives} = 0$ 觸發 Game Over 或完成第 50 關（ALL CLEAR）時，提交至系統排行榜之唯一整數值：
  $$\text{Score}_{\text{final}} = \left( \left\lfloor \frac{\text{RawScore}}{100} \right\rfloor \times 100 \right) + \operatorname{clamp}(\text{lastClearedStage}, 0, 50)$$
* **標準案例驗證**：
  * **案例 A**：第 1 關未過陣亡（$\text{lastClearedStage} = 0, \text{RawScore} = 800$）$\to \mathbf{800}$。
  * **案例 B**：第 3 關陣亡（通關第 1、2 關，$\text{lastClearedStage} = 2, \text{RawScore} = 3,200$）$\to \mathbf{3,202}$。
  * **案例 C**：第 14 關陣亡（通關至第 13 關，$\text{lastClearedStage} = 13, \text{RawScore} = 28,400$）$\to \mathbf{28,413}$。
  * **案例 D**：第 50 關通關 ALL CLEAR（$\text{lastClearedStage} = 50, \text{RawScore} = 156,000$）$\to \mathbf{156,050}$。

---

## 5. 四大主題世界巡迴與幾何拓撲 (World Progression & Geometric Topology)

### 5.1 四大主題世界（5/20/15/10 陣列）

遊戲 50 關按四大主題世界線性推進，箱數與難度梯級嚴格控制：

* **World 1 (Stage 01～05，Microban，5 關)：**
  * **風格**：木造貨棧（CARGO DEPOT），明亮溫暖，新手入門教學衝刺。
  * **箱數分佈**：嚴格固定為 **`1, 2, 3, 3, 3`** 顆。
* **World 2 (Stage 06～25，Original，20 關)：**
  * **風格**：重工業工廠（STEEL WORKS），經典開闊長廊與多凹槽調度。
  * **箱數分佈**：
    * **4 箱 $\times$ 6 關**（Stage 06～11）
    * **5 箱 $\times$ 7 關**（Stage 12～18）
    * **6 箱 $\times$ 7 關**（Stage 19～25）
* **World 3 (Stage 26～40，Cosmos，15 關)：**
  * **風格**：賽博金庫（CYBER VAULT），高密度微型密室。
  * **箱數分佈**：
    * **4 箱 $\times$ 5 關**（Stage 26～30）
    * **5 箱 $\times$ 5 關**（Stage 31～35）
    * **6 箱 $\times$ 5 關**（Stage 36～40）
  * **特殊演出**：首次進入第 26 關時，觸發全屏紅色警報閃爍、CRT 雜訊掃描與鏡頭拉近（Zoom-in）震撼篇章轉場。
* **World 4 (Stage 41～50，Sasquatch，10 關)：**
  * **風格**：巨型碼頭（MEGA TERMINAL），全域廣角大圖終極決戰。
  * **箱數分佈**：
    * **7 箱 $\times$ 3 關**（Stage 41～43）
    * **8 箱 $\times$ 3 關**（Stage 44～46）
    * **9 箱 $\times$ 2 關**（Stage 47～48）
    * **10 箱 $\times$ 2 關**（Stage 49～50 雙關底壓軸終戰）

### 5.2 幾何拓撲過濾與地圖固化管線 (Geometric Filter & Static Dataset)

* **長寬比與邊長限制**：
  為排除不美觀之直幅或扁平牙膏圖，收錄地圖必須嚴格滿足：
  $$\begin{cases} 1.00 \le \dfrac{W_{\text{grid}}}{H_{\text{grid}}} \le 1.45 & (\text{排除直幅，僅收錄正方形至微橫幅}) \\ W_{\text{grid}} \le W_{\max}(W) \;\land\; H_{\text{grid}} \le H_{\max}(W) & (\text{各世界網格邊長上限}) \end{cases}$$
* **各世界網格邊長上限矩陣**：
  * World 1: $W_{\text{grid}} \le 12, \; H_{\text{grid}} \le 12$
  * World 2: $W_{\text{grid}} \le 16, \; H_{\text{grid}} \le 13$
  * World 3: $W_{\text{grid}} \le 12, \; H_{\text{grid}} \le 12$
  * World 4: $W_{\text{grid}} \le 18, \; H_{\text{grid}} \le 15$
* **構建期靜態固化**：
  由過濾管線於構建期預先自 external-specs 提取並固化為 50 關靜態 JSON 資料集（包含盤面 ASCII 陣列、工人起點、箱數、寬高），遊戲運行時零動態解析開銷。

---

## 6. 平台整合、輸入映射與生命週期契約 (Platform Integration & Controls)

### 6.1 純鍵盤輸入映射 (Input Mapping via InputService)

遵循街機硬體規範，專注純鍵盤精確操作，按鍵行為嚴格對應右側 HUD 實體按鍵指南：

| 實體按鍵 | 遊戲動作 | 行為細節 |
|---|---|---|
| `ArrowUp` | 向上移動 | 工人向上走 1 格；若有箱子則推動箱子 1 格 |
| `ArrowDown` | 向下移動 | 工人向下走 1 格；若有箱子則推動箱子 1 格 |
| `ArrowLeft` | 向左移動 | 工人向左走 1 格；若有箱子則推動箱子 1 格 |
| `ArrowRight` | 向右移動 | 工人向右走 1 格；若有箱子則推動箱子 1 格 |
| `KeyZ` | 執行 Undo | 扣除 1 次配額，盤面瞬間還原至推箱前一刻 |
| `KeyR` (長按 1.0s) | 主動棄局 | 彈出進度條視窗，按滿 1.0 秒扣除 1 命重置關卡 |
| `Escape` | 暫停遊戲 | 觸發遊戲暫停與暫停選單遮罩 |

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
* **Game Over 處理**：
  當 $\text{Lives} = 0$ 時，計算隱寫分數 $\text{Score}_{\text{final}}$，廣播 `GAME_OVER` 事件，隨後銷毀 Canvas 並退回 Arcade Stadium 大廳。
* **程序化 Web Audio 音效**：
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
* **World 1:** $T_{\text{base}}=50\text{s}, K_t=10\text{s}, U_{\text{base}}=2, K_u=0.6, P_{\text{base}}=200, P_{\text{perf}}=300$
* **World 2:** $T_{\text{base}}=100\text{s}, K_t=15\text{s}, U_{\text{base}}=4, K_u=0.5, P_{\text{base}}=400, P_{\text{perf}}=500$
* **World 3:** $T_{\text{base}}=150\text{s}, K_t=25\text{s}, U_{\text{base}}=6, K_u=0.8, P_{\text{base}}=600, P_{\text{perf}}=700$
* **World 4:** $T_{\text{base}}=180\text{s}, K_t=20\text{s}, U_{\text{base}}=6, K_u=0.6, P_{\text{base}}=800, P_{\text{perf}}=900$

| 關卡 $S$ | 世界 $W$ | 箱數 $B$ | 軟性時限 $T_{\text{soft}}$ | Undo 配額 $U_{\text{quota}}$ | 保底分 $P_{\text{base}}$ | Perfect 獎勵 $P_{\text{perf}}$ |
|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **01** | 1 (Cargo Depot) | 1 | $60\text{ s}$ | 3 次 | 200 | 300 |
| **02** | 1 (Cargo Depot) | 2 | $72\text{ s}$ | 3 次 | 200 | 300 |
| **03** | 1 (Cargo Depot) | 3 | $84\text{ s}$ | 3 次 | 200 | 300 |
| **04** | 1 (Cargo Depot) | 3 | $86\text{ s}$ | 3 次 | 200 | 300 |
| **05** | 1 (Cargo Depot) | 3 | $88\text{ s}$ | 4 次 | 200 | 300 |
| **06** | 2 (Steel Works) | 4 | $160\text{ s}$ | 6 次 | 400 | 500 |
| **07** | 2 (Steel Works) | 4 | $162\text{ s}$ | 6 次 | 400 | 500 |
| **08** | 2 (Steel Works) | 4 | $164\text{ s}$ | 6 次 | 400 | 500 |
| **09** | 2 (Steel Works) | 4 | $166\text{ s}$ | 6 次 | 400 | 500 |
| **10** | 2 (Steel Works) | 4 | $168\text{ s}$ | 7 次 | 400 | 500 |
| **11** | 2 (Steel Works) | 4 | $170\text{ s}$ | 7 次 | 400 | 500 |
| **12** | 2 (Steel Works) | 5 | $187\text{ s}$ | 7 次 | 400 | 500 |
| **13** | 2 (Steel Works) | 5 | $189\text{ s}$ | 7 次 | 400 | 500 |
| **14** | 2 (Steel Works) | 5 | $191\text{ s}$ | 8 次 | 400 | 500 |
| **15** | 2 (Steel Works) | 5 | $193\text{ s}$ | 8 次 | 400 | 500 |
| **16** | 2 (Steel Works) | 5 | $195\text{ s}$ | 8 次 | 400 | 500 |
| **17** | 2 (Steel Works) | 5 | $197\text{ s}$ | 8 次 | 400 | 500 |
| **18** | 2 (Steel Works) | 5 | $199\text{ s}$ | 9 次 | 400 | 500 |
| **19** | 2 (Steel Works) | 6 | $216\text{ s}$ | 10 次 | 400 | 500 |
| **20** | 2 (Steel Works) | 6 | $218\text{ s}$ | 10 次 | 400 | 500 |
| **21** | 2 (Steel Works) | 6 | $220\text{ s}$ | 10 次 | 400 | 500 |
| **22** | 2 (Steel Works) | 6 | $222\text{ s}$ | 11 次 | 400 | 500 |
| **23** | 2 (Steel Works) | 6 | $224\text{ s}$ | 11 次 | 400 | 500 |
| **24** | 2 (Steel Works) | 6 | $226\text{ s}$ | 11 次 | 400 | 500 |
| **25** | 2 (Steel Works) | 6 | $228\text{ s}$ | 11 次 | 400 | 500 |
| **26** | 3 (Cyber Vault) | 4 | $250\text{ s}$ | 9 次 | 600 | 700 |
| **27** | 3 (Cyber Vault) | 4 | $252\text{ s}$ | 9 次 | 600 | 700 |
| **28** | 3 (Cyber Vault) | 4 | $254\text{ s}$ | 9 次 | 600 | 700 |
| **29** | 3 (Cyber Vault) | 4 | $256\text{ s}$ | 9 次 | 600 | 700 |
| **30** | 3 (Cyber Vault) | 4 | $258\text{ s}$ | 10 次 | 600 | 700 |
| **31** | 3 (Cyber Vault) | 5 | $285\text{ s}$ | 11 次 | 600 | 700 |
| **32** | 3 (Cyber Vault) | 5 | $287\text{ s}$ | 11 次 | 600 | 700 |
| **33** | 3 (Cyber Vault) | 5 | $289\text{ s}$ | 11 次 | 600 | 700 |
| **34** | 3 (Cyber Vault) | 5 | $291\text{ s}$ | 12 次 | 600 | 700 |
| **35** | 3 (Cyber Vault) | 5 | $293\text{ s}$ | 12 次 | 600 | 700 |
| **36** | 3 (Cyber Vault) | 6 | $320\text{ s}$ | 12 次 | 600 | 700 |
| **37** | 3 (Cyber Vault) | 6 | $322\text{ s}$ | 12 次 | 600 | 700 |
| **38** | 3 (Cyber Vault) | 6 | $324\text{ s}$ | 13 次 | 600 | 700 |
| **39** | 3 (Cyber Vault) | 6 | $326\text{ s}$ | 13 次 | 600 | 700 |
| **40** | 3 (Cyber Vault) | 6 | $328\text{ s}$ | 13 次 | 600 | 700 |
| **41** | 4 (Mega Terminal) | 7 | $320\text{ s}$ | 10 次 | 800 | 900 |
| **42** | 4 (Mega Terminal) | 7 | $322\text{ s}$ | 10 次 | 800 | 900 |
| **43** | 4 (Mega Terminal) | 7 | $324\text{ s}$ | 10 次 | 800 | 900 |
| **44** | 4 (Mega Terminal) | 8 | $346\text{ s}$ | 10 次 | 800 | 900 |
| **45** | 4 (Mega Terminal) | 8 | $348\text{ s}$ | 11 次 | 800 | 900 |
| **46** | 4 (Mega Terminal) | 8 | $350\text{ s}$ | 11 次 | 800 | 900 |
| **47** | 4 (Mega Terminal) | 9 | $372\text{ s}$ | 11 次 | 800 | 900 |
| **48** | 4 (Mega Terminal) | 9 | $374\text{ s}$ | 11 次 | 800 | 900 |
| **49** | 4 (Mega Terminal) | 10 | $396\text{ s}$ | 14 次 | 800 | 900 |
| **50** | 4 (Mega Terminal) | 10 | $398\text{ s}$ | 14 次 | 800 | 900 |

