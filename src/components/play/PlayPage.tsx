import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../store/gameStore';
import { useSetupStore } from '../../store/setupStore';
import { useStatsStore } from '../../store/statsStore';
import PokerTable from '../table/PokerTable';
import Card from '../table/Card';
import ActionPanel from './ActionPanel';
import ActionContext from './ActionContext';
import GtoFeedbackModal from '../feedback/GtoFeedbackModal';
import { STRINGS } from '../../constants/strings';
import { POSITION_LABELS } from '../../constants/positions';
import { formatBB } from '../../utils/format';

export default function PlayPage() {
  const navigate = useNavigate();
  const setup = useSetupStore();
  const game = useGameStore();
  const recordResult = useStatsStore((s) => s.recordResult);

  // Start first hand on mount
  useEffect(() => {
    const pos = setup.getResolvedPosition();
    game.startHand(setup.format, setup.stackSize, pos, setup.scenario, setup.ante);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleNextHand = useCallback(() => {
    const pos = setup.getResolvedPosition();
    game.startHand(setup.format, setup.stackSize, pos, setup.scenario, setup.ante);
  }, [game, setup]);

  const handleAction = useCallback(
    (action: 'fold' | 'call' | 'raise') => {
      if (game.showFeedback || game.isHandComplete) return;
      game.submitAction(action);
    },
    [game]
  );

  // Record stats when feedback shows
  useEffect(() => {
    if (game.showFeedback && game.lastResult !== null) {
      recordResult({
        position: game.heroPosition,
        street: game.street,
        correct: game.lastResult === 'correct',
        acceptable: game.lastResult === 'acceptable',
      });
    }
  }, [game.showFeedback, game.lastResult]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (game.showFeedback) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
          e.preventDefault();
          if (game.isHandComplete) {
            handleNextHand();
          } else {
            game.closeFeedback();
          }
        }
        return;
      }

      if (game.isHandComplete) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleNextHand();
        }
        return;
      }

      const key = e.key.toLowerCase();
      if (key === 'f') handleAction('fold');
      else if (key === 'c') handleAction('call');
      else if (key === 'r') handleAction('raise');
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [game, handleAction]);

  const scenarioLabel =
    game.activeScenario === 'RFI'
      ? 'RFI (오픈 레이즈)'
      : game.activeScenario === 'vsRFI'
        ? `vs ${POSITION_LABELS[game.villainPosition || ''] || ''} 오픈 (${formatBB(game.villainOpenSize)})`
        : `vs ${POSITION_LABELS[game.villainPosition || ''] || ''} 3벳 (${formatBB(game.villainOpenSize)})`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a2e] to-[#16213e] flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900/60 border-b border-gray-800">
        <button
          onClick={() => navigate('/')}
          className="text-gray-400 hover:text-white text-sm transition-colors"
        >
          ← {STRINGS.backToSetup}
        </button>
        <div className="text-gray-400 text-sm flex gap-4">
          <span className="text-gray-500">{setup.mode === 'cash' ? 'Cash' : 'MTT'}</span>
          <span>{setup.format === '6max' ? '6-Max' : '9-Max'}</span>
          <span>{formatBB(setup.stackSize)} 스택</span>
          <span>{POSITION_LABELS[game.heroPosition]}</span>
          <span className="text-yellow-400">{scenarioLabel}</span>
        </div>
        <div className="text-gray-500 text-xs">
          {game.street.toUpperCase()}
        </div>
      </div>

      {/* Table area */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4 py-4 overflow-hidden">
        <PokerTable
          format={game.format}
          heroPosition={game.heroPosition}
          villainPosition={game.villainPosition}
          communityCards={game.communityCards}
          pot={game.pot}
          actions={game.actions}
        />

        {/* Hero cards */}
        {game.heroCards && (
          <div className="flex flex-col items-center gap-2 mt-2">
            <div className="text-gray-400 text-xs">
              {STRINGS.heroLabel} ({POSITION_LABELS[game.heroPosition]})
            </div>
            <div className="flex gap-2">
              <Card card={game.heroCards[0]} size="lg" delay={0} />
              <Card card={game.heroCards[1]} size="lg" delay={200} />
            </div>
          </div>
        )}

        {/* Action context + Action panel */}
        <div className="mt-3 flex flex-col items-center gap-2">
          {!game.isHandComplete && !game.showFeedback && (
            <ActionContext
              scenario={game.activeScenario}
              street={game.street}
              heroPosition={game.heroPosition}
              villainPosition={game.villainPosition}
              actions={game.actions}
              currentBet={game.currentBet}
            />
          )}
          {!game.isHandComplete && !game.showFeedback && (
            <ActionPanel
              onAction={handleAction}
              currentBet={game.currentBet}
              pot={game.pot}
              isDisabled={game.showFeedback || !game.dealAnimationDone}
              isPreflop={game.street === 'preflop'}
              scenario={game.activeScenario}
              heroPosition={game.heroPosition}
            />
          )}

          {game.isHandComplete && !game.showFeedback && (
            <div className="flex flex-col items-center gap-3 animate-fade-in">
              <div className="text-gray-500 text-sm font-medium">핸드 완료</div>
              <button
                onClick={() => handleNextHand()}
                className="group relative overflow-hidden px-10 py-3.5 rounded-2xl transition-all duration-200
                           hover:-translate-y-1 hover:scale-[1.03] active:translate-y-0 active:scale-100"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-blue-500 to-blue-700 group-hover:from-blue-400 group-hover:to-blue-600 transition-all" />
                <div className="absolute inset-x-0 top-0 h-[45%] opacity-[0.12]" style={{ background: 'linear-gradient(to bottom, white, transparent)' }} />
                <div className="absolute -inset-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-lg -z-10" style={{ background: 'rgba(59,130,246,0.4)' }} />
                <span className="relative text-white font-bold text-[15px] drop-shadow-sm">
                  {STRINGS.nextHand}
                  <span className="ml-2 text-blue-200/60 text-xs font-mono">Enter</span>
                </span>
                <div className="absolute bottom-0 inset-x-0 h-[3px] bg-blue-900/50" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* GTO Feedback Modal */}
      {game.showFeedback && game.currentAdvice && (
        <GtoFeedbackModal
          advice={game.currentAdvice}
          result={game.lastResult!}
          isHandComplete={game.isHandComplete || game.actions[game.actions.length - 1]?.action === 'fold'}
          onClose={() => {
            if (game.isHandComplete || game.actions[game.actions.length - 1]?.action === 'fold') {
              game.closeFeedback();
            } else {
              game.closeFeedback();
            }
          }}
          onNextHand={() => handleNextHand()}
          street={game.street}
        />
      )}
    </div>
  );
}
