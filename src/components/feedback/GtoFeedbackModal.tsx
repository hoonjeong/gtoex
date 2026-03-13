import { useState } from 'react';
import type { GtoAdvice } from '../../types/gto';
import type { Street } from '../../types/game';
import ActionFrequencyBar from './ActionFrequencyBar';
import RangeGridView from './RangeGridView';
import { STRINGS } from '../../constants/strings';

interface GtoFeedbackModalProps {
  advice: GtoAdvice;
  result: 'correct' | 'incorrect' | 'acceptable';
  isHandComplete: boolean;
  onClose: () => void;
  onNextHand: () => void;
  street: Street;
}

export default function GtoFeedbackModal({
  advice,
  result,
  isHandComplete,
  onClose,
  onNextHand,
  street,
}: GtoFeedbackModalProps) {
  const [showRange, setShowRange] = useState(false);

  const resultConfig = {
    correct: {
      label: STRINGS.correct,
      color: 'text-green-400',
      bg: 'bg-green-900/30',
      border: 'border-green-600',
      icon: '✓',
    },
    acceptable: {
      label: STRINGS.acceptable,
      color: 'text-yellow-400',
      bg: 'bg-yellow-900/30',
      border: 'border-yellow-600',
      icon: '~',
    },
    incorrect: {
      label: STRINGS.incorrect,
      color: 'text-red-400',
      bg: 'bg-red-900/30',
      border: 'border-red-600',
      icon: '✗',
    },
  };

  const config = resultConfig[result];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div
        className={`${config.bg} border ${config.border} rounded-2xl p-6 w-full max-w-md shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto`}
      >
        {/* Result header */}
        <div className="flex items-center gap-3 mb-4">
          <span className={`text-3xl ${config.color} font-bold`}>{config.icon}</span>
          <div>
            <h2 className={`text-xl font-bold ${config.color}`}>{config.label}</h2>
            {advice.handNotation && (
              <span className="text-gray-400 text-sm">{advice.handNotation}</span>
            )}
          </div>
        </div>

        {/* GTO frequencies */}
        <div className="mb-4">
          <h3 className="text-gray-300 text-sm font-medium mb-2">{STRINGS.gtoFrequencies}</h3>
          <ActionFrequencyBar frequencies={advice.frequencies} />
        </div>

        {/* Correct actions */}
        <div className="mb-4">
          <div className="text-gray-400 text-xs mb-1">정답 액션:</div>
          <div className="flex gap-2">
            {advice.correctActions.map((action) => (
              <span
                key={action}
                className="px-3 py-1 bg-gray-700 rounded-full text-sm font-medium text-white capitalize"
              >
                {action === 'fold' ? '폴드' : action === 'call' ? '콜' : '레이즈'}
              </span>
            ))}
          </div>
        </div>

        {/* Explanation */}
        <div className="mb-4 bg-gray-800/60 rounded-lg p-3">
          <h3 className="text-gray-300 text-sm font-medium mb-1">{STRINGS.explanation}</h3>
          <p className="text-gray-400 text-sm whitespace-pre-line">{advice.explanation}</p>
        </div>

        {/* Range grid (preflop only) */}
        {street === 'preflop' && advice.rangeMatrix && (
          <div className="mb-4">
            <button
              onClick={() => setShowRange(!showRange)}
              className="text-blue-400 hover:text-blue-300 text-sm mb-2 transition-colors"
            >
              {showRange ? '▼' : '▶'} {STRINGS.rangeView}
            </button>
            {showRange && (
              <div className="animate-slide-up">
                <RangeGridView
                  rangeMatrix={advice.rangeMatrix}
                  highlightHand={advice.handNotation}
                />
              </div>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3">
          {isHandComplete ? (
            <button
              onClick={onNextHand}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-lg transition-all"
            >
              {STRINGS.nextHand} (Enter)
            </button>
          ) : (
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-lg transition-all"
            >
              다음 스트릿 (Enter)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
