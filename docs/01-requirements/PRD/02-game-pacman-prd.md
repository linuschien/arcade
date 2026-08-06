# PRD-02: 小精靈 (Pac-Man Game PRD)

## 1. 遊戲願景與簡介 (Overview)
Pac-Man 是一部經典的迷宮追逐動作遊戲。玩家控制 Pac-Man 在封閉迷宮中吞食所有豆子，同時躲避 4 隻具備獨特 AI 性格的幽靈。吞食能量豆可暫時反轉局勢，將幽靈變為可食用的受驚狀態。

---

## 2. 核心遊戲機制 (Core Game Mechanics)

### 2.1 規格參數
- **地圖網格**：28x36 離散 Tile 網格，包含左右兩側穿越通道 (Tunnel)。
- **玩家 (Pac-Man)**：初始 3 條生命。持續向前移動，玩家可預先輸入轉向指令 (Direction Buffer Queue)。
- **豆子與得分**：
  - 普通豆 (Pellet)：10 分（全場共 244 顆，清空即過關）。
  - 能量豆 (Power Pellet)：50 分（迷宮 4 角各 1 顆，觸發 Frightened Mode）。
  - 吃幽靈：連續吞食幽靈得分翻倍 ($200 \rightarrow 400 \rightarrow 800 \rightarrow 1600$ 分)。

### 2.2 4 隻幽靈 AI 性格 (Ghost AI Personalities)
- **Blinky (紅鬼 - Shadow)**：直接瞄準 Pac-Man 當前 Tile 網格位置進行直線追逐。
- **Pinky (粉鬼 - Speedy)**：瞄準 Pac-Man 前方 4 個 Tile 的預測位置進行伏擊。
- **Inky (藍鬼 - Bashful)**：取 Pac-Man 前方 2 格與 Blinky 位置之向量延伸線的點作為目標，進行包抄。
- **Clyde (橘鬼 - Pokey)**：距離 Pac-Man $> 8$ 格時追逐 Pac-Man；距離 $\le 8$ 格時退回左下角 Patrol 點。

### 2.3 幽靈狀態切換 (Ghost Modes)
- **Scatter Mode (巡邏)**：每隔一定時間，幽靈放棄追逐，分別退回地圖四個角落。
- **Chase Mode (追逐)**：主要的追逐攻擊模式。
- **Frightened Mode (驚恐)**：Pac-Man 吃下能量豆時觸發（持續 7 秒），幽靈變藍、移動減速 50% 且向反方向隨機轉彎。
- **Eaten State (被吃回巢)**：被 Pac-Man 吞食後僅剩眼睛，高速返回中央 Ghost House 復活。

### 2.4 操作控制對映 (Input Mapping via InputService)
- `UP` / `DOWN` / `LEFT` / `RIGHT`：轉向輸入（支援網格轉向預判緩衝區）。
