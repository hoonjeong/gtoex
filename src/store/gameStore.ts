import { create } from 'zustand';
import type { Card } from '../types/card';
import type { GameFormat, Position, ScenarioType, Street, PlayerAction, GameState } from '../types/game';
import type { GtoAdvice } from '../types/gto';
import { dealHand } from '../engine/deck';
import { getGtoAdvice, isActionCorrect } from '../engine/gtoAdvisor';
import { ACTION_ORDER_6MAX, ACTION_ORDER_9MAX } from '../constants/positions';

interface GameStore extends GameState {
  // Pre-dealt cards (hidden until needed)
  flopCards: [Card, Card, Card] | null;
  turnCard: Card | null;
  riverCard: Card | null;

  // GTO state
  currentAdvice: GtoAdvice | null;
  lastResult: 'correct' | 'incorrect' | 'acceptable' | null;
  showFeedback: boolean;

  // Villain info for scenario
  villainPosition: Position | null;
  activeScenario: ScenarioType;

  // Actions
  startHand: (
    format: GameFormat,
    stackSize: number,
    heroPosition: Position,
    scenario: ScenarioType,
    ante?: number
  ) => void;
  submitAction: (action: 'fold' | 'call' | 'raise', raiseSize?: number) => void;
  advanceStreet: () => void;
  closeFeedback: () => void;
  nextHand: () => void;

  // Internal config
  _format: GameFormat;
  _stackSize: number;
  _heroPosition: Position;
  _scenario: ScenarioType;
}

/**
 * 주어진 포지션에서 가능한 시나리오 목록을 반환합니다.
 * - RFI: BB 제외 (모두 폴드 시 BB 자동 승리)
 * - vsRFI: 앞에 오픈한 플레이어가 있어야 함 (첫 포지션 제외)
 * - vs3Bet: 뒤에 3벳할 플레이어가 있어야 함 (마지막 포지션 제외)
 */
export function getValidScenarios(format: GameFormat, heroPos: Position): ScenarioType[] {
  const order = format === '6max' ? ACTION_ORDER_6MAX : ACTION_ORDER_9MAX;
  const heroIdx = order.indexOf(heroPos as any);
  const valid: ScenarioType[] = [];

  // RFI: BB가 아닌 경우만 가능 (BB는 마지막 액션, 모두 폴드 시 자동 승리)
  if (heroPos !== 'BB') {
    valid.push('RFI');
  }

  // vsRFI: 히어로 앞에 오픈할 수 있는 포지션이 있어야 함
  if (heroIdx > 0) {
    valid.push('vsRFI');
  }

  // vs3Bet: 히어로 뒤에 3벳할 수 있는 포지션이 있어야 함
  if (heroIdx < order.length - 1) {
    valid.push('vs3Bet');
  }

  // 안전 장치: 아무 시나리오도 없으면 vsRFI 허용
  if (valid.length === 0) {
    valid.push('vsRFI');
  }

  return valid;
}

function getVillainPosition(
  format: GameFormat,
  heroPos: Position,
  scenario: ScenarioType
): Position | null {
  const order = format === '6max' ? ACTION_ORDER_6MAX : ACTION_ORDER_9MAX;
  const heroIdx = order.indexOf(heroPos as any);

  if (scenario === 'RFI') {
    return null; // RFI에서는 빌런 없음
  }

  if (scenario === 'vsRFI') {
    // 히어로보다 앞 포지션 중 하나가 오픈
    const earlierPositions = order.filter((_, i) => i < heroIdx);
    if (earlierPositions.length === 0) return null;
    return earlierPositions[
      Math.floor(Math.random() * earlierPositions.length)
    ] as Position;
  }

  if (scenario === 'vs3Bet') {
    // 히어로가 오픈 후, 뒤 포지션 중 하나가 3벳
    const laterPositions = order.filter((_, i) => i > heroIdx);
    if (laterPositions.length === 0) return null;
    return laterPositions[
      Math.floor(Math.random() * laterPositions.length)
    ] as Position;
  }

  return null;
}

function buildPreflopActions(
  scenario: ScenarioType,
  heroPos: Position,
  villainPos: Position | null,
  format: GameFormat,
  villainOpenSize: number
): PlayerAction[] {
  const actions: PlayerAction[] = [];
  const order = format === '6max' ? ACTION_ORDER_6MAX : ACTION_ORDER_9MAX;

  if (scenario === 'RFI') {
    // 히어로 앞의 모든 플레이어가 폴드
    for (const pos of order) {
      if (pos === heroPos) break;
      actions.push({ position: pos as Position, action: 'fold' });
    }
  } else if (scenario === 'vsRFI' && villainPos) {
    // 빌런 앞은 폴드, 빌런은 오픈 레이즈, 빌런과 히어로 사이는 폴드
    let villainPassed = false;
    for (const pos of order) {
      if (pos === heroPos) break;
      if (pos === villainPos) {
        actions.push({ position: pos as Position, action: 'raise', amount: villainOpenSize });
        villainPassed = true;
        continue;
      }
      actions.push({ position: pos as Position, action: 'fold' });
    }
    if (!villainPassed) {
      actions.unshift({ position: order[0] as Position, action: 'raise', amount: villainOpenSize });
    }
  } else if (scenario === 'vs3Bet' && villainPos) {
    // 히어로 오픈 레이즈, 빌런 3벳
    const heroOpenSize = getOpenSize(heroPos);
    for (const pos of order) {
      if (pos === heroPos) {
        actions.push({ position: pos as Position, action: 'raise', amount: heroOpenSize });
        continue;
      }
      if (pos === villainPos) {
        actions.push({ position: pos as Position, action: 'raise', amount: villainOpenSize });
        break;
      }
      if (!actions.some(a => a.position === heroPos)) {
        actions.push({ position: pos as Position, action: 'fold' });
      } else {
        actions.push({ position: pos as Position, action: 'fold' });
      }
    }
  }

  return actions;
}

function calcPot(actions: PlayerAction[], numPlayers: number, ante: number): number {
  let pot = 1.5; // SB(0.5) + BB(1)
  pot += ante * numPlayers;
  for (const a of actions) {
    if (a.amount) pot += a.amount;
  }
  return pot;
}

/**
 * 포지션별 실전 오픈 사이즈 (BB 단위)
 * EP: 2.5x (타이트 레인지, 큰 사이즈로 보호)
 * MP: 2.3-2.5x
 * CO: 2.2-2.5x
 * BTN: 2.0-2.5x (넓은 레인지, 작은 사이즈)
 * SB: 2.5-3.0x (OOP이므로 큰 사이즈)
 */
function getOpenSize(position: Position): number {
  const baseSizes: Record<string, [number, number]> = {
    UTG:  [2.3, 2.7],
    UTG1: [2.3, 2.7],
    UTG2: [2.3, 2.5],
    LJ:   [2.2, 2.5],
    HJ:   [2.2, 2.5],
    CO:   [2.0, 2.5],
    BTN:  [2.0, 2.5],
    SB:   [2.5, 3.0],
  };
  const [min, max] = baseSizes[position] || [2.2, 2.5];
  // 소수 첫째자리까지 랜덤
  const raw = min + Math.random() * (max - min);
  return Math.round(raw * 10) / 10;
}

/**
 * 3벳 사이즈 계산
 * IP 3벳: 약 2.5~3x 원래 오픈 사이즈
 * OOP 3벳: 약 3~4x 원래 오픈 사이즈
 */
function get3BetSize(openSize: number, isInPosition: boolean): number {
  const multiplier = isInPosition
    ? 2.5 + Math.random() * 0.5  // IP: 2.5-3.0x
    : 3.0 + Math.random() * 1.0; // OOP: 3.0-4.0x
  return Math.round(openSize * multiplier * 10) / 10;
}

function calcCurrentBet(scenario: ScenarioType, villainPos: Position | null, heroPos: Position): { currentBet: number; villainOpenSize: number } {
  if (scenario === 'RFI') return { currentBet: 0, villainOpenSize: 0 };

  if (scenario === 'vsRFI' && villainPos) {
    const openSize = getOpenSize(villainPos);
    return { currentBet: openSize, villainOpenSize: openSize };
  }

  if (scenario === 'vs3Bet' && villainPos) {
    // 히어로가 먼저 오픈, 빌런이 3벳
    const heroOpenSize = getOpenSize(heroPos);
    const posOrder = ['SB', 'BB', 'UTG', 'UTG1', 'UTG2', 'LJ', 'HJ', 'CO', 'BTN'];
    const heroIdx = posOrder.indexOf(heroPos);
    const villainIdx = posOrder.indexOf(villainPos);
    const villainIsIP = villainIdx > heroIdx;
    const threeBetSize = get3BetSize(heroOpenSize, villainIsIP);
    return { currentBet: threeBetSize, villainOpenSize: threeBetSize };
  }

  return { currentBet: 0, villainOpenSize: 0 };
}

export const useGameStore = create<GameStore>((set, get) => ({
  // GameState
  format: '6max',
  stackSize: 100,
  heroPosition: 'UTG',
  villainPosition: null,
  scenario: 'RFI',
  street: 'preflop',
  heroCards: null,
  communityCards: [],
  pot: 1.5,
  currentBet: 0,
  villainOpenSize: 0,
  actions: [],
  isHandComplete: false,
  dealAnimationDone: false,

  // Pre-dealt
  flopCards: null,
  turnCard: null,
  riverCard: null,

  // GTO
  currentAdvice: null,
  lastResult: null,
  showFeedback: false,
  activeScenario: 'RFI',

  // Config
  _format: '6max',
  _stackSize: 100,
  _heroPosition: 'UTG',
  _scenario: 'RFI',

  startHand: (format, stackSize, heroPosition, scenario, ante = 0) => {
    // 유효한 시나리오 확인
    const validScenarios = getValidScenarios(format, heroPosition);

    let activeScenario: ScenarioType;
    if (scenario === 'all') {
      // '전체' 모드: 유효한 시나리오 중 랜덤 선택
      activeScenario = validScenarios[Math.floor(Math.random() * validScenarios.length)];
    } else if (validScenarios.includes(scenario)) {
      activeScenario = scenario;
    } else {
      // 선택한 시나리오가 해당 포지션에서 불가능 → 유효한 것 중 랜덤 선택
      activeScenario = validScenarios[Math.floor(Math.random() * validScenarios.length)];
    }

    const villainPos = getVillainPosition(format, heroPosition, activeScenario);
    const numPlayers = format === '6max' ? 6 : 9;
    const { holeCards, flop, turn, river } = dealHand(numPlayers);
    const { currentBet, villainOpenSize } = calcCurrentBet(activeScenario, villainPos, heroPosition);
    const preflopActions = buildPreflopActions(activeScenario, heroPosition, villainPos, format, villainOpenSize);
    const pot = calcPot(preflopActions, numPlayers, ante);

    set({
      format,
      stackSize,
      heroPosition,
      villainPosition: villainPos,
      scenario,
      activeScenario,
      street: 'preflop',
      heroCards: holeCards[0],
      communityCards: [],
      pot,
      currentBet,
      villainOpenSize,
      actions: preflopActions,
      isHandComplete: false,
      dealAnimationDone: false,
      flopCards: flop,
      turnCard: turn,
      riverCard: river,
      currentAdvice: null,
      lastResult: null,
      showFeedback: false,
      _format: format,
      _stackSize: stackSize,
      _heroPosition: heroPosition,
      _scenario: scenario,
    });

    // Trigger deal animation
    setTimeout(() => set({ dealAnimationDone: true }), 600);
  },

  submitAction: (action, raiseSize?) => {
    const state = get();
    if (!state.heroCards || state.isHandComplete) return;

    const advice = getGtoAdvice(
      state.heroCards,
      state.communityCards,
      state.format,
      state.heroPosition,
      state.villainPosition || undefined,
      state.activeScenario,
      state.street,
      state.pot,
      state.currentBet,
      state.stackSize
    );

    const result = isActionCorrect(action, advice);

    // 히어로 액션 금액 계산
    let heroAmount: number | undefined;
    if (action === 'raise') {
      // 유저가 직접 지정한 사이즈 사용
      heroAmount = raiseSize ?? (state.currentBet > 0
        ? Math.round(state.currentBet * 2.75 * 10) / 10
        : Math.round(state.pot * 0.66 * 10) / 10);
    } else if (action === 'call' && state.currentBet > 0) {
      heroAmount = state.currentBet;
    }

    // 팟 업데이트: 히어로 액션에 따라
    let newPot = state.pot;
    if (heroAmount) {
      newPot += heroAmount;
    }

    set({
      currentAdvice: advice,
      lastResult: result,
      showFeedback: true,
      pot: newPot,
      actions: [
        ...state.actions,
        { position: state.heroPosition, action, amount: heroAmount },
      ],
    });

    // If fold or hand is over after this street
    if (action === 'fold') {
      set({ isHandComplete: true });
    }
  },

  advanceStreet: () => {
    const state = get();
    if (state.isHandComplete) return;

    const streetOrder: Street[] = ['preflop', 'flop', 'turn', 'river'];
    const currentIdx = streetOrder.indexOf(state.street);

    if (currentIdx >= 3) {
      set({ isHandComplete: true });
      return;
    }

    const nextStreet = streetOrder[currentIdx + 1];
    let newCommunity = [...state.communityCards];

    if (nextStreet === 'flop' && state.flopCards) {
      newCommunity = [...state.flopCards];
    } else if (nextStreet === 'turn' && state.turnCard) {
      newCommunity = [...newCommunity, state.turnCard];
    } else if (nextStreet === 'river' && state.riverCard) {
      newCommunity = [...newCommunity, state.riverCard];
    }

    // IP/OOP 판별
    const order = ['SB', 'BB', 'UTG', 'UTG1', 'UTG2', 'LJ', 'HJ', 'CO', 'BTN'];
    const heroIdx = order.indexOf(state.heroPosition);
    const villainIdx = state.villainPosition ? order.indexOf(state.villainPosition) : -1;
    const heroIsIP = villainIdx >= 0 && heroIdx > villainIdx;

    let newCurrentBet: number;
    const newActions = [...state.actions];
    if (heroIsIP) {
      // 빌런이 먼저: 체크 or 벳
      const villainBets = Math.random() > 0.5;
      if (villainBets) {
        newCurrentBet = Math.round(state.pot * 0.6 * 10) / 10;
        if (state.villainPosition) {
          newActions.push({
            position: state.villainPosition,
            action: 'raise',
            amount: newCurrentBet,
          });
        }
      } else {
        newCurrentBet = 0;
      }
    } else {
      newCurrentBet = 0;
    }

    set({
      street: nextStreet,
      communityCards: newCommunity,
      pot: state.pot,
      currentBet: newCurrentBet,
      actions: newActions,
      showFeedback: false,
      currentAdvice: null,
      lastResult: null,
    });
  },

  closeFeedback: () => {
    const state = get();
    if (state.isHandComplete || state.lastResult === null) {
      set({ showFeedback: false });
      return;
    }

    // Check if the action was fold
    const lastAction = state.actions[state.actions.length - 1];
    if (lastAction?.action === 'fold') {
      set({ showFeedback: false, isHandComplete: true });
      return;
    }

    // Advance to next street
    const streetOrder: Street[] = ['preflop', 'flop', 'turn', 'river'];
    const currentIdx = streetOrder.indexOf(state.street);

    if (currentIdx >= 3) {
      set({ showFeedback: false, isHandComplete: true });
      return;
    }

    const nextStreet = streetOrder[currentIdx + 1];
    let newCommunity = [...state.communityCards];

    if (nextStreet === 'flop' && state.flopCards) {
      newCommunity = [...state.flopCards];
    } else if (nextStreet === 'turn' && state.turnCard) {
      newCommunity = [...newCommunity, state.turnCard];
    } else if (nextStreet === 'river' && state.riverCard) {
      newCommunity = [...newCommunity, state.riverCard];
    }

    // 팟 계산 현실화: 빌런 콜/벳 시뮬레이션
    let newPot = state.pot;
    const newActions = [...state.actions];

    if (lastAction?.action === 'raise' && lastAction.amount) {
      // 히어로가 레이즈/벳 → 빌런이 콜한 것으로 가정
      const villainCallAmount = lastAction.amount;
      newPot += villainCallAmount;
      if (state.villainPosition) {
        newActions.push({
          position: state.villainPosition,
          action: 'call',
          amount: villainCallAmount,
        });
      }
    }
    // 히어로가 콜 → 이미 팟에 포함됨, 추가 없음

    // IP/OOP에 따른 다음 스트릿 빌런 액션
    const order = ['SB', 'BB', 'UTG', 'UTG1', 'UTG2', 'LJ', 'HJ', 'CO', 'BTN'];
    const heroIdx = order.indexOf(state.heroPosition);
    const villainIdx = state.villainPosition ? order.indexOf(state.villainPosition) : -1;
    const heroIsIP = villainIdx >= 0 && heroIdx > villainIdx;

    let newCurrentBet: number;
    if (heroIsIP) {
      // 히어로가 IP → 빌런이 먼저 액션: 50% 확률로 체크, 50% 확률로 0.5~0.75 팟 벳
      const villainBets = Math.random() > 0.5;
      if (villainBets) {
        const betSize = newPot * (0.5 + Math.random() * 0.25); // 50~75% 팟벳
        newCurrentBet = Math.round(betSize * 10) / 10;
        if (state.villainPosition) {
          newActions.push({
            position: state.villainPosition,
            action: 'raise',
            amount: newCurrentBet,
          });
        }
      } else {
        newCurrentBet = 0; // 빌런 체크 → 히어로는 체크/벳 선택
      }
    } else {
      // 히어로가 OOP → 히어로가 먼저 액션: 체크/벳 선택
      newCurrentBet = 0;
    }

    set({
      street: nextStreet,
      communityCards: newCommunity,
      pot: newPot,
      currentBet: newCurrentBet,
      actions: newActions,
      showFeedback: false,
      currentAdvice: null,
      lastResult: null,
    });
  },

  nextHand: () => {
    const state = get();
    const pos = state._heroPosition;
    get().startHand(state._format, state._stackSize, pos, state._scenario);
  },
}));
