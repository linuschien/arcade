# US-06 小旋風模組 (New Rally-X Game Module)

## 背景 (Background)
《New Rally-X》（新小旋風）是 Arcade Stadium 平台上的第五部經典復古街機遊戲。本模組完整規範 1981 年 Namco 原版街機之 4 向自動慣性巡航、180 度即時掉頭、連續 3 團煙幕防禦、紅車 Spin-Out 打滑 2.0 秒、燃油消耗與歸零半速懲罰、10 面旗幟（含 S 旗加倍與 L 旗補油）、雷達小地圖迷霧盲區（雷達不顯牆壁與岩石）、4 套經典母迷宮、16 關梯級排布（含 4 關紅車休眠挑戰關）、生命與 20k/80k 加命，以及平台 `IArcadeGame` 與 `ArcadeBridge` 事件契約整合。

---

## US-06-01：4 向慣性巡航、90 度轉向緩衝與 180 度即時掉頭 (Movement & 180° U-Turn)

**身份**： Rally-X 玩家 (Player)

> **As a** 玩家，  
> **I want to** 操作方向鍵控制藍色賽車在通道中自動巡航，並能在路口預先轉向或於直道隨時 180 度原地掉頭，  
> **So that** 我能在狹長錯綜的迷宮中靈活穿梭逃脫追擊，並施展「回頭噴煙」絕技。

### 驗收條件 (Acceptance Criteria)
- **AC1 (Inertial Cruise)**：藍車在迷宮通道中保持定速自動向前行駛，無手動煞車減速機制。
- **AC2 (90-Degree Turn Buffer)**：藍車朝十字或丁字路口行駛時，玩家輸入垂直方向指令（水平改垂直、垂直改水平），系統將指令存入轉向緩衝區；當車輛判定點抵達路口節點且無牆壁阻擋時，瞬間執行 90 度轉彎，過彎無減速、無卡頓延遲。
- **AC3 (Instant 180-Degree U-Turn)**：在任何通道中（無論是否處於路口節點），玩家輸入與當前行駛方向完全相反之方向指令，藍車立即原地 180 度調頭行駛。
- **AC4 (Wall Collision Non-Lethal)**：藍車正面撞擊迷宮牆壁時僅停止行駛（速度歸 0），不爆炸、不扣除生命、不扣減額外燃油；玩家輸入有效通路方向時立即恢復巡航行駛。
- **AC5 (Dead End & T-Junction Navigation)**：若藍車直行駛入死巷，車輛停滯；若在 T 字路口正面撞牆且無預轉向輸入，車輛停滯等待有效轉向輸入；若玩家按住或預先輸入分支方向，車輛自動轉入分支通路。

---

## US-06-02：大型迷宮平滑滾動卷軸與視角置中跟隨 (Camera Centering & Scrolling Viewport)

**身份**： Rally-X 遊戲渲染引擎 (Game Render Engine)

> **As a** 渲染引擎，  
> **I want to** 讓攝影機鏡頭以藍車為中心平滑滾動跟隨，並在迷宮世界邊緣進行限制，  
> **So that** 玩家能以近身視角清晰觀察周遭通道、岩石與逼近的敵車。

### 驗收條件 (Acceptance Criteria)
- **AC1 (Camera Centering)**：主遊戲視窗之攝影機焦點隨時錨定於藍車中心點座標 $(x, y)$。
- **AC2 (Edge Clamping)**：當藍車行駛接近迷宮外圍邊界時，攝影機視角平滑停在世界極限邊界（Clamping），禁止露出地圖外之空白區域。
- **AC3 (Multi-Resolution Viewport)**：無論顯示解析度或比例為何，主視窗維持穩定的 Tile 視野半徑，與右側專屬雷達 HUD 形成無重疊之獨立渲染區域。

---

## US-06-03：煙幕彈釋放、3 團尾流延遲與冷卻防抖 (Smoke Screen Puffs & Defense System)

**身份**： Rally-X 玩家 (Player)

> **As a** 玩家，  
> **I want to** 按下煙幕鍵向車尾連續噴射 3 團濃煙，  
> **So that** 阻擋後方緊追不捨的紅車並使其癱瘓打轉。

### 驗收條件 (Acceptance Criteria)
- **AC1 (Smoke Trigger & Fuel Cost)**：當 $\text{Fuel} \ge 30$ 時，玩家按下 `Space` 或 `BUTTON_A`，系統立即扣除 $30$ 點燃油，並於藍車尾端依序釋放煙幕。
- **AC2 (3 Puffs Sequence)**：單次噴煙動作在藍車後方尾流路徑上連續生成 **3 團煙霧 (3 Smoke Puffs)**，每團煙霧具有獨立的圓形或方形碰撞體積。
- **AC3 (Smoke Duration)**：每團煙霧在生成後於迷宮原地停留維持 **$3.5$ 秒**，倒數結束後執行淡出消散。
- **AC4 (Cooldown & Anti-Spam)**：系統設置 $0.4$ 秒防抖冷卻時間，冷卻時間內重複按鍵不扣燃油、不生成新煙霧。
- **AC5 (Fuel Depleted Invalidation)**：當 $\text{Fuel} < 30$ 時，噴煙按鍵指令完全無效，不扣油且不生成煙幕。

---

## US-06-04：紅色敵車打滑失控機制 (Red Car Spin-Out - 原版規格)

**身份**： Rally-X 敵方 AI 系統 (Enemy AI System)

> **As a** 敵方 AI 系統，  
> **I want to** 讓紅車在觸碰煙幕或撞擊岩石時原地打轉 2.0 秒，且不爆炸不重生，  
> **So that** 嚴格重現 1981 年《New Rally-X》原版街機的非致死性防禦博弈。

### 驗收條件 (Acceptance Criteria)
- **AC1 (Smoke Spin-Out)**：當正常行駛的紅車接觸到任何存活中的煙霧團時，**紅車絕不爆炸、不扣命、不重置回起點**，而是立即切換為「打滑打轉」（Spin-Out）狀態。
- **AC2 (Spin-Out Duration)**：紅車在原地持續 360 度旋轉打滑 **$2.0$ 秒**，期間行進速度降為 0，且喪失對藍車的威脅碰撞（或處於無害打轉狀態）。
- **AC3 (Recovery & Re-Engagement)**：2.0 秒打滑結束後，紅車原地恢復抓地力與前進動力，重新啟動最短路徑 AI 追蹤藍車。
- **AC4 (Rock Collision Spin-Out)**：當紅車巡航撞擊通道中的岩石時，**紅車絕不爆炸**，同樣觸發 $2.0$ 秒原地打轉，結束後轉向避開岩石繼續巡航。
- **AC5 (Car-to-Car Bump)**：兩輛紅車在通道中相撞時，各自打轉 $1.0$ 秒後錯開，雙方均不爆炸。

---

## US-06-05：燃油消耗、怠速耗損與油盡低速懲罰 (Fuel Consumption & Empty State)

**身份**： Rally-X 遊戲引擎 (Game Engine)

> **As a** 遊戲引擎，  
> **I want to** 即時計算巡航怠速油耗與噴煙扣油，並在燃油歸零時實施速度減半與禁煙懲罰，  
> **So that** 營造緊迫的資源管理壓力與逃生懸疑感。

### 驗收條件 (Acceptance Criteria)
- **AC1 (Fuel Capacity & HUD)**：初始滿格為 $1,000$ 點，即時同步至 HUD 燃油條。
- **AC2 (Passive Cruise Drain)**：在普通關卡中，藍車前進或怠速停滯時，燃油以固定速率（約每秒 $8$ 點）持續衰減。
- **AC3 (Empty State Transition)**：當 $\text{Fuel} \le 0$ 時，系統立即切換為油盡狀態：
  - 藍車最高行駛速度立即強制降為正常速度的 **$50\%$**。
  - 觸發持續性的警報提示音（Alarm SFX）。
  - 煙幕功能完全鎖定失效。
- **AC4 (Survival Mechanics on Empty)**：燃油耗盡不會直接判定死亡，玩家仍可操控低速藍車尋路吃完剩餘旗幟過關。

---

## US-06-06：旗幟搜集、特殊旗 (S) 翻倍與幸運旗 (L) 補油機制 (Flags, Special & Lucky Flags)

**身份**： Rally-X 玩家 (Player)

> **As a** 玩家，  
> **I want to** 收集迷宮中的 10 面旗幟，並策略性利用 S 旗翻倍與 L 旗補油，  
> **So that** 獲得最高排名的衝榜積分並順利通關。

### 驗收條件 (Acceptance Criteria)
- **AC1 (10 Flags Total)**：每關迷宮固定配置 10 面旗幟（8 面普通旗 + 1 面 S 旗 + 1 面 L 旗）。全數 10 面旗幟搜集完畢時，關卡即刻通關。
- **AC2 (Regular Flag Scoring)**：吃到的第 $n$ 面旗幟，基礎得分為 $S_n = 100 \times n$ 分（$n \in [1, 10]$）。
- **AC3 (Special "S" Flag Multiplier)**：
  - 拾取 "S" 旗時獲得當前順位得分。
  - 啟用「雙倍積分模式」：此後拾取之所有剩餘旗幟得分永久 $\times 2$ 倍（例如第 4 面得 $400 \times 2 = 800$ 分）。
  - 若藍車中途死亡扣命，**雙倍效果即刻失效**，後續旗幟恢復單倍計分。
- **AC4 (Lucky "L" Flag Restoration & Bonus)**：
  - 拾取 "L" 旗時獲得當前順位得分（若已處於 S 旗狀態則享雙倍）。
  - 立即將藍車當前剩餘燃油轉換為等額獎勵積分。
  - 立即將藍車燃油槽無條件**補滿回 $1,000$ 點滿格**。
- **AC5 (Stage Clear Fuel Bonus)**：關卡過關時，剩餘燃油量按 $\text{Bonus} = \text{Remaining Fuel} \times 10$ 分計入總分。
- **AC6 (Death Flag Persistence)**：玩家死亡扣命時，已吃掉的旗幟保持被吃狀態不重置，旗幟拾取順位計數器 $n$ 重置回 1。

---

## US-06-07：雷達小地圖迷霧系統與岩石視野盲區 (Radar HUD & Rock Blindspots)

**身份**： Rally-X 玩家 (Player)

> **As a** 玩家，  
> **I want to** 透過畫面右側雷達全局觀察敵車與旗幟位置，  
> **So that** 規劃最佳搜集路徑並在路口提前防範圍捕。

### 驗收條件 (Acceptance Criteria)
- **AC1 (Radar Entities Mapping)**：
  - 藍車：以黃色/白色高亮方點即時映射於雷達相對座標。
  - 紅車：以亮紅色方點即時映射。
  - 普通旗幟：以黃色點標記。
  - S 旗與 L 旗：以獨立閃爍圖元或字母標記。
- **AC2 (Radar Fog of War - 迷霧盲區)**：
  - 雷達**嚴格不顯示迷宮牆壁**。
  - 雷達**嚴格不顯示煙幕彈**。
  - 雷達**嚴格不顯示岩石 (Rocks)**！岩石成為完全隱匿於主螢幕視野的突發危險障礙。
- **AC3 (Flag Clearance on Radar)**：旗幟被吃掉時，雷達對應光點立即消除。

---

## US-06-08：4 套經典母迷宮與 16 關難度階梯排布 (4 Master Mazes & 16-Round Schedule)

**身份**： Rally-X 關卡系統 (Level Progression System)

> **As a** 關卡系統，  
> **I want to** 依據 16 關標準配置循環載入 4 套母迷宮與難度參數，  
> **So that** 提供層次分明、循序漸進的街機挑戰體驗。

### 驗收條件 (Acceptance Criteria)
- **AC1 (4 Master Mazes Assets)**：內建 4 款經典母迷宮網格矩陣（Maze 1: 幾何旋渦、Maze 2: 泥地花園、Maze 3: 水路窄道、Maze 4: 暗黑破碎）。
- **AC2 (16-Round Schedule Table)**：嚴格遵循 PRD-05 規格表分配關卡難度：
  - Round 1~3 使用 Maze 1（紅車 1、2、7 輛）。
  - Round 4~7 使用 Maze 2（紅車 3、3、4、7 輛）。
  - Round 8~11 使用 Maze 3（紅車 4、5、5、7 輛）。
  - Round 12~15 使用 Maze 4（紅車 6、6、7、7 輛）。
- **AC3 (Endless Loop)**：Round 16+ 循環回 Maze 1，紅車數鎖定為 7 輛極限滿員，岩石數 24 顆。
- **AC4 (Red Car Speed Dynamic)**：紅車直道極速為藍車之 $108\%$；但在交叉路口轉向時紅車具備轉向延遲幀，玩家可利用頻繁變向拉開距離。

---

## US-06-09：挑戰關卡特殊機制 (Challenging Stages: Dormant Cars & Zero Passive Drain)

**身份**： Rally-X 玩家 (Player)

> **As a** 玩家，  
> **I want to** 在 Round 3、7、11、15 體驗紅車休眠與零自然油耗的挑戰關，  
> **So that** 專心規劃吃旗路線並爭取高額燃油折算積分。

### 驗收條件 (Acceptance Criteria)
- **AC1 (Trigger Rounds)**：系統於第 3、7、11、15 關自動啟動「Challenging Stage」模式，畫面顯示專屬轉場字樣與音效。
- **AC2 (Dormant Enemies)**：挑戰關中所有紅車（共 7 輛）停留在原地休眠不動，輪胎不旋轉、不主動尋路、不追逐藍車。
- **AC3 (Zero Passive Fuel Drain)**：在挑戰關中，藍車正常巡航行駛與怠速時，**燃油自然損耗率降為 0**。只有當玩家主動按下噴煙時才扣除 30 點燃油。
- **AC4 (Lethal Touch Maintained)**：藍車若自行撞擊靜止紅車或岩石，依然會發生碰撞爆炸並扣除 1 條生命。
- **AC5 (Challenge Perfect Bonus)**：吃滿 10 面旗通關時，全額剩餘油量兌換為大量過關 Bonus。

---

## US-06-10：生命管理、20k/80k 獎勵加命與死亡重生 (Lives, 1UP Extends & Respawn Retention)

**身份**： Rally-X 玩家 (Player)

> **As a** 玩家，  
> **I want to** 擁有初始 3 輛賽車，在達到特定分數時獲得獎勵加命，並在失誤後保留已吃旗幟重生，  
> **So that** 延續遊戲進度並保持衝榜動力。

### 驗收條件 (Acceptance Criteria)
- **AC1 (Initial Lives)**：玩家開局獲得 3 條生命（1 輛行駛 + 2 輛備用），生命上限為 5 條。
- **AC2 (1UP Extends Milestone)**：
  - 當累積總分首次達到 **20,000 分** 時，生命值 $+1$，播放加命經典音效。
  - 當累積總分首次達到 **80,000 分** 時，生命值再 $+1$。
- **AC3 (Collision Lethality)**：藍車車頭/車身與正常行駛中的紅車發生碰撞，或撞上通道中的岩石時，藍車爆炸粉碎，生命值 $-1$。
- **AC4 (Respawn Sequence)**：
  - 若剩餘生命 $> 0$：
    - 藍車重置回關卡起點位置與方向。
    - 所有紅車重置回初始敵方起點。
    - 燃油槽補滿至 $1,000$ 點。
    - 迷宮中已拾取旗幟維持被吃狀態，不重新生成。
    - 旗幟拾取累乘計數器重置為 $n=1$，S 旗加倍效果解除。
- **AC5 (Game Over Trigger)**：當生命值扣至 0 時，遊戲結束。

---

## US-06-11：平台事件契約整合與 Game Over 結算 (Platform Contracts & Game Over)

**身份**： Arcade Stadium 平台與 React Host Shell

> **As a** 街機平台，  
> **I want to** 透過 `IArcadeGame` 與 `ArcadeBridge` 監聽生命週期事件與上報分數，  
> **So that** 小旋風能無縫整合至 Arcade Stadium 大廳、代幣扣除與排行榜體系。

### 驗收條件 (Acceptance Criteria)
- **AC1 (IArcadeGame Implementation)**：遊戲實作標準 `IArcadeGame` 介面，涵蓋 `init()`, `start()`, `pause()`, `resume()`, `destroyGame()`。
- **AC2 (InputService Integration)**：完整註冊實體鍵盤（方向鍵、`WASD`、`Space`、`ESC`/`P`）與觸控虛擬控制器，支援單按鍵動作與長按連續判定。
- **AC3 (Real-Time State Broadcast)**：
  - 燃油變動廣播：`ArcadeBridge.emit('FUEL_UPDATED', { fuel, maxFuel: 1000 })`。
  - 分數變動廣播：`ArcadeBridge.emit('SCORE_UPDATED', { score })`。
  - 生命變動廣播：`ArcadeBridge.emit('LIVES_UPDATED', { lives })`。
- **AC4 (Game Over Summary)**：遊戲結束時透過 `ArcadeBridge.emit('GAME_OVER', summary)` 拋送包含 `score`, `round`, `flagsCollected`, `playTimeSeconds` 之結構化資料，供大廳更新 Top 10 排行榜。
- **AC5 (Resource Cleanup)**：呼叫 `destroyGame()` 時，徹底釋放 Phaser 音訊、動畫計時器、碰撞事件監聽器與 Canvas 實體，無記憶體洩漏。

