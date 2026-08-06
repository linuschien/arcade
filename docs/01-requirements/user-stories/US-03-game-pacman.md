# US-03 小精靈模組 (Pac-Man Game Module)

## 背景 (Background)
Pac-Man 是 Arcade Stadium 平台上的第一個迷宮追逐類動作遊戲。本模組規範 Pac-Man 迷宮導航、4 隻幽靈 AI 追逐邏輯、能量豆驚恐狀態與生命扣減機制。

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

## US-03-02：吞食豆子與能量豆驚恐模式 (Pellet Eating & Frightened Mode)

**身份**： Pac-Man Player

> **As a** 玩家，  
> **I want to** 吞食迷宮中的普通豆與能量豆，  
> **So that** 我能獲得分數並短暫反擊追逐幽靈。

### 驗收條件 (Acceptance Criteria)
- **AC1 (Pellet Score)**：每吃 1 顆普通豆 $+10$ 分，發出經典 `wakka-wakka` 音效。
- **AC2 (Power Pellet Frightened Trigger)**：吃下能量豆 $+50$ 分，觸發 `Frightened Mode`：
  - 4 隻幽靈外觀變為藍色閃爍。
  - 幽靈移動速度降低 50% 且方向反轉。
  - 狀態持續 7 秒。
- **AC3 (Ghost Eating Multiplier)**：在 Frightened Mode 下，Pac-Man 碰撞幽靈可吞食幽靈。連吞幽靈得分遞增：第 1 隻 $+200$，第 2 隻 $+400$，第 3 隻 $+800$，第 4 隻 $+1600$ 分。被吃的幽靈僅剩眼睛，高速返回中央 Ghost House 復活。

---

## US-03-03：幽靈 AI 性格模式切換 (Ghost AI Personality Switching)

**身份**： Pac-Man Game Engine

> **As a** 遊戲引擎，  
> **I want to** 控制 4 隻幽靈 (Blinky, Pinky, Inky, Clyde) 依照不同的目標算式移動，  
> **So that** 遊戲具備經典的追逐與包抄挑戰性。

### 驗收條件 (Acceptance Criteria)
- **AC1 (Scatter / Chase Timer Cycle)**：遊戲每隔一定時間（如 Scatter 7s $\rightarrow$ Chase 20s）自動切換全體幽靈模式。
- **AC2 (Blinky Target)**：Blinky 瞄準 Pac-Man 當前 Tile 網格。
- **AC3 (Pinky Target)**：Pinky 瞄準 Pac-Man 當前方格 $+4$ 格。
- **AC4 (Inky Target)**：Inky 以 Blinky 為基點與 Pac-Man 前方 2 格連線向量延伸 2 倍距離作為目標格。
- **AC5 (Clyde Target)**：Clyde 與 Pac-Man 距離 $> 8$ 格時追逐 Pac-Man，距離 $\le 8$ 格時退回左下角 Patrol 點。

---

## US-03-04：生命值扣減、過關與 Game Over (Life Loss, Stage Clear & Game Over)

**身份**： Pac-Man Player

> **As a** 玩家，  
> **I want to** 在被正常狀態幽靈抓到時扣除生命，並在吃光豆子時進階下一關，  
> **So that** 遊戲具備清楚的過關與失敗判定。

### 驗收條件 (Acceptance Criteria)
- **AC1 (Life Loss & Respawn)**：與正常幽靈碰撞時，Pac-Man 播放死亡動畫，生命值 $-1$。若生命值 $> 0$，重置角色與幽靈位置至預設起跑點。
- **AC2 (Stage Clear)**：當迷宮內 244 顆豆子全部被清空時，地圖閃爍提示過關，載入下一關並提升幽靈速度。
- **AC3 (Game Over & Event)**：當生命值 $= 0$ 時，觸發 Game Over，透過 `ArcadeBridge.emit('GAME_OVER', summary)` 拋出分數與結算資料。
