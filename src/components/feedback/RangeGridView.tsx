import type { RangeMatrix } from '../../types/gto';
import { getAllHandNotations } from '../../utils/handNotation';

interface RangeGridViewProps {
  rangeMatrix: RangeMatrix;
  highlightHand?: string;
}

function getColor(freq: { fold: number; call: number; raise: number } | undefined): string {
  if (!freq) return 'bg-gray-800';

  const r = freq.raise;
  const c = freq.call;

  if (r >= 0.7) return 'bg-red-500';
  if (r >= 0.4) return 'bg-red-400';
  if (r + c >= 0.7 && r >= 0.2) return 'bg-orange-400';
  if (c >= 0.5) return 'bg-green-500';
  if (c >= 0.3) return 'bg-green-400';
  if (r + c >= 0.3) return 'bg-yellow-500';
  if (r + c > 0) return 'bg-yellow-700';
  return 'bg-gray-800';
}

export default function RangeGridView({ rangeMatrix, highlightHand }: RangeGridViewProps) {
  const grid = getAllHandNotations();

  return (
    <div className="w-full">
      <div className="grid gap-[1px]" style={{ gridTemplateColumns: 'repeat(13, 1fr)' }}>
        {grid.map((row, i) =>
          row.map((hand, j) => {
            const freq = rangeMatrix[hand];
            const colorClass = getColor(freq);
            const isHighlight = hand === highlightHand;
            const isSuited = i < j;
            const isPair = i === j;

            return (
              <div
                key={hand}
                className={`${colorClass} aspect-square flex items-center justify-center text-[8px] sm:text-[9px] font-medium transition-all
                  ${isHighlight ? 'ring-2 ring-white ring-offset-1 ring-offset-gray-900 z-10' : ''}
                  ${isPair ? 'text-white' : isSuited ? 'text-blue-100' : 'text-gray-200'}
                `}
                title={`${hand}: F${freq ? Math.round(freq.fold * 100) : 100}% C${freq ? Math.round(freq.call * 100) : 0}% R${freq ? Math.round(freq.raise * 100) : 0}%`}
              >
                {hand}
              </div>
            );
          })
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-3 text-[10px] text-gray-400">
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 bg-red-500 rounded-sm" /> 레이즈
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 bg-orange-400 rounded-sm" /> 레이즈/콜 믹스
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 bg-green-500 rounded-sm" /> 콜
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 bg-yellow-500 rounded-sm" /> 마진 콜
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 bg-gray-800 rounded-sm" /> 폴드
        </div>
      </div>
    </div>
  );
}
