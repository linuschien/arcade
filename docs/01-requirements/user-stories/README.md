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
| **US-01-02** | 單局啟動/續關直接扣幣 | 按 START 或 CONTINUE 直接從帳號錢包扣幣 | 單局啟動直接扣 1 Coin、10s 續關倒數扣幣、零殘幣零退幣邏輯 |
| **US-01-03** | 動態載入 Canvas 遊戲 | 扣幣成功後啟動 Canvas 視窗 | 動態掛載 Canvas、Credit=0 阻擋發射、返回大廳記憶體銷毀 |
| **US-01-04** | CRT 復古掃描線濾鏡切換 | 設定選單開啟/關閉 CRT Shader | CSS/WebGL 掃描線切換、LocalStorage 保存 |
| **US-01-05** | 每日免費代幣發放機制 | 每日登入獲得 10 枚免費硬幣 | 每日 00:00 重置配額 10 枚、不可跨日累積 |
| **US-01-06** | 管理員獎勵代幣與扣除順序 | Admin 給予獎勵代幣、優先扣免費硬幣 | Admin 發幣 API/介面、獎勵硬幣跨日保留、優先扣除免費硬幣 |
| **US-01-07** | 前十名高分榜與 Email 自動結算 | 自動帶入登入 Email 並展示前 10 名 | 僅展示 Top 10、自動帶入登入 Email（免暱稱輸入彈窗）、非同步結算 |

### 2. 俄羅斯方塊模組 (`US-02-game-tetris.md`)
| 故事 ID | 故事名稱 | 核心動作 | 驗收條件涵蓋 |
|---|---|---|---|
| **US-02-01** | 7-Bag 隨機生成與 Hold 區 | 生成公平方塊序列、NEXT 預覽與 Hold 暫存 | 7-Bag 公平發牌、NEXT 預覽視窗、Hold 限制 1 次 |
| **US-02-02** | 方塊位移、SRS 旋轉與 Drop | 控制方塊落點與旋轉 | 邊界碰撞、SRS Wall Kick 反彈、Hard Drop 加分 |
| **US-02-03** | 滿行消除與等級加載 | 消除滿行並提升等級 | 1~4 行得分倍率、Level 1~15 休閒平緩加速 (200ms 封頂) |
| **US-02-04** | 遊戲結束與分數上報 | 觸發 GameOver 並拋出分數 | Block Out 判定、`GAME_OVER` 事件廣播、記憶體釋放 |

### 3. 小精靈模組 (`US-03-game-pacman.md`)
| 故事 ID | 故事名稱 | 核心動作 | 驗收條件涵蓋 |
|---|---|---|---|
| **US-03-01** | 迷宮導航與轉向緩衝 | 控制 Pac-Man 轉向與路徑位移 | Tile Center 對齊、轉向緩衝佇列、通道兩側穿梭 |
| **US-03-02** | 吞食豆子、水果與能量豆驚恐 | 吞食普通豆、水果與能量豆 | 豆子得分、水果觸發與得分、Frightened Mode 反擊、吃幽靈分數翻倍 |
| **US-03-03** | 幽靈 AI 性格模式切換 | 4 隻幽靈切換 Scatter/Chase | Blinky/Pinky/Inky/Clyde 獨特目標算式、Timer Array 序列 |
| **US-03-04** | 生命扣減、過關與 Game Over | 扣減生命、跳下一關與失敗結算 | 碰撞死亡動畫、Level 1~17+ 精確難度參數表、`GAME_OVER` 事件廣播 |

---

## 🔄 端到端業務流程 (Business Workflows)

### 流程一：玩家進入系統與單局啟動 (Game Startup & Direct Deduction Flow)
1. 玩家每日首次進入 Arcade Stadium，系統自動發放/重置 10 枚「每日免費代幣」 (`US-01-05`)。
2. 玩家於大廳選單選擇 Tetris，點擊「START (1 Coin)」 (`US-01-02`)。
3. 系統直接從帳號錢包扣除 1 枚免費代幣，透過 `ArcadeBridge.emit('COIN_INSERTED')` 啟動遊戲 (`US-01-03`)。

### 流程二：遊戲中途離場與續關 (Exit & Continue Flow)
1. 玩家遊玩中途點擊「返回大廳」，系統調用 `destroyGame()` 清理記憶體，帳號錢包依然精確無殘幣、不需退幣。
2. 玩家 GameOver 時跳出 10 秒倒數，點擊「CONTINUE (1 Coin)」，扣除 1 枚硬幣原位恢復生命繼續遊玩。

### 流程三：前十名排行榜自動 Email 結算流程 (Top 10 Auto Email Submission Flow)
1. 玩家 GameOver 觸發 `ArcadeBridge.emit('GAME_OVER', summary)`。
2. 系統**完全不彈出暱稱輸入視窗**，自動抓取當前登入 User 的 `email`（例：`user@example.com`）併同得分上傳 API。
3. 若該得分擠進該遊戲前十名，大廳排行榜視窗 (Top 10) 自動刷新展出。
