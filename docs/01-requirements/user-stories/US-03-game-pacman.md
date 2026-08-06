# US-03 小精靈模組 (Pac-Man Game Module)

## 背景 (Background)
Pac-Man 是 Arcade Stadium 平台上的第一個迷宮追逐類動作遊戲。本模組規範 Pac-Man 迷宮導航、4 隻幽靈 AI 追逐邏輯、能量豆驚恐狀態、Level 1~17+ 精確難度遞增參數表與生命扣減機制。

---

## US-03-01：迷宮導航與轉向緩衝 (Grid Navigation & Direction Buffer)

**身份**： Pac-Man 玩家 (Pac-Man Player)

> **As a** 玩家，  
> **I want to** 使用方向鍵控制 Pac-Man 在 28x36 迷宮網格中移動與預先輸入轉向指令，  
> **So that** 操控流暢不受網格頂格死板感影響。

### 驗收條件 (Acceptance Criteria)
- **AC1 (Tile Center Movement)**：Pac-Man 的座標計算基於 Tile 中心點 `(x + 0.5) * tileSize`，防止碰撞牆壁穿牆。
- **AC2 (Direction Queue Buffer)**：當玩家在轉角前 1 格按轉向鍵，系統預先暫存轉向指令，當走到十字路口且無牆壁阻擋時自動轉向。
- **AC3 (Tunnel Wrapping)**：當 Pac-Man 走到迷宮左右邊緣通道時，座標瞬間水平穿梭至對側通道口。

---

## US-03-02：吞食豆子、水果與能量豆驚恐模式 (Pellets, Fruits & Frightened Mode)

**身份**： Pac-Man Player

> **As a** 玩家，  
> **I want to** 吞食迷宮中的普通豆、水果與能量豆，  
> **So that** 我能獲得分數並短暫反擊追逐幽靈。

### 驗收條件 (Acceptance Criteria)
- **AC1 (Pellet Score)**：每吃 1 顆普通豆 $+10$ 分，發出經典 `wakka-wakka` 音效。
- **AC2 (Fruit Bonus Trigger)**：當剩餘豆子降至 174 顆與 74 顆時，於 `(13, 20)` 生成對應 Level 的水果獎勵（由 Level 1 櫻桃 100分 至 Level 13+ 鑰匙 5,000分），存在 9.5 秒。
- **AC3 (Power Pellet Frightened Trigger)**：吃下能量豆 $+50$ 分，依據當前 Level 的 `Fright Duration` 秒數與閃爍次數觸發 `Frightened Mode`。在 Level 17+，`Fright Duration = 0` 秒，幽靈不變藍。
- **AC4 (Ghost Eating Multiplier)**：在 Frightened Mode 下，Pac-Man 碰撞幽靈可吞食幽靈。連吞幽靈得分遞增：第 1 隻 $+200$，第 2 隻 $+400$，第 3 隻 $+800$，第 4 隻 $+1600$ 分。被吃的幽靈僅剩眼睛，高速返回中央 Ghost House 復活。

---

## US-03-03：幽靈 AI 性格模式切換 (Ghost AI Personality Switching)

**身份**： Pac-Man Game Engine

> **As a** 遊戲引擎，  
> **I want to** 控制 4 隻幽靈 (Blinky, Pinky, Inky, Clyde) 依照不同的目標算式移動，  
> **So that** 遊戲具備經典的追逐與包抄挑戰性。

### 驗收條件 (Acceptance Criteria)
- **AC1 (Scatter / Chase Timer Array Cycle)**：遊戲計時器嚴格依據 PRD-02 之 `Timer Array` 序列（如 Level 1 為 `[7s, 20s, 7s, 20s, 5s, 20s, 5s, ∞]`）自動切換 Scatter/Chase 模式，每次切換時幽靈立刻 180 度調頭。
- **AC2 (Blinky Target)**：Blinky 瞄準 `Pacman.tilePosition`。
- **AC3 (Pinky Target)**：Pinky 瞄準 `Pacman.tilePosition + Pacman.direction * 4`。
- **AC4 (Inky Target)**：Inky 瞄準 `(Pacman.tilePosition + Pacman.direction * 2) * 2 - Blinky.tilePosition`。
- **AC5 (Clyde Target)**：Clyde 距離 Pac-Man $> 8$ Tile 時瞄準 Pac-Man，距離 $\le 8$ Tile 時瞄準 `(0, 35)`。

---

## US-03-04：生命扣減、關卡遞增與 Game Over (Life Loss, Stage Progression & Game Over)

**身份**： Pac-Man Player

> **As a** 玩家，  
> **I want to** 在吃光 244 顆豆子時進階下一關並套用精確的難度參數表，  
> **So that** 遊戲具備層層遞進的挑戰性與過關成就感。

### 驗收條件 (Acceptance Criteria)
- **AC1 (Life Loss & Respawn)**：與正常幽靈碰撞時，Pac-Man 播放死亡動畫，生命值 $-1$。若生命值 $> 0$，重置角色與幽靈位置至預設起跑點。
- **AC2 (Stage Clear & Level Parameter Table)**：當迷宮內 244 顆豆子清空時，地圖閃爍提示過關，載入下一關並精確套用 PRD-02 之 Level 1~17+ 參數表（幽靈速度比、驚恐秒數、閃爍次數、Timer 陣列與水果得分）。
- **AC3 (Game Over & Event)**：當生命值 $= 0$ 時，觸發 Game Over，透過 `ArcadeBridge.emit('GAME_OVER', summary)` 拋出分數與結算資料。
