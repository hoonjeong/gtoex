import type { Position6Max, Position9Max } from '../types/game';

export const POSITIONS_6MAX: Position6Max[] = ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
export const POSITIONS_9MAX: Position9Max[] = ['UTG', 'UTG1', 'UTG2', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB'];

export const POSITION_LABELS: Record<string, string> = {
  UTG: 'UTG',
  UTG1: 'UTG+1',
  UTG2: 'UTG+2',
  LJ: 'LJ',
  HJ: 'HJ',
  CO: 'CO',
  BTN: 'BTN',
  SB: 'SB',
  BB: 'BB',
};

// Seat positions around the table (angle in degrees, 0° = right, 90° = down, clockwise)
export const SEAT_ANGLES_6MAX: Record<Position6Max, number> = {
  BTN: 180,
  SB: 240,
  BB: 300,
  UTG: 0,
  HJ: 60,
  CO: 120,
};

export const SEAT_ANGLES_9MAX: Record<Position9Max, number> = {
  BTN: 180,
  SB: 220,
  BB: 260,
  UTG: 300,
  UTG1: 340,
  UTG2: 20,
  LJ: 60,
  HJ: 100,
  CO: 140,
};

// Opening action order (preflop)
export const ACTION_ORDER_6MAX: Position6Max[] = ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
export const ACTION_ORDER_9MAX: Position9Max[] = ['UTG', 'UTG1', 'UTG2', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
