# PRD-00: Arcade Stadium 平台主機規格 (Arcade Platform PRD)

## 1. 產品願景 (Product Vision)
Arcade Stadium 是一個模組化、極致沉浸的 HTML5 Web 大型電玩合輯平台。平台提供流暢的遊戲選擇大廳、每日免費代幣與管理員獎勵機制、多裝置控制 (鍵盤/Gamepad手把/手機觸控)、復古 CRT Shader 濾鏡以及全網高分排行榜，並透過標準化的 `ArcadeBridge` 與 `InputService` 讓任何子遊戲均可熱插拔上架。

---

## 2. 核心功能模組 (Core Platform Modules)

### 2.1 遊戲大廳選單 (Arcade Lobby UI)
- **卡片輪播與預覽**：提供橫向輪播選單，展示各子遊戲的海報 (Cover Art)、歷史最高分、遊玩次數與遊戲簡介。
- **進入/離開遊戲**：點擊「START」選擇遊戲後，以流暢動畫掛載對應遊戲之 HTML5 Canvas，背景音樂自動切換。

### 2.2 跨裝置控制架構 (Multi-Device Control & InputService)
- **鍵盤控制**：支援 `WASD` / `Arrow Keys` 移動，`Space`/`Enter` 動作與 `C` 鍵投幣。
- **實體 Gamepad / 街機搖桿**：透過 W3C Gamepad API 自動辨識連線之 USB/藍牙街機搖桿與 Xbox/PlayStation 控制器。
- **手機/平板虛擬觸控盤**：於行動裝置觸控屏自動渲染 Web 虛擬 D-Pad 與按鈕。

### 2.3 代幣與點數管理系統 (Credit & Quota Management)
- **每日免費代幣 (Daily Free Quota)**：玩家每日登入可獲得 **10 枚免費硬幣**。每日 00:00 (Local/UTC) 重置為 10 枚，**不可跨日累積**（例：昨日剩 2 枚，今日重置後仍為 10 枚而非 12 枚）。
- **管理員獎勵發幣 (Admin Bonus Credits)**：管理員 (Admin) 可透過後台或 API 賦予玩家額外獎勵代幣。管理員獎勵代幣**不受每日重置影響**，且可長期保存。
- **代幣扣除優先權**：玩家啟動遊戲扣除代幣時，優先扣除「每日免費代幣」，免費代幣扣完後才扣除「管理員獎勵代幣」。

### 2.4 復古 CRT Shader 濾鏡與環境音效 (CRT Filter & Audio)
- **掃描線 Shader**：透過 CSS/WebGL 全域 Overlay 模擬陰極射線管 (CRT) 曲面與掃描線 (Scanline) 視覺。大廳選單提供 Toggle 開關與本地持久化記憶。
- **街機店背景音**：可選擇開啟 80 年代電玩城環境嘈雜音效與電子硬幣掉落聲。

### 2.5 全網高分排行榜 (Global Leaderboard)
- **結算監聽**：監聽 `ArcadeBridge.on('GAME_OVER', summary)`。
- **高分彈窗**：遊戲結束時彈出高分結算視窗，提示玩家輸入 3 字元 Arcade 暱稱（例：`LIN`）並上傳至高分榜。

---

## 3. 非功能性需求 (Non-Functional Requirements)

1. **效能要求**：大廳 DOM 載入時間 $< 1.5$ 秒，遊戲 Canvas 渲染幀率穩定維持在 60 FPS。
2. **記憶體管理**：切換遊戲時，舊遊戲的 WebGL Texture 與 Sound 記憶體必須 $100\%$ 釋放，全域內存無洩漏。
3. **響應式佈局**：支援 16:9 電腦螢幕、Arcade 街機框體比例以及手機直/橫屏自適應。
