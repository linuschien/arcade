/**
 * MahjongThemeConfig.ts
 * Centralized design system tokens, typography settings, color palettes,
 * and font family fallback chains for Taiwanese 16-Tile Mahjong.
 */

export const MAHJONG_FONTS = {
  /**
   * Traditional Calligraphy Regular Script (楷書 / 標楷體)
   * Prioritizes native OS KaiTi fonts: Windows (DFKai-SB), macOS/iOS (BiauKai / Kaiti TC),
   * Linux/Android (STKaiti, KaiTi, Noto Serif TC).
   */
  KAI: '"DFKai-SB", "BiauKai", "Kaiti TC", "STKaiti", "KaiTi", "Noto Serif TC", serif',

  /**
   * Modern High-Legibility Sans-Serif (黑體 / 微軟正黑體 / 蘋方)
   * Used for HUD badges, point tallies, chip counters, and system buttons.
   */
  SANS: '"Microsoft JhengHei", "PingFang TC", "Noto Sans TC", sans-serif',

  /**
   * Monospace font for flower numbers and dice indicators.
   */
  MONO: 'monospace',
} as const;

export const MAHJONG_COLORS = {
  // 1. Core Inscription & Carving Inks (雕刻字體與筒索色漆)
  CINNABAR_RED: '#b91c1c',       // 硃砂紅 (萬字牌 1m~9m 下方「萬」字)
  DEEP_INK_BLACK: '#0f172a',     // 蒼黑 (風牌 東南西北、萬字上方數字、1索鳥眼)
  DRAGON_RED: '#dc2626',         // 硃砂正紅 (中、紅索、紅筒、1索鳥身/鳥冠/蓮花底、骰子1/4點)
  DRAGON_GREEN: '#15803d',       // 翡翠綠 (發、綠索、綠筒、1索鳥頭/鳥身/棲枝)
  DRAGON_BLUE: '#0284c7',        // 寶藍 (白板外框、藍索、藍筒、1索尾羽)
  DRAGON_BLUE_LIGHT: '#38bdf8',  // 天藍 (白板內凹槽)
  GOLD_ACCENT: '#facc15',        // 琉璃金 (一筒日輪中心、1索雀冠/眼圈/蓮花底金飾、牌背底板金飾)
  ORANGE_ACCENT: '#f97316',      // 亮橙 (1索鳥喙/肚羽)
  CARVING_WHITE: '#ffffff',      // 純白 (一筒內嵌圓環、1索鳥眼白玉)

  // 2. Flower Tile Inks (花牌專用色)
  SEASON_FLOWER: '#ea580c',      // 春夏秋冬 亮橙紅
  PLANT_FLOWER: '#ca8a04',       // 梅蘭竹菊 琥珀金
  FLOWER_NUMBER: '#7c2d12',      // 花牌角落序號 棕紅

  // 3. Tile Acrylic & Ivory Body (牌面壓克力與象牙漸層)
  IVORY_GRADIENT_START: '#ffffff',
  IVORY_GRADIENT_MID: '#fdfbf7',
  IVORY_GRADIENT_END: '#e8e2d5',
  GOLD_BORDER: '#c5a059',
  CARD_RECESS: '#d5dbdb',
  DROP_SHADOW: '#06130b',

  // 4. Tile Back Jade (牌背翡翠玉石漸層)
  JADE_START: '#15803d',
  JADE_MID: '#0f5132',
  JADE_END: '#064e3b',
  JADE_TRIM: '#4ade80',

  // 5. HUD Compass & Flower Rack (中央羅盤與花牌欄)
  COMPASS_BG: '#0f172a',
  COMPASS_GOLD_RIM: '#d4af37',
  COMPASS_CORE_BG: '#064e3b',
  COMPASS_CORE_RING: '#10b981',
  FLOWER_CELL_BG: 'rgba(15, 23, 42, 0.45)',
  FLOWER_CELL_BORDER: 'rgba(212, 175, 55, 0.4)',

  // 6. Dice (骰子)
  DICE_BODY: '#ffffff',
  DICE_BORDER: '#cbd5e1',
  DICE_RED_DOT: '#dc2626',
  DICE_BLACK_DOT: '#0f172a',

  // 7. Action Buttons (吃碰槓聽胡自摸過 操作按鈕)
  ACTION_CHOW: '#2563eb',
  ACTION_PONG: '#059669',
  ACTION_KONG: '#d97706',
  ACTION_TING: '#7c3aed',
  ACTION_HU: '#dc2626',
  ACTION_ZIMO: '#dc2626',
  ACTION_PASS: '#475569',

  // 8. 3D Wall Blocks & Iron Wall (牌牆與鐵牌)
  WALL_TILE_LOWER_BG: '#0f5132',
  WALL_TILE_LOWER_BORDER: '#15803d',
  WALL_TILE_UPPER_BG: '#15803d',
  WALL_TILE_UPPER_BORDER: '#4ade80',
  WALL_TILE_FACE_RIM: '#f8fafc',
  IRON_WALL_LOWER_BG: '#78350f',
  IRON_WALL_LOWER_BORDER: '#b45309',
  IRON_WALL_UPPER_BG: '#92400e',
  IRON_WALL_UPPER_BORDER: '#f59e0b',
  IRON_WALL_FACE_RIM: '#fef08a',

  // 9. Dice Cup & Dice Tray (骰盅與骰托)
  DICE_CUP_SHADOW: 'rgba(0, 0, 0, 0.4)',
  DICE_CUP_GRAD_0: '#1c0b05',
  DICE_CUP_GRAD_20: '#451a03',
  DICE_CUP_GRAD_50: '#78350f',
  DICE_CUP_GRAD_80: '#451a03',
  DICE_CUP_GRAD_100: '#0f0502',
  GOLD_BAND_GRAD_0: '#92400e',
  GOLD_BAND_GRAD_30: '#f59e0b',
  GOLD_BAND_GRAD_50: '#fef08a',
  GOLD_BAND_GRAD_70: '#fbbf24',
  GOLD_BAND_GRAD_100: '#78350f',
  DICE_TRAY_SHADOW: 'rgba(0, 0, 0, 0.45)',
  DICE_TRAY_RIM_GRAD_0: '#b45309',
  DICE_TRAY_RIM_GRAD_50: '#78350f',
  DICE_TRAY_RIM_GRAD_100: '#451a03',
  DICE_TRAY_RIM_BORDER: '#fbbf24',
  DICE_TRAY_FELT_GRAD_0: '#065f46',
  DICE_TRAY_FELT_GRAD_80: '#064e3b',
  DICE_TRAY_FELT_GRAD_100: '#022c22',
  DICE_TRAY_FELT_BORDER: '#34d399',
} as const;

export const MAHJONG_TILE_TYPOGRAPHY = {
  CHARACTERS: {
    NUMERAL_FONT_SIZE: 18,
    NUMERAL_Y_OFFSET: -9,
    NUMERAL_COLOR: MAHJONG_COLORS.DEEP_INK_BLACK, // 上方數字：蒼黑 (一~九)
    WAN_FONT_SIZE: 17,
    WAN_Y_OFFSET: 10,
    WAN_COLOR: MAHJONG_COLORS.CINNABAR_RED,       // 下方萬字：硃砂紅 (萬)
  },
  WINDS: {
    FONT_SIZE: 26,
    Y_OFFSET: -1,
    COLOR: MAHJONG_COLORS.DEEP_INK_BLACK,
  },
  DRAGONS: {
    RED_SIZE: 27,
    RED_COLOR: MAHJONG_COLORS.DRAGON_RED,
    GREEN_SIZE: 26,
    GREEN_COLOR: MAHJONG_COLORS.DRAGON_GREEN,
    WHITE_OUTER_W: 22,
    WHITE_OUTER_H: 34,
    WHITE_OUTER_COLOR: MAHJONG_COLORS.DRAGON_BLUE,
    WHITE_INNER_COLOR: MAHJONG_COLORS.DRAGON_BLUE_LIGHT,
  },
  FLOWERS: {
    CHAR_FONT_SIZE: 20,
    CHAR_Y_OFFSET: -7,
    NUM_FONT_SIZE: 12,
    NUM_Y_OFFSET: 12,
    SEASON_COLOR: MAHJONG_COLORS.SEASON_FLOWER,
    PLANT_COLOR: MAHJONG_COLORS.PLANT_FLOWER,
    NUMBER_COLOR: MAHJONG_COLORS.FLOWER_NUMBER,
  },
} as const;
