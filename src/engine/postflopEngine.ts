import type { Card } from '../types/card';
import type { ActionFrequency, HandStrength } from '../types/gto';
import type { Position } from '../types/game';
import { evaluateHand, getHandStrengthCategory, countOuts } from './handEvaluator';
import { analyzeBoardTexture } from './boardAnalyzer';

interface PostflopFactors {
  handStrength: HandStrength;
  boardWetness: number;
  drawEquity: number;
  potOdds: number;
  hasPosition: boolean;
}

/**
 * Calculate pot odds as a fraction
 */
function calcPotOdds(pot: number, toCall: number): number {
  if (toCall === 0) return 1;
  return toCall / (pot + toCall);
}

/**
 * Calculate draw equity estimate based on outs
 */
function calcDrawEquity(totalOuts: number, street: 'flop' | 'turn' | 'river'): number {
  if (street === 'flop') {
    // Two cards to come: ~4% per out (rule of 4)
    return Math.min(totalOuts * 0.04, 0.6);
  } else if (street === 'turn') {
    // One card to come: ~2% per out (rule of 2)
    return Math.min(totalOuts * 0.02, 0.45);
  }
  return 0; // River: no more draws
}

/**
 * Score a hand strength category numerically
 */
function strengthScore(strength: HandStrength): number {
  const scores: Record<HandStrength, number> = {
    monster: 1.0,
    very_strong: 0.85,
    strong: 0.7,
    medium: 0.5,
    weak: 0.3,
    draw: 0.2,       // 드로우는 미완성 핸드 → weak보다 낮음
    nothing: 0.05,
  };
  return scores[strength];
}

/**
 * Determine if hero has position (acts last)
 */
function hasPosition(heroPos: Position, villainPos?: Position): boolean {
  // 포스트플랍: SB가 가장 먼저 액션, BTN이 마지막 (인포지션)
  const posOrder = ['SB', 'BB', 'UTG', 'UTG1', 'UTG2', 'LJ', 'HJ', 'CO', 'BTN'];
  const heroIdx = posOrder.indexOf(heroPos);
  // 빌런이 없으면 OOP로 가정 (보수적 판단)
  const villainIdx = villainPos ? posOrder.indexOf(villainPos) : -1;
  return villainIdx >= 0 && heroIdx > villainIdx;
}

/**
 * Generate postflop GTO frequencies using heuristic scoring
 */
export function getPostflopFrequencies(
  holeCards: [Card, Card],
  communityCards: Card[],
  pot: number,
  currentBet: number,
  heroPosition: Position,
  villainPosition?: Position,
  street: 'flop' | 'turn' | 'river' = 'flop',
  stackSize: number = 100
): { frequencies: ActionFrequency; factors: PostflopFactors; explanation: string } {
  const evalResult = evaluateHand(holeCards, communityCards);
  const handStrength = getHandStrengthCategory(evalResult, communityCards);
  const boardTexture = analyzeBoardTexture(communityCards);
  const outs = countOuts(holeCards, communityCards);
  const drawEquity = calcDrawEquity(outs.totalOuts, street);
  const potOdds = calcPotOdds(pot, currentBet);
  const inPosition = hasPosition(heroPosition, villainPosition);

  const factors: PostflopFactors = {
    handStrength,
    boardWetness: boardTexture.wetness,
    drawEquity,
    potOdds,
    hasPosition: inPosition,
  };

  // Composite score: weighted factors
  const W_HAND = 0.40;
  const W_BOARD = 0.20;
  const W_DRAW = 0.15;
  const W_ODDS = 0.15;
  const W_POS = 0.10;

  const handScore = strengthScore(handStrength);
  // 보드 웻니스 연속값: 0.3~0.8 범위
  const boardFactor = 0.3 + boardTexture.wetness * 0.5;
  const drawScore = drawEquity;
  // If pot odds are good (low toCall relative to pot), incentivize calling
  const oddsScore = 1 - potOdds;
  // 포지션 가중치 강화: 실전에서 포지션은 매우 중요
  const posScore = inPosition ? 0.7 : 0.3;

  let compositeScore =
    W_HAND * handScore +
    W_BOARD * boardFactor +
    W_DRAW * drawScore +
    W_ODDS * oddsScore +
    W_POS * posScore;

  // SPR(Stack-to-Pot Ratio) 기반 조정
  const spr = pot > 0 ? stackSize / pot : 20;
  if (spr < 3) {
    // 낮은 SPR: push/fold 경향 강화 — 중간 핸드의 가치 하락
    if (handScore >= 0.7) compositeScore += 0.05;
    else if (handScore <= 0.3) compositeScore -= 0.05;
  } else if (spr > 8) {
    // 높은 SPR: implied odds 증가 — 드로우 콜 가치 상승
    if (drawEquity > 0.1) compositeScore += 0.05;
  }

  // Convert composite score to action frequencies
  let fold = 0;
  let call = 0;
  let raise = 0;

  const facingBet = currentBet > 0;

  if (compositeScore >= 0.75) {
    // Strong hand: mostly raise/bet
    raise = 0.7 + (compositeScore - 0.75) * 1.2;
    call = 0.2;
    fold = 0;
  } else if (compositeScore >= 0.55) {
    // Good hand: mix of call and raise
    raise = 0.3;
    call = 0.5;
    fold = 0.2;
  } else if (compositeScore >= 0.40) {
    // Medium: mostly call, some fold
    if (facingBet) {
      call = 0.45;
      fold = 0.45;
      raise = 0.10; // semi-bluff sometimes
    } else {
      call = 0.55; // check
      raise = 0.25; // small bet
      fold = 0.20;
    }
  } else if (compositeScore >= 0.25) {
    // Weak: mostly fold, but draw hands can call
    if (drawEquity > 0.15) {
      call = 0.5;
      fold = 0.35;
      raise = 0.15; // semi-bluff
    } else {
      fold = 0.7;
      call = 0.2;
      raise = 0.1;
    }
  } else {
    // Nothing: mostly fold
    fold = 0.85;
    call = 0.05;
    raise = 0.10; // bluff frequency
  }

  // 포지션 조정: IP는 공격적, OOP는 수비적
  if (inPosition) {
    raise += 0.10;
    fold = Math.max(0, fold - 0.10);
  } else {
    call += 0.08;
    raise = Math.max(0, raise - 0.08);
  }

  // Normalize
  const total = fold + call + raise;
  fold = Math.round((fold / total) * 100) / 100;
  call = Math.round((call / total) * 100) / 100;
  raise = Math.round((1 - fold - call) * 100) / 100;
  raise = Math.max(0, raise);

  const frequencies: ActionFrequency = { fold, call, raise };

  // Generate explanation
  const explanation = generatePostflopExplanation(
    evalResult.description,
    handStrength,
    boardTexture,
    outs,
    frequencies,
    facingBet,
    inPosition,
    street
  );

  return { frequencies, factors, explanation };
}

function generatePostflopExplanation(
  handDesc: string,
  strength: HandStrength,
  boardTexture: { wetness: number; isMonotone: boolean; isPaired: boolean },
  outs: { flushOuts: number; straightOuts: number; totalOuts: number },
  freq: ActionFrequency,
  facingBet: boolean,
  inPosition: boolean,
  street: string
): string {
  const parts: string[] = [];
  const pct = (v: number) => `${Math.round(v * 100)}%`;

  const strengthNames: Record<HandStrength, string> = {
    monster: '몬스터 핸드',
    very_strong: '매우 강한 핸드',
    strong: '강한 핸드',
    medium: '중간 강도 핸드',
    weak: '약한 핸드',
    draw: '드로우 핸드',
    nothing: '메이드 없음',
  };

  parts.push(`[${street.toUpperCase()}] ${handDesc} - ${strengthNames[strength]}`);

  if (outs.totalOuts > 0) {
    const outParts: string[] = [];
    if (outs.flushOuts > 0) outParts.push(`플러시 드로우 ${outs.flushOuts}아웃`);
    if (outs.straightOuts > 0) outParts.push(`스트레이트 드로우 ${outs.straightOuts}아웃`);
    parts.push(`드로우: ${outParts.join(', ')}`);
  }

  if (boardTexture.isMonotone) {
    parts.push('모노톤 보드로 플러시 가능성이 높습니다.');
  }
  if (boardTexture.isPaired) {
    parts.push('페어드 보드입니다.');
  }

  parts.push(`포지션: ${inPosition ? '인 포지션 (IP)' : '아웃 오브 포지션 (OOP)'}`);

  const action = facingBet ? '베팅에 직면' : '체크 가능';
  parts.push(`상황: ${action}`);

  parts.push(`GTO 빈도: 폴드 ${pct(freq.fold)}, 콜/체크 ${pct(freq.call)}, 레이즈/벳 ${pct(freq.raise)}`);

  return parts.join('\n');
}
