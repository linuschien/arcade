# US-05 台灣16張麻將模組 (Taiwanese 16-Tile Mahjong Module)

## 背景 (Background)
台灣16張麻將是 Arcade Stadium 平台上的第四個經典棋牌益智子遊戲。本模組規範 144 張牌庫結構、起手配牌與補花流程、16 張「5 面子 + 1 眼 ($17+K$ 張)」胡牌型態驗證、動作優先權仲裁（吃碰槓胡）、四種槓牌與搶槓、500底/200台經典台數互斥結算、智慧聽牌與自動摸打託管、海底 16 張鐵牌流局、向聽數牌效推進與危險度棄胡防守 AI 引擎、搬風抓位、擲骰開門、四圈一將流轉、連莊下莊狀態機、10,000 點籌碼扣完續幣制以及圈風門風判定。

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

## US-05-02：16 張胡牌型態驗證（5 面子 + 1 眼，$17+K$ 張總牌數公式）(Winning Hand Validation)

**身份**： 規則判定引擎 (Rule Engine)

> **As a** 規則判定引擎，  
> **I want to** 在玩家摸牌或宣告胡牌時驗證是否滿足「5 面子 + 1 對子（眼）」並計算精確總牌張數，  
> **So that** 精準判定是否達成合法胡牌條件並避免槓牌張數誤解。

### 驗收條件 (Acceptance Criteria)
- **AC1 (Standard Hand $17+K$ Tiles)**：
  - 判定玩家手牌與門前副露（吃、碰、槓）組合，總計須構成 5 組順子/刻子/槓子與 1 組對子。
  - 總牌張數精確公式為 **$\text{總張數} = 17 + K \text{ 張}$**（$K \in [0, 4]$ 為槓牌組數；無槓牌時為 17 張，每宣告 1 組槓牌總張數即 $+1$ 張）。
- **AC2 (Special Hand Eight Pairs)**：支援特殊牌型「嚦咕嚦咕（八對半）」（8 組對子 + 1 張單張，且手牌必須全門清無任何副露，$K=0$，精確 17 張）。
- **AC3 (False Hu Penalty)**：若玩家宣告胡牌但不符合上述型態，判定為「詐胡」，需賠付三家點數（每家賠付 500 底 $+ 5$ 台 $\times 200 = 1500$ 點）。

---

## US-05-03：玩家動作優先權仲裁（吃、碰、槓、胡）(Action Priority Arbitration)

**身份**： 狀態機仲裁器 (State Machine Arbitrator)

> **As a** 狀態機仲裁器，  
> **I want to** 當有人打出牌時，依據優先權順序收集並裁決四家宣告，  
> **So that** 確保遊戲流程嚴格符合台灣麻將的動態競爭規則。

### 驗收條件 (Acceptance Criteria)
- **AC1 (Priority Hierarchy)**：動作優先權為：**胡牌（榮和） $>$ 碰牌 / 明槓 $>$ 吃牌**。
- **AC2 (Chow Restriction)**：「吃牌」僅限由打牌者的正下家（順時針下一位）執行。
- **AC3 (Intercept Win / No Double-Ron)**：當多家同時宣告胡牌時，依據出牌者順時針方向由最近的玩家獲勝（無一砲多響規則，採「攔胡」機制）。
- **AC4 (Turn Jump on Pong/Kong)**：玩家宣告碰牌/槓牌後，跳過吃牌者的摸牌順序，輪由碰/槓牌者打出下一張牌。

---

## US-05-04：暗槓、明槓、加槓與補牌機制 (Kong Operations & Robbing Kong)

**身份**： 遊戲流程引擎 (Game Engine)

> **As a** 遊戲流程引擎，  
> **I want to** 處理玩家的各種槓牌行為並執行牌尾補牌，  
> **So that** 確保手牌張數平衡（每組槓牌 $+1$ 張）並觸發相關槓牌台數與搶槓胡。

### 驗收條件 (Acceptance Criteria)
- **AC1 (Concealed Kong)**：手牌 4 張相同時允許宣告「暗槓」（牌面覆蓋），自牌尾補摸 1 張牌。暗槓不可被搶槓。
- **AC2 (Melded Kong)**：手牌 3 張相同遇別家打出第 4 張時允許宣告「大明槓」，自牌尾補摸 1 張牌。
- **AC3 (Added Kong)**：已碰出的 3 張牌遇自己摸到第 4 張時允許宣告「加槓（補槓）」，自牌尾補摸 1 張牌。
- **AC4 (Robbing Kong Win)**：其他玩家可在加槓宣告當下宣告「搶槓胡」（結算額外 $+1$ 台）；若無人搶槓，槓牌者打出一張牌繼續牌局。

---

## US-05-05：台灣麻將 500底/200台 役種互斥與不重複計台結算 (Mutual Exclusion Fan Calculation)

**身份**： 計分系統 (Scoring System)

> **As a** 計分系統，  
> **I want to** 嚴格遵循「從高不計低、上位役涵蓋下位役不重複計台」原則結算總台數，  
> **So that** 依據 500底/200台 精準結算各家輸贏點數。

### 驗收條件 (Acceptance Criteria)
- **AC1 (Scoring Formula)**：結算得分為 $500 + 200 \times \text{總台數}$。自摸由其餘三家各付一份，放銃由放銃者單獨賠付一份。
- **AC2 (Banker Fans)**：莊家自摸/胡牌加 1 台；連莊 $N$ 次額外加 $2N$ 台（連一拉一 3 台、連二拉二 5 台...）。
- **AC3 (Mutual Exclusion & Hierarchy Rules)**：
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
- **AC4 (Independent Hand & Situational Fans)**：平胡（2台）、混一色（4台）、碰碰胡（4台）、槓上開花（1台）、海底撈月（1台）、搶槓（1台）、天胡（16台）、地胡（8台）、人胡（8台）。

---

## US-05-06：智慧聽牌提示與自動摸打託管模式 (Smart Ting & Auto-Draw Mode)

**身份**： 玩家輔助系統 (Player Assistant System)

> **As a** 玩家，  
> **I want to** 即時看到聽牌張提示，並可選擇開啟「自動摸打託管」模式自動摸牌與胡牌，  
> **So that** 聽牌後享受流暢極速的自動博弈體驗。

### 驗收條件 (Acceptance Criteria)
- **AC1 (Smart Ting Tile Display)**：手牌達成聽牌時，系統實時於手牌上方標記所有「可胡之聽牌張」與牌庫「剩餘張數」。
- **AC2 (Auto-Draw Mode Activation)**：玩家聽牌後可點擊開啟「聽牌託管 (Auto Mode)」，系統接管後續摸打：
  - 若摸進非胡牌張，系統自動打出該摸進之牌。
  - 若摸進胡牌張（自摸）或別家打出聽牌張（榮和），系統毫秒級自動宣告胡牌並結算。
- **AC3 (Pass Lockout Trigger & Release)**：若未開啟自動託管時別家打出聽牌張而玩家過水，鎖定該玩家榮和權利，直到玩家重新自摸打出非胡張為止。

---

## US-05-07：流局（荒莊）與海底 16 張鐵牌限制 (Dead Wall & Draw Game)

**身份**： 牌局管理器 (Round Manager)

> **As a** 牌局管理器，  
> **I want to** 在牌庫摸至最後 16 張時強制結束牌局，  
> **So that** 維持台灣麻將「海底保留 16 張鐵牌（不可摸）」的流局規則。

### 驗收條件 (Acceptance Criteria)
- **AC1 (16 Iron Tiles Limit)**：牌庫剩餘張數扣除槓牌補牌數後，達到 16 張時即停止摸牌。
- **AC2 (Draw Game Trigger)**：最後一位打出牌的玩家若無人胡牌，宣告「流局（荒莊）」。
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

## US-05-11：搬風抓位與開局東南西北座位確認 (Seating Draw & Wind Assignment)

**身份**： 遊戲裁判系統 (Referee System)

> **As a** 遊戲裁判系統，  
> **I want to** 在一將（四圈）開始前執行擲骰與「東南西北」抽籤抓位，  
> **So that** 隨機決定四位玩家的實體坐位與起始風位。

### 驗收條件 (Acceptance Criteria)
- **AC1 (Wind Tile Setup)**：系統洗出「東、南、西、北」四張風牌，覆蓋排成一列。
- **AC2 (Temporary East Dice Roll)**：任意指定一位玩家擲三顆骰子，點數總和自該玩家起逆時針計算至對應玩家（自一、對五、右三、左七），該玩家成為「臨時東風位」。
- **AC3 (Draw & Seat Positioning)**：臨時東風位翻開第一張風牌並依擲骰單雙數決定由哪一端開始依序摸牌，摸到「東」者入座臨時東風位，其餘依逆時針順序入座「南、西、北」位。

---

## US-05-12：莊家擲骰、開門位置與配牌起點判定 (Banker Dice Roll & Wall Breaking)

**身份**： 發牌控制器 (Dealing Controller)

> **As a** 發牌控制器，  
> **I want to** 在每局開始排牌（每家前面 18 墩共 36 張）後，依莊家擲骰點數判定開門位置，  
> **So that** 精準定位配牌起點與牌尾保留區。

### 驗收條件 (Acceptance Criteria)
- **AC1 (3 Dice Roll Total)**：莊家擲三顆骰子，計算點數總和 $S \in [3, 18]$。
- **AC2 (Wall Breaking Logic)**：依「自一（莊家）、逆時針數至 $S$」決定開門牌牆（5,9,13,17 本家；6,10,14,18 下家；3,7,11,15 對家；4,8,12,16 上家）。
- **AC3 (Wall Offset & Dealing Start)**：在被開門者牌牆由右往左數第 $S+1$ 墩開始抓牌；左側（或起點前方）留作補花與槓牌的「牌尾」。
- **AC4 (Dealing Round & Jump Tile)**：莊家起手順時針各家每次抓 2 墩（4 張），共抓 4 輪，莊家再抓第 17 張（跳牌），三家閒家各補第 16 張。

---

## US-05-13：10,000 點籌碼扣完續關與四圈一將結算 (10,000 Chip Bankroll & Continue)

**身份**： 牌局結算系統 (Match Settlement System)

> **As a** 牌局結算系統，  
> **I want to** 執行 10,000 點籌碼扣完續幣倒數與打滿四圈的總結算，  
> **So that** 營造街機競技的緊張感並記錄最終積分。

### 驗收條件 (Acceptance Criteria)
- **AC1 (Initial Bankroll)**：單次投幣 (1 Coin) 開局獲得 **10,000 點籌碼**。
- **AC2 (Bankruptcy & Continue)**：當玩家點數 $\le 0$ 時，觸發平台 **10 秒 Continue 倒數**。投幣 1 Coin 補充 10,000 點籌碼原地繼續牌局；未續幣則宣告 Game Over。
- **AC3 (4-Wind Flow Progression)**：一將固定由 **「東風圈 $\rightarrow$ 南風圈 $\rightarrow$ 西風圈 $\rightarrow$ 北風圈」** 依序進行。
- **AC4 (Match Over & Leaderboard Summary)**：北風圈北家下莊時，一將正式結束，總籌碼換算為最終結算積分並透過 `ArcadeBridge.emit('GAME_OVER', summary)` 拋出四家總成績上載至 Top 10 排行榜。

---

## US-05-14：連莊（莊家連任）與下莊狀態推進 (Banker Continuity & Succession)

**身份**： 輪替管理模組 (Rotation Module)

> **As a** 輪替管理模組，  
> **I want to** 依據當局勝負結果判定莊家是否「連莊」或「過莊（下莊）」，  
> **So that** 正確累加連莊台數與更新圈風/門風狀態。

### 驗收條件 (Acceptance Criteria)
- **AC1 (Banker Continuity Trigger)**：當局由莊家胡牌、莊家自摸，或發生「流局（荒莊）」時，莊家維持原位，連莊次數 $N = N + 1$（台數計算為 $2N + 1$ 台）。
- **AC2 (Banker Succession Trigger)**：當局由任何一位閒家胡牌（自摸或抓銃）時，莊家下莊，連莊次數歸零。
- **AC3 (Dealer Marker Passing)**：莊家下莊後，將莊家標記順時針移交給下一位玩家，新莊家成為當前小局的「東風門風」。

---

## US-05-15：圈風台與門風台即時役型判定 (Round Wind & Seat Wind Fans)

**身份**： 計分系統 (Scoring System)

> **As a** 計分系統，  
> **I want to** 依據當前牌局的「圈風」與玩家的「門風」判定字牌刻子/槓子台數，  
> **So that** 玩家湊齊對應風牌時獲得正確的番台獎勵。

### 驗收條件 (Acceptance Criteria)
- **AC1 (Round Wind Fan)**：若手牌或副露中擁有與當前「圈風」相符的風牌刻子/槓子（如東風圈拿到東風刻子），結算加 1 台（圈風台；大/小四喜不重複累加）。
- **AC2 (Seat Wind Fan)**：若手牌或副露中擁有與自己當前「門風」相符的風牌刻子/槓子（如坐在南風位拿到南風刻子），結算加 1 台（門風台；大/小四喜不重複累加）。
- **AC3 (Double Wind Fan)**：若圈風與門風相同（如東風圈的莊家拿東風刻子，即「雙東」），結算加 2 台（圈風 1 台 + 門風 1 台）。
