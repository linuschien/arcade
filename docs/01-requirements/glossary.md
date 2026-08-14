# 領域術語表 (Domain Glossary)

## 核心領域物件 (Core Domain Objects)

### 1. 街機平台實體 (Arcade Platform Entities)

| 術語 | 英文 / 代碼 | 定義 | 備註 / 約束 |
|------|------------|------|------------|
| **GCP IAP 身份認證** | `GCP Identity-Aware Proxy` | Google Cloud 的身份感應代理。託管登入頁面與 OAuth 驗證，並在 Header 注入使用者身份。 | 注入 `X-Goog-Authenticated-User-Email` Header |
| **街機大廳** | `Arcade Lobby` | Arcade Stadium 平台主頁面，提供遊戲卡片切換、代幣計數與選單操作。 | React Host Shell 渲染 |
| **代幣 / 點數** | `Credit` / `Coin` | 用於啟動或重試子遊戲的虛擬貨幣。 | 預設投幣 1 次 = -1 Credit |
| **每日免費代幣** | `Daily Free Credit` | 系統每日自動發放給玩家的免費遊玩硬幣。 | 每日配額 10 枚，每日 00:00 重置，不可跨日累積 |
| **管理員獎勵代幣** | `Admin Bonus Credit` | 管理員手動獎勵給特定玩家的額外代幣。 | 不受每日重置影響，優先於免費代幣扣除後或作為獨立庫存保存 |
| **投幣槽** | `Coin Slot` | 玩家觸發投幣動作的 UI、快捷鍵 (`C` 鍵) 或手把 `START/COIN` 鍵。 | 觸發 `COIN_INSERTED` 事件 |
| **街機搖桿與手把** | `Gamepad / Arcade Stick` | 通過 W3C Gamepad API 串接的實體 USB / 藍牙街機搖桿與手把。 | 支援 P1/P2 雙人控制器 |
| **虛擬觸控盤** | `Touch Virtual D-Pad` | 於行動裝置螢幕上渲染的虛擬十字鍵與動作按鈕。 | 支援手機與平板觸控 |
| **街機框體** | `Arcade Cabinet` | 包裹 HTML5 Canvas 視窗的復古電玩框體視覺外框。 | 支援 2D / 3D 擬真樣式 |
| **復古濾鏡** | `CRT Filter` | 模擬舊型陰極射線管 (CRT) 螢幕掃描線與色彩微膨脹的 Shader 效果。 | 可於大廳設定中 Toggle 開關 |
| **一幣通關** | `1CC` | 玩家僅使用 1 枚 Credit 即完成遊戲全部關卡的最高榮譽成就。 | 記錄於 `GameSummary` |

---

### 2. 俄羅斯方塊領域物件 (Tetris Domain Objects)

| 術語 | 英文 / 代碼 | 定義 | 備註 / 約束 |
|------|------------|------|------------|
| **方塊板塊** | `Tetromino` | 由 4 個正方形小格 (Mino) 組成的 7 種幾何圖案 (I, J, L, O, S, T, Z)。 | 遵循 SRS 旋轉系統規格 |
| **遊戲地圖矩陣** | `Playfield Matrix` | 存放方塊落點狀態的 10 (寬) x 20 (高) 離散網格。 | (0,0) 為左上角 |
| **滿行消除** | `Line Clear` | 當矩陣中某一橫列 10 個格子完全填滿時，該列消除並得分。 | 支援 Single, Double, Triple, Tetris |
| **硬降** | `Hard Drop` | 玩家按下下鍵或空白鍵，方塊瞬間垂直降落至最底端並固定 (Lock Down)。 | 瞬間發動並結算得分 |
| **軟降** | `Soft Drop` | 玩家按住向下鍵，加速方塊下落速度。 | 下落過程中每格獲得額外加分 |
| **影子方塊** | `Ghost Piece` | 顯示當前方塊若執行 Hard Drop 將會落下的半透明位置預覽。 | 輔助玩家精準瞄準 |
| **保留區** | `Hold Queue` | 玩家可暫存當前方塊並換出先前保留方塊的機制。 | 每顆方塊下落期間限交換 1 次 |
| **七隨機袋生成器** | `7-Bag Generator` | 確保每 7 次落下的方塊必定包含 I, J, L, O, S, T, Z 各一次的公平生成演算法。 | 避免連續不出現關鍵方塊 |

---

### 3. 小精靈領域物件 (Pac-Man Domain Objects)

| 術語 | 英文 / 代碼 | 定義 | 備註 / 約束 |
|------|------------|------|------------|
| **小精靈** | `Pac-Man` | 玩家控制的主角，在迷宮中移動並吞食豆子。 | 移動基於 28x36 Tile 網格 |
| **幽靈 / 鬼魂** | `Ghost` | 迷宮中追逐 Pac-Man 的 4 隻 AI 敵方角色 (Blinky, Pinky, Inky, Clyde)。 | 各自具備獨立的追逐 AI 邏輯 |
| **普通豆** | `Pac-Dot / Pellet` | 散落於迷宮路徑上的黃色小豆，吞食獲得 10 分。 | 吃到所有豆子即過關 |
| **能量豆** | `Power Pellet` | 迷宮四角的大型閃爍豆子，吞食獲得 50 分並使幽靈進入驚恐狀態。 | 觸發 Frightened Mode |
| **驚恐模式** | `Frightened Mode` | 幽靈變為藍色、移動變慢且方向反轉的暫時狀態。Pac-Man 可反吞幽靈。 | 持續時間隨關卡遞減 |
| **巡邏模式** | `Scatter Mode` | 幽靈放棄追逐 Pac-Man，分別朝迷宮四個角落陣地移動的定時狀態。 | 與 Chase Mode 定期切換 |
| **追逐模式** | `Chase Mode` | 幽靈依據各自 AI 演算法主動瞄準 Pac-Man 或特定目標格移動的主模式。 | 主戰鬥模式 |
| **紅鬼** | `Blinky (Shadow)` | 直線直接瞄準 Pac-Man 當前網格位置追逐的紅色幽靈。 | 領頭 AI |
| **粉鬼** | `Pinky (Speedy)` | 瞄準 Pac-Man 前方 4 格預判位置進行伏擊的粉色幽靈。 | 伏擊 AI |
| **藍鬼** | `Inky (Bashful)` | 依據 Blinky 與 Pac-Man 前方 2 格連線向量延伸雙倍距離計算目標的青色幽靈。 | 包抄 AI |
| **橘鬼** | `Clyde (Pokey)` | 距離 Pac-Man > 8 格時追逐，$\le 8$ 格時退回左下角 Patrol 點。 | 隨機游移 AI |

---

### 4. 水管工人領域物件 (Pipe Mania Domain Objects)

| 術語 | 英文 / 代碼 | 定義 | 備註 / 約束 |
|------|------------|------|------------|
| **化學液體 / 水流** | `Flooz / Liquid` | 於管道中推進的綠色液體。起噴延遲 $T_{\text{delay}}$，推進間隔 $T_{\text{flow}}$。 | 觸碰無開口即爆管 |
| **5格 FIFO 發牌佇列** | `5-Slot FIFO Queue` | 側邊顯示未來 5 個待放置水管的先進先出生產佇列。 | 放置後自動 Pop & Push |
| **基礎水管** | `Standard Pipes` | 涵蓋水平/垂直直管、4 款雙向彎管與 1 款立體交叉十字管 (`╬`)。 | 共 7 種種類 |
| **單向水管** | `One-Way Pipes` | 僅允許單一方向進水（`→`, `←`, `↑`, `↓`）的特殊直管，反向進水立即爆管。 | 共 4 種種類 |
| **水庫水管** | `Reservoir Tanks` | 具備 3~5 秒緩衝降速（$20\% \sim 33\%$ 速度）的水庫元件，完全填滿獲得大額加分。 | 共 2 種種類 |
| **障礙石頭** | `Obstacle Stones` | 占據網格且無法通過、無法覆蓋替換的障礙元件。 | $N_{\text{obstacle}}$ 依 Level 遞增 |
| **預設固定水管** | `Preset Pipes` | 開局預先固定於盤面的水管，不可覆蓋，流經獲得額外 Bonus 積分。 | $N_{\text{fixed}}$ 依 Level 遞增 |
| **快進 / 手動加速** | `Fast Forward` | 按下加速按鈕使水流強制縮短至 $50\text{ ms}$ 推進，並獲得 $2\times$ 加速倍率積分。 | 節省等待時間與加分 |
| **爆管溢出** | `Spill Game Over` | 水流撞上無開口水管、障礙物或邊界時引發的失敗判定。 | 觸發爆管動畫與 Game Over |
| **未達標失敗** | `Underflow Game Over` | 水流雖然成功流入終點排水口，但累積長度未達 $N_{\text{target}}$ 要求的失敗判定。 | 未達目標長度失敗 |

---

## 5. 功能與系統狀態術語 (System State Terms)

| 術語 | 英文 / 代碼 | 定義 |
|------|------------|------|
| **遊戲狀態機** | `Game Flow FSM` | 涵蓋 `UNLOADED`, `LOBBY`, `PLAYING`, `PAUSED`, `GAMEOVER` 的狀態轉移。 |
| **單遊戲前十名榜** | `Per-Game Top 10 Leaderboard` | 每款子遊戲 (`game_id`) 獨立展示專屬前十名最高分紀錄。 | 依 `game_id` 獨立計算 |
| **GCP IAP 認證 Email** | `GCP IAP Authenticated Email` | 經由 GCP IAP 驗證傳入之 User Email，自動作為排行榜識別與發幣標示。 | 由系統標頭自動帶入 |
