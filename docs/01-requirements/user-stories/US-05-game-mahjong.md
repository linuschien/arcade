# US-05 台灣16張麻將模組 (Taiwanese 16-Tile Mahjong Module)

## 背景 (Background)
台灣16張麻將是 Arcade Stadium 平台上的第四個經典棋牌益智子遊戲。本模組規範 144 張牌庫結構、起手配牌與補花流程、16 張「5 面子 + 1 眼 ($17+K$ 張)」胡牌型態驗證與動作選單防呆、動作優先權仲裁（吃碰槓胡）、四種槓牌與搶槓、500底/200台經典台數互斥結算、智慧聽牌與極速自動摸打託管、海底 16 張鐵牌流局、向聽數牌效推進與危險度棄胡防守 AI 引擎、標準搬風抓位、擲骰開門、四圈一將流轉、連莊下莊狀態機、10,000 點籌碼扣完淘汰制以及門風與正花 1~4 號對應判定。

---

## 角色名詞規範 (Role Terminology)
- **真人玩家 (Human Player / P1)**：由使用者親自操作的單一真實玩家。
- **AI 牌家 (AI Opponent / CPU P2, P3, P4)**：由系統向聽數與防守演算法託管的三位電腦對手。
- **牌家 / 牌咖 (Seat Player)**：圍坐於牌桌四個方位的任一參與者（統稱東家、南家、西家、北家）。
- **莊家 (Banker / Dealer)**：當局擁有首發起手牌（17張）、連莊權利與莊家台責任的牌家。
- **閒家 (Non-Banker Player)**：當局除莊家以外的其他三位牌家。

---

## US-05-01：144 張牌庫結構、起手配牌與自動補花流程 (144 Tiles, Dealing & Flower Replacement)

**身份**： 發牌系統 (Dealing System)

> **As a** 發牌系統，  
> **I want to** 正確初始化 144 張麻將牌庫並依序完成發牌與自動補花，  
> **So that** 遊戲能以合規的 16 張牌局狀態正式開始。

### 驗收條件 (Acceptance Criteria)
- **AC1 (144 Tiles Pool)**：牌庫精確包含 144 張牌（萬、筒、條各 36 張、字牌 28 張：東南西北中發白、花牌 8 張：梅蘭竹菊、春夏秋冬）。
- **AC2 (Dealing Sequence)**：莊家起手配發 17 張牌（含第 17 張跳牌），三家閒家各配發 16 張牌。
- **AC3 (Auto Flower Replacement)**：開局自動偵測手牌中的花牌，依「莊家 $\rightarrow$ 南家 $\rightarrow$ 西家 $\rightarrow$ 北家」順序由牌尾摸牌補花，摸到花牌需連續補牌，播放補花音效，直至四家手牌皆無花牌為止。
- **AC4 (Instant Flower Win Evaluation)**：起手若集齊 8 張花牌直接觸發「八仙過海 (8 台)」自摸胡牌；若一人持 7 張花牌且別家補進最後 1 張花牌，觸發「七搶一 (8 台)」榮和胡牌。

---

## US-05-02：16 張胡牌型態驗證與動作選單防呆 (Winning Hand Validation & Zero False-Hu)

**身份**： 規則判定引擎 (Rule Engine)

> **As a** 規則判定引擎，  
> **I want to** 在牌家摸牌或別家打牌時驗證「5 面子 + 1 眼 ($17+K$ 張)」，並透過 UI 動作選單防呆，  
> **So that** 精準判定合法胡牌條件，從架構上徹底消除詐胡可能。

### 驗收條件 (Acceptance Criteria)
- **AC1 (Standard Hand $17+K$ Tiles)**：
  - 判定手牌與門前副露（吃、碰、槓）組合，總計須構成 5 組順子/刻子/槓子與 1 組對子。
  - 總牌張數精確公式為 **$\text{總張數} = 17 + K \text{ 張}$**（$K \in [0, 4]$ 為槓牌組數；無槓牌時為 17 張，每宣告 1 組槓牌總張數即 $+1$ 張）。
- **AC2 (Special Hand Eight Pairs)**：支援特殊牌型「嚦咕嚦咕（八對半）」（8 組對子 + 1 張單張，且手牌必須全門清無任何副露，$K=0$，精確 17 張）。
- **AC3 (Zero False-Hu via UI Menu)**：當輪到摸牌或別家打出牌時，系統即時驗證規則。僅當手牌符合法定胡牌條件時，UI 才會亮起「胡」按鈕；未滿足條件時「胡」按鈕鎖定不可點擊，保證 0% 詐胡。

---

## US-05-03：牌家動作優先權仲裁（吃、碰、槓、胡）(Action Priority Arbitration)

**身份**： 狀態機仲裁器 (State Machine Arbitrator)

> **As a** 狀態機仲裁器，  
> **I want to** 當有人打出牌時，依據優先權順序收集並裁決四家宣告，  
> **So that** 確保遊戲流程嚴格符合台灣麻將的動態競爭規則。

### 驗收條件 (Acceptance Criteria)
- **AC1 (Priority Hierarchy)**：動作優先權為：**胡牌（榮和） $>$ 碰牌 / 明槓 $>$ 吃牌**。
- **AC2 (Chow Restriction)**：「吃牌」僅限由打牌者的正下家（順時針下一位）執行。
- **AC3 (Intercept Win / No Double-Ron)**：當多家同時宣告胡牌時，依據出牌者順時針方向由最近的牌家獲勝（無一砲多響規則，採「攔胡」機制）。
- **AC4 (Turn Jump on Pong/Kong)**：牌家宣告碰牌/槓牌後，跳過吃牌者的摸牌順序，輪由碰/槓牌者打出下一張牌。

---

## US-05-04：暗槓、明槓、加槓與補牌機制 (Kong Operations & Robbing Kong)

**身份**： 遊戲流程引擎 (Game Engine)

> **As a** 遊戲流程引擎，  
> **I want to** 處理牌家的各種槓牌行為並執行牌尾補牌，  
> **So that** 確保手牌張數平衡（每組槓牌 $+1$ 張）並觸發相關槓牌台數與搶槓胡。

### 驗收條件 (Acceptance Criteria)
- **AC1 (Concealed Kong)**：手牌 4 張相同時允許宣告「暗槓」（牌面覆蓋），自牌尾補摸 1 張牌。暗槓不可被搶槓。
- **AC2 (Melded Kong)**：手牌 3 張相同遇別家打出第 4 張時允許宣告「大明槓」，自牌尾補摸 1 張牌。
- **AC3 (Added Kong)**：已碰出的 3 張牌遇自己摸到第 4 張時允許宣告「加槓（補槓）」，自牌尾補摸 1 張牌。
- **AC4 (Robbing Kong Win)**：其他牌家可在加槓宣告當下宣告「搶槓胡」（結算額外 $+1$ 台）；若無人搶槓，槓牌者打出一張牌繼續牌局。

---

## US-05-05：台灣麻將 500底/200台 莊家責任與役種互斥結算 (Scoring & Settlement Formulas)

**身份**： 計分系統 (Scoring System)

> **As a** 計分系統，  
> **I want to** 依據 500底/200台 精準計算自摸、放銃與莊家 $2N+1$ 台責任，並嚴格執行役種互斥，  
> **So that** 精準結算各家點數與籌碼。

### 驗收條件 (Acceptance Criteria)
- **AC1 (Settlement by Situation)**：
  - **閒家自摸**：另兩位閒家各付 $500 + 200 \times \text{牌型台數}$；莊家支付 $500 + 200 \times (\text{牌型台數} + 2N + 1)$。
  - **莊家自摸**：三位閒家各付 $500 + 200 \times (\text{牌型台數} + 2N + 1)$。
  - **閒家胡閒家放銃**：放銃閒家單獨賠付 $500 + 200 \times \text{牌型台數}$。
  - **莊閒互抓放銃**：放銃者單獨賠付 $500 + 200 \times (\text{牌型台數} + 2N + 1)$。
- **AC2 (Mutual Exclusion Rules)**：
  - **大三元 (8台)**：不重複累加小三元 (4台) 或單組三元牌刻子 (各1台)。
  - **小三元 (4台)**：不重複累加該 2 組三元牌刻子 (各1台)。
  - **大四喜 (16台)**：不重複累加小四喜 (8台)、圈風台 (1台) 或門風台 (1台)。
  - **小四喜 (8台)**：不重複累加該 3 組風牌之圈風/門風台。
  - **字一色 (16台)**：不重複累加清一色 (8台)、混一色 (4台) 或碰碰胡 (4台)。
  - **清一色 (8台)**：不重複累加混一色 (4台)。
  - **門清自摸 (3台)**：固定 3 台，不重複累加門清 (1台) 與自摸 (1台)。
  - **八仙過海 / 七搶一 (8台)**：以 8 台封頂即時結算，不重複累加正花 (1台) 或花槓 (2台)。
  - **花槓 (2台)**：以整套 2 台計，不重複累加該套內的正花 (1台)。
  - **嚦咕嚦咕 (8台)**：不重複累加門清 (1台)、平胡 (2台) 或碰碰胡 (4台)。
- **AC3 (Independent Hand & Situational Fans)**：平胡（2台）、混一色（4台）、碰碰胡（4台）、槓上開花（1台）、海底撈月（1台）、搶槓（1台）、天胡（16台）、地胡（8台）、人胡（8台）。

---

## US-05-06：智慧聽牌提示與極速自動摸打託管模式 (Smart Ting & Accelerated Auto-Draw Mode)

**身份**： 玩家輔助系統 (Player Assistant System)

> **As a** 玩家，  
> **I want to** 即時看到聽牌張提示，並可選擇開啟「極速自動摸打託管」模式自動摸牌與胡牌，  
> **So that** 聽牌後享受快節奏且一氣呵成的自動博弈體驗。

### 驗收條件 (Acceptance Criteria)
- **AC1 (Smart Ting Tile Display)**：手牌達成聽牌時，系統實時於手牌上方標記所有「可胡之聽牌張」與牌庫「剩餘張數」。
- **AC2 (Accelerated Auto-Draw & Non-Cancellable)**：真人玩家聽牌後可點擊開啟「聽牌託管 (Auto Mode)」，系統接管後續摸打：
  - 牌局摸打節奏立即加速，手牌鎖定。
  - 摸進非胡牌張時，系統即時自動打出該摸進之牌。
  - 摸進胡牌張（自摸）或別家打出聽牌張（榮和）時，系統毫秒級自動宣告胡牌並進入結算。
  - 託管模式一旦啟用即鎖定持續至本局結束（胡牌或流局），中途不提供解除按鈕。
- **AC3 (Pass Lockout Trigger & Release)**：若未開啟自動託管時別家打出聽牌張而牌家過水，鎖定該牌家榮和權利，直到牌家重新自摸打出非胡張為止。

---

## US-05-07：流局（荒莊）與海底 16 張鐵牌限制 (Dead Wall & Draw Game)

**身份**： 牌局管理器 (Round Manager)

> **As a** 牌局管理器，  
> **I want to** 在牌庫摸至最後 16 張時強制結束牌局，  
> **So that** 維持台灣麻將「海底保留 16 張鐵牌（不可摸）」的流局規則。

### 驗收條件 (Acceptance Criteria)
- **AC1 (16 Iron Tiles Limit)**：牌庫剩餘張數扣除槓牌補牌數後，達到 16 張時即停止摸牌。
- **AC2 (Draw Game Trigger)**：最後一位打出牌的牌家若無人胡牌，宣告「流局（荒莊）」。
- **AC3 (Banker Retain on Draw)**：流局時莊家連莊（連莊次數 $N = N + 1$），不進行任何底台輸贏結算。

---

## US-05-08：AI 牌效最大化演算法（向聽數與進張數計算）(AI Shanten & Tile Acceptance)

**身份**： 麻將 AI 決策系統 (Mahjong AI Engine)

> **As a** 麻將 AI 決策系統，  
> **I want to** 計算每張手牌打出後的向聽數（Shanten）與有效進張數，  
> **So that** AI 能在非防守狀態下以最高期望值推進手牌至聽牌狀態。

### 驗收條件 (Acceptance Criteria)
- **AC1 (Shanten Evaluation)**：AI 遍歷當前手牌，計算打出任一張牌後的向聽數 $S$（距離聽牌差幾步）。
- **AC2 (Min Shanten Branching)**：優先保留使得向聽數最小化（$\min S$）的打牌決策分支。
- **AC3 (Tile Acceptance Maximization)**：當多個出牌選項向聽數相同時，計算剩餘牌庫與可見牌中該分支的「最大有效進張數 (Acceptance Count)」，選擇進張機率最高者打出。

---

## US-05-09：AI 防守與危險度評估（現物、筋牌與棄胡）(AI Defense & Danger Level Rating)

**身份**： 麻將 AI 決策系統 (Mahjong AI Engine)

> **As a** 麻將 AI 決策系統，  
> **I want to** 在對手展現聽牌跡象（副露多、聽牌宣告或末巡）時評估手牌危險度，  
> **So that** 降低放銃（放槍）機率並執行棄胡防守。

### 驗收條件 (Acceptance Criteria)
- **AC1 (Defense Trigger)**：當 AI 自身向聽數 $> 2$ 且場上有對手副露 $\ge 3$ 組或牌庫剩餘 $< 30$ 張時，強制切換為防守模式。
- **AC2 (Danger Level Hierarchy)**：安全度評級嚴格依序為：**現物（該家棄牌池已出牌，100% 安全） $>$ 筋牌（Suji 4-7、2-5、3-6 兩面防禦） $>$ 字牌死張 $>$ 早期打出周邊牌**。
- **AC3 (Safest Discard Selection)**：防守模式下，AI 優先由手牌中挑選危險評分最低（安全度最高）的牌打出。

---

## US-05-10：AI 鳴牌（吃、碰、槓）期望值決策引擎 (AI Meld EV Engine)

**身份**： 麻將 AI 決策系統 (Mahjong AI Engine)

> **As a** 麻將 AI 決策系統，  
> **I want to** 評估別家打出牌時是否值得執行吃、碰、槓操作，  
> **So that** 避免為低收益副露破壞門清或縮減手牌防守彈性。

### 驗收條件 (Acceptance Criteria)
- **AC1 (Concealed Value Evaluation)**：若目前為門清狀態，評估鳴牌後是否會破壞「門清/平胡/門清自摸」台數；若鳴牌後預期總台數 $< 2$ 台且向聽數未顯著推進至聽牌，AI 選擇 Pass。
- **AC2 (Honor Tile Pong Preference)**：遇圈風、門風、中發白等役牌對子時，評估碰牌後能獲得固定 1 台，優先級調高。
- **AC3 (Kong Risk Evaluation)**：暗槓正常執行；明槓/加槓若場上有其他家處於聽牌狀態，AI 評估被搶槓或給予對手摸牌機會之風險，降低槓牌意願。

---

## US-05-11：標準搬風抓位與開局風位入座確認 (Standard Seating Draw & Seating)

**身份**： 遊戲裁判系統 (Referee System)

> **As a** 遊戲裁判系統，  
> **I want to** 在一將開局時洗出「東南西北」風牌並由擲骰者依序抽籤，  
> **So that** 隨機決定四位牌家的實體坐位與起始風位。

### 驗收條件 (Acceptance Criteria)
- **AC1 (Wind Tile Setup)**：系統洗出「東、南、西、北」四張風牌，背面朝上覆蓋排成一列。
- **AC2 (First Drawer Selection via Modulo)**：
  - 真人玩家擲 3 顆骰子（點數和 $S \in [3, 18]$），計算起抽位置 $(S - 1) \bmod 4$。
  - 餘數 0 (點數 5,9,13,17)：擲骰者本人為第 1 順位抽牌者。
  - 餘數 1 (點數 6,10,14,18)：下家（逆時針下一位）為第 1 順位。
  - 餘數 2 (點數 3,7,11,15)：對家為第 1 順位。
  - 餘數 3 (點數 4,8,12,16)：上家為第 1 順位。
- **AC3 (Draw & Seat Allocation)**：
  - 四位牌家自第 1 順位者起，依逆時針順序每人各抽一張覆蓋的風牌。
  - 抽到「東」者入座本局 **東風位（起始莊家）**。
  - 抽到「南」者入座東家右方 **南風位**；抽到「西」者入座東家對面 **西風位**；抽到「北」者入座東家左方 **北風位**。

---

## US-05-12：莊家擲骰、開門位置與配牌起點判定 (Banker Dice Roll & Wall Breaking)

**身份**： 發牌控制器 (Dealing Controller)

> **As a** 發牌控制器，  
> **I want to** 在每局開始排牌（每家前面 18 墩共 36 張）後，依莊家擲骰點數判定開門位置，  
> **So that** 精準定位配牌起點與牌尾保留區。

### 驗收條件 (Acceptance Criteria)
- **AC1 (3 Dice Roll Total)**：莊家擲三顆骰子，計算點數總和 $S \in [3, 18]$。
- **AC2 (Wall Breaking Logic via Modulo)**：依 $(S - 1) \bmod 4$ 決定開門牌牆（餘數 0 莊家本家；餘數 1 下家；餘數 2 對家；餘數 3 上家）。
- **AC3 (Wall Offset & Dealing Start)**：在被開門者牌牆由右往左數第 $S+1$ 墩開始抓牌；左側（或起點前方）留作補花與槓牌之「牌尾」。
- **AC4 (Dealing Round & Jump Tile)**：莊家起手順時針各家每次抓 2 墩（4 張），共抓 4 輪，莊家再抓第 17 張（跳牌），三家閒家各補第 16 張。

---

## US-05-13：10,000 點籌碼扣完淘汰與四圈一將結算 (10,000 Chip Bankroll & Settlement)

**身份**： 牌局結算系統 (Match Settlement System)

> **As a** 牌局結算系統，  
> **I want to** 執行 10,000 點籌碼扣完淘汰判定與打滿四圈的總結算，  
> **So that** 營造街機競技的緊張感並記錄最終積分。

### 驗收條件 (Acceptance Criteria)
- **AC1 (Initial Bankroll)**：單次投幣 (1 Coin) 開局獲得 **10,000 點籌碼**。
- **AC2 (Bankruptcy Game Over)**：當真人玩家籌碼點數 $\le 0$（破產）時，立即判定 Game Over，發送 `ArcadeBridge.emit('GAME_OVER', summary)` 結束遊戲並結算戰績。
- **AC3 (4-Wind Flow Progression)**：一將固定由 **「東風圈 $\rightarrow$ 南風圈 $\rightarrow$ 西風圈 $\rightarrow$ 北風圈」** 依序進行。
- **AC4 (Match Over & Leaderboard Summary)**：北風圈北家下莊時，一將正式結束，總籌碼換算為最終結算積分並透過 `ArcadeBridge.emit('GAME_OVER', summary)` 拋出四家總成績上載至 Top 10 排行榜。

---

## US-05-14：連莊（莊家連任）與下莊狀態推進 (Banker Continuity & Succession)

**身份**： 輪替管理模組 (Rotation Module)

> **As a** 輪替管理模組，  
> **I want to** 依據當局勝負結果判定莊家是否「連莊」或「過莊（下莊）」，  
> **So that** 正確累加連莊台數與更新圈風/門風狀態。

### 驗收條件 (Acceptance Criteria)
- **AC1 (Banker Continuity Trigger)**：當局由莊家胡牌、莊家自摸，或發生「流局（荒莊）」時，莊家維持原位，連莊次數 $N = N + 1$（莊家責任加計 $2N + 1$ 台）。
- **AC2 (Banker Succession Trigger)**：當局由任何一位閒家胡牌（自摸或抓銃）時，莊家下莊，連莊次數歸零。
- **AC3 (Dealer Marker Passing)**：莊家下莊後，將莊家標記順時針移交給下一位牌家，新莊家成為當前小局的「東風門風」。

---

## US-05-15：圈風台、門風台與 1~4 號正花台判定 (Wind & Flower Fan Rules)

**身份**： 計分系統 (Scoring System)

> **As a** 計分系統，  
> **I want to** 依據當局莊家為東之動態門風、圈風以及花牌 1~4 號對應判定台數，  
> **So that** 牌家湊齊對應風牌與正花時獲得正確的番台獎勵。

### 驗收條件 (Acceptance Criteria)
- **AC1 (Banker is East & Dynamic Seat Wind)**：
  - 每小局**以當局莊家所在位置為【東風門風】**（正花為 1 號 春/梅）。
  - 莊家右手邊（下家）為 **【南風門風】**（正花為 2 號 夏/蘭）。
  - 莊家對面（對家）為 **【西風門風】**（正花為 3 號 秋/竹）。
  - 莊家左手邊（上家）為 **【北風門風】**（正花為 4 號 冬/菊）。
  - 下莊移交莊標記時，門風與正花歸屬**隨新莊家位置同步逆時針旋轉**。
- **AC2 (Wind Fan Scoring Rules)**：
  - 手牌/副露擁有與當前「圈風」相符之刻子/槓子，加 1 台（圈風台）。
  - 手牌/副露擁有與自己當局「門風」相符之刻子/槓子，加 1 台（門風台）。
  - 圈風與門風相同（如東風圈東家持東風刻子），加 2 台（雙東台；大/小四喜不重複累加）。
- **AC3 (Seat Flower 1~4 Rules)**：
  - 1 號花（春、梅）歸屬當局東風位（莊家正花，每張 1 台）。
  - 2 號花（夏、蘭）歸屬當局南風位（下家正花，每張 1 台）。
  - 3 號花（秋、竹）歸屬當局西風位（對家正花，每張 1 台）。
  - 4 號花（冬、菊）歸屬當局北風位（上家正花，每張 1 台）。
  - 摸到非自己門風之花牌為爛花（0 台），僅供補牌。
- **AC4 (Flower Kong & Special Flower Wins)**：
  - 集齊四季（春夏秋冬）或四君子（梅蘭竹菊）全套 4 張，計花槓 2 台（取代該套正花）。
  - 集齊 8 張花牌觸發八仙過海（8 台封頂）；持 7 張花牌別家補進最後 1 張花牌觸發七搶一（8 台封頂）。

