import type { Card } from '../types/card';
import type { GtoAdvice, ActionFrequency } from '../types/gto';
import type { GameFormat, Position, ScenarioType, Street } from '../types/game';
import { getPreflopAdvice } from './preflopEngine';
import { getPostflopFrequencies } from './postflopEngine';

function determineCorrectActions(freq: ActionFrequency): ('fold' | 'call' | 'raise')[] {
  const actions: ('fold' | 'call' | 'raise')[] = [];

  if (freq.fold >= 0.7) return ['fold'];
  if (freq.call >= 0.7) return ['call'];
  if (freq.raise >= 0.7) return ['raise'];

  if (freq.fold >= 0.25) actions.push('fold');
  if (freq.call >= 0.25) actions.push('call');
  if (freq.raise >= 0.25) actions.push('raise');

  if (actions.length === 0) {
    const max = Math.max(freq.fold, freq.call, freq.raise);
    if (freq.fold === max) actions.push('fold');
    if (freq.call === max) actions.push('call');
    if (freq.raise === max) actions.push('raise');
  }

  return actions;
}

export function getGtoAdvice(
  heroCards: [Card, Card],
  communityCards: Card[],
  format: GameFormat,
  heroPosition: Position,
  villainPosition: Position | undefined,
  scenario: ScenarioType,
  street: Street,
  pot: number,
  currentBet: number,
  stackSize: number = 100
): GtoAdvice {
  if (street === 'preflop') {
    return getPreflopAdvice(heroCards, format, heroPosition, scenario, villainPosition);
  }

  // Postflop
  const postflopStreet = street as 'flop' | 'turn' | 'river';
  const { frequencies, explanation } = getPostflopFrequencies(
    heroCards,
    communityCards,
    pot,
    currentBet,
    heroPosition,
    villainPosition,
    postflopStreet,
    stackSize
  );

  const correctActions = determineCorrectActions(frequencies);

  return {
    frequencies,
    correctActions,
    explanation,
    handNotation: '',
  };
}

/**
 * Check if a player's action was correct according to GTO
 */
export function isActionCorrect(
  playerAction: 'fold' | 'call' | 'raise',
  advice: GtoAdvice
): 'correct' | 'incorrect' | 'acceptable' {
  if (advice.correctActions.length === 1 && advice.correctActions[0] === playerAction) {
    return 'correct';
  }
  if (advice.correctActions.includes(playerAction)) {
    return advice.correctActions.length === 1 ? 'correct' : 'acceptable';
  }
  return 'incorrect';
}
