# US-01 街機大廳模組 (Arcade Lobby Module)

## 背景 (Background)
Arcade Lobby 是 Arcade Stadium 平台的最上層使用者介面。負責遊戲卡片輪播展示、每日免費與管理員代幣發放扣除、跨裝置控制 (鍵盤/Gamepad/觸控)、CRT 復古濾鏡切換以及全網排行榜視窗顯示。

---

## US-01-01：遊戲卡片輪播與切換 (Game Carousel Selection)

**身份**：街機玩家 (Arcade Player)

> **As a** 街機玩家，  
> **I want to** 在 Arcade Lobby 頁面上滑動或按方向鍵/搖桿瀏覽選單中的子遊戲，  
> **So that** 我能查看每款遊戲的海報、簡介與歷史最高得分紀錄。

### 驗收條件 (Acceptance Criteria)
- **AC1 (Happy Path)**：大廳預設載入包含 Tetris 與 Pac-Man 等遊戲卡片，當玩家切換選焦點時，同步更新背景海報圖片、標題與最高分紀錄。
- **AC2 (Multi-Device Navigation)**：支援鍵盤 `LEFT`/`RIGHT` 鍵、實體 Gamepad 搖桿/D-Pad 以及手機觸控滑動。
- **AC3 (Empty State)**：若系統無可用遊戲，顯示「No Games Available」提示警示。

---

## US-01-02：代幣投幣機制與多裝置控制 (Coin System & Multi-Device Control)

**身份**：街機玩家 (Arcade Player)

> **As a** 街機玩家，  
> **I want to** 點擊「INSERT COIN」按鈕、按下鍵盤 `C` 鍵、或按下 Gamepad 的 `SELECT/COIN` 鍵進行投幣，  
> **So that** 系統從我的代幣庫存扣除 1 枚 Credit 並撥放街機硬幣掉落音效。

### 驗收條件 (Acceptance Criteria)
- **AC1 (Happy Path & Multi-Device)**：每次觸發投幣動作（UI 點擊、鍵盤 `C` 鍵、實體 Gamepad `COIN` 鍵或行動裝置觸控按鈕），頂部 `CREDIT` 計數器 $-1$，播放掉幣音效，並透過 `ArcadeBridge.emit('COIN_INSERTED', remainingCredits)` 廣播給遊戲。
- **AC2 (Max Credit Cap)**：玩家擁有的代幣總數最高上限為 `99`。
- **AC3 (Zero Credit Edge Case)**：當 Credit $= 0$ 時嘗試投幣或啟動遊戲，阻擋發射並跳出「OUT OF CREDITS」警示提示。

---

## US-01-03：啟動與切換 Canvas 遊戲引擎 (Launch Game Canvas)

**身份**：街機玩家 (Arcade Player)

> **As a** 街機玩家，  
> **I want to** 在選定遊戲且 Credit $\ge 1$ 時按下「START」，  
> **So that** 大廳隱藏選單，載入對應遊戲的 HTML5 Canvas 並開始遊玩。

### 驗收條件 (Acceptance Criteria)
- **AC1 (Happy Path)**：點擊 START 後，大廳隱藏，銷毀舊 Canvas，並以非同步 Dynamic Import 載入目標遊戲模組 (`src/games/{game_id}/index.ts`) 掛載至 `<div id="phaser-game-container" />`。
- **AC2 (Zero Credit Edge Case)**：當 Credit $= 0$ 時按下 START，阻擋啟動並於螢幕中央閃爍紅色提示「INSERT COIN TO PLAY」。

---

## US-01-04：CRT 復古掃描線濾鏡切換 (CRT Filter Toggle)

**身份**：街機玩家 (Arcade Player)

> **As a** 街機玩家，  
> **I want to** 在設定選單中開啟或關閉 CRT 復古濾鏡，  
> **So that** 我能自由選擇擬真街機掃描線視覺或現代清晰視覺。

### 驗收條件 (Acceptance Criteria)
- **AC1 (Happy Path)**：切換 CRT 開關時，全域 Overlay `<div class="crt-overlay" />` 的 CSS/WebGL 掃描線 Shader 效果即時生效或隱藏。
- **AC2 (User Preference Persistence)**：濾鏡設定自動儲存至 LocalStorage (`arcade_crt_enabled`)，下次開啟網站自動帶入。

---

## US-01-05：每日免費代幣發放機制 (Daily Free Credit Quota)

**身份**：街機玩家 (Arcade Player)

> **As a** 街機玩家，  
> **I want to** 每日首次登入平台時獲得 10 枚免費硬幣，  
> **So that** 我每天都能享受免費遊玩遊戲的體驗。

### 驗收條件 (Acceptance Criteria)
- **AC1 (Daily Quota Assignment)**：系統每日 00:00 (Local/UTC) 將玩家的「每日免費代幣 (`Daily Free Credit`)」重置為 **10 枚**。
- **AC2 (Non-Accumulative Rule)**：每日免費代幣**不可跨日累積**。例如：玩家昨日剩餘 3 枚免費代幣，今日 00:00 重置後代幣數量為 **10 枚**（重置配額），而非 13 枚。
- **AC3 (Daily Reset Notification)**：每日重置時於 UI 顯示「Daily Free 10 Coins Refreshed!」提示通知。

---

## US-01-06：管理員獎勵代幣與扣除順序 (Admin Reward Credit & Consumption Order)

**身份**：管理員 (Admin) / 街機玩家 (Arcade Player)

> **As an** 管理員，  
> **I want to** 給予特定玩家額外獎勵硬幣 (`Admin Bonus Credit`)，  
> **So that** 玩家能獲得活動獎勵與額外遊玩次數；  
> **As a** 街機玩家，  
> **I want to** 系統優先扣除每日免費硬幣，免費硬幣用完後才扣除管理員獎勵硬幣，  
> **So that** 我的獎勵硬幣不會因為每日重置而失效。

### 驗收條件 (Acceptance Criteria)
- **AC1 (Admin Grant Action)**：Admin 可透過 API/後台介面給予玩家 指定數量的 `Admin Bonus Credit`。
- **AC2 (Bonus Non-Expiration Rule)**：`Admin Bonus Credit` **不受每日 00:00 重置影響**，可長期保留於玩家帳號。
- **AC3 (Consumption Priority)**：當玩家投幣遊玩時，系統扣除優先順序為：
  1. 優先扣除 `Daily Free Credit`（每日免費硬幣）。
  2. 若 `Daily Free Credit` $= 0$，才扣除 `Admin Bonus Credit`（管理員獎勵硬幣）。
- **AC4 (UI Display)**：大廳 Credit 計數器清晰展示總硬幣數，並可懸浮查看 breakdown（例如：`Total: 15 (Free: 5, Bonus: 10)`）。
