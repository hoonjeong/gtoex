import { useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { useSetupStore } from '../store/setupStore';
import { useStatsStore } from '../store/statsStore';

export function useGameFlow() {
  const game = useGameStore();
  const setup = useSetupStore();
  const stats = useStatsStore();

  const startNewHand = useCallback(() => {
    const pos = setup.getResolvedPosition();
    game.startHand(setup.format, setup.stackSize, pos, setup.scenario);
  }, [game, setup]);

  const submitAction = useCallback(
    (action: 'fold' | 'call' | 'raise') => {
      game.submitAction(action);

      // Record stats after feedback
      if (game.lastResult !== null) {
        stats.recordResult({
          position: game.heroPosition,
          street: game.street,
          correct: game.lastResult === 'correct',
          acceptable: game.lastResult === 'acceptable',
        });
      }
    },
    [game, stats]
  );

  return {
    startNewHand,
    submitAction,
    game,
    stats,
  };
}
