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

### 2.3 關卡難度遞增曲線 (Stage Difficulty Progression)

當玩家清空迷宮 244 顆豆子進階下一關時，難度從 **4 個維度** 遞增：

| 關卡 (Stage / Fruit) | 幽靈移動速度比 | 驚恐時間 (Frightened Time) | 巡邏時間 (Scatter Time) | 水果獎勵 (Bonus Fruit) |
|---|---|---|---|---|
| **Level 1 (櫻桃)** | 75% 速度 | 6 秒 (幽靈變藍可吃) | 7s $\rightarrow$ 20s 正常輪替 | 櫻桃 (100 分) |
| **Level 2 (草莓)** | 85% 速度 | 5 秒 | 5s $\rightarrow$ 20s 輪替 | 草莓 (300 分) |
| **Level 3~4 (水蜜桃)** | 85% 速度 | 4 秒 | 5s $\rightarrow$ 20s 輪替 | 水蜜桃 (500 分) |
| **Level 5~8 (蘋果/鳳梨)** | 95% 速度 | 2 秒 (極短) | 縮短巡邏，幾乎全時追逐 | 蘋果 (700分) / 鳳梨 (1,000分) |
| **Level 9~16 (旗幟/鈴鐺)** | 95% 速度 | 1 秒 | 永久 Chase 追逐模式 | 旗幟 (2,000分) / 鈴鐺 (3,000分) |
| **Level 17+ (鑰匙 - 封頂難度)** | **100% 速度 (極快)** | **0 秒 (能量豆失效！幽靈不會變藍)** | **永久 Chase 追逐模式** | **鑰匙 (5,000 分)** |

#### 難度遞增四大維度摘要：
1. **速度加快**：幽靈移動速度從 75% 提升至 100%，後期幾乎與 Pac-Man 等速。
2. **驚恐時間縮短**：能量豆效果從 6 秒縮短至 0 秒（Level 17 後吃能量豆幽靈不再變藍，僅能轉向 1 幀）。
3. **巡邏時間消失**：Scatter 撤退時間縮短至 0 秒，幽靈進入永久 Chase 追逐打擊。
4. **水果獎勵加分**：每關吃下 70 與 170 顆豆時， Ghost House 下方出現水果獎勵，分數從 100 分提升至 5,000 分 (鑰匙)。

### 2.4 操作控制對映 (Input Mapping via InputService)
- `UP` / `DOWN` / `LEFT` / `RIGHT`：轉向輸入（支援網格轉向預判緩衝區）。
