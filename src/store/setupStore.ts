import { create } from 'zustand';
import type { GameMode, GameFormat, Position, ScenarioType, SetupConfig } from '../types/game';
import { POSITIONS_6MAX, POSITIONS_9MAX } from '../constants/positions';

interface SetupStore extends SetupConfig {
  setMode: (mode: GameMode) => void;
  setFormat: (format: GameFormat) => void;
  setStackSize: (size: number) => void;
  setHeroPosition: (pos: Position | 'random') => void;
  setScenario: (scenario: ScenarioType) => void;
  setAnte: (ante: number) => void;
  randomize: () => void;
  getResolvedPosition: () => Position;
}

export const useSetupStore = create<SetupStore>((set, get) => ({
  mode: 'cash',
  format: '6max',
  stackSize: 100,
  heroPosition: 'random',
  scenario: 'RFI',
  ante: 0,

  setMode: (mode) => {
    if (mode === 'tournament') {
      set({ mode, ante: 0.125, stackSize: 30 });
    } else {
      set({ mode, ante: 0, stackSize: 100 });
    }
  },
  setFormat: (format) => set({ format }),
  setStackSize: (stackSize) => set({ stackSize }),
  setHeroPosition: (heroPosition) => set({ heroPosition }),
  setScenario: (scenario) => set({ scenario }),
  setAnte: (ante) => set({ ante }),

  randomize: () => {
    const modes: GameMode[] = ['cash', 'tournament'];
    const mode = modes[Math.floor(Math.random() * modes.length)];
    const formats: GameFormat[] = ['6max', '9max'];
    const format = formats[Math.floor(Math.random() * formats.length)];
    const cashStacks = [50, 75, 100, 150, 200];
    const tourneyStacks = [10, 15, 20, 25, 30, 40, 50];
    const stacks = mode === 'cash' ? cashStacks : tourneyStacks;
    const stackSize = stacks[Math.floor(Math.random() * stacks.length)];
    const scenarios: ScenarioType[] = ['RFI', 'vsRFI', 'vs3Bet'];
    const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
    const ante = mode === 'tournament' ? 0.125 : 0;

    set({ mode, format, stackSize, heroPosition: 'random', scenario, ante });
  },

  getResolvedPosition: () => {
    const state = get();
    if (state.heroPosition !== 'random') return state.heroPosition;

    const positions = state.format === '6max' ? POSITIONS_6MAX : POSITIONS_9MAX;
    return positions[Math.floor(Math.random() * positions.length)];
  },
}));
