# US-03 小精靈模組 (Pac-Man Game Module)

## 背景 (Background)
Pac-Man 是 Arcade Stadium 平台上的第一個迷宮追逐類動作遊戲。本模組規範 Pac-Man 迷宮導航、4 隻幽靈 AI 追逐邏輯、能量豆驚恐狀態、Stage 1~17+ 難度遞增曲線與生命扣減機制。

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
- **AC2 (Power Pellet Frightened Trigger)**：吃下能量豆 $+50$ 分，依據當前 Stage 難度觸發 `Frightened Mode`。
- **AC3 (Ghost Eating Multiplier)**：在 Frightened Mode 下，Pac-Man 碰撞幽靈可吞食幽靈。連吞幽靈得分遞增：第 1 隻 $+200$，第 2 隻 $+400$，第 3 隻 $+800$，第 4 隻 $+1600$ 分。被吃的幽靈僅剩眼睛，高速返回中央 Ghost House 復活。

---

## US-03-03：幽靈 AI 性格模式切換 (Ghost AI Personality Switching)

**身份**： Pac-Man Game Engine

> **As a** 遊戲引擎，  
> **I want to** 控制 4 隻幽靈 (Blinky, Pinky, Inky, Clyde) 依照不同的目標算式移動，  
> **So that** 遊戲具備經典的追逐與包抄挑戰性。

### 驗收條件 (Acceptance Criteria)
- **AC1 (Scatter / Chase Timer Cycle)**：遊戲每隔一定時間（如 Level 1 為 Scatter 7s $\rightarrow$ Chase 20s）自動切換全體幽靈模式。隨關卡提升，Scatter 巡邏時間逐漸縮短至 0 秒（全時 Chase）。
- **AC2 (Blinky Target)**：Blinky 瞄準 Pac-Man 當前 Tile 網格。
- **AC3 (Pinky Target)**：Pinky 瞄準 Pac-Man 當前方格 $+4$ 格。
- **AC4 (Inky Target)**：Inky 以 Blinky 為基點與 Pac-Man 前方 2 格連線向量延伸 2 倍距離作為目標格。
- **AC5 (Clyde Target)**：Clyde 與 Pac-Man 距離 $> 8$ 格時追逐 Pac-Man，距離 $\le 8$ 格時退回左下角 Patrol 點。

---

## US-03-04：生命扣減、關卡遞增與 Game Over (Life Loss, Stage Progression & Game Over)

**身份**： Pac-Man Player

> **As a** 玩家，  
> **I want to** 在吃光 244 顆豆子時進階下一關並感受速度與能量豆時間的難度遞增，  
> **So that** 遊戲具備層層遞進的挑戰性與過關成就感。

### 驗收條件 (Acceptance Criteria)
- **AC1 (Life Loss & Respawn)**：與正常幽靈碰撞時，Pac-Man 播放死亡動畫，生命值 $-1$。若生命值 $> 0$，重置角色與幽靈位置至預設起跑點。
- **AC2 (Stage Clear & Progression Curve)**：當迷宮內 244 顆豆子清空時，地圖閃爍提示過關，載入下一關並依下表提升難度：
  - **Level 1 (櫻桃)**：幽靈 75% 速度，驚恐時間 6 秒，水果獎勵 100 分。
  - **Level 2 (草莓)**：幽靈 85% 速度，驚恐時間 5 秒，水果獎勵 300 分。
  - **Level 5 (蘋果)**：幽靈 95% 速度，驚恐時間 2 秒，水果獎勵 700 分。
  - **Level 17+ (鑰匙 - 頂峰關卡)**：幽靈 100% 全速，**驚恐時間 0 秒 (能量豆失效，幽靈不再變藍)**，水果獎勵 5,000 分。
- **AC3 (Game Over & Event)**：當生命值 $= 0$ 時，觸發 Game Over，透過 `ArcadeBridge.emit('GAME_OVER', summary)` 拋出分數與結算資料。
