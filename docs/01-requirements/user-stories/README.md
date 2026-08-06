# Arcade Stadium - 需求與 User Stories 總覽 (Master Index)

## 📌 系統角色 (System Actors)
- **街機玩家 (Arcade Player)**：遊玩遊戲、投幣、查詢排行榜與切換 CRT 濾鏡的主要使用者。
- **管理員 (Admin)**：管理平台、給予玩家獎勵代幣 (Admin Bonus Credit) 的系統管理角色。
- **React Host Shell**：外層 Arcade 大廳 UI 容器與事件監聽器。
- **Phaser Game Engine**：內層 Canvas 遊戲引擎與 60fps 物理渲染視窗。

---

## 📂 需求模組清單 (Module List)

### 1. 街機大廳與代幣模組 (`US-01-arcade-lobby.md`)
| 故事 ID | 故事名稱 | 核心動作 | 驗收條件涵蓋 |
|---|---|---|---|
| **US-01-01** | 遊戲卡片輪播與切換 | 瀏覽遊戲海報、標題與歷史最高分 | 卡片焦點切換、鍵盤/搖桿/觸控操作、無遊戲空狀態 |
| **US-01-02** | 代幣投幣機制與多裝置控制 | 按 `C`、Gamepad 鍵或觸控進行投幣 | Credit 加總廣播、99 上限限制、鍵盤/Gamepad/觸控原生效能 |
| **US-01-03** | 啟動與切換 Canvas 遊戲 | 點擊 START 進入遊戲畫面 | 動態掛載 Canvas、Credit=0 阻擋發射 |
| **US-01-04** | CRT 復古掃描線濾鏡切換 | 設定選單開啟/關閉 CRT Shader | CSS/WebGL 掃描線切換、LocalStorage 保存 |
| **US-01-05** | 每日免費代幣發放機制 | 每日登入獲得 10 枚免費硬幣 | 每日 00:00 重置配額 10 枚、不可跨日累積 |
| **US-01-06** | 管理員獎勵代幣與扣除順序 | Admin 給予獎勵代幣、優先扣免費硬幣 | Admin 發幣 API/介面、獎勵硬幣跨日保留、優先扣除免費硬幣 |

### 2. 俄羅斯方塊模組 (`US-02-game-tetris.md`)
| 故事 ID | 故事名稱 | 核心動作 | 驗收條件涵蓋 |
|---|---|---|---|
| **US-02-01** | 7-Bag 隨機生成與 Hold 區 | 生成公平方塊序列與 Hold 暫存 | 7-Bag 公平發牌、Hold 限制 1 次 |
| **US-02-02** | 方塊位移、SRS 旋轉與 Drop | 控制方塊落點與旋轉 | 邊界碰撞、SRS Wall Kick 反彈、Hard Drop 加分 |
| **US-02-03** | 滿行消除與等級加載 | 消除滿行並提升等級 | 1~4 行得分倍率、每 10 行下落速度提升 |
| **US-02-04** | 遊戲結束與分數上報 | 觸發 GameOver 並拋出分數 | Block Out 判定、`GAME_OVER` 事件廣播、記憶體釋放 |

### 3. 小精靈模組 (`US-03-game-pacman.md`)
| 故事 ID | 故事名稱 | 核心動作 | 驗收條件涵蓋 |
|---|---|---|---|
| **US-03-01** | 迷宮導航與轉向緩衝 | 控制 Pac-Man 轉向與路徑位移 | Tile Center 對齊、轉向緩衝佇列、通道兩側穿梭 |
| **US-03-02** | 吞食豆子與能量豆驚恐 | 吞食普通豆與能量豆 | 豆子得分、Frightened Mode 反擊、吃幽靈分數翻倍 |
| **US-03-03** | 幽靈 AI 性格模式切換 | 4 隻幽靈切換 Scatter/Chase | Blinky/Pinky/Inky/Clyde 獨特目標算式 |
| **US-03-04** | 生命扣減、過關與 Game Over | 扣減生命、跳下一關與失敗結算 | 碰撞死亡動畫、244 豆清空過關、`GAME_OVER` 事件廣播 |

---

## 🔄 端到端業務流程 (Business Workflows)

### 流程一：玩家進入系統與每日代幣結算 (Game Startup & Daily Quota Flow)
1. 玩家每日首次進入 Arcade Stadium，系統自動發放/重置 10 枚「每日免費代幣」 (`US-01-05`)。
2. 大廳渲染 `US-01-01` 遊戲輪播卡片與當前剩餘 Credit (顯示 Breakdown: Free/Bonus)。
3. 玩家選擇 Tetris 並點擊 START (`US-01-03`)，優先扣除 1 枚免費代幣，進入 `US-02-01` 方塊遊戲畫面。

### 流程二：管理員獎勵代幣與投幣扣除 (Admin Grant & Credit Consumption Flow)
1. Admin 透過後台給予玩家 50 枚 `Admin Bonus Credit` (`US-01-06`)。
2. 玩家遊玩時優先扣除每日免費代幣 (`Daily Free Credit`)。
3. 每日免費代幣用完後，自動開始扣除管理員獎勵代幣。00:00 重置時，管理員獎勵代幣完整保留。

### 流程三：跨裝置操控流程 (Multi-Device Input Flow)
1. 玩家在電腦可使用 `Keyboard` 操控。
2. 玩家插入 USB/藍牙街機搖桿，`Gamepad API` 自動識別並對映鍵位至 `InputService`。
3. 玩家在手機開啟，畫面自動渲染觸控 D-Pad。
