import type { Card } from '../types/card';
import type { ActionFrequency, RangeMatrix, GtoAdvice } from '../types/gto';
import type { GameFormat, Position, ScenarioType } from '../types/game';
import { cardsToNotation } from '../utils/handNotation';
import { SIX_MAX_RFI, SIX_MAX_VS_RFI, SIX_MAX_VS_3BET } from '../data/preflop/sixMax';
import { NINE_MAX_RFI, NINE_MAX_VS_RFI, NINE_MAX_VS_3BET } from '../data/preflop/nineMax';

const DEFAULT_FOLD: ActionFrequency = { fold: 1, call: 0, raise: 0 };

function getRFIRange(format: GameFormat, position: string): RangeMatrix {
  const data = format === '6max' ? SIX_MAX_RFI : NINE_MAX_RFI;
  return data[position] || {};
}

function getVsRFIRange(
  format: GameFormat,
  defenderPos: string,
  openerPos: string
): RangeMatrix {
  const data = format === '6max' ? SIX_MAX_VS_RFI : NINE_MAX_VS_RFI;
  return data[defenderPos]?.[openerPos] || {};
}

function getVs3BetRange(format: GameFormat, position: string): RangeMatrix {
  const data = format === '6max' ? SIX_MAX_VS_3BET : NINE_MAX_VS_3BET;
  return data[position] || {};
}

function lookupFrequency(range: RangeMatrix, notation: string): ActionFrequency {
  return range[notation] || DEFAULT_FOLD;
}

function determineCorrectActions(freq: ActionFrequency): ('fold' | 'call' | 'raise')[] {
  const actions: ('fold' | 'call' | 'raise')[] = [];

  // If one action >= 70%, only that action is correct
  if (freq.fold >= 0.7) return ['fold'];
  if (freq.call >= 0.7) return ['call'];
  if (freq.raise >= 0.7) return ['raise'];

  // Otherwise, all actions >= 25% are acceptable
  if (freq.fold >= 0.25) actions.push('fold');
  if (freq.call >= 0.25) actions.push('call');
  if (freq.raise >= 0.25) actions.push('raise');

  // Fallback: the most frequent action
  if (actions.length === 0) {
    const max = Math.max(freq.fold, freq.call, freq.raise);
    if (freq.fold === max) actions.push('fold');
    if (freq.call === max) actions.push('call');
    if (freq.raise === max) actions.push('raise');
  }

  return actions;
}

function generateExplanation(
  notation: string,
  freq: ActionFrequency,
  scenario: ScenarioType,
  position: string,
  villainPosition?: string
): string {
  const parts: string[] = [];
  const pct = (v: number) => `${Math.round(v * 100)}%`;

  if (scenario === 'RFI') {
    if (freq.raise >= 0.7) {
      parts.push(`${notation}은(는) ${position}에서 항상 오픈 레이즈하는 핸드입니다.`);
    } else if (freq.fold >= 0.7) {
      parts.push(`${notation}은(는) ${position}에서 폴드하는 핸드입니다.`);
    } else {
      parts.push(`${notation}은(는) ${position}에서 믹스 전략을 사용합니다.`);
    }
  } else if (scenario === 'vsRFI') {
    const opener = villainPosition || '상대';
    if (freq.raise >= 0.5) {
      parts.push(`${opener} 오픈에 대해 ${notation}은(는) 주로 3벳하는 핸드입니다.`);
    } else if (freq.call >= 0.5) {
      parts.push(`${opener} 오픈에 대해 ${notation}은(는) 주로 콜하는 핸드입니다.`);
    } else if (freq.fold >= 0.7) {
      parts.push(`${opener} 오픈에 대해 ${notation}은(는) 폴드하는 핸드입니다.`);
    } else {
      parts.push(`${opener} 오픈에 대해 ${notation}은(는) 믹스 전략을 사용합니다.`);
    }
  } else if (scenario === 'vs3Bet') {
    if (freq.raise >= 0.5) {
      parts.push(`3벳에 대해 ${notation}은(는) 4벳하는 핸드입니다.`);
    } else if (freq.call >= 0.5) {
      parts.push(`3벳에 대해 ${notation}은(는) 콜하는 핸드입니다.`);
    } else {
      parts.push(`3벳에 대해 ${notation}은(는) 폴드하는 핸드입니다.`);
    }
  }

  parts.push(`GTO 빈도: 폴드 ${pct(freq.fold)}, 콜 ${pct(freq.call)}, 레이즈 ${pct(freq.raise)}`);

  return parts.join(' ');
}

export function getPreflopAdvice(
  heroCards: [Card, Card],
  format: GameFormat,
  heroPosition: Position,
  scenario: ScenarioType,
  villainPosition?: Position
): GtoAdvice {
  const notation = cardsToNotation(heroCards);

  let range: RangeMatrix;
  let actualScenario = scenario;

  if (scenario === 'all') {
    // Pick a random scenario
    const scenarios: ScenarioType[] = ['RFI', 'vsRFI', 'vs3Bet'];
    actualScenario = scenarios[Math.floor(Math.random() * scenarios.length)];
  }

  switch (actualScenario) {
    case 'RFI':
      range = getRFIRange(format, heroPosition);
      break;
    case 'vsRFI':
      range = getVsRFIRange(format, heroPosition, villainPosition || 'UTG');
      break;
    case 'vs3Bet':
      range = getVs3BetRange(format, heroPosition);
      break;
    default:
      range = getRFIRange(format, heroPosition);
  }

  const frequencies = lookupFrequency(range, notation);
  const correctActions = determineCorrectActions(frequencies);
  const explanation = generateExplanation(
    notation,
    frequencies,
    actualScenario,
    heroPosition,
    villainPosition
  );

  return {
    frequencies,
    correctActions,
    explanation,
    handNotation: notation,
    rangeMatrix: range,
  };
}
