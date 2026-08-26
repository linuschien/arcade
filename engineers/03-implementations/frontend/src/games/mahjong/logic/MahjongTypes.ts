/**
 * MahjongTypes.ts
 * Core domain types and enumerations for Taiwanese 16-Tile Mahjong (台灣16張麻將).
 * Follows strict domain modeling and decoupling between game logic and view layer.
 */

export type SuitType = 'CHARACTERS' | 'DOTS' | 'BAMBOO' | 'WINDS' | 'DRAGONS' | 'FLOWERS';

export type SeatWind = 'EAST' | 'SOUTH' | 'WEST' | 'NORTH';

/**
 * 0: P1 (Human / 賭神 - Bottom)
 * 1: P2 (AI / 賭俠小刀 - Right / 下家)
 * 2: P3 (AI / 賭聖阿星 - Top / 對家)
 * 3: P4 (AI / 賭霸有喜 - Left / 上家)
 */
export type PlayerSeat = 0 | 1 | 2 | 3;

export interface Tile {
  id: string; // e.g. '1m_0', '9p_2', 'east_1', 'spring_0'
  suit: SuitType;
  value: number; // 1..9 for numbers; 1..4 for winds/flowers (1:East/Spring/Plum, 2:South/Summer/Orchid, 3:West/Autumn/Bamboo, 4:North/Winter/Chrysanthemum); 1..3 for dragons (1:Red中, 2:Green發, 3:White白)
  name: string; // e.g. '一萬', '九筒', '東風', '紅中', '春', '梅'
  shortCode: string; // e.g. '1m', '9p', '5s', 'east', 'red', 'spring'
  isFlower?: boolean;
}

export type MeldType = 'CHOW' | 'PONG' | 'MELDED_KONG' | 'ADDED_KONG' | 'CONCEALED_KONG';

export interface Meld {
  type: MeldType;
  tiles: Tile[]; // 3 tiles for Chow/Pong; 4 tiles for Kongs
  calledTile?: Tile; // The tile claimed from opponent
  sourceSeat: PlayerSeat; // Seat index of the discarder (or self for Concealed Kong)
  /**
   * Relative index of called tile in the 3-tile grid:
   * 0 = Left (from Upper/Left player P4)
   * 1 = Center (from Across/Top player P3)
   * 2 = Right (from Lower/Right player P2)
   */
  relativeSourceIndex?: number;
}

export type ActionType = 'CHOW' | 'PONG' | 'KONG' | 'TING' | 'HU' | 'PASS';

export interface ChowOption {
  tiles: Tile[]; // 2 tiles from hand + 1 called tile
  discardTileIds: string[]; // Hand tile IDs to meld
}

export interface KongOption {
  type: 'CONCEALED_KONG' | 'ADDED_KONG' | 'MELDED_KONG';
  tileCode: string;
  handTileIds: string[];
  meldIndex?: number; // For Added Kong
}

export interface AvailableActions {
  canChow: boolean;
  chowOptions: ChowOption[];
  canPong: boolean;
  canKong: boolean;
  kongOptions: KongOption[];
  canTing: boolean;
  canHu: boolean;
  canPass: boolean;
}

export interface TingInfo {
  winningTiles: {
    tileCode: string;
    tileName: string;
    remainingCount: number;
    fans?: number;
  }[];
}

export interface FanItem {
  name: string;
  fan: number;
  description?: string;
}

export interface SettlementBreakdown {
  winnerSeat: PlayerSeat;
  isSelfDrawn: boolean;
  loserSeat?: PlayerSeat; // Discarder seat if Ron; undefined if Self-Drawn
  winningTile?: Tile; // Winning drawn or discarded tile
  isRobbingKong?: boolean;
  isFlowerWin?: boolean; // 八仙過海 or 七搶一
  isDraw?: boolean; // 流局
  basePoints: number; // 500
  fanRate: number; // 200
  dealerMultiplierFan: number; // 2N + 1
  dealerStreak: number; // N
  fans: FanItem[];
  totalFans: number;
  chipDeltas: number[]; // Index 0..3 net chip changes
  remainingChips: number[]; // Index 0..3 after settlement
  winnerName: string;
  isFinalRound?: boolean;
}

export interface PlayerProfile {
  seat: PlayerSeat;
  name: string;
  isHuman: boolean;
  wind: SeatWind;
  isDealer: boolean;
  chips: number;
  hand: Tile[];
  drawnTile: Tile | null;
  melds: Meld[];
  flowers: Tile[];
  discards: Tile[];
  isTing: boolean;
  tingInfo?: TingInfo | null;
  isAutoPlay: boolean;
  isPassLockout: boolean; // 過水不胡鎖定
  passPongCodesInTurn: Set<string>; // 同巡過碰不得碰同名牌
  justClaimedPongTileCode?: string; // 剛碰之牌牌碼（當巡禁止立刻加槓此牌）
}

export type GamePhase =
  | 'SEATING_DRAW'
  | 'DICE_ROLL'
  | 'DEALING'
  | 'FLOWER_REPLACEMENT'
  | 'PLAYER_TURN'
  | 'ACTION_WAIT'
  | 'ROUND_SETTLEMENT'
  | 'MATCH_OVER'
  | 'GAME_OVER';

export interface GameStateSnapshot {
  phase: GamePhase;
  roundWind: SeatWind;
  dealerSeat: PlayerSeat;
  dealerStreak: number;
  currentTurnSeat: PlayerSeat;
  lastDiscard: {
    tile: Tile;
    fromSeat: PlayerSeat;
  } | null;
  diceResult: number[]; // e.g. [3, 4, 5]
  diceSum: number;
  remainingWallTiles: number;
  deadWallTiles: number; // 16
  players: PlayerProfile[];
  pendingActions: {
    seat: PlayerSeat;
    actions: AvailableActions;
  }[];
}

export interface SeatingDrawPlayerInfo {
  name: string;
  isHuman: boolean;
  initialPosIndex: number; // 0=Bottom (賭神), 1=Right (賭俠小刀), 2=Top (賭聖阿星), 3=Left (賭霸有喜)
  drawnWind: SeatWind;
  finalSeat: PlayerSeat;
  isDealer: boolean;
}

export interface SeatingDrawDetails {
  diceResult: [number, number, number];
  diceSum: number;
  firstDrawerIndex: number; // 0=Bottom, 1=Right, 2=Top, 3=Left
  firstDrawerName: string;
  players: SeatingDrawPlayerInfo[];
}
