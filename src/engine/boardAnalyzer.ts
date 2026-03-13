import type { Card } from '../types/card';
import type { BoardTexture } from '../types/gto';
import { RANK_VALUES } from '../types/card';

export function analyzeBoardTexture(communityCards: Card[]): BoardTexture {
  if (communityCards.length === 0) {
    return {
      isMonotone: false,
      isTwoTone: false,
      isRainbow: true,
      isPaired: false,
      isTrips: false,
      hasHighCards: false,
      isConnected: false,
      isGapped: false,
      isHighBoard: false,
      isLowBoard: false,
      wetness: 0,
    };
  }

  const suits = communityCards.map((c) => c.suit);
  const ranks = communityCards.map((c) => RANK_VALUES[c.rank]);

  // Suit analysis
  const suitCounts: Record<string, number> = {};
  for (const s of suits) {
    suitCounts[s] = (suitCounts[s] || 0) + 1;
  }
  const suitValues = Object.values(suitCounts);
  const maxSuit = Math.max(...suitValues);
  const uniqueSuits = suitValues.length;

  const isMonotone = communityCards.length >= 3 && maxSuit >= 3;
  const isTwoTone = !isMonotone && uniqueSuits <= 2;
  const isRainbow = uniqueSuits === communityCards.length;

  // Pair analysis
  const rankCounts: Record<number, number> = {};
  for (const r of ranks) {
    rankCounts[r] = (rankCounts[r] || 0) + 1;
  }
  const rankValues = Object.values(rankCounts);
  const isPaired = rankValues.some((c) => c >= 2);
  const isTrips = rankValues.some((c) => c >= 3);

  // High cards
  const hasHighCards = ranks.some((r) => r >= 12); // Q, K, A

  // Connectivity: gap <= 1 → 진정한 커넥티드, gap == 2 → gapped
  const sortedRanks = [...new Set(ranks)].sort((a, b) => a - b);
  let maxConnectedSeq = 1;
  let currentConnectedSeq = 1;
  let hasGap2 = false;
  for (let i = 1; i < sortedRanks.length; i++) {
    const gap = sortedRanks[i] - sortedRanks[i - 1];
    if (gap <= 1) {
      currentConnectedSeq++;
      maxConnectedSeq = Math.max(maxConnectedSeq, currentConnectedSeq);
    } else {
      currentConnectedSeq = 1;
      if (gap === 2) hasGap2 = true;
    }
  }
  const isConnected = maxConnectedSeq >= 2;
  const isGapped = hasGap2 && !isConnected;

  // 보드 높이: 하이보드 vs 로우보드
  const highCardCount = ranks.filter((r) => r >= 10).length; // T 이상
  const isHighBoard = highCardCount >= 2;
  const isLowBoard = ranks.every((r) => r <= 8);

  // Wetness score (0-1)
  let wetness = 0;
  // Flush draw potential
  if (isMonotone) wetness += 0.4;
  else if (isTwoTone) wetness += 0.25;
  // Straight draw potential
  if (maxConnectedSeq >= 3) wetness += 0.3;
  else if (isConnected) wetness += 0.15;
  else if (isGapped) wetness += 0.08;
  // High card boards are wetter (more top pair possibilities)
  if (hasHighCards) wetness += 0.1;
  // Paired boards are drier
  if (isPaired) wetness -= 0.15;

  wetness = Math.max(0, Math.min(1, wetness));

  return {
    isMonotone,
    isTwoTone,
    isRainbow,
    isPaired,
    isTrips,
    hasHighCards,
    isConnected,
    isGapped,
    isHighBoard,
    isLowBoard,
    wetness,
  };
}

/**
 * Get a description of the board texture in Korean
 */
export function describeBoardTexture(texture: BoardTexture): string {
  const parts: string[] = [];

  if (texture.isMonotone) parts.push('모노톤');
  else if (texture.isTwoTone) parts.push('투톤');
  else if (texture.isRainbow) parts.push('레인보우');

  if (texture.isTrips) parts.push('트립스 보드');
  else if (texture.isPaired) parts.push('페어드 보드');

  if (texture.isConnected) parts.push('커넥티드');
  if (texture.hasHighCards) parts.push('하이카드');

  if (texture.wetness > 0.5) parts.push('웻 보드');
  else if (texture.wetness < 0.2) parts.push('드라이 보드');

  return parts.join(', ') || '일반 보드';
}
