import type { Card, Rank } from '../types/card';
import { RANK_VALUES } from '../types/card';

/**
 * Convert a pair of hole cards to standard notation like "AKs", "QJo", "TT"
 */
export function cardsToNotation(cards: [Card, Card]): string {
  const [c1, c2] = cards;
  const v1 = RANK_VALUES[c1.rank];
  const v2 = RANK_VALUES[c2.rank];

  // Sort higher rank first
  const high = v1 >= v2 ? c1 : c2;
  const low = v1 >= v2 ? c2 : c1;

  if (high.rank === low.rank) {
    return `${high.rank}${low.rank}`;
  }

  const suited = high.suit === low.suit;
  return `${high.rank}${low.rank}${suited ? 's' : 'o'}`;
}

/**
 * Get all 169 unique hand notations in standard order (for range grid)
 */
export function getAllHandNotations(): string[][] {
  const ranks: Rank[] = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
  const grid: string[][] = [];

  for (let i = 0; i < 13; i++) {
    const row: string[] = [];
    for (let j = 0; j < 13; j++) {
      if (i === j) {
        row.push(`${ranks[i]}${ranks[j]}`);
      } else if (i < j) {
        row.push(`${ranks[i]}${ranks[j]}s`);
      } else {
        row.push(`${ranks[j]}${ranks[i]}o`);
      }
    }
    grid.push(row);
  }

  return grid;
}

/**
 * Check if a notation represents a suited hand, offsuit hand, or pair
 */
export function getHandType(notation: string): 'pair' | 'suited' | 'offsuit' {
  if (notation.length === 2) return 'pair';
  return notation[2] === 's' ? 'suited' : 'offsuit';
}
