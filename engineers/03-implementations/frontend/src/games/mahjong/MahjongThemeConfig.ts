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
  // Tile Inscription Inks
  CINNABAR_RED: '#b91c1c',   // 硃砂紅 (萬字牌 1m~9m)
  DEEP_INK_BLACK: '#0f172a', // 蒼黑 (風牌 東南西北)
  DRAGON_RED: '#dc2626',     // 正紅 (紅中)
  DRAGON_GREEN: '#15803d',   // 翡翠綠 (青發、綠索、綠筒)
  DRAGON_BLUE: '#0284c7',    // 寶藍 (白板外框、藍索、藍筒)
  DRAGON_BLUE_LIGHT: '#38bdf8', // 天藍 (白板內凹槽)

  // Flower Tile Inks
  SEASON_FLOWER: '#ea580c',  // 春夏秋冬 亮橙紅
  PLANT_FLOWER: '#ca8a04',   // 梅蘭竹菊 琥珀金
  FLOWER_NUMBER: '#7c2d12',  // 花牌角落數字 棕紅

  // Tile Acrylic & Frame
  IVORY_GRADIENT_START: '#ffffff',
  IVORY_GRADIENT_MID: '#fdfbf7',
  IVORY_GRADIENT_END: '#e8e2d5',
  GOLD_BORDER: '#c5a059',
  CARD_RECESS: '#d5dbdb',
  DROP_SHADOW: '#06130b',

  // Tile Back Jade
  JADE_START: '#15803d',
  JADE_MID: '#0f5132',
  JADE_END: '#064e3b',
  JADE_TRIM: '#4ade80',
} as const;

export const MAHJONG_TILE_TYPOGRAPHY = {
  CHARACTERS: {
    NUMERAL_FONT_SIZE: 18,
    NUMERAL_Y_OFFSET: -9,
    WAN_FONT_SIZE: 17,
    WAN_Y_OFFSET: 10,
    COLOR: MAHJONG_COLORS.CINNABAR_RED,
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
