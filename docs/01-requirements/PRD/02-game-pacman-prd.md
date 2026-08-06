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
  - 吃幽靈：連續吞食幽靈得分倍增（第 1 隻 200 分、第 2 隻 400 分、第 3 隻 800 分、第 4 隻 1,600 分）。

### 2.2 4 隻幽靈 AI 性格 (Ghost AI Personalities)
- **Blinky (紅鬼 - Shadow)**：目標格等於 `Pacman.tilePosition`（直接追擊）。
- **Pinky (粉鬼 - Speedy)**：目標格等於 `Pacman.tilePosition + Pacman.direction * 4`（前方 4 格伏擊）。
- **Inky (藍鬼 - Bashful)**：目標格等於 `(Pacman.tilePosition + Pacman.direction * 2) * 2 - Blinky.tilePosition`（向量夾擊）。
- **Clyde (橘鬼 - Pokey)**：與 Pac-Man 距離 $> 8$ Tile 時目標等於 `Pacman.tilePosition`；距離 $\le 8$ Tile 時目標等於左下角巡邏點 `(0, 35)`。

### 2.3 關卡精確參數規格表 (Exact Level Specifications)

下表為各 Level 之精確速度比、驚恐時間 (Frightened Duration)、Scatter/Chase 計時器序列與水果獎勵得分：

| 關卡 (Level) | 水果獎勵 (Fruit) | 水果得分 (Fruit Pts) | 幽靈速度比 (Ghost Speed) | 驚恐時間 (Fright Duration) | 驚恐閃爍次數 (Fright Flash) | 巡邏/追逐時間序列 (Scatter/Chase Timer Array in sec) |
|---|---|---|---|---|---|---|
| **Level 1** | 櫻桃 (Cherry) | 100 分 | 75% | 6.0 秒 | 5 次 | `[7, 20, 7, 20, 5, 20, 5, ∞]` |
| **Level 2** | 草莓 (Strawberry) | 300 分 | 85% | 5.0 秒 | 5 次 | `[7, 20, 7, 20, 5, 20, 5, ∞]` |
| **Level 3** | 水蜜桃 (Peach) | 500 分 | 85% | 4.0 秒 | 5 次 | `[5, 20, 5, 20, 5, 20, 5, ∞]` |
| **Level 4** | 水蜜桃 (Peach) | 500 分 | 85% | 3.0 秒 | 5 次 | `[5, 20, 5, 20, 5, 20, 5, ∞]` |
| **Level 5** | 蘋果 (Apple) | 700 分 | 95% | 2.0 秒 | 5 次 | `[5, 20, 5, 20, 5, 20, 5, ∞]` |
| **Level 6** | 蘋果 (Apple) | 700 分 | 95% | 5.0 秒 | 5 次 | `[5, 20, 5, 20, 5, 20, 5, ∞]` |
| **Level 7** | 鳳梨 (Pineapple) | 1,000 分 | 95% | 2.0 秒 | 5 次 | `[5, 20, 5, 20, 5, 20, 5, ∞]` |
| **Level 8** | 鳳梨 (Pineapple) | 1,000 分 | 95% | 2.0 秒 | 5 次 | `[5, 20, 5, 20, 5, 20, 5, ∞]` |
| **Level 9** | 旗幟 (Galaxian) | 2,000 分 | 95% | 1.0 秒 | 3 次 | `[5, 20, 5, 20, 5, 20, 5, ∞]` |
| **Level 10** | 旗幟 (Galaxian) | 2,000 分 | 95% | 5.0 秒 | 5 次 | `[5, 20, 5, 20, 5, 20, 5, ∞]` |
| **Level 11** | 鈴鐺 (Bell) | 3,000 分 | 95% | 2.0 秒 | 5 次 | `[5, 20, 5, 20, 5, 20, 5, ∞]` |
| **Level 12** | 鈴鐺 (Bell) | 3,000 分 | 95% | 1.0 秒 | 3 次 | `[5, 20, 5, 20, 5, 20, 5, ∞]` |
| **Level 13** | 鑰匙 (Key) | 5,000 分 | 95% | 1.0 秒 | 3 次 | `[5, 20, 5, 20, 5, 20, 5, ∞]` |
| **Level 14** | 鑰匙 (Key) | 5,000 分 | 95% | 3.0 秒 | 5 次 | `[5, 20, 5, 20, 5, 20, 5, ∞]` |
| **Level 15** | 鑰匙 (Key) | 5,000 分 | 95% | 1.0 秒 | 3 次 | `[5, 20, 5, 20, 5, 20, 5, ∞]` |
| **Level 16** | 鑰匙 (Key) | 5,000 分 | 95% | 1.0 秒 | 3 次 | `[5, 20, 5, 20, 5, 20, 5, ∞]` |
| **Level 17+** | 鑰匙 (Key) | 5,000 分 | 100% | **0.0 秒** | 0 次 | `[5, 20, 5, 20, 5, 20, 5, ∞]` |

#### 說明：
1. **水果生成時機 (Fruit Spawn Trigger)**：當迷宮內剩餘豆子數分別降至 **174 顆**（吃掉 70 顆）與 **74 顆**（吃掉 170 顆）時，於 Ghost House 正下方網格 `(13, 20)` 生成水果，維持 **9.5 秒** 後未被吃掉則消失。
2. **Scatter/Chase 陣列 (Timer Array)**：例如 `[7, 20, 7, 20, 5, 20, 5, ∞]` 表示：
   - 階段 1：Scatter 7s
   - 階段 2：Chase 20s
   - 階段 3：Scatter 7s
   - 階段 4：Chase 20s
   - 階段 5：Scatter 5s
   - 階段 6：Chase 20s
   - 階段 7：Scatter 5s
   - 階段 8：Chase 無限長 (進入永久 Chase 模式)

### 2.4 操作控制對映 (Input Mapping via InputService)
- `UP` / `DOWN` / `LEFT` / `RIGHT`：轉向輸入（支援網格轉向預判緩衝區）。
