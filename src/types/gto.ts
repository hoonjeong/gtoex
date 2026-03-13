export interface ActionFrequency {
  fold: number;
  call: number;
  raise: number;
}

export type RangeMatrix = Record<string, ActionFrequency>;

export interface GtoAdvice {
  frequencies: ActionFrequency;
  correctActions: ('fold' | 'call' | 'raise')[];
  explanation: string;
  handNotation: string;
  rangeMatrix?: RangeMatrix;
}

export type HandStrength =
  | 'monster'
  | 'very_strong'
  | 'strong'
  | 'medium'
  | 'weak'
  | 'draw'
  | 'nothing';

export interface BoardTexture {
  isMonotone: boolean;
  isTwoTone: boolean;
  isRainbow: boolean;
  isPaired: boolean;
  isTrips: boolean;
  hasHighCards: boolean; // A, K, Q on board
  isConnected: boolean; // 인접 카드 (gap <= 1)
  isGapped: boolean;    // gap-2 카드 (원거리 커넥터)
  isHighBoard: boolean; // T 이상 카드 2장 이상
  isLowBoard: boolean;  // 모든 카드 8 이하
  wetness: number; // 0-1, how draw-heavy the board is
}

export type HandCategory =
  | 'royal_flush'
  | 'straight_flush'
  | 'four_of_a_kind'
  | 'full_house'
  | 'flush'
  | 'straight'
  | 'three_of_a_kind'
  | 'two_pair'
  | 'one_pair'
  | 'high_card';

export interface HandEvalResult {
  category: HandCategory;
  rank: number; // higher is better
  bestFive: import('./card').Card[];
  description: string;
}
