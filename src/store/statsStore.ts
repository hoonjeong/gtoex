import { create } from 'zustand';
import type { Position, Street } from '../types/game';

interface HandResult {
  position: Position;
  street: Street;
  correct: boolean;
  acceptable: boolean;
}

interface StatsState {
  totalHands: number;
  correctHands: number;
  acceptableHands: number;
  byPosition: Record<string, { total: number; correct: number }>;
  byStreet: Record<string, { total: number; correct: number }>;
  history: HandResult[];

  recordResult: (result: HandResult) => void;
  reset: () => void;
  getAccuracy: () => number;
  getPositionAccuracy: (position: string) => number;
  getStreetAccuracy: (street: string) => number;
}

function loadStats(): Partial<StatsState> {
  try {
    const saved = localStorage.getItem('gtoex-stats');
    if (saved) return JSON.parse(saved);
  } catch {
    // ignore
  }
  return {};
}

function saveStats(state: StatsState) {
  try {
    localStorage.setItem(
      'gtoex-stats',
      JSON.stringify({
        totalHands: state.totalHands,
        correctHands: state.correctHands,
        acceptableHands: state.acceptableHands,
        byPosition: state.byPosition,
        byStreet: state.byStreet,
        history: state.history.slice(-200), // keep last 200
      })
    );
  } catch {
    // ignore
  }
}

const initial = loadStats();

export const useStatsStore = create<StatsState>((set, get) => ({
  totalHands: initial.totalHands || 0,
  correctHands: initial.correctHands || 0,
  acceptableHands: initial.acceptableHands || 0,
  byPosition: initial.byPosition || {},
  byStreet: initial.byStreet || {},
  history: initial.history || [],

  recordResult: (result) => {
    set((state) => {
      const isCorrect = result.correct || result.acceptable;

      const byPosition = { ...state.byPosition };
      const posKey = result.position;
      if (!byPosition[posKey]) byPosition[posKey] = { total: 0, correct: 0 };
      byPosition[posKey] = {
        total: byPosition[posKey].total + 1,
        correct: byPosition[posKey].correct + (isCorrect ? 1 : 0),
      };

      const byStreet = { ...state.byStreet };
      const streetKey = result.street;
      if (!byStreet[streetKey]) byStreet[streetKey] = { total: 0, correct: 0 };
      byStreet[streetKey] = {
        total: byStreet[streetKey].total + 1,
        correct: byStreet[streetKey].correct + (isCorrect ? 1 : 0),
      };

      const newState = {
        totalHands: state.totalHands + 1,
        correctHands: state.correctHands + (result.correct ? 1 : 0),
        acceptableHands: state.acceptableHands + (result.acceptable ? 1 : 0),
        byPosition,
        byStreet,
        history: [...state.history.slice(-199), result],
      };

      setTimeout(() => saveStats(get()), 0);
      return newState;
    });
  },

  reset: () => {
    localStorage.removeItem('gtoex-stats');
    set({
      totalHands: 0,
      correctHands: 0,
      acceptableHands: 0,
      byPosition: {},
      byStreet: {},
      history: [],
    });
  },

  getAccuracy: () => {
    const s = get();
    if (s.totalHands === 0) return 0;
    return (s.correctHands + s.acceptableHands) / s.totalHands;
  },

  getPositionAccuracy: (position: string) => {
    const data = get().byPosition[position];
    if (!data || data.total === 0) return 0;
    return data.correct / data.total;
  },

  getStreetAccuracy: (street: string) => {
    const data = get().byStreet[street];
    if (!data || data.total === 0) return 0;
    return data.correct / data.total;
  },
}));
