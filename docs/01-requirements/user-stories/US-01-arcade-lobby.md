# US-01 街機大廳模組 (Arcade Lobby Module)

## 背景 (Background)
Arcade Lobby 是 Arcade Stadium 平台的最上層使用者介面。負責遊戲卡片輪播展示、模擬投幣代幣累積、CRT 復古濾鏡切換以及全網排行榜視窗顯示。

---

## US-01-01：遊戲卡片輪播與切換 (Game Carousel Selection)

**身份**：街機玩家 (Arcade Player)

> **As a** 街機玩家，  
> **I want to** 在 Arcade Lobby 頁面上左右滑動或按方向鍵瀏覽選單中的子遊戲，  
> **So that** 我能查看每款遊戲的海報、簡介與歷史最高得分紀錄。

### 驗收條件 (Acceptance Criteria)
- **AC1 (Happy Path)**：大廳預設載入包含 Tetris 與 Pac-Man 等遊戲卡片，當玩家切換選焦點時，同步更新背景海報圖片、標題與最高分紀錄。
- **AC2 (Keyboard & Controller Navigation)**：支援鍵盤 `LEFT`/`RIGHT` 鍵與 `Enter` 鍵選取遊戲，亦支援滑鼠/觸控點擊卡片。
- **AC3 (Empty State)**：若系統無可用遊戲，顯示「No Games Available」提示警示。

---

## US-01-02：代幣投幣機制 (Coin / Credit System)

**身份**：街機玩家 (Arcade Player)

> **As a** 街機玩家，  
> **I want to** 點擊「INSERT COIN」按鈕或按下鍵盤 `C` 鍵進行投幣，  
> **So that** 系統累積 Credit 次數並撥放街機硬幣掉落音效。

### 驗收條件 (Acceptance Criteria)
- **AC1 (Happy Path)**：每次觸發投幣，頂部 HUD 的 `CREDIT` 計數器 $+1$，播放音效，並透過 `ArcadeBridge.emit('COIN_INSERTED', currentCredits)` 廣播。
- **AC2 (Max Credit Cap)**：單次最高可累積代幣上限為 `99`，達上限時再投幣不增加並提示「MAX CREDITS REACHED」。
- **AC3 (Persistence)**：代幣數量在玩家關閉瀏覽器分頁前維持記憶。

---

## US-01-03：啟動與切換 Canvas 遊戲引擎 (Launch Game Canvas)

**身份**：街機玩家 (Arcade Player)

> **As a** 街機玩家，  
> **I want to** 在選定遊戲且 Credit $\ge 1$ 時按下「START」，  
> **So that** 大廳隱藏選單，載入對應遊戲的 HTML5 Canvas 並扣除 1 個 Credit。

### 驗收條件 (Acceptance Criteria)
- **AC1 (Happy Path)**：點擊 START 後，Credit $-1$，大廳隱藏，銷毀舊 Canvas，並以非同步 Dynamic Import 載入目標遊戲模組 (`src/games/{game_id}/index.ts`) 掛載至 `<div id="phaser-game-container" />`。
- **AC2 (Zero Credit Edge Case)**：當 Credit $= 0$ 時按下 START，阻擋啟動並於螢幕中央閃爍紅色提示「INSERT COIN TO PLAY」。

---

## US-01-04：CRT 復古掃描線濾鏡切換 (CRT Filter Toggle)

**身份**：街機玩家 (Arcade Player)

> **As a** 街機玩家，  
> **I want to** 在設定選單中開啟或關閉 CRT 復古濾鏡，  
> **So that** 我能自由選擇擬真街機掃描線視覺或現代清晰視覺。

### 驗收條件 (Acceptance Criteria)
- **AC1 (Happy Path)**：切換 CRT 開關時，全域 Overlay `<div class="crt-overlay" />` 的 CSS 掃描線 Shader 效果即時生效或隱藏。
- **AC2 (User Preference Persistence)**：濾鏡設定自動儲存至 LocalStorage (`arcade_crt_enabled`)，下次開啟網站自動帶入。
