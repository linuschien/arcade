# Arcade Stadium - 需求與 User Stories 總覽 (Master Index)

## 📌 系統角色 (System Actors)
- **街機玩家 (Arcade Player)**：遊玩遊戲、投幣、查詢排行榜與切換 CRT 濾鏡的主要使用者。
- **React Host Shell**：外層 Arcade 大廳 UI 容器與事件監聽器。
- **Phaser Game Engine**：內層 Canvas 遊戲引擎與 60fps 物理渲染視窗。

---

## 📂 需求模組清單 (Module List)

### 1. 街機大廳模組 (`US-01-arcade-lobby.md`)
| 故事 ID | 故事名稱 | 核心動作 | 驗收條件涵蓋 |
|---|---|---|---|
| **US-01-01** | 遊戲卡片輪播與切換 | 瀏覽遊戲海報、標題與歷史最高分 | 卡片焦點切換、鍵盤/搖桿操作、無遊戲空狀態 |
| **US-01-02** | 代幣投幣機制 | 按 `C` 或點擊按鈕進行投幣 | Credit 加總廣播、99 上限限制、記憶持久化 |
| **US-01-03** | 啟動與切換 Canvas 遊戲 | 點擊 START 進入遊戲畫面 | 動態掛載 Canvas、Credit=0 阻擋發射 |
| **US-01-04** | CRT 復古掃描線濾鏡切換 | 設定選單開啟/關閉 CRT Shader | CSS/WebGL 掃描線切換、LocalStorage 保存 |

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

### 流程一：玩家進入系統與啟動遊戲 (Game Startup Flow)
1. 玩家進入 Arcade Stadium，大廳渲染 `US-01-01` 遊戲輪播卡片。
2. 玩家按 `C` 鍵，觸發 `US-01-02` 投幣，Credit $+1$。
3. 玩家選擇 Tetris 並點擊 START (`US-01-03`)，Credit $-1$，進入 `US-02-01` 方塊遊戲畫面。

### 流程二：遊戲中途暫停與恢復 (Pause/Resume Flow)
1. 玩家於遊戲中按下 `ESC` 或 `P` 鍵。
2. Phaser 遊戲監聽 `ArcadeBridge.on('PAUSE_REQUESTED')` 暫停內部 Scene 物理與 Timer。
3. 玩家點擊 Resume，觸發 `ArcadeBridge.on('RESUME_REQUESTED')` 恢復 60fps 主循環。

### 流程三：遊戲結算與高分榜上報 (GameOver & Leaderboard Flow)
1. 玩家於 Pac-Man 扣光 3 條生命 (`US-03-04`)，觸發 Game Over。
2. Phaser 發送 `ArcadeBridge.emit('GAME_OVER', summary)` 給 React Host Shell。
3. React 跳出高分排行榜視窗，提示玩家輸入暱稱上傳至高分榜。
