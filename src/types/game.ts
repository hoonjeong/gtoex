import type { Card } from './card';

export type GameMode = 'cash' | 'tournament';
export type GameFormat = '6max' | '9max';
export type Street = 'preflop' | 'flop' | 'turn' | 'river';
export type ActionType = 'fold' | 'call' | 'raise' | 'check' | 'bet';
export type Position6Max = 'UTG' | 'HJ' | 'CO' | 'BTN' | 'SB' | 'BB';
export type Position9Max = 'UTG' | 'UTG1' | 'UTG2' | 'LJ' | 'HJ' | 'CO' | 'BTN' | 'SB' | 'BB';
export type Position = Position6Max | Position9Max;

export type ScenarioType = 'RFI' | 'vsRFI' | 'vs3Bet' | 'all';

export interface PlayerAction {
  position: Position;
  action: ActionType;
  amount?: number; // in BB
  street?: Street; // 어느 스트릿에서 발생한 액션인지
}

export interface GameState {
  format: GameFormat;
  stackSize: number; // in BB
  heroPosition: Position;
  villainPosition: Position | null;
  scenario: ScenarioType;
  street: Street;
  heroCards: [Card, Card] | null;
  communityCards: Card[];
  pot: number; // in BB
  currentBet: number; // in BB
  villainOpenSize: number; // 빌런의 오픈/3벳 사이즈 (BB)
  actions: PlayerAction[];
  isHandComplete: boolean;
  dealAnimationDone: boolean;
}

export interface SetupConfig {
  mode: GameMode;
  format: GameFormat;
  stackSize: number;
  heroPosition: Position | 'random';
  scenario: ScenarioType;
  ante: number; // in BB (0 for cash, typically 0.125 for tournament)
}
