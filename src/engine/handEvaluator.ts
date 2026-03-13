import type { Card, Rank } from '../types/card';
import type { HandCategory, HandEvalResult } from '../types/gto';
import { RANK_VALUES } from '../types/card';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Numeric rank value for a card (2..14, where A=14). */
function rv(card: Card): number {
  return RANK_VALUES[card.rank];
}

/** Sort cards descending by rank value. */
function sortDesc(cards: Card[]): Card[] {
  return [...cards].sort((a, b) => rv(b) - rv(a));
}

/** Generate all C(n, k) combinations from an array. */
function combinations<T>(arr: T[], k: number): T[][] {
  const result: T[][] = [];
  function helper(start: number, combo: T[]) {
    if (combo.length === k) {
      result.push([...combo]);
      return;
    }
    for (let i = start; i < arr.length; i++) {
      combo.push(arr[i]);
      helper(i + 1, combo);
      combo.pop();
    }
  }
  helper(0, []);
  return result;
}

/** Count occurrences of each rank in a 5-card hand. */
function rankCounts(cards: Card[]): Map<Rank, number> {
  const counts = new Map<Rank, number>();
  for (const c of cards) {
    counts.set(c.rank, (counts.get(c.rank) ?? 0) + 1);
  }
  return counts;
}

/**
 * Build a tiebreaker integer from an ordered list of rank values.
 * The first value is the most significant.  We encode up to 5 values
 * each in the range 0-14 using a base-15 positional scheme so that
 * the resulting integer supports direct numeric comparison.
 */
function tiebreaker(values: number[]): number {
  let result = 0;
  for (let i = 0; i < values.length; i++) {
    result = result * 15 + values[i];
  }
  return result;
}

// Category base multiplier: category * 1_000_000
const CATEGORY_BASE: Record<HandCategory, number> = {
  high_card: 0,
  one_pair: 1_000_000,
  two_pair: 2_000_000,
  three_of_a_kind: 3_000_000,
  straight: 4_000_000,
  flush: 5_000_000,
  full_house: 6_000_000,
  four_of_a_kind: 7_000_000,
  straight_flush: 8_000_000,
  royal_flush: 9_000_000,
};

// ---------------------------------------------------------------------------
// 5-card evaluator
// ---------------------------------------------------------------------------

interface FiveCardResult {
  category: HandCategory;
  rank: number;
  description: string;
}

/**
 * Detect whether sorted (desc) 5-card hand forms a straight.
 * Returns the high card rank value of the straight, or 0 if not a straight.
 * Handles the wheel (A-2-3-4-5) where A plays low (high card = 5).
 */
function detectStraight(sorted: Card[]): number {
  const vals = sorted.map(rv);

  // Normal straight check: each card is exactly 1 less than the previous
  let isStraight = true;
  for (let i = 1; i < 5; i++) {
    if (vals[i] !== vals[i - 1] - 1) {
      isStraight = false;
      break;
    }
  }
  if (isStraight) return vals[0];

  // Wheel: A-5-4-3-2  (sorted desc as A,5,4,3,2 -> vals 14,5,4,3,2)
  if (
    vals[0] === 14 &&
    vals[1] === 5 &&
    vals[2] === 4 &&
    vals[3] === 3 &&
    vals[4] === 2
  ) {
    return 5; // 5-high straight
  }

  return 0;
}

function evaluate5(cards: Card[]): FiveCardResult {
  const sorted = sortDesc(cards);
  const counts = rankCounts(sorted);

  // Determine flush
  const isFlush = sorted.every((c) => c.suit === sorted[0].suit);

  // Determine straight
  const straightHigh = detectStraight(sorted);
  const isStraight = straightHigh > 0;

  // Group by count for pair-type hands
  // entries: [rank, count] sorted by count desc, then rank desc
  const entries = [...counts.entries()].sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    return RANK_VALUES[b[0]] - RANK_VALUES[a[0]];
  });

  const topCount = entries[0][1];
  const secondCount = entries.length > 1 ? entries[1][1] : 0;

  // Build kicker arrays from sorted cards in useful order
  const kickers = (rankOfGroup: Rank, _count: number): number[] =>
    sorted.filter((c) => c.rank !== rankOfGroup).map(rv);

  // --- Straight Flush / Royal Flush ---
  if (isFlush && isStraight) {
    if (straightHigh === 14) {
      return {
        category: 'royal_flush',
        rank: CATEGORY_BASE.royal_flush + tiebreaker([straightHigh]),
        description: 'Royal Flush',
      };
    }
    return {
      category: 'straight_flush',
      rank: CATEGORY_BASE.straight_flush + tiebreaker([straightHigh]),
      description: `Straight Flush, ${rankName(straightHigh)}-high`,
    };
  }

  // --- Four of a Kind ---
  if (topCount === 4) {
    const quadRank = RANK_VALUES[entries[0][0]];
    const kickerVal = RANK_VALUES[entries[1][0]];
    return {
      category: 'four_of_a_kind',
      rank: CATEGORY_BASE.four_of_a_kind + tiebreaker([quadRank, kickerVal]),
      description: `Four of a Kind, ${rankName(quadRank)}s`,
    };
  }

  // --- Full House ---
  if (topCount === 3 && secondCount === 2) {
    const tripRank = RANK_VALUES[entries[0][0]];
    const pairRank = RANK_VALUES[entries[1][0]];
    return {
      category: 'full_house',
      rank: CATEGORY_BASE.full_house + tiebreaker([tripRank, pairRank]),
      description: `Full House, ${rankName(tripRank)}s full of ${rankName(pairRank)}s`,
    };
  }

  // --- Flush ---
  if (isFlush) {
    const vals = sorted.map(rv);
    return {
      category: 'flush',
      rank: CATEGORY_BASE.flush + tiebreaker(vals),
      description: `Flush, ${rankName(vals[0])}-high`,
    };
  }

  // --- Straight ---
  if (isStraight) {
    return {
      category: 'straight',
      rank: CATEGORY_BASE.straight + tiebreaker([straightHigh]),
      description: `Straight, ${rankName(straightHigh)}-high`,
    };
  }

  // --- Three of a Kind ---
  if (topCount === 3) {
    const tripRank = RANK_VALUES[entries[0][0]];
    const k = kickers(entries[0][0], 3);
    return {
      category: 'three_of_a_kind',
      rank: CATEGORY_BASE.three_of_a_kind + tiebreaker([tripRank, ...k]),
      description: `Three of a Kind, ${rankName(tripRank)}s`,
    };
  }

  // --- Two Pair ---
  if (topCount === 2 && secondCount === 2) {
    const highPair = Math.max(RANK_VALUES[entries[0][0]], RANK_VALUES[entries[1][0]]);
    const lowPair = Math.min(RANK_VALUES[entries[0][0]], RANK_VALUES[entries[1][0]]);
    const kickerVal = RANK_VALUES[entries[2][0]];
    return {
      category: 'two_pair',
      rank: CATEGORY_BASE.two_pair + tiebreaker([highPair, lowPair, kickerVal]),
      description: `Two Pair, ${rankName(highPair)}s and ${rankName(lowPair)}s`,
    };
  }

  // --- One Pair ---
  if (topCount === 2) {
    const pairRank = RANK_VALUES[entries[0][0]];
    const k = kickers(entries[0][0], 2);
    return {
      category: 'one_pair',
      rank: CATEGORY_BASE.one_pair + tiebreaker([pairRank, ...k]),
      description: `Pair of ${rankName(pairRank)}s`,
    };
  }

  // --- High Card ---
  const vals = sorted.map(rv);
  return {
    category: 'high_card',
    rank: CATEGORY_BASE.high_card + tiebreaker(vals),
    description: `High Card, ${rankName(vals[0])}`,
  };
}

/** Human-readable rank name from a numeric rank value. */
function rankName(value: number): string {
  const names: Record<number, string> = {
    2: 'Two',
    3: 'Three',
    4: 'Four',
    5: 'Five',
    6: 'Six',
    7: 'Seven',
    8: 'Eight',
    9: 'Nine',
    10: 'Ten',
    11: 'Jack',
    12: 'Queen',
    13: 'King',
    14: 'Ace',
  };
  return names[value] ?? String(value);
}

// ---------------------------------------------------------------------------
// Main evaluator: best of C(7,5)=21 combinations
// ---------------------------------------------------------------------------

/**
 * Evaluate a Texas Hold'em hand (2 hole + 5 community) and return the
 * best possible 5-card hand with its category, comparable rank, the
 * five cards used, and a human-readable description.
 */
export function evaluateHand(
  holeCards: [Card, Card],
  communityCards: Card[],
): HandEvalResult {
  const allCards = [...holeCards, ...communityCards];

  if (allCards.length < 5) {
    // Pre-flop or incomplete board: evaluate with whatever is available
    // Pad to 5 if fewer (shouldn't happen in normal play, but be safe)
    const sorted = sortDesc(allCards);
    const result = evaluate5(sorted.slice(0, Math.min(5, sorted.length)));
    return {
      category: result.category,
      rank: result.rank,
      bestFive: sorted.slice(0, Math.min(5, sorted.length)),
      description: result.description,
    };
  }

  const combos = combinations(allCards, 5);

  let bestResult: FiveCardResult | null = null;
  let bestCards: Card[] = [];

  for (const combo of combos) {
    const result = evaluate5(combo);
    if (bestResult === null || result.rank > bestResult.rank) {
      bestResult = result;
      bestCards = sortDesc(combo);
    }
  }

  // For straight (or straight flush / royal flush) where A plays low,
  // re-sort bestCards so the Ace appears at the end for the wheel
  if (bestResult!.category === 'straight' || bestResult!.category === 'straight_flush') {
    const vals = bestCards.map(rv);
    // Wheel detection: high card is 5 but we have an Ace
    if (vals[0] === 14 && vals[1] === 5) {
      // Move the Ace to the end
      const ace = bestCards.shift()!;
      bestCards.push(ace);
    }
  }

  return {
    category: bestResult!.category,
    rank: bestResult!.rank,
    bestFive: bestCards,
    description: bestResult!.description,
  };
}

// ---------------------------------------------------------------------------
// Hand strength classification
// ---------------------------------------------------------------------------

/**
 * Map a hand evaluation result to a coarse strength category.
 *
 * The mapping takes into account the community cards so that, e.g.,
 * a pair that is top pair on the board is rated differently from a
 * low pair.
 */
export function getHandStrengthCategory(
  evalResult: HandEvalResult,
  communityCards: Card[],
): import('../types/gto').HandStrength {
  const { category } = evalResult;

  // Monster: straight flush+, quads, full house
  if (
    category === 'royal_flush' ||
    category === 'straight_flush' ||
    category === 'four_of_a_kind' ||
    category === 'full_house'
  ) {
    return 'monster';
  }

  // Very strong: flush, straight
  if (category === 'flush' || category === 'straight') {
    return 'very_strong';
  }

  // Three of a kind
  if (category === 'three_of_a_kind') {
    return 'strong';
  }

  // Two pair
  if (category === 'two_pair') {
    // Determine if both pairs involve the top board card
    const boardRanks = communityCards.map(rv).sort((a, b) => b - a);

    // Find the two pair ranks from bestFive
    const counts = rankCounts(evalResult.bestFive);
    const pairRanks = [...counts.entries()]
      .filter(([, c]) => c === 2)
      .map(([r]) => RANK_VALUES[r])
      .sort((a, b) => b - a);

    if (pairRanks.length >= 2) {
      const highPair = pairRanks[0];
      const topBoardRank = boardRanks.length > 0 ? boardRanks[0] : 0;

      // "Top two" if the high pair matches or exceeds the top board card
      if (highPair >= topBoardRank) {
        return 'strong';
      }
    }

    // Bottom two pair
    return 'weak';
  }

  // One pair
  if (category === 'one_pair') {
    const boardRanks = communityCards.map(rv).sort((a, b) => b - a);
    const counts = rankCounts(evalResult.bestFive);
    const pairRank = [...counts.entries()]
      .filter(([, c]) => c === 2)
      .map(([r]) => RANK_VALUES[r])[0];

    if (boardRanks.length === 0) {
      // 프리플랍 포켓 페어: 랭크별 세분화
      if (pairRank >= 12) return 'monster';     // QQ+ (Q=12, K=13, A=14)
      if (pairRank >= 9)  return 'strong';      // 99-JJ
      if (pairRank >= 6)  return 'medium';      // 66-88
      return 'weak';                             // 22-55
    }

    const topBoardRank = boardRanks[0];

    // 오버페어: 보드 탑카드보다 높은 포켓페어
    if (pairRank > topBoardRank) {
      if (pairRank >= 12) return 'very_strong'; // QQ+ 오버페어
      return 'strong';                           // 나머지 오버페어
    }

    // 탑페어: 보드 탑카드와 매칭
    if (pairRank === topBoardRank) {
      const kickers = evalResult.bestFive
        .filter((c) => RANK_VALUES[c.rank] !== pairRank)
        .map(rv)
        .sort((a, b) => b - a);
      const bestKicker = kickers.length > 0 ? kickers[0] : 0;
      // TPTK: A(14) 또는 K(13) 킥커
      if (bestKicker >= 13) return 'strong';    // TPTK (A, K 킥커)
      if (bestKicker >= 10) return 'medium';    // 괜찮은 킥커 (T, J, Q)
      return 'weak';                             // 약한 킥커
    }

    // 로우 페어 (탑카드 아래)
    return 'weak';
  }

  // High card
  return 'nothing';
}

// ---------------------------------------------------------------------------
// Outs counter
// ---------------------------------------------------------------------------

/** All 52 cards in a standard deck. */
function fullDeck(): Card[] {
  const suits: Card['suit'][] = ['spade', 'heart', 'diamond', 'club'];
  const ranks: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
  const deck: Card[] = [];
  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({ rank, suit });
    }
  }
  return deck;
}

/**
 * Count drawing outs for flush and straight draws.
 *
 * - flushOuts: number of cards that complete a flush (when exactly
 *   4 of the same suit are present among hole + community cards).
 * - straightOuts: number of cards that complete an open-ended straight
 *   draw (8 outs) or a gutshot (4 outs).
 * - totalOuts: combined unique outs (avoids double-counting cards that
 *   complete both a flush and a straight).
 */
export function countOuts(
  holeCards: [Card, Card],
  communityCards: Card[],
): { flushOuts: number; straightOuts: number; totalOuts: number } {
  const knownCards = [...holeCards, ...communityCards];
  const knownSet = new Set(knownCards.map((c) => `${c.rank}${c.suit}`));
  const remainingDeck = fullDeck().filter(
    (c) => !knownSet.has(`${c.rank}${c.suit}`),
  );

  const flushOutCards: Set<string> = new Set();
  const straightOutCards: Set<string> = new Set();

  // --- Flush draw detection ---
  // Count suits among all known cards
  const suitCounts = new Map<string, number>();
  for (const c of knownCards) {
    suitCounts.set(c.suit, (suitCounts.get(c.suit) ?? 0) + 1);
  }

  for (const [suit, count] of suitCounts) {
    if (count === 4) {
      // 4 to a flush — any remaining card of this suit completes it
      for (const c of remainingDeck) {
        if (c.suit === suit) {
          flushOutCards.add(`${c.rank}${c.suit}`);
        }
      }
    }
  }

  // --- Straight draw detection ---
  // Get unique rank values present
  const uniqueRanks = [...new Set(knownCards.map(rv))].sort((a, b) => a - b);

  // We check each possible straight (there are 10: A-5 through T-A).
  // A straight needs 5 consecutive values.  If we have exactly 4 of
  // the 5 needed values, there is a straight draw.
  //
  // Straights: [low, low+1, low+2, low+3, low+4]
  // Special case: wheel [A(14),2,3,4,5] represented as values [2,3,4,5,14]
  // We model A as both 1 and 14 for this purpose.

  const rankValuesWithLowAce = [...uniqueRanks];
  if (uniqueRanks.includes(14)) {
    rankValuesWithLowAce.push(1); // Ace can play as 1
  }
  const rankSet = new Set(rankValuesWithLowAce);

  // Track which missing values would complete a straight
  const straightCompletingValues = new Set<number>();

  for (let low = 1; low <= 10; low++) {
    const needed = [low, low + 1, low + 2, low + 3, low + 4];
    const missing = needed.filter((v) => !rankSet.has(v));
    if (missing.length === 1) {
      // Exactly 4 of 5 present — the missing one is a straight draw
      let missingVal = missing[0];
      // Map value 1 back to 14 (Ace)
      if (missingVal === 1) missingVal = 14;
      straightCompletingValues.add(missingVal);
    }
  }

  // Convert completing values to actual remaining cards
  for (const val of straightCompletingValues) {
    for (const c of remainingDeck) {
      if (rv(c) === val) {
        straightOutCards.add(`${c.rank}${c.suit}`);
      }
    }
  }

  // Determine type: count how many completing values we found to
  // classify open-ended (2 values = 8 outs) vs gutshot (1 value = 4 outs).
  // The raw count already reflects this since each value has 4 suits
  // minus any known cards.

  const flushOuts = flushOutCards.size;
  const straightOuts = straightOutCards.size;

  // Total unique outs (union of flush and straight outs)
  const allOuts = new Set([...flushOutCards, ...straightOutCards]);
  const totalOuts = allOuts.size;

  return { flushOuts, straightOuts, totalOuts };
}
