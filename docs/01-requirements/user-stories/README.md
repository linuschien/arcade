# Arcade Stadium - 需求與 User Stories 總覽 (Master Index)

## 📌 系統角色 (System Actors)
- **街機玩家 (Arcade Player)**：經由 GCP IAP 驗證登入、遊玩遊戲、投幣、查詢 Per-Game 排行榜與切換 CRT 濾鏡的主要使用者。
- **管理員 (Admin)**：管理平台、給予玩家獎勵代幣 (Admin Bonus Credit) 的系統管理角色。
- **React Host Shell**：外層 Arcade 大廳 UI 容器與事件監聽器。
- **Phaser Game Engine**：內層 Canvas 遊戲引擎與 60fps 物理渲染視窗。

---

## 📂 需求模組清單 (Module List)

### 1. 街機大廳與代幣模組 (`US-01-arcade-lobby.md`)
| 故事 ID | 故事名稱 | 核心動作 | 驗收條件涵蓋 |
|---|---|---|---|
| **US-01-01** | 遊戲卡片輪播與 GCP IAP 驗證 | 瀏覽遊戲海報與歷史最高分 | 卡片焦點切換、鍵盤/搖桿/觸控操作、GCP IAP `X-Goog-Authenticated-User-Email` 自動驗證 |
| **US-01-02** | 單局啟動/續關直接扣幣 | 按 START 或 CONTINUE 直接從錢包扣幣 | 單局啟動扣 1 Coin、10s 續關倒數扣幣、零退幣手續、無 Soft Reset |
| **US-01-03** | 動態載入 Canvas 遊戲 | 扣幣成功後啟動 Canvas 視窗 | 動態掛載 Canvas、Credit=0 阻擋發射、返回大廳記憶體銷毀 |
| **US-01-04** | CRT 復古掃描線濾鏡切換 | 設定選單開啟/關閉 CRT Shader | CSS/WebGL 掃描線切換、LocalStorage 保存 |
| **US-01-05** | 每日免費代幣發放機制 | 每日登入獲得 10 枚免費硬幣 | 每日 00:00 重置配額 10 枚、不可跨日累積 |
| **US-01-06** | 管理員獎勵代幣與扣除順序 | Admin 給予獎勵代幣、優先扣免費硬幣 | Admin 發幣 API/介面、獎勵硬幣跨日保留、優先扣除免費硬幣 |
| **US-01-07** | 每款遊戲獨立前十名排行榜 | 自動帶入 GCP IAP Email 並展示每款遊戲 Top 10 | 每款遊戲獨立 Top 10 (`game_id`)、自動帶入 GCP IAP Email、同分按 Email A-Z 排序 |
| **US-01-08** | 手動觸發與失焦自動暫停機制 | 手動按鍵/點擊暫停，或切換分頁時自動暫停 | UI 點擊 / `ESC`/`P` / Gamepad 按鍵手動暫停，分頁 `onblur` 自動發送 `PAUSE_REQUESTED` |
| **US-01-09** | 全域音量與靜音控管 | 調整 Master 音量或一鍵靜音 | 大廳頂部控件、同步控管 Phaser WebAudio 靜音 |

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

### 4. 水管工人模組 (`US-04-game-pipemania.md`)
| 故事 ID | 故事名稱 | 核心動作 | 驗收條件涵蓋 |
|---|---|---|---|
| **US-04-01** | $10 \times 7$ 網格操作與水管放置 | 點擊網格放置/覆蓋水管 | 佇列 Pop/Push、未水淹水管覆蓋扣 50 分、水淹水管禁止覆蓋 |
| **US-04-02** | 障礙物與預設固定水管限制 | 盤面障礙與預設水管互動 | 石頭忽略輸入、預設水管禁止覆蓋與 Bonus 加分 |
| **US-04-03** | 13 種實體水管元件連通性物理 | 判定 13 種水管之進出方向與速度 | 7 種基礎管（含 `╬` 十字獨立通道）、4 種單向管、2 種水庫管（$20\% \sim 33\%$ 緩衝） |
| **US-04-04** | 邊界碰撞與水流溢出判定 | 判定撞牆、錯位或無開口溢出 | 外圍邊界爆管、無開口/單向管反向爆管、`GAME_OVER` 事件拋出 |
| **US-04-05** | 5 格先進先出 (FIFO) 發送器 | 側邊 UI 展示未來 5 格佇列 | 5 格 UI 預覽、平滑 Pop & Push 動畫 |
| **US-04-06** | 基於關卡等級的加權發牌 | 動態調整 13 種水管發牌機率 | $L<4$ 無水庫管、$L<7$ 無單向管、$L\ge 7$ 線性動態權重分配 |
| **US-04-07** | 無硬編碼線性難度參數公式 | 計算預備時間、流速、目標長度與障礙數 | $T_{\text{delay}}$, $T_{\text{flow}}$, $N_{\text{target}}$, $N_{\text{obstacle}}$, $N_{\text{fixed}}$ 無硬編碼公式 |
| **US-04-08** | 終點錨定與過關長度驗證 | 驗收水流進入終點條件與長度 | $\ge N_{\text{target}}$ 成功過關、$< N_{\text{target}}$ Underflow 失敗、終點開口背向起點 |
| **US-04-09** | 36 關主線通關與無限極限循環 | 36 關通關後進入 Endless Loop | 36 關主線、$\bmod 36$ 地圖循環與等比流速加壓 |
| **US-04-10** | 手動加速與結算加分 | 按下 Fast Forward 加速水流 | 強制 $50\text{ ms}$ 推進、$2\times$ 加速倍率得分加成 |

---

## 🔄 端到端業務流程 (Business Workflows)

### 流程一：玩家經由 GCP IAP 登入與單局啟動 (GCP IAP Auth & Game Startup Flow)
1. 會員玩家經由 GCP IAP 認證存取平台，系統自動取得 `X-Goog-Authenticated-User-Email` Header，並發放/重置 10 枚「每日免費代幣」 (`US-01-05`)。
2. 玩家於大廳選單選擇 Pipe Mania，點擊「START (1 Coin)」 (`US-01-02`)。
3. 系統直接從帳號錢包扣除 1 枚免費代幣，透過 `ArcadeBridge.emit('COIN_INSERTED')` 啟動遊戲 (`US-01-03`)。

### 流程二：手動/自動暫停與離場 (Pause & Exit Flow)
1. 玩家手動點擊 UI 按鈕或按下 `ESC`/`P`/Gamepad 按鍵（或切換分頁失焦），觸發 `US-01-08` 發送 `PAUSE_REQUESTED` 暫停遊戲。
2. 玩家遊玩中途點擊「返回大廳」，系統調用 `destroyGame()` 清理記憶體，無 Soft Reset。
3. 玩家 GameOver (爆管溢出或長度未達標) 時跳出 10 秒倒數，點擊「CONTINUE (1 Coin)」，扣除 1 枚硬幣續關。

### 流程三：Pipe Mania 鋪路與 Fast Forward 加速通關流程 (Pipe Placement & Fast Forward Flow)
1. 遊戲開局倒數 $T_{\text{delay}}$ 秒，玩家利用 $5$ 格 FIFO 佇列在 $10 \times 7$ 網格放置水管 (`US-04-01`, `US-04-05`)。
2. 液體由起點開始以 $T_{\text{flow}}$ 速度推進 (`US-04-03`)。
3. 玩家長按 Fast Forward 加速 (`US-04-10`)，水流以 $50\text{ ms}$ 極速前進並獲得 $2\times$ 得分倍率。
4. 液體成功流入終點且水管格數 $\ge N_{\text{target}}$，宣告通關並載入下一個 Level (`US-04-08`)。
