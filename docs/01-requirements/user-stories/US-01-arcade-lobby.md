# US-01 街機大廳模組 (Arcade Lobby Module)

## 背景 (Background)
Arcade Lobby 是 Arcade Stadium 平台的最上層使用者介面。負責 GCP IAP 身份整合、遊戲卡片輪播展示、單局直接扣幣 (Option C)、每日免費與管理員代幣發放扣除、跨裝置控制 (鍵盤/Gamepad/觸控)、手動與失焦自動暫停、全域靜音控管、CRT 復古濾鏡切換以及每款遊戲獨立 (Per-Game) 前十名 Email 結算排行榜視窗顯示。

---

## US-01-01：遊戲卡片輪播與 GCP IAP 驗證 (Game Carousel & GCP IAP Auth)

**身份**：街機玩家 (Arcade Player)

> **As a** 街機玩家，  
> **I want to** 在經由 GCP IAP 認證後進入大廳，滑動或按方向鍵/搖桿瀏覽選單中的子遊戲，  
> **So that** 我能查看每款遊戲的海報、簡介與該遊戲獨立的 Top 10 歷史最高分。

### 驗收條件 (Acceptance Criteria)
- **AC1 (GCP IAP Auth Integration)**：系統自動抓取 GCP IAP 傳入之 `X-Goog-Authenticated-User-Email` Header 作為登入者 Email，完全無須前端自刻登入頁面。
- **AC2 (Carousel & Per-Game High Scores)**：大廳載入子遊戲卡片（Tetris、Pac-Man...），切換卡片時同步展出該子遊戲獨有的 Top 10Leaderboard 排行榜與歷史紀錄。
- **AC3 (Multi-Device Navigation)**：支援鍵盤 `LEFT`/`RIGHT` 鍵、實體 Gamepad 搖桿/D-Pad 以及手機觸控滑動。

---

## US-01-02：單局啟動/續關直接扣幣機制 (Direct Credit Deduct on Start & Continue)

**身份**：街機玩家 (Arcade Player)

> **As a** 街機玩家，  
> **I want to** 點擊「START (1 Coin)」、按下鍵盤 `C`/`START` 或 Gamepad 的 `START` 鍵直接啟動遊戲或續關，  
> **So that** 系統直接從我的錢包扣除 1 枚 Credit 並開始遊玩，無須複雜的二次轉幣與退幣。

### 驗收條件 (Acceptance Criteria)
- **AC1 (Atomic Deduction on Start)**：玩家點擊 START 或按鍵啟動遊戲時，系統從帳號錢包原子化扣除 1 枚 Credit，發出掉幣音效，並透過 `ArcadeBridge.emit('COIN_INSERTED', remainingCredits)` 廣播啟動遊戲。
- **AC2 (Continue Deduction)**：Game Over 畫面 10 秒倒數期間，玩家按下 `C` / `START` 或點擊「CONTINUE (1 Coin)」，系統扣除 1 枚 Credit 恢復生命續關。
- **AC3 (Zero Credit Block)**：當 Credit $= 0$ 時按下 START 或 CONTINUE，阻擋發射並跳出「OUT OF CREDITS」警示提示。
- **AC4 (No Soft Reset)**：遵循實體街機傳統，遊戲中不提供 Soft Reset 按鈕，離場僅能選擇返回大廳。

---

## US-01-03：動態載入 Canvas 遊戲引擎 (Launch Game Canvas)

**身份**：街機玩家 (Arcade Player)

> **As a** 街機玩家，  
> **I want to** 在選定遊戲且扣幣成功後，  
> **So that** 大廳流暢切換隱藏選單，載入對應遊戲的 HTML5 Canvas 開始遊戲。

### 驗收條件 (Acceptance Criteria)
- **AC1 (Happy Path)**：扣幣成功後，大廳隱藏，銷毀舊 Canvas，並以非同步 Dynamic Import 載入目標遊戲模組 (`src/games/{game_id}/index.ts`) 掛載至 `<div id="phaser-game-container" />`。
- **AC2 (Teardown on Return)**：點擊返回大廳時，觸發 `gameInstance.destroyGame()` 銷毀遊戲與 WebGL Texture 記憶體。

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
- **AC1 (Admin Grant Action)**：Admin 可透過 API/後台介面給予玩家指定數量的 `Admin Bonus Credit`。
- **AC2 (Bonus Non-Expiration Rule)**：`Admin Bonus Credit` **不受每日 00:00 重置影響**，可長期保留於玩家帳號。
- **AC3 (Consumption Priority)**：當玩家 START 或 CONTINUE 扣幣時，系統扣除優先順序為：
  1. 優先扣除 `Daily Free Credit`（每日免費硬幣）。
  2. 若 `Daily Free Credit` $= 0$，才扣除 `Admin Bonus Credit`（管理員獎勵硬幣）。

---

## US-01-07：每款遊戲獨立前十名排行榜 (Per-Game Top 10 Leaderboard & Auto Email Submission)

**身份**：街機玩家 (Arcade Player)

> **As a** 街機玩家，  
> **I want to** 在各遊戲卡片上看到該遊戲專屬的前十名高分榜，且 Game Over 時系統自動帶入 GCP IAP Email 完成上載，  
> **So that** 榜單針對不同遊戲獨立展示，同分時按 Email 字母 A-Z 秩序排列。

### 驗收條件 (Acceptance Criteria)
- **AC1 (Per-Game Top 10 Rank Display)**：排行榜依據子遊戲 `game_id`（例：`tetris` vs `pacman`）**獨立查詢並展示各自的前十名最高分紀錄 (Rank 1~10)**。
- **AC2 (GCP IAP Email Auto Identifier)**：當 Game Over 觸發，系統自動帶入 GCP IAP 傳入之玩家 `email` 欄位（例如：`linus@example.com`），免除暱稱輸入彈窗。
- **AC3 (Tie-Breaking Rule by Email)**：若同款遊戲兩位玩家得分相同，**依照 Email 字母順序 (A-Z ASC) 進行排序**。

---

## US-01-08：手動觸發與失焦自動暫停機制 (Manual Trigger & Auto-Pause on Blur)

**身份**：街機玩家 (Arcade Player)

> **As a** 街機玩家，  
> **I want to** 隨時點擊按鈕或按下按鍵手動暫停，或在切換分頁時自動暫停，  
> **So that** 我能主動或被動地保護遊戲進度不意外死亡。

### 驗收條件 (Acceptance Criteria)
- **AC1 (Manual Pause Trigger)**：玩家可隨時點擊 UI 頂部「Pause」按鈕、按下鍵盤 `ESC`/`P` 鍵或實體 Gamepad 的 `START`/`PAUSE` 鍵主動觸發暫停。
- **AC2 (Auto-Pause on Blur)**：全域監聽 `window.onblur` 與 `document.visibilitychange`。當分頁隱藏或視窗失焦時，自動發送 `ArcadeBridge.emit('PAUSE_REQUESTED')` 暫停遊戲與計時器。

---

## US-01-09：全域靜音與音量控制 (Global Master Volume & Mute)

**身份**：街機玩家 (Arcade Player)

> **As a** 街機玩家，  
> **I want to** 透過大廳頂部的 Master 控制器調節全域音量或一鍵靜音，  
> **So that** 我能在適當場合控制聲響。

### 驗收條件 (Acceptance Criteria)
- **AC1 (Master Volume & Mute Toggle)**：UI 頂部提供音量 Slider 與 Mute 鍵。
- **AC2 (Phaser Audio Sync)**：切換 Mute 時，同步控制大廳背景音與 Phaser WebAudio (`game.sound.mute = true`)。
