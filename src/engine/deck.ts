import type { Card } from '../types/card';
import { SUITS, RANKS } from '../types/card';

/**
 * Create a standard 52-card deck
 */
export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ rank, suit });
    }
  }
  return deck;
}

/**
 * Fisher-Yates shuffle
 */
export function shuffle(deck: Card[]): Card[] {
  const arr = [...deck];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Deal cards from the deck
 */
export function deal(deck: Card[], count: number): { dealt: Card[]; remaining: Card[] } {
  return {
    dealt: deck.slice(0, count),
    remaining: deck.slice(count),
  };
}

/**
 * Create a shuffled deck and deal hole cards + community cards
 */
export function dealHand(numPlayers: number): {
  holeCards: [Card, Card][];
  flop: [Card, Card, Card];
  turn: Card;
  river: Card;
  remainingDeck: Card[];
} {
  const deck = shuffle(createDeck());
  let idx = 0;

  // Deal hole cards
  const holeCards: [Card, Card][] = [];
  for (let i = 0; i < numPlayers; i++) {
    holeCards.push([deck[idx++], deck[idx++]]);
  }

  // Burn and deal flop
  idx++; // burn
  const flop: [Card, Card, Card] = [deck[idx++], deck[idx++], deck[idx++]];

  // Burn and deal turn
  idx++; // burn
  const turn = deck[idx++];

  // Burn and deal river
  idx++; // burn
  const river = deck[idx++];

  return {
    holeCards,
    flop,
    turn,
    river,
    remainingDeck: deck.slice(idx),
  };
}

/**
 * Get card key for comparisons
 */
export function cardKey(card: Card): string {
  return `${card.rank}${card.suit[0]}`;
}

/**
 * Check if two cards are the same
 */
export function sameCard(a: Card, b: Card): boolean {
  return a.rank === b.rank && a.suit === b.suit;
}
