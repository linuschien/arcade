# PRD-00: Arcade Stadium 平台主機規格 (Arcade Platform PRD)

## 1. 產品願景 (Product Vision)
Arcade Stadium 是一個模組化、極致沉浸的 HTML5 Web 大型電玩合輯平台。平台提供流暢的遊戲選擇大廳、單局點擊即扣代幣機制、每日免費與管理員獎勵機制、多裝置控制 (鍵盤/Gamepad手把/手機觸控)、分頁離開自動暫停、全域音量控管、復古 CRT Shader 濾鏡以及前十名 Email 結算高分排行榜，並透過標準化的 `ArcadeBridge` 與 `InputService` 讓任何子遊戲均可熱插拔上架。

---

## 2. 核心功能模組 (Core Platform Modules)

### 2.1 身份驗證存取與會員權限 (Strict Auth Access)
- **強制會員登入 (No Guest Access)**：平台僅供已登入會員使用，不開放訪客/匿名模式。未登入者自動重導向至登入頁。

### 2.2 遊戲大廳選單 (Arcade Lobby UI)
- **卡片輪播與預覽**：提供橫向輪播選單，展示各子遊戲的海報 (Cover Art)、歷史最高分、遊玩次數與遊戲簡介。
- **進入/離開遊戲**：點擊「START」選擇遊戲後，發動原子化扣幣並以流暢動畫掛載對應遊戲之 HTML5 Canvas，背景音樂自動切換。

### 2.3 跨裝置控制架構 (Multi-Device Control & InputService)
- **鍵盤控制**：支援 `WASD` / `Arrow Keys` 移動，`Space`/`Enter` 動作與 `C` 鍵投幣/續關。
- **實體 Gamepad / 街機搖桿**：透過 W3C Gamepad API 自動辨識連線之 USB/藍牙街機搖桿與 Xbox/PlayStation 控制器。
- **手機/平板虛擬觸控盤**：於行動裝置觸控屏自動渲染 Web 虛擬 D-Pad 與按鈕。

### 2.4 代幣與單局直接扣幣機制 (Direct Credit Deduction System)
- **統一帳號錢包 (Single Universal Wallet)**：平台維護單一簡潔的「帳號代幣餘額」，摒棄複雜的機台二次轉幣與退幣邏輯。
- **單局啟動扣幣 (Start Game Deduct)**：玩家在選單點擊「START (1 Coin)」或按下手把/鍵盤 `START` 鍵時，系統直接從帳號錢包原子化扣除 1 枚 Credit 並啟動遊戲。
- **續關扣幣 (Game Over Continue Deduct)**：遊戲 Game Over 時跳出經典街機 10 秒倒數視窗，玩家按下 `C` / `START` / 點擊「CONTINUE (1 Coin)」，直接從帳號錢包扣除 1 枚 Credit 恢復生命續關。中途離場不留殘幣、無需退幣手續。
- **每日免費代幣 (Daily Free Quota)**：玩家每日登入可獲得 **10 枚免費硬幣**。每日 00:00 (Local/UTC) 重置為 10 枚，**不可跨日累積**。
- **管理員獎勵發幣 (Admin Bonus Credits)**：管理員 (Admin) 可透過後台或 API 賦予玩家額外獎勵代幣。管理員獎勵代幣**不受每日重置影響**，且可長期保存。
- **代幣扣除優先權**：扣除代幣時，優先扣除「每日免費代幣」，免費代幣扣完後才扣除「管理員獎勵代幣」。

### 2.5 視窗失焦自動暫停與全域音效控管 (Auto-Pause & Global Audio)
- **視窗離開自動暫停 (Auto-Pause on Blur)**：當玩家切換瀏覽器分頁 (Alt+Tab) 或視窗失去焦點 (`window.onblur` / `document.hidden`) 時，系統自動觸發 `ArcadeBridge.emit('PAUSE_REQUESTED')` 暫停遊戲畫面與計時器，防止角色意外死亡。
- **全域音量控制 (Global Master Volume)**：大廳提供 Master Volume 滑桿與靜音 Mute 開關。開關同步控管大廳背景聲與 Phaser 內部 WebAudio (`game.sound.mute`)。
- **道地街機哲學 (No Soft Reset)**：遵循實體街機傳統，遊戲中**不提供重置 (Reset/Restart)** 按鈕。玩家若表現不佳，必須玩完單局或主動選擇退出回大廳。

### 2.6 前十名高分排行榜 (Top 10 Leaderboard & Email Submission)
- **前十名限制 (Top 10 Rank Limit)**：各子遊戲排行榜介面**僅顯示前十名 (Top 10)** 最高分紀錄。
- **自動 Email 帶入 (No Nickname Popup)**：系統自動抓取玩家當前登入之 Email 作為排行榜標示名稱，免除暱稱輸入彈窗。
- **同分排序規則 (Tie-Breaking Rule)**：若兩位玩家得分相同，**依照玩家 Email 字母順序 (A-Z) 排序**。

---

## 3. 非功能性需求 (Non-Functional Requirements)

1. **效能要求**：大廳 DOM 載入時間 $< 1.5$ 秒，遊戲 Canvas 渲染幀率穩定維持在 60 FPS。
2. **記憶體管理**：切換遊戲時，舊遊戲的 WebGL Texture 與 Sound 記憶體必須 $100\%$ 釋放，全域內存無洩漏。
3. **響應式佈局**：支援 16:9 電腦螢幕、Arcade 街機框體比例以及手機直/橫屏自適應。
